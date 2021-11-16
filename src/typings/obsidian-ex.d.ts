import "obsidian";

import IconSCAPI from "./api";

declare module "obsidian" {
  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }
  interface Vault {
    readJson(path: string): Promise<unknown>;
    writeJson(path: string, data: any): Promise<void>;
    configDir: string;
  }
  interface App {
    openWithDefaultApp(path: string): Promise<void>;
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
