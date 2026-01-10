import { App, TFile } from "obsidian";
import XournalMetadataItem from "./XournalMetadataItem";
import { extractRawData, extractTags } from "src/utils/XoppFileParserUtils";
import XournalPageItem from "./XournalPageItem";
import XournalPage from "./XournalPage";


const REQUIRED_TAGS = ["font", "size", "x", "y", "color"]

export default class XournalText extends XournalPageItem {


    print(): void {
        console.log("This is a text")
    }
    private font: string
    private size: number
    private x: number
    private y: number
    private color: string
    private text: string


    constructor(attr: Record<string, any>, value: string[], page: XournalPage) {
        super(attr, value, page)
    }

    processAttr(attr: Record<string, any>): void {
        // this.font = attr["font"]
        // this.size = parseFloat(attr["size"])
        // this.x = parseFloat(attr["x"])
        // this.y = parseFloat(attr["y"])
        // this.color = attr["color"]
        Object.assign(this, attr)
    }
    processValue(value: string[]): void {
        this.text = value.join("")
    }

    public deserialize(line: string): void {
        const text = extractRawData(line);

        if(!text){
            throw new Error("Missing required tag in Text Property: text")
        }
        this.text = text
    
        const tags = extractTags(line, REQUIRED_TAGS)
    
        this.font = tags.get("font")
        this.size = tags.get("size")
        this.x = tags.get("x")
        this.y = tags.get("y")
        this.color = tags.get("color")
    }

    // public serializeToCanvas(ind: number): string{
    //     //  <canvas id="myCanvas" width="200" height="100"></canvas>
    //     return `ctx${ind}.font = '${this.size}px ${this.font}';\nctx${ind}.fillStyle = '${this.color}';\nctx${ind}.fillText('${this.text}', ${this.x}, ${this.y});`;
    // }

    public async serializeToCanvas(): Promise<void> {
        const ctx = this.page.getCtx()

        ctx.font = `${this.size}px ${this.font}`

        ctx.fillStyle = this.color

        ctx.fillText(this.text, this.x, this.y)
    }
}