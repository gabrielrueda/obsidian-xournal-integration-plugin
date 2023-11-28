import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

declare class XournalIntegrationPlugin extends Plugin {
    settings: XournalIntegrationSettings;
}

export class XournalIntegrationSettings {
    xopp_location: string = "_xournal";
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
            .setName("New Xournal File Folder")
            .setDesc("Location to store all xournal files and their pdf output")
            .addText((text) =>
                text.onChange((value) => {
                this.plugin.settings.xopp_location = value;
                this.plugin.saveData(this.plugin.settings);
            }));
            
    }
}