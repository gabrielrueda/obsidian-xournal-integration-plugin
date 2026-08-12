
export default abstract class XournalMetadataItem {


    constructor(attr: Record<string, string>, value: string[]) {
        this.processAttr(attr)
        this.processValue(value)
    }
    
    abstract processAttr(attr: Record<string, string>): void;

    abstract processValue(value: string[]): void;

}

