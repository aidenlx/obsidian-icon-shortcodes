import "./main.less";

import Fuse from "fuse.js";
import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, IconSCSettings, IconSCSettingTab } from "settings";

import PackManager from "./icon-packs/pack-manager";
import getShortcodeProcessor from "./modules/post-ps";
import EmojiSuggester from "./modules/suggester";

export default class IconSC extends Plugin {
  settings: IconSCSettings = DEFAULT_SETTINGS;

  packManager = new PackManager(this);

  fuse = Fuse;
  get ids() {
    return this.packManager.iconIds.map(({ id, pack }) => ({
      name: pack === "emoji" ? id : id.substring(pack.length + 1),
      pack,
    }));
  }

  async onload() {
    console.log("loading Icon Shortcodes");

    await this.loadSettings();
    await this.packManager.loadCustomIcons();

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

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
