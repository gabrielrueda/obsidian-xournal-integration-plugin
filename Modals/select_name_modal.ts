import {App, Modal, Notice, Setting} from "obsidian";

export class SelectNameModal extends Modal {
    result: string;
    title: string
    onSubmit: (result: string) => void;

    constructor(app: App, title: string, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit
        this.title = title
    }

    onOpen() {
        const {contentEl} = this;

        contentEl.createEl("h1", {text: this.title});

        new Setting(contentEl)
            .setName("Name:")
            .addText((text) =>
                text.onChange((value) => {
                    this.result = value
                })
            );

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Submit")
                    .setCta()
                    .onClick(() => {
                        try {
                            this.onSubmit(this.result)
                        } catch (e) {
                            new Notice(e.message)
                        }
                        this.close();
                    }))
            .addButton((btn) =>
                btn
                    .setButtonText("Cancel")
                    .onClick(() => {
                        this.close();
                    }));
    }

    onClose() {
        let {contentEl} = this;
        contentEl.empty();
    }
}