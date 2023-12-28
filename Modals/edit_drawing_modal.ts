import {FuzzySuggestModal, normalizePath, Notice, TFile} from "obsidian";

const {exec} = require('child_process');


export class EditDrawing extends FuzzySuggestModal<TFile> {
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

        const pdfFilePath = filePath.slice(0, -5) + "pdf" + "\"";

        const command = "xournalpp " + filePath + "; xournalpp -p " + pdfFilePath + " " + filePath;

        exec(command, (err: string) => {
            // once the command has completed, the callback function is called
            if (err) {
                // Fix if xournalpp command can't be found, opens file in default application for .xopp
                exec(`xdg-open ${filePath}`, (openErr: string)  => {
                    if(openErr) {
                        // log and return if we encounter an error
                        console.error("could not execute command: ", err)
                        new Notice(`Error: could not execute command ${command}`)
                        return
                    }
                })
            }
        })

    }

}