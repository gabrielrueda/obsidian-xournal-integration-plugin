import XournalMetadataItem from "./XournalMetadataItem";
import XournalPage from "./XournalPage";

export default class XournalDrawing {
    private currentContainer: HTMLElement;

    pages: XournalPage[];

    constructor(container: HTMLElement){
        this.pages = [];
        this.currentContainer = container;
    }

    public async addPage(page: XournalPage): Promise<void>{
        this.pages.push(page);
        page.serializeToCanvas(this.currentContainer)
    }

    public getLastPage(): XournalPage {
         if(this.pages.length == 0){
            throw new Error("No pages in drawing to add element to.");
        }
        
        return this.pages[this.pages.length - 1]
    }

    // public serializeToCanvas(container: HTMLElement): void {

    //     this.pages.forEach(async (page) => {page.serializeToCanvas(container)})
        
    // }
}
