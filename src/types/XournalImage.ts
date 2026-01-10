import { extractRawData, extractTags } from "src/utils/XoppFileParserUtils";
import XournalMetadataItem from "./XournalMetadataItem";
import XournalPageItem from "./XournalPageItem";
import XournalPage from "./XournalPage";


const REQUIRED_TAGS = ["left", "top", "right", "bottom"]

export default class XournalImage extends XournalPageItem {

    private dataURL: string;
    private x: number;
    private y: number;
    private width: number;
    private height: number;

    print(): void {
        console.log("This is a image")
    }

    constructor(attr: Record<string, any>, value: string[], page: XournalPage) {
        super(attr, value, page)
    }

    public deserialize(line: string): void {
        const raw_image_data = extractRawData(line);

        if (!raw_image_data) {
            throw new Error("Missing required tag in Image Property: image data")
        }

        this.dataURL = `data:image/png;base64,${raw_image_data}`;

        const tags = extractTags(line, REQUIRED_TAGS)

        this.x = tags.get("left");
        this.y = tags.get("top");
        this.width = tags.get("right") - this.x;
        this.height = tags.get("bottom") - this.y;
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
    
    // public serializeToCanvas(ind: number): string {
    //     return `drawImage(ctx${ind}, "${this.dataURL}", ${this.x}, ${this.y}, ${this.width}, ${this.height})`
    // }

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

    loadImage(): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);

            img.src = this.dataURL;
        });
    }

    
}