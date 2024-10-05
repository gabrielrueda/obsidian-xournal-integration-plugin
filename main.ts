import {SelectNameModal} from "Modals/select_name_modal";
import {EditDrawing} from "Modals/edit_drawing_modal";
import {CreatePdfDrawing} from "Modals/create_pdf_drawing_modal";
import {DeleteDrawing} from "Modals/delete_drawing_modal";
import {Plugin, TFile, TFolder} from "obsidian";
import {XournalIntegrationSettings, XournalIntegrationSettingsTab} from "settings";
import {CreateDrawingService} from "./Services/create_drawing_service";
import { RenderContentService } from "Services/render_content_service";
import { EmbedDrawing } from "Modals/embed_drawing_modal";


export default class XournalIntegrationPlugin extends Plugin {
    settings: XournalIntegrationSettings;
    createDrawingService: CreateDrawingService
    renderContentService: RenderContentService


    async onload() {
        console.log('Loading plugin: Xournal Integration Plugin');

        this.settings = Object.assign(new XournalIntegrationSettings(), await this.loadData());
        this.addSettingTab(new XournalIntegrationSettingsTab(this.app, this));
        this.createDrawingService = new CreateDrawingService(this.app, this);
        this.renderContentService = new RenderContentService(this.app);

        this.addCommand({
            id: "edit-drawing",
            name: "Edit drawing",
            callback: () => {

                new EditDrawing(this.app).open();
            }
        })


        this.addCommand({
            id: "embed-drawing",
            name: "Embed drawing",
            callback: () => {
                new EmbedDrawing(this.app).open();
            }
        
        })

        this.addCommand({
            id: "delete-drawing",
            name: "Delete drawing",
            callback: () => {
                new DeleteDrawing(this.app).open();
            }
        })

        this.addCommand({
            id: "create-empty-drawing",
            name: "Create empty drawing",
            callback: () => {
                new SelectNameModal(this.app, "Create Xournal drawing", (name => {
                    this.createDrawingService.createEmpty(name)
                })).open();
            }
        })

        this.addCommand({
            id: "create-drawing-from-template",
            name: "Create drawing from template",
            callback: () => {
                new SelectNameModal(this.app, "Create Xournal drawing from template", (name => {
                    this.createDrawingService.createFromTemplate(name)
                })).open();
            }
        })

        this.addCommand({
            id: "create-drawing-from-pdf",
            name: "Create drawing from pdf",
            callback: () => {
                const file = this.app.workspace.getActiveFile()

                if(file === null || file.extension !== "pdf") {
                    new CreatePdfDrawing(this.app, this.createDrawingService).open();
                } else {
                    this.createDrawingService.createFromPdf(file, file.parent?.path)
                }
            }
        })



        // Event for allowing file esit:
        this.registerEvent(
			this.app.vault.on("modify", async (file) => {
                if (file instanceof TFile && file.extension == "xopp") {
                    await this.renderContentService.start_render(file);                        
                }
            }));

    


        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (!(file instanceof TFile && file.extension == "pdf")) {
                    return
                }
                menu.addItem((item) => {
                    item
                        .setTitle("Convert to Xournal drawing")
                        .setIcon("document")
                        .onClick(async () => {
                            await this.createDrawingService.createFromPdf(file, file.parent?.path)
                        });
                });
            })
        );

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (!(file instanceof TFile && file.extension == "xopp")) {
                    return
                }
                menu.addItem((item) => {
                    item
                        .setTitle("Refresh Xournal Drawing in Obsidian")
                        .setIcon("document")
                        .onClick(async () => {
                            await this.renderContentService.start_render(file)
                        });
                });
            })
        );


        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (!(file instanceof TFolder)) {
                    return
                }
                menu.addItem((item) => {
                    item
                        .setTitle("Create Xournal drawing")
                        .setIcon("document")
                        .onClick(async () => {
                            new SelectNameModal(this.app, "Create Xournal drawing", (name => {
                                this.createDrawingService.createEmpty(name, file.path)
                            })).open();
                        });
                });
            })
        );
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (!(file instanceof TFolder) && file.path != this.settings.template_location) {
                    return
                }
                menu.addItem((item) => {
                    item
                        .setTitle("Create Xournal drawing from template")
                        .setIcon("document")
                        .onClick(async () => {
                            new SelectNameModal(this.app, "Create Xournal drawing from Template", (name => {
                                this.createDrawingService.createFromTemplate(name, file instanceof TFolder ? file.path : undefined)
                            })).open();
                        });
                });
            })
        );

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, info) => {
                if(info?.file === null || info?.file?.extension !== "pdf") {
                    return
                }
                menu.addItem((item) => {
                    item
                        .setTitle("Convert to Xournal drawing")
                        .setIcon("document")
                        .onClick(async () => {
                            await this.createDrawingService.createFromPdf(info.file!!, info?.file?.parent?.path)
                        });
                });
            })
        )
    }

    onunload() {
        console.log('Unloading plugin: Xournal Integration Plugin');
    }
}