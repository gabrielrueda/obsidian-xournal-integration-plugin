import XournalPageItem from "./XournalPageItem";
import XournalPage from "./XournalPage";


const REQUIRED_TAGS = ["font", "size", "x", "y", "color"]

export default class XournalText extends XournalPageItem {
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

    public async serializeToCanvas(): Promise<void> {
        const ctx = this.page.getCtx()

        ctx.font = `${this.size}px ${this.font}`

        ctx.fillStyle = this.color

        ctx.fillText(this.text, this.x, this.y)
    }
}