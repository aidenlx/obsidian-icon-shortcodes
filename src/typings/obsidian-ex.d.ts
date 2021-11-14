import "obsidian";

import IconSCAPI from "./api";

declare module "obsidian" {
  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }
  interface Vault {
    readJson(path: string): Promise<unknown>;
    writeJson(path: string, data: any): Promise<void>;
  }
  interface App {
    plugins: {
      enabledPlugins: Set<string>;
      plugins: {
        ["obsidian-icon-shortcodes"]?: {
          api: IconSCAPI;
        };
      };
    };
  }
}
