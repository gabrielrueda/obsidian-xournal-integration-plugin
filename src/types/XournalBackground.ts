import XournalPage from "./XournalPage";
import XournalPageItem from "./XournalPageItem";



export default class XournalBackground extends XournalPageItem {
    private color: string;

    constructor(attr: Record<string, any>, value: string[], page: XournalPage) {
        super(attr, value, page)
    }

    public async serializeToCanvas(): Promise<void> {
        console.log("Setting background color to ", this.color)
        const ctx = this.page.getCtx()
        ctx.canvas.style.backgroundColor = this.color
    }

    processAttr(attr: Record<string, string>): void {
        this.color = String(attr["color"]);    
    }
    
    processValue(value: string[]): void {
        return;
    }
}