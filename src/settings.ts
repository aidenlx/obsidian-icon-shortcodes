import IconSC from "isc-main";
import { App, PluginSettingTab, Setting } from "obsidian";

import { IconPackNames } from "./modules/icon";

export interface IconSCSettings {
  code2emoji: boolean;
  suggester: boolean;
  iconpack: Record<IconPackNames, boolean>;
}

export const DEFAULT_SETTINGS: IconSCSettings = {
  code2emoji: true,
  suggester: true,
  iconpack: {
    fa: true,
    ri: true,
  },
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
      .setName("Replace emoji shortcode with emoji character")
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
      .setName("Icon Suggester")
      .setDesc(
        "If this is turned on, a Suggester will appear everytime you type :(or ：： if full-width) followed by a letter. This will help you insert Emojis. ",
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.suggester).onChange(async (value) => {
          this.plugin.settings.suggester = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl("h2", { text: "Icon Packs" });
    new Setting(containerEl)
      .setName("Font Awesome")
      .setDesc(
        createFragment((el) =>
          el.createEl("a", {
            href: "https://fontawesome.com/",
            text: "official website",
          }),
        ),
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.iconpack.fa).onChange(
          async (value) => {
            this.plugin.settings.iconpack.fa = value;
            await this.plugin.saveSettings();
          },
        );
      });
    new Setting(containerEl)
      .setName("Remixicon")
      .setDesc(
        createFragment((el) =>
          el.createEl("a", {
            href: "https://remixicon.com",
            text: "official website",
          }),
        ),
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.iconpack.ri).onChange(
          async (value) => {
            this.plugin.settings.iconpack.ri = value;
            await this.plugin.saveSettings();
          },
        );
      });
  }
}
