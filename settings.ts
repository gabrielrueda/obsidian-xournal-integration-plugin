import {App, normalizePath, Plugin, PluginSettingTab, Setting} from 'obsidian';

declare class XournalIntegrationPlugin extends Plugin {
    settings: XournalIntegrationSettings;
}

export class XournalIntegrationSettings {
    xopp_location: string = "_xournal";
    template_location: string = "_xournal/template.xopp"
    overwrite_files: boolean = false
    date_format: string = "DD.MM.YYYY"
}

export class XournalIntegrationSettingsTab extends PluginSettingTab {
    plugin: XournalIntegrationPlugin;

    constructor(app: App, plugin: XournalIntegrationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("New xournal file folder")
            .setDesc("Location to store all xournal files and their pdf output")
            .addText((text) =>
                text
                .setValue(this.plugin.settings.xopp_location)
                .onChange((value) => {
                    this.plugin.settings.xopp_location = value;
                    this.plugin.saveData(this.plugin.settings);
            }));

        new Setting(containerEl)
            .setName("Xournal template file")
            .setDesc("File for xournal template to use in new drawings")
            .setTooltip("You can use ${title} and ${date} as variables in your template")
            .addText((text) =>
                text
                .setValue(this.plugin.settings.template_location)
                .onChange((value) => {
                    value = normalizePath(value);
                    this.plugin.settings.template_location = value;
                    this.plugin.saveData(this.plugin.settings);
            }));

        new Setting(containerEl)
            .setName("Overwrite existing files")
            .setDesc("Whether you want to automatically overwrite files if you create a second one with the same name")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.overwrite_files)
                    .onChange((value) => {
                        this.plugin.settings.overwrite_files = value;
                        this.plugin.saveData(this.plugin.settings);
                    })
            )

        new Setting(containerEl)
            .setName("Custom Date Format")
            .setDesc("The date format which will be used to replace ${date} variables")
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.date_format)
                    .onChange((value) => {
                        this.plugin.settings.date_format = value;
                        this.plugin.saveData(this.plugin.settings);
                    }));
    }
}