import {App, loadPdfJs, normalizePath, Notice, TFile} from "obsidian";
import {XournalIntegrationSettings} from "../settings";

export class CreateDrawingService {
    app: App
    settings: XournalIntegrationSettings

    constructor(app: App, settings: XournalIntegrationSettings) {
        this.app = app
        this.settings = settings
    }

    createEmpty(name: string, outputFolder: string = this.settings.xopp_location) {
        let fileContent = []

        // Header
        fileContent.push("<?xml version=\"1.0\" standalone=\"no\"?>\n");
        fileContent.push("<xournal creator=\"obsidianplugin\" fileversion=\"0.4\">\n");
        fileContent.push(`<title>${name}</title>\n\n`)

        // Page:
        fileContent.push("<page width=\"595.27559100\" height=\"841.88976400\">\n")
        fileContent.push("<background type=\"solid\" color=\"#ffffffff\" style=\"lined\"/>\n")
        fileContent.push("<layer/>\n")
        fileContent.push("</page>\n\n")

        fileContent.push("</xournal>\n")

        const newFilePath = normalizePath(`${outputFolder}/${name}.xopp`)
        const newFile = this.app.vault.getAbstractFileByPath(newFilePath)
        if(!newFile || this.settings.overwrite_files) {
            if(newFile && this.settings.overwrite_files) {
                this.app.vault.delete(newFile)
                new Notice(`The file ${newFilePath} was overridden`)
            }
            this.app.vault.create(newFilePath, fileContent.join(""))
        } else {
            new Notice(`The file ${newFilePath} already exists`)
            return
        }

        const currFile = this.app.workspace.getActiveFile()
        const editor = this.app.workspace.activeEditor?.editor;

        if(currFile != null && currFile.extension == "md"){
            editor?.replaceRange(
                `![[${newFilePath}]]`,
                editor?.getCursor()
            )
        }
    }

    createFromTemplate(name: string, outputFolder: string = this.settings.xopp_location){
        const newFilePath = outputFolder + "/" + name + ".xopp"

        if(this.app.vault.getAbstractFileByPath(newFilePath)){
            throw Error(`File ${newFilePath} already exists`)
        }

        const templateTFile = this.app.vault.getAbstractFileByPath(this.settings.template_location)

        if(templateTFile instanceof TFile){
            this.app.vault.copy(templateTFile, newFilePath)
        } else {
            throw Error(`Couldn't create new file '${newFilePath}: Template file '${this.settings.template_location}' does not exist`)
        }

        const currFile = this.app.workspace.getActiveFile()
        const editor = this.app.workspace.activeEditor?.editor;

        if(currFile != null && currFile.extension == "md"){
            editor?.replaceRange(
                `![[${newFilePath}]]`,
                editor?.getCursor()
            )
        }
    }

    async createFromPdf(file: TFile, outputFolder: string = this.settings.xopp_location) {
        const basePath = (this.app.vault.adapter as any).basePath;
        const filePath = "/" + normalizePath(basePath + "/" + file.path);

        const doc = await this.app.vault.readBinary(file)

        const info = await this.getPdfInfo(Buffer.from(doc))

        const newFilePath = normalizePath(outputFolder + "/" + file.basename + ".xopp")

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
        for(let i = 2; i <= info[2]; i++){
            fileContent.push("<page width=\"" + String(info[0]) + "\" height=\"" + String(info[1]) + "\">\n")
            fileContent.push("<background type=\"pdf\" pageno=\"" + i + "ll\"/>\n")
            fileContent.push("<layer/>\n")
            fileContent.push("</page>\n\n")
        }

        fileContent.push("</xournal>")

        const newFile = this.app.vault.getAbstractFileByPath(newFilePath)
        if(!newFile || this.settings.overwrite_files) {
            if(newFile && this.settings.overwrite_files) {
                this.app.vault.delete(newFile)
            }
            this.app.vault.create(newFilePath, fileContent.join(""))
        } else {
            new Notice(`The file ${newFilePath} already exists`)
            return
        }

        const currFile = this.app.workspace.getActiveFile()
        const editor = this.app.workspace.activeEditor?.editor;

        if(currFile != null && currFile.extension == "md"){
            editor?.replaceRange(
                `![[${newFilePath}]]`,
                editor?.getCursor()
            )
        }
    }

    async getPdfInfo(data: Buffer) {
        const pdfjs = await loadPdfJs();
        let doc = await pdfjs.getDocument({data}).promise;

        let res = [0, 0, doc.numPages]

        let page = await doc.getPage(2)
        res[0] = page.view[2] - page.view[0]
        res[1] = page.view[3] - page.view[1]

        return res
    }
}