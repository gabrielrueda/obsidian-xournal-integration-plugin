import { ungzip } from "node-gzip"
import { App, TFile } from "obsidian"
import { SAXParser } from "sax-ts"
import XournalDrawing from "src/types/XournalDrawing"
import XournalImage from "src/types/XournalImage"
import XournalLine from "src/types/XournalLine"
import XournalPage from "src/types/XournalPage"
import XournalText from "src/types/XournalText"
import { XournalPageItemFactory } from "./XournalPageItemFactory"
const { performance } = require('perf_hooks');


const CACHE_SIZE = 5;

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

    public async renderDrawing(file: TFile, container: HTMLElement) {
        const drawing = new XournalDrawing(container);
        // TODO: remove the await call when finished with this
        await this.parseXournalXML(file, drawing)
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