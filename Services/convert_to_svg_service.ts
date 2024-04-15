import {App, loadPdfJs, moment, normalizePath, TFile} from "obsidian";
import {gzip, ungzip} from "node-gzip"
import {FileAlreadyExistsModal} from "../Modals/file_already_exists_modal";
import {SelectNameModal} from "../Modals/select_name_modal";
import XournalIntegrationPlugin from "../main";



export class ConvertToSvgService {
    app: App
    plugin: XournalIntegrationPlugin

    constructor(app: App, plugin: XournalIntegrationPlugin) {
        this.app = app
        this.plugin = plugin
    }

}