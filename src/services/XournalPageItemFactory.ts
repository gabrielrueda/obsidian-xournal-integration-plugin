import XournalBackground from "src/types/XournalBackground";
import XournalImage from "src/types/XournalImage";
import XournalLine from "src/types/XournalLine";
import XournalPage from "src/types/XournalPage";
import XournalPageItem from "src/types/XournalPageItem";
import XournalText from "src/types/XournalText";

type pageItemConstructor = new (
    attr: Record<string, any>, 
    value: string[], 
    page: XournalPage
) => XournalPageItem

export class XournalPageItemFactory {
    private static readonly registry: Record<string, pageItemConstructor> = {
        text: XournalText,
        image: XournalImage,
        stroke: XournalLine,
        background: XournalBackground
    }

    static create(tagName: string, attrs: Record<string, any> | null, value: string[], page: XournalPage): XournalPageItem | null{
        if (!attrs) return null;

        const ctr = this.registry[tagName];
        
        if(!ctr) return null;

        return new ctr(attrs, value, page)
    }
}