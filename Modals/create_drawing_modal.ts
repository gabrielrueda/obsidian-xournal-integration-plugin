import { App, Modal, Setting, TFile } from "obsidian";

export class CreateDrawing extends Modal {
  result: string;
  folder: string;
  templateFile: string;
  onSubmit: (result: string) => void;

  constructor(app: App, folder: string, templateFile: string) {
    super(app);
    this.folder = folder;
    this.templateFile = templateFile;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "New Xournal Drawing" });

    new Setting(contentEl)
      .setName("File Name:")
      .addText((text) =>
        text.onChange((value) => {
          this.result = value
        })
      );

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            if(this.createXournalFile(this.result)){
              this.close();
            }
          }));
  }

  private createXournalFile(result: string){
    const newFilePath = this.folder + "/" + result + ".xopp"
    

    if(this.app.vault.getAbstractFileByPath(newFilePath)){
      return false;
    }

    const templateTFile = this.app.vault.getAbstractFileByPath(this.templateFile)

    if(templateTFile instanceof TFile){
      this.app.vault.copy(templateTFile, newFilePath)
    }else{
      return false
    }

    const currFile = this.app.workspace.getActiveFile()

    if(currFile != null && currFile.extension == "md"){
      this.app.vault.append(currFile, "![[" + this.folder + "/" + result + ".pdf]]")
    }      
    
    return true;
    
    }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}