import { App, Modal, Setting } from "obsidian";

const { exec } = require('child_process');

export class CreateDrawing extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App) {
    super(app);
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
    const filePath = (this.app.vault.adapter as any).basePath + "/_xournal/" + result + ".xopp"

    if(this.app.vault.getAbstractFileByPath("_xournal/" + result + ".xopp")){
      return false;
    }

    const templatePath = (this.app.vault.adapter as any).basePath + "/_xournal/template.xopp" 

    const command = "cp " + templatePath + " " + filePath

    const currFile = this.app.workspace.getActiveFile()

    if(currFile != null && currFile.extension == "md"){
      this.app.vault.append(currFile, "![[_xournal/" + result + ".pdf]]")
    }
    
    exec(command, (err, output) => {
        // once the command has completed, the callback function is called
        if (err) {
            // log and return if we encounter an error
            console.error("could not execute command: ", err)
            return false;
        }
        // log the output received from the command
        console.log("Output: \n", output)
        });
      
      
        return true;
    
    }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}