import {App, debounce, TFile, normalizePath, Notice} from "obsidian";
import {ungzip} from "node-gzip"
import XournalFileContext from "./XournalFileContext";
import XournalFileDeserializedParser from "./XournalFileDeserializedParser";


const {exec} = require('child_process');

const SCALE = 0.4;

export class RenderContentService {
    app: App
    window: number[]
    buffer: number
    fileIndex: number


    constructor(app: App) {
        this.app = app
        this.window = []
        this.buffer = 5
    }

    public convertToSvg_debounced = debounce((file: TFile) => {
            this.convertToSvg(file)
        }, 500, true);
    
    private xournal_to_embed_name(file: TFile){
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
        try {
            const fileContext = new XournalFileContext(this.app)
            await fileContext.deserialize(file)
            const parser = new XournalFileDeserializedParser(this.app, fileContext)

            let data = [""]
            let pageStart = 0       

            while(fileContext.nextTag()){
                switch(parser.parseTagAtCursor()){
                    case "background":
                        parser.convert_background_field()
                        break
                    case "stroke":
                        data.push(parser.convert_stroke_field())
                        break
                    case "text":
                        data.push(parser.convertTextField())
                        break
                    case "image":
                        data.push(parser.convertImageField())
                        break
                    case "page":
                        data.push("</svg>")
                        pageStart = data.length - 1 
                        break
                    case "/page":
                        data[pageStart] = parser.convert_page_field()
                        data.push("</svg>")
                        break
                    case null:
                        throw new Error("Invalid tag")
                    default:
                        break
                }
            }

            await this.createNewFile(file, data.join(""))

        } catch(e) {
            console.log(e.message)
            return this.convertToPDF(file)
        }
    }


}