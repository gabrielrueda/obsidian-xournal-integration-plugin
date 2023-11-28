import { App, FuzzySuggestModal, Modal, Notice, TFile, loadPdfJs } from "obsidian";

import * as fs from 'fs';

const { exec } = require('child_process');



export class CreatePdfDrawing extends FuzzySuggestModal<TFile> {
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

    const doc = await fs.readFileSync(filePath);

    const info = await this.getPdfInfo(doc)

    console.log(info[0])
    console.log(info[1])
    console.log(info)


    const newfilePath = basePath + "/_xournal/" + file.basename + ".xopp"

    var writeStream = fs.createWriteStream(newfilePath);
    writeStream.write("<?xml version=\"1.0\" standalone=\"no\"?>\n");
    writeStream.write("<xournal version=\"0.4\">\n\n");

    // First Page:
    writeStream.write("<page width=\"" + String(info[0]) + "\" height=\"" + String(info[1]) + "\">\n")
    writeStream.write("<background type=\"pdf\" domain=\"absolute\" filename=\"" + filePath + "\" pageno=\"1ll\"/>\n")
    writeStream.write("<layer/>\n")
    writeStream.write("</page>\n\n")

    // Remaing pages
    for(var i = 2; i <= info[2]; i++){
      writeStream.write("<page width=\"" + String(info[0]) + "\" height=\"" + String(info[1]) + "\">\n")
      writeStream.write("<background type=\"pdf\" pageno=\"" + i + "ll\"/>\n")
      writeStream.write("<layer/>\n")
      writeStream.write("</page>\n\n")
    }

    writeStream.write("</xournal>")
    writeStream.end();

    const currFile = this.app.workspace.getActiveFile()

    if(currFile != null && currFile.extension == "md"){
      this.app.vault.append(currFile, "![[_xournal/" + file.basename + ".pdf]]")
    }
    

}

}