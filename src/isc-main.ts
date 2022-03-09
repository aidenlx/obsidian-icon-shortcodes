import { Plugin } from "obsidian";

import buildIconPlugin from "./icon-in-editor";
import type { ShortcodePosField } from "./icon-in-editor/state";
import getShortcodePosField from "./icon-in-editor/state";
import PackManager from "./icon-packs/pack-manager";
import tryUpdateIcons from "./modules/json-to-svg";
import { getMDPostProcessor, getNodePostProcessor } from "./modules/post-ps";
import { EmojiSuggester } from "./modules/suggester";
import { DEFAULT_SETTINGS, IconSCSettings, IconSCSettingTab } from "./settings";
import { getApi } from "./typings/api";
import API, { API_NAME } from "./typings/api";
import FileIconCache from "./icon-packs/icon-cache";

const API_NAME: API_NAME extends keyof typeof window ? API_NAME : never =
  "IconSCAPIv0" as const; // this line will throw error if name out of sync

export default class IconSC extends Plugin {
  settings: IconSCSettings = DEFAULT_SETTINGS;

  packManager = new PackManager(this);

  _nodeProcessor = getNodePostProcessor(this);
  _mdProcessor = getMDPostProcessor(this);

  shortcodePosField: ShortcodePosField = getShortcodePosField(this);

  postProcessor(input: string, replacer: (shortcode: string) => string): string;
  postProcessor(input: HTMLElement): void;
  postProcessor(
    input: HTMLElement | string,
    replacer?: (shortcode: string) => string,
  ): string | void {
    if (typeof input === "string" && replacer) {
      return this._mdProcessor(input, replacer);
    } else if (input instanceof HTMLElement) {
      return this._nodeProcessor(input);
    } else {
      throw new TypeError("Invalid args given to postProcessor");
    }
  }

  api = getApi(this.packManager, this);
  fileIconCache = new FileIconCache(this);

  async onload() {
    console.log("loading Icon Shortcodes");

    await this.loadSettings();
    await tryUpdateIcons(this);
    await this.packManager.loadIcons();

    (window[API_NAME] = this.api) &&
      this.register(() => (window[API_NAME] = undefined));

    this.registerEditorSuggest(new EmojiSuggester(this));
    this.registerMarkdownPostProcessor(this._nodeProcessor);
    buildIconPlugin(this);

    this.addSettingTab(new IconSCSettingTab(this.app, this));
  }

  // onunload() {
  //   console.log("unloading Icon Shortcodes");
  // }

  async loadSettings() {
    let loaded = (await this.loadData()) as IconSCSettings | undefined;
    if (loaded) {
      if ((loaded as any).iconpack) {
        delete (loaded as any)["iconpack"];
      }
      this.settings = {
        ...this.settings,
        ...loaded,
        disabledPacks: loaded.disabledPacks
          ? new Set(loaded.disabledPacks)
          : this.settings.disabledPacks,
      };
    }
  }

  async saveSettings() {
    await this.saveData({
      ...this.settings,
      disabledPacks: [...this.settings.disabledPacks],
    });
  }
}
