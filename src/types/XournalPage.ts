import XournalBackground from "./XournalBackground";
import XournalMetadataItem from "./XournalMetadataItem";
import XournalPageItem from "./XournalPageItem";


export default class XournalPage extends XournalMetadataItem{
    width: number;
    height: number;
    elements: XournalPageItem[];
    private ctx: CanvasRenderingContext2D;
    private background: XournalBackground | null = null;

    constructor(attr: Record<string, any>){
        super(attr, [])
        this.elements = [];
    }

    processAttr(attr: Record<string, any>): void {
        this.width = Number(attr["width"])
        this.height = Number(attr["height"])
    }

    processValue(value: string[]): void {
        return
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
        this.background?.serializeToCanvas()
        this.elements.forEach(async (element) => {element.serializeToCanvas()})
    }

    public getCtx(): CanvasRenderingContext2D {
        return this.ctx;
    }

    public addElement(element: XournalPageItem): void{
        if(element instanceof XournalBackground) {
            this.background = element;
            return;
        }
        this.elements.push(element);
    }
}
