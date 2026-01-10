import { App, TFile } from "obsidian";


// export default interface IXournalMetadataItem {
//     deserialize: (text: string) => void
//     serializeToCanvas: (ind: number) => void

// }

export default abstract class XournalMetadataItem {


    constructor(attr: Record<string, string>, value: string[]) {
        this.processAttr(attr)
        this.processValue(value)
    }

    // abstract deserialize(text: string): void;
    
    abstract processAttr(attr: Record<string, string>): void;

    abstract processValue(value: string[]): void;

    abstract print(): void;
}

