import cls from "classnames";
import getMd5 from "md5";
import svg2uri from "mini-svg-data-uri";
import emoji from "node-emoji";
import { normalizePath, Notice } from "obsidian";

import IconSC from "../isc-main";
import { IconIds, IconPacknames, SVGIconPacks } from "./built-ins";
import { IconId, IconInfo, IdIconMap } from "./types";
import {
  EntriesFromRecord,
  getIconInfoFromId,
  ObjtoEntries,
  PackPrefixPattern,
  sanitizeId,
} from "./utils";

type ExportedIcons = {
  [key: Parameters<typeof getIconInfoFromId>[0]]: Parameters<
    typeof getIconInfoFromId
  >[1];
};

const RE_UNDERSTORE_DASH = /[-_]/g;
const CUSTOM_ICON_PATH = "/icons.json";

export default class PackManager {
  private _customIcons = new Map<string, IconInfo>();
  private _cutomsIconPacknames: Set<string> = new Set();
  get customIcons(): ExportedIcons | null {
    let icons = [...this._customIcons].map(
      ([id, { svg }]) => [id, svg] as [key: string, value: string],
    );
    return icons.length > 0 ? Object.fromEntries(icons) : null;
  }
  get customPacks(): string[] {
    return [...this._cutomsIconPacknames];
  }
  get customIconsFilePath() {
    return normalizePath(this.plugin.manifest.dir + CUSTOM_ICON_PATH);
  }

  hasIcon(id: string): boolean {
    return (
      emoji.hasEmoji(id) || SVGIconPacks.has(id) || this._customIcons.has(id)
    );
  }

  /**
   * @param raw if given, return svg data uri instead of img element
   */
  getIcon(id: string, raw: true): string | null;
  getIcon(id: string, raw?: false): string | HTMLImageElement | null;
  getIcon(id: string, raw = false): string | HTMLImageElement | null {
    let info;
    if (emoji.hasEmoji(id)) return emoji.get(id);
    else if (
      (info = SVGIconPacks.get(id)) ||
      (info = this._customIcons.get(id))
    ) {
      const { svg, pack } = info,
        svgUri = svg2uri(svg);
      return raw
        ? svgUri
        : createEl("img", {
            cls: cls(["isc-icon", `isc-${pack}`]),
            attr: { src: svgUri },
          });
    } else return null;
  }
  getNameFromId(id: string): string | null {
    if (!this.hasIcon(id)) return null;
    if (emoji.hasEmoji(id)) return id;
    return id
      .replace(PackPrefixPattern, (str, packname) => {
        if (
          IconPacknames.includes(packname) ||
          this._cutomsIconPacknames.has(packname)
        ) {
          return "";
        } else return str;
      })
      .replace(RE_UNDERSTORE_DASH, " ");
  }

  isPackEnabled(icon: IconId): boolean {
    if (icon.pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return (
      !(icon.pack in status) ||
      status[icon.pack as keyof typeof status] === true
    );
  }

  /** store ids of custom icons  */
  private _iconIds: IconId[] = [];
  get iconIds() {
    return this._iconIds;
  }
  private async refresh(save = true) {
    this._iconIds.length = 0;
    this._cutomsIconPacknames.clear();
    for (const [id, { pack, md5 }] of this._customIcons) {
      this._iconIds.push({ pack, id, md5 });
      this._cutomsIconPacknames.add(pack);
    }
    this._iconIds.push(...IconIds);

    if (save) return this.saveCustomIcons();
  }
  constructor(public plugin: IconSC) {}

  async loadCustomIcons(): Promise<void> {
    const { vault } = this.plugin.app,
      data = await vault.readJson(this.customIconsFilePath);

    if (!(data && data instanceof Object)) return;
    let info;
    for (const id in data) {
      const svg = data[id as keyof typeof data];
      if (typeof svg === "string" && (info = getIconInfoFromId(id, svg))) {
        this._customIcons.set(id, info);
      } else {
        console.warn(
          "Failed to load icon data (raw value: %o) for id %s, skipping...",
          svg,
          id,
        );
      }
    }
    this.refresh(false);
  }
  async saveCustomIcons() {
    const { vault } = this.plugin.app,
      data = this.customIcons;
    await vault.writeJson(this.customIconsFilePath, data ?? {});
  }

  async addFromFiles(pack: string, files: FileList) {
    const icons = await getSVGIconFromFileList(files);
    if (!icons) {
      new Notice("No SVG file found in dropped items");
      return;
    }

    if (IconPacknames.includes(pack)) {
      console.error("failed to add pack: pack name %s reserved", pack);
      return;
    }
    let addedIds = [] as string[];
    for (const { name, svg } of icons) {
      const id = sanitizeId(`${pack}_${name}`);
      if (!id) {
        console.warn("failed to add icon: id %s invalid, skipping...", id);
        continue;
      }
      if (this.hasIcon(id))
        console.warn("icon id %s already exists, overriding...", id);
      this._customIcons.set(id, { pack, svg, md5: getMd5(svg) });
      addedIds.push(id);
    }
    await this.refresh();
    new Notice(addedIds.length.toString() + " icons added");
  }
  async setMultiple(toset: IdIconMap | EntriesFromRecord<IdIconMap>) {
    const entries = Array.isArray(toset) ? toset : ObjtoEntries(toset);
    for (const entry of entries) {
      this._customIcons.set(...entry);
    }
    await this.refresh();
    return this;
  }
  async deleteMultiple(...ids: string[]) {
    for (const id of ids) {
      this._customIcons.delete(id);
    }
    await this.refresh();
  }
  async filter(
    predicate: (key: string, value: IconInfo) => boolean,
  ): Promise<void> {
    let changed = false;
    for (const [key, value] of this._customIcons) {
      if (!predicate(key, value)) {
        this._customIcons.delete(key);
        changed || (changed = true);
      }
    }
    if (changed) return this.refresh();
  }
  async rename(id: string, newId: string): Promise<string | null> {
    if (this.hasIcon(newId)) {
      console.log("failed to rename icon: id %s already exists", newId);
      return null;
    }
    const info = this._customIcons.get(id);
    if (!info) {
      console.log("failed to rename icon: id %s not found in custom icons", id);
      return null;
    }
    const renameTo = sanitizeId(newId);
    if (!renameTo) {
      console.log("failed to rename icon: id %s invalid", id);
      return null;
    }
    this._customIcons.set(renameTo, info);
    this._customIcons.delete(id);
    await this.refresh();
    return newId;
  }
  async star(id: string): Promise<string | null> {
    const targetId = id.replace(/_\d?$/, "");
    if (targetId === id) {
      console.log("failed to star icon: no suffix found for id %s", id);
      return null;
    }
    const info = this._customIcons.get(id);
    if (!info) {
      console.log("failed to star icon: id %s not found in custom icons", id);
      return null;
    }
    if (this._customIcons.has(targetId)) {
      const temp = this._customIcons.get(targetId) as IconInfo;
      this._customIcons.set(targetId, info);
      this._customIcons.set(id, temp);
    } else if (this.hasIcon(targetId)) {
      console.log(
        "failed to star icon: new id %s exists in built-in icons",
        targetId,
      );
    } else {
      this._customIcons.set(targetId, info);
      this._customIcons.delete(id);
    }
    await this.refresh();
    return targetId;
  }

  async set(id: string, info: IconInfo): Promise<void> {
    this._customIcons.set(id, info);
    await this.refresh();
  }

  async delete(id: string): Promise<boolean> {
    const result = this._customIcons.delete(id);
    await this.refresh();
    return result;
  }
  async clear() {
    this._customIcons.clear();
    await this.refresh();
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
