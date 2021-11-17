import "settings.less";
import "invalid.less";

import { fileDialog } from "file-select-dialog";
import IconSC from "isc-main";
import {
  App,
  ButtonComponent,
  Notice,
  PluginSettingTab,
  Setting,
  TextComponent,
} from "obsidian";

import IconManager from "./component/icon-manager";
import { IconPacknames, SVGPacknames } from "./icon-packs/built-ins";

export interface IconSCSettings {
  code2emoji: boolean;
  suggester: boolean;
  iconpack: Record<SVGPacknames, boolean> & Record<string, boolean>;
  spaceAfterSC: boolean;
}

export const DEFAULT_SETTINGS: IconSCSettings = {
  code2emoji: true,
  suggester: true,
  iconpack: {
    fab: false,
    far: true,
    fas: false,
    rif: false,
    ril: true,
  },
  spaceAfterSC: false,
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
        "If this is turned on, emoji shortcodes will be immediately replaced by emoji after typing. " +
          "Otherwise they are still stored as a shortcode and you only see the Emoji in Preview Mode.",
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
    new Setting(containerEl)
      .setName("Suggester: Add space after inserted shortcode")
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.spaceAfterSC).onChange(
          async (value) => {
            this.plugin.settings.spaceAfterSC = value;
            await this.plugin.saveSettings();
          },
        );
      });

    this.skipIconPack();
    this.manageCustomIcons();
  }

  skipIconPack(): void {
    const { containerEl } = this;

    const getSetting = (
      id: SVGPacknames,
      name: string,
      getDesc: (el: DocumentFragment) => void,
    ) =>
      new Setting(containerEl)
        .setName(name)
        .setDesc(createFragment(getDesc))
        .addToggle((cb) => {
          cb.setValue(this.plugin.settings.iconpack[id]).onChange(
            async (value) => {
              this.plugin.settings.iconpack[id] = value;
              await this.plugin.saveSettings();
            },
          );
        });
    containerEl.createEl("h2", { text: "Icon Packs" });

    getSetting("far", "Font Awesome (Line)", (el) =>
      el.createEl("a", {
        href: "https://fontawesome.com/",
        text: "official website",
      }),
    );
    getSetting("fab", "Font Awesome (Brand)", (el) =>
      el.createEl("a", {
        href: "https://fontawesome.com/",
        text: "official website",
      }),
    );
    getSetting("fas", "Font Awesome (Solid)", (el) =>
      el.createEl("a", {
        href: "https://fontawesome.com/",
        text: "official website",
      }),
    );
    getSetting("ril", "Remixicon (Line)", (el) =>
      el.createEl("a", {
        href: "https://remixicon.com",
        text: "official website",
      }),
    );
    getSetting("rif", "Remixicon (Solid)", (el) =>
      el.createEl("a", {
        href: "https://remixicon.com",
        text: "official website",
      }),
    );
  }

  manageCustomIcons(): void {
    this.containerEl.createEl("h2", { text: "Custom Icons" });
    const containerEl = this.containerEl.createDiv({
      cls: "isc-settings-custom-icon",
    });

    const isPacknameInvalid = (name: string) =>
      !/^[A-Za-z0-9]+$/.test(name) ||
      this.plugin.packManager.isPacknameExists(name);
    new Setting(containerEl)
      .setName("Add new icon pack")
      .setDesc("Reserved names: " + IconPacknames.join(", "))
      .then((s) => {
        let button: ButtonComponent | null = null,
          input: TextComponent | null = null;
        s.addText((txt) => {
          txt
            .setPlaceholder("Enter name")
            .onChange((name) => {
              const isInvalid = isPacknameInvalid(name);
              txt.inputEl.toggleClass("invalid", !!name && isInvalid);
              button?.setDisabled(isInvalid);
            })
            .then((txt) => txt.inputEl.addClass("isc-add-pack-input")),
            (input = txt);
        }).addButton(
          (btn) => (
            btn
              .setCta()
              .setIcon("plus-with-circle")
              .onClick(() => {
                const packName = input?.getValue();
                if (!packName) return;
                if (isPacknameInvalid(packName)) {
                  new Notice("This name is invalid.");
                  return;
                }
                this.addNewCustomIconEntry(packName, containerEl);
                input?.setValue("");
              }),
            (button = btn)
          ),
        );
      });

    this.plugin.packManager.customPacknames.forEach((pack) =>
      this.addNewCustomIconEntry(pack, containerEl),
    );
  }
  async addNewCustomIconEntry(pack: string, containerEl: HTMLElement) {
    const setting = new Setting(containerEl)
      .setName(pack)
      .setDesc("Drag svg files in to add custom icon")
      .addButton((btn) =>
        btn
          .setIcon("go-to-file")
          .setTooltip("select files to import")
          .onClick(async () =>
            this.plugin.packManager.addFromFiles(
              pack,
              await fileDialog({ multiple: true, accept: ".svg" }),
            ),
          ),
      )
      .addButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("delete")
          .setWarning()
          .onClick(() => {
            this.plugin.packManager.filter((k, v) => v.pack !== pack);
            containerEl.removeChild(setting.settingEl);
          }),
      )
      .addButton((btn) =>
        btn
          .setIcon("popup-open")
          .setTooltip("manage icons")
          .setCta()
          .onClick(() => new IconManager(this.plugin, pack).open()),
      )
      .then((s) =>
        setupDnd(s.settingEl, async (evt) => {
          if (!evt.dataTransfer) {
            new Notice("Failed to get dropped items");
            return;
          }
          this.plugin.packManager.addFromFiles(pack, evt.dataTransfer.files);
        }),
      );
  }
}

const setupDnd = (el: HTMLElement, droppedHandler: (evt: DragEvent) => any) => {
  const dragoverClass = "dragover";
  el.addEventListener("dragover", (evt) => {
    evt.preventDefault();
    (evt.currentTarget as HTMLElement).addClass(dragoverClass);
  });
  el.addEventListener("drop", (evt) => {
    evt.preventDefault();
    (evt.currentTarget as HTMLElement).removeClass(dragoverClass);
    droppedHandler(evt);
  });
  el.addEventListener("dragleave", (evt) => {
    evt.preventDefault();
    (evt.currentTarget as HTMLElement).removeClass(dragoverClass);
  });
};
