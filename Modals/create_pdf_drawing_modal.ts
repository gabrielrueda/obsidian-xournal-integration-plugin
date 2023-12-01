import { App, FuzzySuggestModal, Modal, Notice, TFile, loadPdfJs } from "obsidian";

export class CreatePdfDrawing extends FuzzySuggestModal<TFile> {
  folder: string;

  constructor(app: App, folder: string) {
    super(app);
    this.folder = folder;  
  }

    getItems(): TFile[] {
      const files = this.app.vault.getFiles();
  
      return files.filter(
        (element, index, array) => {
          if(element.extension == "pdf"){
            return true;
          }
          return false;
        }
      )
    }

    async getPdfInfo(data: Buffer) {
      const pdfjs = await loadPdfJs();
      let doc = await pdfjs.getDocument({data}).promise;

      let res = [0, 0, doc.numPages]

      await doc.getPage(2).then(page => {
        res[0] = page.view[2] - page.view[0]
        res[1] = page.view[3] - page.view[1]
      });

      return res
        
    }

    getItemText(file: TFile): string {
      return file.name;
    }
    
  async onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent) {
    const basePath = (this.app.vault.adapter as any).basePath;
    const filePath = basePath + "/" + file.path;

    const doc = await this.app.vault.readBinary(file)
    
    const info = await this.getPdfInfo(Buffer.from(doc))

    const newfilePath = this.folder + "/" + file.basename + ".xopp"

    let fileContent = []

    // Header
    fileContent.push("<?xml version=\"1.0\" standalone=\"no\"?>\n");
    fileContent.push("<xournal creator=\"obsidianplugin\" fileversion=\"0.4\">\n\n");

    // First Page:
    fileContent.push("<page width=\"" + String(info[0]) + "\" height=\"" + String(info[1]) + "\">\n")
    fileContent.push("<background type=\"pdf\" domain=\"absolute\" filename=\"" + filePath + "\" pageno=\"1ll\"/>\n")
    fileContent.push("<layer/>\n")
    fileContent.push("</page>\n\n")

    // Remaing pages
    for(var i = 2; i <= info[2]; i++){
      fileContent.push("<page width=\"" + String(info[0]) + "\" height=\"" + String(info[1]) + "\">\n")
      fileContent.push("<background type=\"pdf\" pageno=\"" + i + "ll\"/>\n")
      fileContent.push("<layer/>\n")
      fileContent.push("</page>\n\n")
    }

    fileContent.push("</xournal>")

    this.app.vault.create(newfilePath, fileContent.join(""))

    const currFile = this.app.workspace.getActiveFile()

    if(currFile != null && currFile.extension == "md"){
      this.app.vault.append(currFile, "![[" + this.folder + "/" + file.basename + ".pdf]]")
    }
    

}

}