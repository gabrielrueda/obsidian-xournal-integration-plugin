import {App, Modal, TAbstractFile} from "obsidian";

export class FileAlreadyExistsModal extends Modal {
    fileName: string

    constructor(app: App, fileName: string) {
        super(app);
        this.fileName = fileName

        this.titleEl.innerHTML = `A file called "${fileName.split("/").last()}" already exists`
        this.contentEl.innerHTML =
            '<div class="modal-button-container">' +
            '<label class="mod-checkbox"><input tabindex="-1" type="checkbox">Don\'t ask again</label>' +
            '<button class="mod-warning" onclick="this.overwrite()">Overwrite</button>' +
            '<button class="mod-submit" onclick="this.newName()">Enter new Name</button>' +
            '<button onclick="this.cancel()">Cancel</button>' +
            '</div>'
    }

    overwrite() {
        const file = this.app.vault.getAbstractFileByPath(this.fileName)
        if (file instanceof TAbstractFile) {
            this.app.vault.delete(file)
        }
    }
}