import XournalMetadataItem from "./XournalMetadataItem";
import XournalPage from "./XournalPage";

export default abstract class XournalPageItem extends XournalMetadataItem {
    page: XournalPage;
    
    constructor(attr: Record<string, any>, value: string[], page: XournalPage) {
        super(attr, value)
        page.addElement(this)
        this.page = page
    } 

    abstract serializeToCanvas(): Promise<void>;
}