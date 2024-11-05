import {App, debounce, TFile, normalizePath, Notice} from "obsidian";
import {ungzip} from "node-gzip"


const {exec} = require('child_process');

const SCALE = 0.4;

export class RenderContentService {
    app: App
    window: number[]
    buffer: number


    constructor(app: App) {
        this.app = app
        this.window = []
        this.buffer = 5
    }


    getTag(fileContent: string, i: number) {
        let end = i;
        while(fileContent[end] != "\n"){
            if(fileContent[end] == " " || fileContent[end] == ">"){
                return fileContent.slice(i+1, end)
            }
            end++;
        }
        return ""
    }


    convertToSvg_debounced = debounce((file: TFile) => {
            this.convertToSvg(file)
        }, 500, true);
    

    extract_attributes(file_content: string, attributes: string[], values:string[], i: number){
        let index = 0
        let end_ind = i
        for(let j = 0; j < attributes.length; j++){
            if(!attributes[j].endsWith("=")){
                index = file_content.indexOf(attributes[j] + "=", i) + (attributes[j] + "=").length
            } else {
                index = file_content.indexOf(attributes[j], i) + attributes[j].length + 1
            }

            values.push(file_content.slice(index, file_content.indexOf("\"", index)))
            end_ind = Math.max(end_ind, index)
        }
        
        return file_content.indexOf(">", end_ind)
    }


    extract_raw_data(file_content: string, i: number){
        const raw_start = file_content.indexOf('>', i) + 1;
        const raw_end = file_content.indexOf('<', raw_start);

        return file_content.substring(raw_start, raw_end)
    }

    convert_text_field(file_content: string, data: string[], i: number): number {
        const attributes = ["font=", "size=", "x=", "y=", "color="]
        let values: string[] = []
        i = this.extract_attributes(file_content, attributes, values, i)
        

        let y = parseFloat(values[3]) + parseFloat(values[1])
        const raw_data = this.extract_raw_data(file_content, i)

        data.push(`<text font-family="${values[0]}" font-size="${values[1]}" x="${values[2]}" y="${y}" fill="${values[4]}">${raw_data}</text>`);

        return i + raw_data.length
    }



    convert_image_field(file_content: string, data: string[], i: number): number {
        const attributes = ["left=", "top=", "right=", "bottom="]
        let values: string[] = []
        i = this.extract_attributes(file_content, attributes, values, i)
        
        const left = parseFloat(values[0]);
        const top = parseFloat(values[1]);
        const right = parseFloat(values[2]);
        const bottom = parseFloat(values[3]);
    
        // Calculate width and height
        const width = right - left;
        const height = bottom - top;

        // Update Boundary Window
        this.update_window(left, top)
        this.update_window(right, bottom)

        const raw_image_data = this.extract_raw_data(file_content, i)
    
        // Construct the output text
        data.push(`<image x="${left}" y="${top}" width="${width}" height="${height}" xlink:href="data:image/png;base64,${raw_image_data}" />`);
    
        return i + raw_image_data.length;
    }

    convert_page_field(file_content: string, data: string[], i: number, pageStart: number): number {
        data[pageStart] = `<svg viewBox="${this.window[0]} ${this.window[1]} ${this.window[2]} ${this.window[3]}">`
        data.push("</svg>")

        return i
    }

    init_boundary_window(file_content: string, data:string[], i: number): number {
        this.window = []
    
        data.push("<svg>")

        return i
    }

    update_window(x: number, y: number) {
        if(this.window.length === 0){
            this.window = [x, y, x, y]
            return
        }

        if (x < this.window[0]) {
            this.window[0] = x
        } 
        else if (x > this.window[2]) {
            this.window[2] = x
        }

        if (y < this.window[1]) {
            this.window[1] = y
        }
        else if (y > this.window[3]) {
            this.window[3] = y
        }

    }

