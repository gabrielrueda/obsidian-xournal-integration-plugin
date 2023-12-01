import { App, FuzzySuggestModal, Modal, Notice, TFile } from "obsidian";


export class DeleteDrawing extends FuzzySuggestModal<TFile> {
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
    const pdfFile = this.app.vault.getAbstractFileByPath(file.path.slice(0, -5) + ".pdf")

    if(pdfFile != null){
      this.app.vault.delete(pdfFile)
    }

    this.app.vault.delete(file)

    }
    
  }