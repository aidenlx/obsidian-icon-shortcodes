import "./main.less";

import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, IconSCSettings, IconSCSettingTab } from "settings";

import PackManager from "./icon-packs/pack-manager";
import getShortcodeProcessor from "./modules/post-ps";
import EmojiSuggester from "./modules/suggester";
import API, { API_NAME } from "./typings/api";

const API_NAME: API_NAME extends keyof typeof window ? API_NAME : never =
  "IconSCAPIv0" as const; // this line will throw error if name out of sync

export default class IconSC extends Plugin {
  settings: IconSCSettings = DEFAULT_SETTINGS;

  packManager = new PackManager(this);

  postProcessor = getShortcodeProcessor(this);

  api: API = {
    hasIcon: this.packManager.hasIcon.bind(this.packManager),
    getIcon: this.packManager.getIcon.bind(this.packManager),
    postProcessor: this.postProcessor,
  };

  async onload() {
    console.log("loading Icon Shortcodes");

    await this.loadSettings();
    await this.packManager.loadCustomIcons();

    this.registerEditorSuggest(new EmojiSuggester(this));
    this.registerMarkdownPostProcessor(this.postProcessor);

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
