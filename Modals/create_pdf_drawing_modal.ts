import {App, FuzzySuggestModal, TFile} from "obsidian";
import {CreateDrawingService} from "../Services/create_drawing_service";

export class CreatePdfDrawing extends FuzzySuggestModal<TFile> {
    createDrawingService: CreateDrawingService
    outputFolder: string

    constructor(app: App, createDrawingService: CreateDrawingService, outputFolder: string = createDrawingService.outputFolder) {
        super(app);
        this.createDrawingService = createDrawingService
        this.outputFolder = outputFolder
    }

    getItems(): TFile[] {
        const files = this.app.vault.getFiles();

        return files.filter(
            (element, index, array) => {
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
