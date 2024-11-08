import {App, FuzzySuggestModal, TFile} from "obsidian";
import {CreateDrawingService} from "../services/create_drawing_service";

export class CreatePdfDrawing extends FuzzySuggestModal<TFile> {
    createDrawingService: CreateDrawingService
    outputFolder: string

    constructor(app: App, createDrawingService: CreateDrawingService, outputFolder: string = createDrawingService.plugin.settings.xopp_location) {
        super(app);
        this.createDrawingService = createDrawingService
        this.outputFolder = outputFolder
    }

    getItems(): TFile[] {
        const files = this.app.vault.getFiles();

        return files.filter(
            (element) => {
                return element.extension == "pdf"
            }
        )
    }

    getItemText(file: TFile): string {
        return file.name;
    }

    async onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent) {
        await this.createDrawingService.createFromPdf(file, this.outputFolder)
    }
}
