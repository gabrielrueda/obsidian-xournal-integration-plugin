import {FuzzySuggestModal, normalizePath, Notice, TFile} from "obsidian";


const {exec} = require('child_process');


export class EmbedDrawing extends FuzzySuggestModal<TFile> {
    getItems(): TFile[] {
        const files = this.app.vault.getFiles();

        return files.filter(
            (element, index, array) => {
                return element.extension == "xopp";
            }
        )
    }

    getItemText(file: TFile): string {
        return file.name;
    }


    async onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent) {

        const basePath = (this.app.vault.adapter as any).basePath

        const filePath = normalizePath("\"" + basePath + "/" + file.path + "\"");


        const editor = this.app.workspace.activeEditor?.editor;

        editor?.replaceRange(
            `![[${file.path}.md|xournal-embed]]`,
            editor?.getCursor()
        )
     
    }

}