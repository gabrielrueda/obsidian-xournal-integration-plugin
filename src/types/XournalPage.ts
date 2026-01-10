import { extractTags } from "src/utils/XoppFileParserUtils";
import XournalMetadataItem from "./XournalMetadataItem";
import XournalPageItem from "./XournalPageItem";

const REQUIRED_TAGS = ["width", "height"]

export default class XournalPage extends XournalMetadataItem{
    processValue(value: string[]): void {
        return
    }

    print(): void {
        console.log("This is a page")
    }
    private width: number;
    private height: number;
    elements: XournalPageItem[];
    private ctx: CanvasRenderingContext2D;

    constructor(attr: Record<string, any>){
        super(attr, [])
        this.elements = [];
    }

    processAttr(attr: Record<string, any>): void {
        this.width = Number(attr["width"])
        this.height = Number(attr["height"])
    }

    public deserialize(line: string): void{
        const tags = extractTags(line, REQUIRED_TAGS);

        this.width = tags.get("width")
        this.height = tags.get("height")
    }

    public initializeCanvas(container: HTMLElement): void{
        const ctx = container.createEl('canvas', { attr: {id: 'page1', width: this.width, height: this.height} }).getContext('2d');
        if(!ctx) {
            throw new Error("Canvas could not be created for page")
        }

        this.ctx = ctx
    }

    public async serializeToCanvas(container: HTMLElement): Promise<void> {
        this.initializeCanvas(container)
        this.elements.forEach(async (element) => {element.serializeToCanvas()})
    }

    public getCtx(): CanvasRenderingContext2D {
        return this.ctx;
    }

    // public serializeToCanvas(ind: number): string{
    //     let content = [];

    //     content.push(`const ctx${ind} = document.getElementById('page${ind}').getContext('2d');`)

    //     for(const element of this.elements){
    //         content.push(element.serializeToCanvas(ind));
    //     }

    //     return content.join("\n");
    // }

    // public serializeHTMLToCanvas(ind: number): string {
    //     return `<canvas id="page${ind}" width="${this.width}" height="${this.height}" style="border:1px solid #FFFFFF;"></canvas>`;
    // }


    public addElement(element: XournalPageItem): void{
        this.elements.push(element);
    }
}
