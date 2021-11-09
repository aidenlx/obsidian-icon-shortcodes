import "./icon-manager.less";

import {
  ButtonComponent,
  debounce,
  Modal,
  Notice,
  TextAreaComponent,
} from "obsidian";

import IconSC from "../isc-main";
import { getPacknNameFromId } from "./icon-packs";

export default class IconManager extends Modal {
  constructor(public plugin: IconSC, public pack: string) {
    super(plugin.app);
    this.titleEl.setText(`${pack} Icons`);
    this.modalEl.addClasses(["isc-icon-manager", "mod-community-theme"]);
  }

  get ids() {
    return this.plugin.iconPacks.iconIds
      .filter(({ pack }) => pack === this.pack)
      .map(({ id }) => id);
  }

  onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("icons");
    this.ids.forEach((id) => {
      const icon = this.plugin.iconPacks.getIcon(id);
      if (!(icon instanceof HTMLElement)) return;
      const iconEl = this.contentEl.createDiv({ cls: "item" }, (container) => {
        let namebox: null | TextAreaComponent = null;
        container.createDiv({ cls: "icon" }, (preview) => {
          preview.append(icon);
        });
        container.createDiv({ cls: "name" }, (name) => {
          let idBeforeEdit = id;
          const onChange = async (value: string) => {
            const renameTo = `${this.pack}_${value}`;
            if (this.plugin.iconPacks.hasIcon(renameTo)) {
              new Notice(`Failed to rename to ${value}, id already exists`);
            } else {
              const newId = this.plugin.iconPacks.rename(
                idBeforeEdit,
                renameTo,
              );
              if (!newId)
                new Notice(
                  `Failed to rename to ${value}, check log for details`,
                );
              else {
                new Notice(`The icon is renamed to ${newId}`);
                idBeforeEdit = newId;
              }
            }
          };
          namebox = new TextAreaComponent(name)
            .setValue(getPacknNameFromId(id)?.name ?? "")
            .setDisabled(true)
            .onChange(debounce(onChange, 500, true))
            .then((t) => {
              t.inputEl.rows = 2;
              t.inputEl.cols = 8;
            });
        });
        container.createDiv({ cls: "buttons" }, (container) => {
          new ButtonComponent(container)
            .setIcon("trash")
            .setWarning()
            .onClick(() => {
              this.plugin.iconPacks.delete(id);
              this.contentEl.removeChild(iconEl);
            });
          new ButtonComponent(container)
            .setIcon("pencil")
            .setCta()
            .onClick(() => {
              if (!namebox) return;
              namebox.setDisabled(!namebox.disabled);
            });
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
}
