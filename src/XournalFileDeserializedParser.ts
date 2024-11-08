import {App, debounce, TFile, normalizePath, Notice} from "obsidian";
import XournalFileContext from "./XournalFileContext";



export default class XournalFileDeserializedParser {
    app: App
    xournalFile: XournalFileContext

    constructor(app: App, xournalFile: XournalFileContext) {
        this.app = app
        this.xournalFile = xournalFile
    }

    public parseTagAtCursor(): string{
        const fileContent = this.xournalFile.rawContent
        const start = this.xournalFile.getFileIndex()
        let i = start

        while(fileContent[i] != "\n"){
            if(fileContent[i] == " " || fileContent[i] == ">"){
                return fileContent.slice(start, i)
            }
            i++;
        }
        return ""
    }

    public convertTextField(): string {
        const values = this.extractAttributes(["font=", "size=", "x=", "y=", "color="])
        
        let y = parseFloat(values[3]) + parseFloat(values[1])
        const raw_data = this.extract_raw_data()

        return `<text font-family="${values[0]}" font-size="${values[1]}" x="${values[2]}" y="${y}" fill="${values[4]}">${raw_data}</text>`         
    }

    public convertImageField(): string {
        const values = this.extractAttributes(["left=", "top=", "right=", "bottom="])
        
        const left = parseFloat(values[0]);
        const top = parseFloat(values[1]);
        const right = parseFloat(values[2]);
        const bottom = parseFloat(values[3]);
    
        // Calculate width and height
        const width = right - left;
        const height = bottom - top;

        // Update Boundary Window
        this.xournalFile.update_window(left, top)
        this.xournalFile.update_window(right, bottom)

        const raw_image_data = this.extract_raw_data()
    
        // Construct the output text
        return `<image x="${left}" y="${top}" width="${width}" height="${height}" xlink:href="data:image/png;base64,${raw_image_data}" />`

    }


    private extractAttributes(attributes: string[]): string[]{
        const values: string[] = []
        let i = this.xournalFile.getFileIndex()
        const file_content = this.xournalFile.rawContent
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
        
        return values
    }

    private extract_raw_data(){
        const file_content = this.xournalFile.rawContent
        const raw_start = file_content.indexOf('>', this.xournalFile.getFileIndex()) + 1;
        const raw_end = file_content.indexOf('<', raw_start);

        return file_content.substring(raw_start, raw_end)
    }


    private identify_outlier_widths(widths: number[]) : Set<number> {
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

    public convert_background_field() {
        const values = this.extractAttributes(["type="])

        if(values[0] == "pdf"){
            throw new Error("PDF files are not supported")
        }
    }

    public convert_stroke_field(): string {
        const data = []
        const values = this.extractAttributes(["color=", "width=", "capStyle=", "tool="])

        const widths = values[1].split(" ").map(parseFloat)

        let outliers = this.identify_outlier_widths(widths)

        const width = (widths.filter((ele, ind) => !outliers.has(ind)).reduce((a, b) => a + b)) / (widths.length - outliers.size)

        let opacity = 1
        if (values[3] == "highlighter") {
            opacity = 0.5
        }
                
        data.push(`<path fill="none" stroke-width="${width}" stroke-linecap="${values[2]}" stroke-linejoin="${values[2]}" stroke="${values[0]}" stroke-opacity="${opacity}" stroke-miterlimit="10" d=`)

        let raw_data = this.extract_raw_data().split(" ").map(parseFloat)

        data.push(`"M ${raw_data[0]},${raw_data[1]}`)
        this.xournalFile.update_window(raw_data[0], raw_data[1])

        for (let j = 2; j < raw_data.length; j+=2){
            data.push(` L ${raw_data[j]} ${raw_data[j+1]}`) 
            this.xournalFile.update_window(raw_data[j], raw_data[j+1])
        }

      
        data.push("\"/>")
        return data.join("");
    }

    public convert_page_field(): string {
        return `<svg viewBox="${this.xournalFile.getWindowMinWidth()} ${this.xournalFile.getWindowMinHeight()} ${this.xournalFile.getWindowMaxWidth()} ${this.xournalFile.getWindowMaxHeight()}">`
    }
    


}