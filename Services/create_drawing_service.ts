import {App, loadPdfJs, moment, normalizePath, TFile} from "obsidian";
import {gzip, ungzip} from "node-gzip"
import {FileAlreadyExistsModal} from "../Modals/file_already_exists_modal";
import {SelectNameModal} from "../Modals/select_name_modal";
import XournalIntegrationPlugin from "../main";

export class CreateDrawingService {
    app: App
    plugin: XournalIntegrationPlugin

    constructor(app: App, plugin: XournalIntegrationPlugin) {
        this.app = app
        this.plugin = plugin
    }

    async createEmpty(name: string, outputFolder: string = this.plugin.settings.xopp_location) {
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

        await this.createXoppFile(newFilePath, fileContent.join(""))
    }

    async createFromTemplate(name: string, outputFolder: string = this.plugin.settings.xopp_location){
        const newFilePath = outputFolder + "/" + name + ".xopp"

        if(this.app.vault.getAbstractFileByPath(newFilePath)){
            throw Error(`File ${newFilePath} already exists`)
        }

        const templateTFile = this.app.vault.getAbstractFileByPath(this.plugin.settings.template_location)

        if(templateTFile instanceof TFile){
            let fileContent = (await ungzip(await this.app.vault.readBinary(templateTFile))).toString()
            fileContent = fileContent
                .replace("${title}", name)
                .replace("${date}", moment().format(this.plugin.settings.date_format))

            await this.createXoppFile(newFilePath, fileContent)
        } else {
            throw Error(`Couldn't create new file '${newFilePath}: Template file '${this.plugin.settings.template_location}' does not exist`)
        }

    }

    async createFromPdf(file: TFile, outputFolder: string = this.plugin.settings.xopp_location) {
        const basePath = (this.app.vault.adapter as any).basePath;
        const filePath = basePath + "/" + file.path

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

        await this.createXoppFile(newFilePath, fileContent.join(""))
    }

    private async createXoppFile(filePath: string, content: string) {
        const newFile = this.app.vault.getAbstractFileByPath(filePath)

        if(!newFile || this.plugin.settings.overwrite_files) {
            await this.createFile(filePath, content)
        } else {
            new FileAlreadyExistsModal(this.app, filePath, (result) => {
                if(result === "overwrite") {
                    this.createFile(filePath, content)
                } else if(result === "newName") {
                    new SelectNameModal(this.app, `New name for file ${filePath}`, (result) => {
                        const newFilePath = normalizePath(filePath.substring(0, filePath.lastIndexOf("/")) + "/" + result + ".xopp")
                        this.createXoppFile(newFilePath, content)
                    }).open()
                } else {
                    return
                }
            }).open()
        }

        const currFile = this.app.workspace.getActiveFile()
        const editor = this.app.workspace.activeEditor?.editor;

        if(currFile != null && currFile.extension == "md"){
            editor?.replaceRange(
                `![[${filePath}]]`,
                editor?.getCursor()
            )
        }
    }

    private async createFile(file: string, content: string) {
        const newFile = this.app.vault.getAbstractFileByPath(file)
        if(newFile) {
            await this.app.vault.delete(newFile)
        }
        this.createFolders(file.substring(0, file.lastIndexOf("/")))

        const compressed = await gzip(content)
        await this.app.vault.createBinary(file, compressed)
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

    createFolders(folder: string) {
        if(this.app.vault.getAbstractFileByPath(folder)) {
            return
        }
        if(!folder.contains("/")) {
            this.app.vault.createFolder(folder)
            return
        }

        const parent = folder.substring(0, folder.lastIndexOf("/"))

        this.createFolders(parent)
        this.app.vault.createFolder(folder)
    }
}