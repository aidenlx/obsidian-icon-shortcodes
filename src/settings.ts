import "settings.less";

import { fileDialog } from "file-select-dialog";
import IconSC from "isc-main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";

import IconManager from "./modules/icon-manager";
import { BuiltInPacks, builtInPacks } from "./modules/icon-packs";

export interface IconSCSettings {
  code2emoji: boolean;
  suggester: boolean;
  iconpack: Record<BuiltInPacks, boolean> & Record<string, boolean>;
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
    this.skipIconPack();
    this.manageCustomIcons();
  }

  skipIconPack(): void {
    const { containerEl } = this;

    const getSetting = (
      id: keyof IconSCSettings["iconpack"],
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
    getSetting("ris", "Remixicon (Solid)", (el) =>
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

    new Setting(containerEl)
      .setName("Add new icon pack")
      .setDesc("Reserved names: " + builtInPacks.join(", "))
      .then((s) => {
        s.addText((txt) => {
          txt.setPlaceholder("Enter name");
          txt.inputEl.addClass("isc-add-pack-input");
          const apply = () => {
            const packName = txt.getValue();
            if (!packName) return;
            if (builtInPacks.includes(packName)) {
              new Notice("This name is reserved.");
              return;
            }
            txt.setValue("");
            this.addNewCustomIconEntry(packName, containerEl);
          };
          s.addButton((btn) =>
            btn.setCta().setIcon("plus-with-circle").onClick(apply),
          );
        });
      });

    this.plugin.iconPacks.customPacks.forEach((pack) =>
      this.addNewCustomIconEntry(pack, containerEl),
    );
  }
  async addNewCustomIconEntry(pack: string, containerEl: HTMLElement) {
    const handleInputFiles = async (files: FileList) => {
      const icons = await getSVGIconFromFileList(files);
      if (!icons) {
        new Notice("No SVG file found in dropped items");
        return;
      }
      new Notice(
        (
          await this.plugin.iconPacks.addFromFiles(pack, icons)
        )?.length.toString() + " icons added",
      );
    };
    const setting = new Setting(containerEl)
      .setName(pack)
      .setDesc("Drag svg files in to add custom icon")
      .addButton((btn) =>
        btn
          .setIcon("go-to-file")
          .setTooltip("select files to import")
          .onClick(async () =>
            handleInputFiles(
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
            this.plugin.iconPacks.filter((k, v) => v.pack !== pack);
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
          handleInputFiles(evt.dataTransfer.files);
        }),
      );
  }
}

const svgMime = "image/svg+xml";
const getSVGIconFromFileList = async (
  list: FileList | null | undefined,
): Promise<{ name: string; svg: string }[] | null> => {
  if (!list || list.length <= 0) return null;
  const getIcon = async (file: File) => ({
    name: file.name.replace(/\.svg$/, ""),
    svg: await file.text(),
  });
  let promises = [] as ReturnType<typeof getIcon>[];
  for (let i = 0; i < list.length; i++) {
    const file = list[i];
    if (file.type === svgMime) {
      promises.push(getIcon(file));
    }
  }
  const result = await Promise.all(promises);
  return result.length > 0 ? result : null;
};

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
