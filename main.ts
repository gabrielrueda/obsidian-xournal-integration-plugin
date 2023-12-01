
import { CreateDrawing } from "Modals/create_drawing_modal";
import { EditDrawing } from "Modals/edit_drawing_modal";
import { CreatePdfDrawing } from "Modals/create_pdf_drawing_modal";
import { DeleteDrawing } from "Modals/delete_drawing_modal";
import { Plugin } from "obsidian";
import { XournalIntegrationSettings, XournalIntegrationSettingsTab } from "settings";



export default class XournalIntegrationPlugin extends Plugin {
  settings: XournalIntegrationSettings;

  async onload() {
    console.log('loading plugin: Xournal Integration Plugin');
    
    this.settings = Object.assign(new XournalIntegrationSettings(), await this.loadData());
    this.addSettingTab(new XournalIntegrationSettingsTab(this.app, this));
    
    this.addCommand({
      id: "edit-drawing",
      name: "Edit Drawing",
      callback: () => {
        new EditDrawing(this.app).open();
      }
    })

    this.addCommand({
      id: "delete-drawing",
      name: "Delete Drawing",
      callback: () => {
        new DeleteDrawing(this.app).open();
      }
    })

    this.addCommand({
      id: "create-new-drawing",
      name: "Create New Drawing",
      callback: () => {
        new CreateDrawing(this.app, this.settings.xopp_location, this.settings.template_location).open();
      }
    })

    this.addCommand({
      id: "create-new-drawing-from-pdf",
      name: "Create New Drawing From PDF",
      callback: () => {
        new CreatePdfDrawing(this.app, this.settings.xopp_location).open();
      }
    })

    
  }

  onunload() {
    console.log('unloading plugin: Xournal Integration Plugin');
  }
}