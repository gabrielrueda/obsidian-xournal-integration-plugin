import XournalPage from "./XournalPage";

export default class XournalDrawing {
    private currentContainer: HTMLElement;
    pages: XournalPage[];
    id: string;

    constructor(container: HTMLElement, id: string){
        this.pages = [];
        this.currentContainer = container;
        this.id = id;
    }

    public async addPage(page: XournalPage): Promise<void>{
        this.pages.push(page);
        page.serializeToCanvas(this.currentContainer)
    }

    public async parseDrawing(): Promise<void>{
        for (const page of this.pages){
            await page.serializeToCanvas(this.currentContainer)
        }
    }


    public async parseDrawingNewContainer(container: HTMLElement): Promise<void>{
        this.currentContainer = container;
        this.parseDrawing()
    }


    public getLastPage(): XournalPage {
         if(this.pages.length == 0){
            throw new Error("No pages in drawing to add element to.");
        }
        
        return this.pages[this.pages.length - 1]
    }

}
