import {App, debounce, TFile} from "obsidian";
import {ungzip} from "node-gzip"

const SCALE = 0.4;

export class RenderContentService {
    app: App


    constructor(app: App) {
        this.app = app
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


    start_render = debounce((file: TFile) => {
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

        const raw_image_data = this.extract_raw_data(file_content, i)
    
        // Construct the output text
        data.push(`<image x="${left}" y="${top}" width="${width}" height="${height}" xlink:href="data:image/png;base64,${raw_image_data}" />`);
    
        return i + raw_image_data.length;
    }

    convert_page_field(file_content: string, data: string[], i: number): number {
        const attributes = ["width=", "height="]
        let values: string[] = []

        i = this.extract_attributes(file_content, attributes, values, i)
        
        data.push(`<svg viewBox="0 0 ${values[0]} ${values[1]}">`)

        return i
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

        let ptr_ind = 0 
        let mid = false
        let first = true
        let data_start = file_content.indexOf(">", i) + 1
        i = data_start

        data.push(`"M `)

        while(file_content[i] != "<"){
            if(file_content[i] == " "){
                if(mid){
                    ptr_ind++
                    if(!outliers.has(ptr_ind) && first == false){
                        data.push(" L ")
                    }
                    mid = false
                }else{
                    if(!outliers.has(ptr_ind)){
                        data.push(" ")
                    }
                    mid = true
                }
            }else if(!outliers.has(ptr_ind)){
                    data.push(file_content[i])
                    first = false
            }
            i++;
        }

        data.push("\"/>")
        return i;
    }


    xournal_to_embed_name(file: TFile, page:number = 0){
        return `${file.path}.md`
    }


    async convertToSvg(file: TFile) {
        console.log("Starting conversion for " + file.path)
        let fileContent = (await ungzip(await this.app.vault.readBinary(file))).toString()
        console.log(fileContent)

        let tag = this.getTag(fileContent, 0)
        let i = tag.length + 1;
        let data = [""]          

        while(tag != "/xournal" || tag == null){

            if(tag == "stroke"){
                i = this.convert_stroke_field(fileContent, data, i)
            }
            else if(tag == "text"){
                i = this.convert_text_field(fileContent, data, i)
            }
            else if(tag == "image"){
                i = this.convert_image_field(fileContent, data, i)
            }
            else if(tag == "page"){
                i = this.convert_page_field(fileContent, data, i)
            }else if(tag == "/page"){
                data.push("</svg>")
            }

            while(fileContent[i] != "\n"){
                i++
            }

            i++;

            tag = this.getTag(fileContent, i)
            i = i + tag.length + 1
        
        }

        const newFile = this.app.vault.getAbstractFileByPath(file.path + ".md")

        if(newFile) {
            await this.app.vault.delete(newFile)
        }


        await this.app.vault.create(this.xournal_to_embed_name(file), data.join(""))

        console.log("Finished conversion for " + file.path)
    }


}