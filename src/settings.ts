import "settings.less";
import "invalid.less";

import { fileDialog } from "file-select-dialog";
import {
  App,
  ButtonComponent,
  Notice,
  Platform,
  PluginSettingTab,
  Setting,
  TextComponent,
} from "obsidian";

import BrowserPacks from "./component/browser-packs";
import IconManager from "./component/icon-manager";
import { BuiltInIconPacknames, SVGPacknames } from "./icon-packs/built-ins";
import { SupportedIconExt } from "./icon-packs/utils";
import IconSC from "./isc-main";

export interface IconSCSettings {
  code2emoji: boolean;
  suggester: boolean;
  iconpack: Record<SVGPacknames, boolean> & Record<string, boolean>;
  spaceAfterSC: boolean;
  isMigrated: boolean;
}

export const DEFAULT_SETTINGS: IconSCSettings = {
  code2emoji: true,
  suggester: true,
  iconpack: {
    obs: false,
    luc: true,
  },
  spaceAfterSC: false,
  isMigrated: false,
};

export class IconSCSettingTab extends PluginSettingTab {
  plugin: IconSC;

  constructor(app: App, plugin: IconSC) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    this.containerEl.empty();

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
    new Setting(containerEl)
      .setName("Icon Packs")
      .setDesc("Browse and download icon packs")
      .addButton((btn) =>
        btn
          .setButtonText("Browser")
          .onClick(() => new BrowserPacks(this.plugin).open()),
      );

    // custom icon manage section
    const managerContainer = createDiv({
      cls: ["isc-settings-custom-icon", "installed-plugins-container"],
    });
    new Setting(this.containerEl)
      .setHeading()
      .setName("Custom Icons")
      .addExtraButton((btn) =>
        btn
          .setIcon("sheets-in-box")
          .setTooltip("Backup icons")
          .onClick(() => this.plugin.packManager.backupIcons()),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("restore-file-glyph")
          .setTooltip("Restore backup")
          .onClick(async () => {
            this.plugin.packManager.importIconsFromFileList(
              await fileDialog({ multiple: true, accept: ".zip" }),
              false,
            );
            await this.plugin.packManager.loadIcons();
            this.manageCustomIcons(managerContainer);
          }),
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("switch")
          .setTooltip("Reload custom icons")
          .onClick(async () => {
            await this.plugin.packManager.loadIcons();
            this.manageCustomIcons(managerContainer);
            new Notice("Custom icons reloaded");
          }),
      )
      .then(
        (s) =>
          Platform.isDesktopApp &&
          s.addExtraButton((btn) =>
            btn
              .setIcon("folder")
              .setTooltip("Open Icons Folder")
              .onClick(() =>
                this.app.openWithDefaultApp(
                  this.plugin.packManager.customIconsDir,
                ),
              ),
          ),
      );
    this.containerEl.appendChild(managerContainer);
    this.manageCustomIcons(managerContainer);
  }

  skipIconPack(): void {
    const { containerEl } = this;

    const getSetting = (
      id: SVGPacknames,
      name: string,
      getDesc?: (el: DocumentFragment) => void,
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
    new Setting(this.containerEl).setHeading().setName("Icon Packs");

    getSetting("luc", "Lucide", (el) =>
      el.createEl("a", {
        href: "https://lucide.dev",
        text: "official website",
      }),
    );
    getSetting("obs", "Obsidian's built-in icons", (el) =>
      el.appendText(
        "Obsidian's built-in icons are mostly used for UI components. ",
      ),
    );
  }

  manageCustomIcons(containerEl: HTMLElement): void {
    if (containerEl.hasChildNodes()) containerEl.empty();

    const isPacknameInvalid = (name: string) =>
      !/^[A-Za-z0-9]+$/.test(name) ||
      this.plugin.packManager.isPacknameExists(name);
    new Setting(containerEl)
      .setName("Add new icon pack")
      .setDesc("Reserved names: " + BuiltInIconPacknames.join(", "))
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
                this.addNewCustomIconEntry(
                  packName,
                  containerEl,
                ).settingEl.scrollIntoView();
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
  addNewCustomIconEntry(pack: string, containerEl: HTMLElement) {
    const setting = new Setting(containerEl)
      .setName(pack)
      .setDesc(
        createFragment((el) => {
          el.appendText("Drag files in to import custom icons");
          el.createEl("br");
          el.appendText("Supported format: ");
          SupportedIconExt.forEach((ext, index, arr) => {
            el.createEl("code", { text: ext });
            if (arr.length - 1 !== index) el.appendText(", ");
          });
        }),
      )
      .addButton((btn) =>
        btn
          .setIcon("sheets-in-box")
          .setTooltip("Backup icons")
          .onClick(() => this.plugin.packManager.backupIcons(pack)),
      )
      .addButton((btn) =>
        btn
          .setIcon("go-to-file")
          .setTooltip("select files to import")
          .onClick(async () =>
            this.plugin.packManager.addFromFiles(
              pack,
              await fileDialog({
                multiple: true,
                accept: SupportedIconExt as any,
              }),
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

    return setting;
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
