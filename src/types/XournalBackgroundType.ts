export default interface XournalBackgroundOverlay {
   serializeToCanvas(): Promise<void>
}

const LINED_COLOR_HORIZONTAL = "#CCCCCC"
const LINED_COLOR_VERTICAL = "#CCCCCC"



export default class XournalBackgroundLinedOverlay implements XournalBackgroundOverlay {
    private lineColor: string;
    private lineSpacing: number;
    private pageWidth: number;
    private pageHeight: number;
    private ctx: CanvasRenderingContext2D;

    constructor(lineColor: string, lineSpacing: number, pageWidth: number, pageHeight: number, ctx: CanvasRenderingContext2D) {
        this.lineColor = lineColor;
        this.lineSpacing = lineSpacing;
        this.pageWidth = pageWidth;
        this.pageHeight = pageHeight;
        this.ctx = ctx;
    }

    public async serializeToCanvas(): Promise<void> {
        const ctx = this.ctx;
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = 1;

        for (let y = this.lineSpacing; y < this.pageHeight; y += this.lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.pageWidth, y);
            ctx.stroke();
        }
    }


}
