import IconSC from "isc-main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface IconSCSettings {
  code2emoji: boolean;
  suggester: boolean;
}

export const DEFAULT_SETTINGS: IconSCSettings = {
  code2emoji: true,
  suggester: true,
};

export class IconSCSettingTab extends PluginSettingTab {
  plugin: IconSC;

  constructor(app: App, plugin: IconSC) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Replace shortcode with emoji")
      .setDesc(
        "If this is turned on, emoji shortcodes will be immediately replaced by emoji after typing." +
          " Otherwise they are still stored as a shortcode and you only see the Emoji in Preview Mode.",
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.code2emoji).onChange(async (value) => {
          this.plugin.settings.code2emoji = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Emoji Suggester")
      .setDesc(
        "If this is turned on, a Suggester will appear everytime you type : followed by a letter. This will help you insert Emojis. ",
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.suggester).onChange(async (value) => {
          this.plugin.settings.suggester = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
