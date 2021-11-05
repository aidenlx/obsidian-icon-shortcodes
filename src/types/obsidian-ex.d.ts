import "obsidian";

declare module "obsidian" {
  export interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }
}
