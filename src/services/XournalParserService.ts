import { ungzip } from "node-gzip"
import { App, TFile } from "obsidian"
import { SAXParser } from "sax-ts"
import XournalDrawing from "src/types/XournalDrawing"
import XournalPage from "src/types/XournalPage"
import { XournalPageItemFactory } from "./XournalPageItemFactory"


const CACHE_SIZE = 1;

interface Node { 
    name: string | null; 
    attributes: Record<string, any> 
}

export default class XournalParserService {
    private cache: XournalDrawing[];
    private app: App;

    constructor(app: App){
        this.cache = []
        this.app = app;
    }

    private updateCache(drawing: XournalDrawing) {
        this.cache.push(drawing)
        if (this.cache.length > CACHE_SIZE) {
            this.cache.shift()
        }
    }


    private findInCache(file: TFile): XournalDrawing | null {
        for (const drawing of this.cache) {
            if (drawing.id === file.path) {
                return drawing
            }
        }
        return null
    }

    public async renderDrawing(file: TFile, container: HTMLElement) {

        let drawing = this.findInCache(file);

        if (drawing) {
            await drawing.parseDrawingNewContainer(container)
        } else {
            drawing = new XournalDrawing(container, file.path);
            // TODO: remove the await call when finished with this
            await this.parseXournalXML(file, drawing)
    
            this.updateCache(drawing)
        }

        return drawing        
    }

    private async unzipContent(file: TFile): Promise<string> {
        return ungzip(await this.app.vault.readBinary(file))
        .then(buf => buf.toString())
    }

    private async parseXournalXML(file: TFile, drawing: XournalDrawing) {
        const parser = new SAXParser(true, {});
        const xml = await this.unzipContent(file)


        let currentAttrs: Record<string, any> | null = null
        let textBuffer: string[] = []
        let currentPage: XournalPage | null = null

        parser.onopentag = (node: Node) => {
            currentAttrs = node.attributes
            textBuffer = []

            if (node.name === "page") {
                currentPage = new XournalPage(currentAttrs)
            }

            if(node.name === "background" && currentPage) {
                XournalPageItemFactory.create(node.name, currentAttrs, textBuffer, currentPage)
            }
        }

        parser.ontext = (text: string) => {
            textBuffer.push(text)
        }

        parser.onclosetag = (tagName: string) => {
            if (!currentPage || textBuffer.length == 0) return

            if(tagName == "page"){
                drawing.addPage(currentPage)
            } else {
                XournalPageItemFactory.create(tagName, currentAttrs, textBuffer, currentPage)
            }

            currentAttrs = null
            textBuffer = []
        }

        parser.write(xml).close()
    }

}