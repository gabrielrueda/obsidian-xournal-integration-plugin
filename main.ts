
import { CreateDrawing } from "Modals/create_drawing_modal";
import { EditDrawing } from "Modals/edit_drawing_modal";
import { CreatePdfDrawing } from "Modals/create_pdf_drawing_modal";
import { Plugin } from "obsidian";



export default class CycleThroughPanes extends Plugin {

  onload() {
    console.log('loading plugin: Cycle through panes');
    this.addCommand({
      id: "edit-drawing",
      name: "Edit Drawing",
      callback: () => {
        new EditDrawing(this.app).open();
      }
    })

    this.addCommand({
      id: "create-new-drawing",
      name: "Create New Drawing",
      callback: () => {
        new CreateDrawing(this.app).open();
      }
    })

    this.addCommand({
      id: "create-new-drawing-from-pdf",
      name: "Create New Drawing From PDF",
      callback: () => {
        new CreatePdfDrawing(this.app).open();
      }
    })
  }

  onunload() {
    console.log('unloading plugin: Cycle through panes');
  }
}