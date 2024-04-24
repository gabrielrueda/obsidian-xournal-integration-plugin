import {App, debounce, loadPdfJs, moment, normalizePath, TFile} from "obsidian";
import {ungzip} from "node-gzip"




export class RenderContentService {
    app: App
    text_prop_conversion: Map<string, string>; 
    image_prop_conversion: Map<string, string>; 


    constructor(app: App) {
        this.app = app
        this.text_prop_conversion = new Map<string, string>([
            ["font", "font-family"],
            ["size", "font-size"],
            ["x","x"],
            ["y","y"],
            ["color", "fill"]
        ]);

        this.image_prop_conversion = new Map<string, string>([
            ["left", "x"],
            ["top", "y"],
            ["right", "width"],
            ["bottom", "height"]
        ]);
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


    render_debounced = debounce((file: TFile) => {
            this.convertToSvg(file)
        }, 500, true);
    


    // NOTE: Map is ordered -> so if xournal changes order of it's properties, you must change it
    convert_text_field(file_content: string, data: string[], i: number){
        data.push("<text ")
        
        // Add Properties:
        this.text_prop_conversion.forEach((value, key) => {
            i = file_content.indexOf(key, i) + key.length + 2
            let j = file_content.indexOf("\"", i)
            data.push(value + "=\"" + file_content.slice(i, j) + "\" ")
            i = j + 1
        });

        // Adds Remaining Content: 
        while(file_content[i] != "\n"){
            data.push(file_content[i])
            i++;
        }
        return i;
    }


    // NOTE: Map is ordered -> so if xournal changes order of it's properties, you must change it
    convert_image_field(file_content: string, data: string[], i: number){
        data.push("<image ")
        
        // Add Properties:
        this.image_prop_conversion.forEach((value, key) => {
            i = file_content.indexOf(key, i) + key.length + 2
            let j = file_content.indexOf("\"", i)
            data.push(value + "=\"" + file_content.slice(i, j) + "\" ")
            i = j + 1
        });

        data.push(" xlink:href=\"data:image/png;base64,")
        i = file_content.indexOf(">", i) + 1

        // Add Image Data
        while(file_content[i] != "<"){
            data.push(file_content[i])
            i++;
        }

        data.push("\"/>")

        return i;
    }


    async convertToSvg(file: TFile) {

        console.log("Starting conversion for " + file.path)
        let fileContent = (await ungzip(await this.app.vault.readBinary(file))).toString()


        let tag = this.getTag(fileContent, 0)

        let i = tag.length + 1;

        let data_start = 0;
        let mid = false;

        let data = ["<svg viewBox=\"0 0 595.27559 841.88976\">"]


        while(tag != "/xournal" || tag == null){
            if(tag == "stroke"){

                i = fileContent.indexOf("color", i) + 7

                let color = fileContent.slice(i, fileContent.indexOf("\"", i))

                data.push("<path fill=\"none\" stroke-width=\"1.41\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"" + color + "\" stroke-opacity=\"1\" stroke-miterlimit=\"10\" d=\"M ")
                mid = false
                data_start = fileContent.indexOf(">", i) + 1
                i = data_start

                while(fileContent[i] != "<"){
                    if(fileContent[i] == " "){
                        if(mid){
                            data.push(" L ")
                            mid = false
                        }else{
                            data.push(" ")
                            mid = true
                        }
                    }else{
                        data.push(fileContent[i])
                    }
                    i++;
                }

                data.push("\"/>")
            }
            else if(tag == "text"){
                i = this.convert_text_field(fileContent, data, i)
            }
            else if(tag == "image"){
                i = this.convert_image_field(fileContent, data, i)
            }

            while(fileContent[i] != "\n"){
                i++
            }
            i++;
            

            tag = this.getTag(fileContent, i)
            i = i + tag.length + 1
        
        }

        data.push("</svg>")

        const newFile = this.app.vault.getAbstractFileByPath(file.path + ".md")

        if(newFile) {
            await this.app.vault.delete(newFile)
        }


        await this.app.vault.create(file.path + ".md", data.join(""))
        // await this.app.vault.create(file.path + ".md", fileContent)

        console.log("Finished conversion for " + file.path)
    }

}