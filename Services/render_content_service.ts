import {App, debounce, loadPdfJs, moment, normalizePath, TFile} from "obsidian";
import {ungzip} from "node-gzip"




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


    render_debounced = debounce((file: TFile) => {
            this.convertToSvg(file)
        }, 500, true);

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
        console.log("Finished conversion for " + file.path)
    }

}