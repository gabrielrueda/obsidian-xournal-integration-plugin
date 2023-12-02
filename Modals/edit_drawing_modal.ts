import { App, FuzzySuggestModal, Modal, Notice, TFile, normalizePath } from "obsidian";

const { exec } = require('child_process');


export class EditDrawing extends FuzzySuggestModal<TFile> {
  getItems(): TFile[] {
    const files = this.app.vault.getFiles();

    return files.filter(
      (element, index, array) => {
        if(element.extension == "xopp"){
          return true;
        }
        return false;
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
    
    exec(command, (err, output) => {
        // once the command has completed, the callback function is called
        if (err) {
            // log and return if we encounter an error
            console.error("could not execute command: ", err)
            return
        }
        // log the output received from the command
        console.log("Output: \n", output)
        })
    
    }
    
  }