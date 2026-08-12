import XournalPageItem from "./XournalPageItem";
import XournalPage from "./XournalPage";


const REQUIRED_TAGS = ["left", "top", "right", "bottom"]

export default class XournalImage extends XournalPageItem {

    private dataURL: string;
    private x: number;
    private y: number;
    private width: number;
    private height: number;

    constructor(attr: Record<string, any>, value: string[], page: XournalPage) {
        super(attr, value, page)
    }

    
    processAttr(attr: Record<string, any>): void {
        this.x = Number(attr["left"])
        this.y = Number(attr["top"])
        this.width = Number(attr["right"]) - this.x;
        this.height = Number(attr["bottom"]) - this.y;
    }

    processValue(value: string[]): void {
        this.dataURL = `data:image/png;base64,${value.join("")}`;
    }    

    public async serializeToCanvas(): Promise<void> {
        const ctx = this.page.getCtx()
        
        const image = await this.loadImage();

        ctx.drawImage(
            image,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    private loadImage(): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);

            img.src = this.dataURL;
        });
    }

    
}