import XournalDrawing from "src/types/XournalDrawing";
import XournalImage from "src/types/XournalImage";
import XournalLine from "src/types/XournalLine";
import XournalMetadataItem from "src/types/XournalMetadataItem";
import XournalPage from "src/types/XournalPage";
import XournalText from "src/types/XournalText";


export default class XournalMetadataItemFactory {
    private drawing: XournalDrawing;

    constructor(drawing: XournalDrawing){
        this.drawing = drawing;
    }

    // public createItem(line: string): void {
    //     let item: XournalMetadataItem;
    //     switch(this.extractXMLProperty(line)) {
    //         case "page":
    //             item = new XournalPage(line);
    //             this.drawing.addPage(item as XournalPage);
    //             break;
    //         case "text":
    //             new XournalText(line, this.drawing.getLastPage());
    //             break;
    //         case "stroke":
    //             new XournalLine(line, this.drawing.getLastPage());
    //             break;
    //         case "image":
    //             new XournalImage(line, this.drawing.getLastPage());
    //             break;
    //         default:
    //             return;
    //     }
    // }

    private extractXMLProperty(line: string): string {
        if(line.length < 3) return ""
        
        return line.substring(1, this.indexOfAorB(line, '>', ' '))
    }

    private indexOfAorB(str: string, a: string, b: string): number{
        let i = 0
        while(str.charAt(i) != a && str.charAt(i) != b){
            i += 1
            if (str.length == i) return -1
        }

        return i
    }
} 