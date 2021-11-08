import "obsidian";

declare module "obsidian" {
  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }
  interface Vault {
    readJson(path: string): Promise<unknown>;
    writeJson(path: string, data: any): Promise<void>;
  }
}
