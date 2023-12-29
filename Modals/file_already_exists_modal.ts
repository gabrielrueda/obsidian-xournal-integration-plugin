import {App, Modal, Setting} from "obsidian";

export class FileAlreadyExistsModal extends Modal {
    private readonly file: string
    private readonly onSubmit: (result: "overwrite" | "cancel" | "newName", file: string) => void

    constructor(app: App, file: string, onSubmit: (result: "overwrite" | "cancel" | "newName", file: string) => void) {
        super(app);
        this.file = file
        this.onSubmit = onSubmit
    }

    onOpen() {
        const {contentEl} = this;

        contentEl.createEl("h1", {text: `A file called "${this.file.split("/").last()}" already exists`});

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Overwrite")
                    .setWarning()
                    .onClick(() => {
                        this.submit("overwrite")
                    }))
            .addButton((btn) =>
                btn
                    .setButtonText("New Name")
                    .setCta()
                    .onClick(() => {
                        this.submit("newName")
                    }))
            .addButton((btn) =>
                btn
                    .setButtonText("Cancel")
                    .onClick(() => {
                        this.submit("cancel")
                    }));
    }

    submit(result: "overwrite" | "cancel" | "newName") {
        this.onSubmit(result, this.file)
        this.close()
    }
}