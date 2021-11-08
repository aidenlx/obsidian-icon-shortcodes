import "./main.less";

import { normalizePath, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, IconSCSettings, IconSCSettingTab } from "settings";

import IconPacks, { getIconInfoFromId } from "./modules/icon-packs";
import getShortcodeProcessor from "./modules/post-ps";
import EmojiSuggester from "./modules/suggester";

const CUSTOM_ICON_PATH = "/icons.json";

export default class IconSC extends Plugin {
  settings: IconSCSettings = DEFAULT_SETTINGS;

  iconPacks = new IconPacks(this);

  async onload() {
    console.log("loading Icon Shortcodes");

    await this.loadSettings();
    await this.loadCustomIcons();

    this.registerEditorSuggest(new EmojiSuggester(this));
    this.registerMarkdownPostProcessor(getShortcodeProcessor(this));

    this.addSettingTab(new IconSCSettingTab(this.app, this));
  }

  // onunload() {
  //   console.log("unloading Icon Shortcodes");
  // }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async loadCustomIcons(): Promise<void> {
    const { vault } = this.app,
      data = await vault.readJson(
        normalizePath(this.manifest.dir + CUSTOM_ICON_PATH),
      );

    if (!(data && data instanceof Object)) return;
    let info;
    for (const id in data) {
      const svg = data[id as keyof typeof data];
      if (typeof svg === "string" && (info = getIconInfoFromId(id, svg))) {
        this.iconPacks.set(id, info);
      }
    }
  }

  async saveCustomIcons() {
    const { vault } = this.app,
      data = this.iconPacks.customIcons;
    await vault.writeJson(
      normalizePath(this.manifest.dir + CUSTOM_ICON_PATH),
      data ?? {},
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