    identify_outlier_widths(widths: number[]) : Set<number> {
        const TARGET_Z = 1.5
        if(widths.length == 1) {
            return new Set<number>;
        }

        const n = widths.length
        const mean = (widths.reduce((a, b) => a + b)) / n
        const sd =  Math.pow((widths.reduce((a,b) => a + Math.pow((b - mean), 2)) / (n - 1)), 0.5)
         
        let outliers = new Set<number>();

        for(let i = 0; i< n; i++){
            const z_score = (widths[i] - mean) / sd
            if(Math.abs(z_score) > TARGET_Z){
                outliers.add(i)
            }
        }

        return outliers
    }

    convert_background_field(file_content: string, i: number): number {
        const attributes = ["type="]
        let values: string[] = []
        i = this.extract_attributes(file_content, attributes, values, i)

        if(values[0] == "pdf"){
            throw new Error("PDF files are not supported")
        }

        return i
    }

    convert_stroke_field(file_content: string, data: string[], i: number): number {
        const attributes = ["color=", "width=", "capStyle=", "tool="]
        let values: string[] = []
        i = this.extract_attributes(file_content, attributes, values, i)

        const widths = values[1].split(" ").map(parseFloat)

        let outliers = this.identify_outlier_widths(widths)

        const width = (widths.filter((ele, ind) => !outliers.has(ind)).reduce((a, b) => a + b)) / (widths.length - outliers.size)

        let opacity = 1
        if (values[3] == "highlighter") {
            opacity = 0.5
        }
                
        data.push(`<path fill="none" stroke-width="${width}" stroke-linecap="${values[2]}" stroke-linejoin="${values[2]}" stroke="${values[0]}" stroke-opacity="${opacity}" stroke-miterlimit="10" d=`)

        let raw_data = this.extract_raw_data(file_content, i).split(" ").map(parseFloat)

        data.push(`"M ${raw_data[0]},${raw_data[1]}`)
        this.update_window(raw_data[0], raw_data[1])

        for (let j = 2; j < raw_data.length; j+=2){
            data.push(` L ${raw_data[j]} ${raw_data[j+1]}`) 
            this.update_window(raw_data[j], raw_data[j+1])
        }

      
        data.push("\"/>")
        return i;
    }


    xournal_to_embed_name(file: TFile){
        return `${file.path}.md`
    }

    async createNewFile(file: TFile, data: string) {
        const newFile = this.app.vault.getAbstractFileByPath(file.path + ".md")

        if(newFile) {
            await this.app.vault.delete(newFile)
        }


        await this.app.vault.create(this.xournal_to_embed_name(file), data)
    }

    convertToPDF(file: TFile) {
        const basePath = (this.app.vault.adapter as any).basePath

        const filePath = normalizePath("\"" + basePath + "/" + file.path + "\"");
        const pdfFilePath = filePath.slice(0, -5) + "pdf" + "\""; 

        const command = "xournalpp -p " + pdfFilePath + " " + filePath;
        
        exec(command, (err: string) => {
            if (err) this.createNewFile(file, "ERROR: Could not convert to PDF")
        })

        this.createNewFile(file, `![](${file.path.slice(0, -5) + ".pdf"})`)
    }


    async convertToSvg(file: TFile) {
        let fileContent = (await ungzip(await this.app.vault.readBinary(file))).toString()

        let tag = this.getTag(fileContent, 0)
        let i = tag.length + 1;
        let data = [""]
        let pageStart = 0          

        while(tag != "/xournal" || tag == null){

            if(tag == "background"){
                try{
                    i = this.convert_background_field(fileContent, i)
                } catch(e) {
                    return this.convertToPDF(file)
                }
            }
            else if(tag == "stroke"){
                i = this.convert_stroke_field(fileContent, data, i)
            }
            else if(tag == "text"){
                i = this.convert_text_field(fileContent, data, i)
            }
            else if(tag == "image"){
                i = this.convert_image_field(fileContent, data, i)
            }
            else if(tag == "page"){
                i = this.init_boundary_window(fileContent, data, i)
                pageStart = data.length - 1 
            }else if(tag == "/page"){
                i = this.convert_page_field(fileContent, data, i, pageStart)
            }

            while(fileContent[i] != "\n"){
                i++
            }

            i++;

            tag = this.getTag(fileContent, i)
            i = i + tag.length + 1
        
        }

        await this.createNewFile(file, data.join(""))
    }


}