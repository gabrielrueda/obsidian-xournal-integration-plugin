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
    


    // NOTE: Map is ordered -> so if xournal changes order of it's properties, you must change it
    convert_text_field(file_content: string, data: string[], i: number){
        const fontIndex = file_content.indexOf('font="', i) + 'font="'.length;
        const sizeIndex = file_content.indexOf('size="', i) + 'size="'.length;
        const xIndex = file_content.indexOf('x="', i) + 'x="'.length;
        const yIndex = file_content.indexOf('y="', i) + 'y="'.length;
        const colorIndex = file_content.indexOf('color="', i) + 'color="'.length;

        // Extract Attribute values using the found indices
        const font = file_content.substring(fontIndex, file_content.indexOf('"', fontIndex));
        const size = parseFloat(file_content.substring(sizeIndex, file_content.indexOf('"', sizeIndex)));
        const x = parseFloat(file_content.substring(xIndex, file_content.indexOf('"', xIndex)));
        let y = parseFloat(file_content.substring(yIndex, file_content.indexOf('"', yIndex)));
        const color = file_content.substring(colorIndex, file_content.indexOf('"', colorIndex));

        y += size

        const raw_start = file_content.indexOf('>', colorIndex) + 1;
        const raw_end = file_content.indexOf('<', raw_start);

        const rawTextData = file_content.substring(raw_start, raw_end);
    

        data.push(`<text font-family="${font}" font-size="${size}" x="${x}" y="${y}" fill="${color}">${rawTextData}</text>`);

        // console.log(data[data.length - 1]);
        return raw_end;

    }



    convert_image_field(inputText: string, data: string[], i: number): number {
        // Find the index of each attribute
        const leftIndex = inputText.indexOf('left="', i) + 'left="'.length;
        const topIndex = inputText.indexOf('top="', i) + 'top="'.length;
        const rightIndex = inputText.indexOf('right="', i) + 'right="'.length;
        const bottomIndex = inputText.indexOf('bottom="', i) + 'bottom="'.length;
    
        // Extract attribute values using the found indices
        const left = parseFloat(inputText.substring(leftIndex, inputText.indexOf('"', leftIndex)));
        const top = parseFloat(inputText.substring(topIndex, inputText.indexOf('"', topIndex)));
        const right = parseFloat(inputText.substring(rightIndex, inputText.indexOf('"', rightIndex)));
        const bottom = parseFloat(inputText.substring(bottomIndex, inputText.indexOf('"', bottomIndex)));
    
        // Calculate width and height
        const width = right - left;
        const height = bottom - top;

        const raw_start = inputText.indexOf('>', bottomIndex) + 1;
        const raw_end = inputText.indexOf('<', raw_start);

        const rawImgData = inputText.substring(raw_start, raw_end);
    
        // Construct the output text
        data.push(`<image x="${left}" y="${top}" width="${width}" height="${height}" xlink:href="data:image/png;base64,${rawImgData}" />`);
    
        // console.log(data[data.length - 1]);
        return raw_end;
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