import "./icon.less";

import cls from "classnames";
import Fuse from "fuse.js";
import getMd5 from "md5";
import svg2uri from "mini-svg-data-uri";
import emoji from "node-emoji";
import { EventRef, Events, normalizePath, Notice } from "obsidian";

import IconSC from "../isc-main";
import { evtPrefix, PMEvents } from "../typings/api";
import { IconIds, IconPacknames, SVGIconPacks } from "./built-ins";
import { IconId, SVGIconInfo } from "./types";
import { getApi, getIconInfoFromId, sanitizeId } from "./utils";

type ExportedIcons = {
  [key: Parameters<typeof getIconInfoFromId>[0]]: Parameters<
    typeof getIconInfoFromId
  >[1];
};

const CUSTOM_ICON_PATH = "/icons.json";

export default class PackManager extends Events {
  private _customIcons = new Map<string, SVGIconInfo>();
  private _cutomsIconPacknames: Set<string> = new Set();
  get customIcons(): ExportedIcons | null {
    let icons = [...this._customIcons].map(
      ([id, { svg }]) => [id, svg] as [key: string, value: string],
    );
    return icons.length > 0 ? Object.fromEntries(icons) : null;
  }
  get customPacknames(): string[] {
    return [...this._cutomsIconPacknames];
  }
  get customIconsFilePath() {
    return normalizePath(this.plugin.manifest.dir + CUSTOM_ICON_PATH);
  }
  isPacknameExists(packname: string) {
    return (
      IconPacknames.includes(packname) ||
      this._cutomsIconPacknames.has(packname)
    );
  }
  get enabledPacknames(): string[] {
    return [...IconPacknames, ...this._cutomsIconPacknames].filter((pack) =>
      this.isPackEnabled(pack),
    );
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

  isPackEnabled(pack: string): boolean {
    if (pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return !(pack in status) || status[pack as keyof typeof status] === true;
  }

  private async refresh(save = true) {
    this._cutomsIconPacknames.clear();
    for (const [, { pack }] of this._customIcons) {
      this._cutomsIconPacknames.add(pack);
    }
    if (save) return this.saveCustomIcons();
  }
  constructor(public plugin: IconSC) {
    super();
  }

  private _loaded = false;
  async loadCustomIcons(): Promise<void> {
    if (this._loaded) return;
    const { vault } = this.plugin.app,
      data = await vault.readJson(this.customIconsFilePath);

    if (!(data && data instanceof Object)) return;
    let info;
    for (const id in data) {
      const svg = data[id as keyof typeof data];
      if (typeof svg === "string" && (info = getIconInfoFromId(id, svg))) {
        this._customIcons.set(id, info);
        const { md5, name, pack } = info;
        this._fuse.add({ id, md5, name, pack });
      } else {
        console.warn(
          "Failed to load icon data (raw value: %o) for id %s, skipping...",
          svg,
          id,
        );
      }
    }
    this._loaded = true;
    await this.refresh(false);
    this.trigger("initialized", getApi(this, this.plugin));
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
      if (this._customIcons.has(id))
        console.warn("icon id %s already exists, overriding...", id);
      this.set(id, { pack, name, svg, md5: getMd5(svg) }, false);
      addedIds.push(id);
    }
    await this.refresh();
    this.trigger("changed", getApi(this, this.plugin));
    new Notice(addedIds.length.toString() + " icons added");
  }
  async deleteMultiple(...ids: string[]) {
    for (const id of ids) {
      this._customIcons.delete(id);
    }
    this._fuse.remove((icon) => ids.includes(icon.id));
    await this.refresh();
    this.trigger("changed", getApi(this, this.plugin));
  }
  async filter(
    predicate: (
      key: string,
      value: Omit<SVGIconInfo, "svg" | "md5">,
    ) => boolean,
  ): Promise<void> {
    let changed = false;
    for (const [key, value] of this._customIcons) {
      if (!predicate(key, value)) {
        this._customIcons.delete(key);
        changed || (changed = true);
      }
    }
    this._fuse.remove((icon) => !predicate(icon.id, icon));
    if (changed) {
      await this.refresh();
      this.trigger("changed", getApi(this, this.plugin));
    }
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
    this.set(renameTo, info, false);
    this.delete(id, false);
    await this.refresh();
    this.trigger("changed", getApi(this, this.plugin));
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
      const temp = this._customIcons.get(targetId) as SVGIconInfo;
      this.set(targetId, info, false);
      this.set(id, temp, false);
    } else if (this.hasIcon(targetId)) {
      console.log(
        "failed to star icon: new id %s exists in built-in icons",
        targetId,
      );
    } else {
      this.set(targetId, info, false);
      this.delete(id, false);
    }
    await this.refresh();
    this.trigger("changed", getApi(this, this.plugin));
    return targetId;
  }

  async set(id: string, info: SVGIconInfo, refresh = true): Promise<void> {
    this._customIcons.set(id, info);
    this._fuse.remove((icon) => icon.id === id);
    const { md5, pack } = info;
    this._fuse.add({ id, md5, name: id.substring(pack.length + 1), pack });
    if (refresh) {
      await this.refresh();
      this.trigger("changed", getApi(this, this.plugin));
    }
  }

  async delete(id: string, refresh = true): Promise<boolean> {
    const result = this._customIcons.delete(id);
    this._fuse.remove((icon) => icon.id === id);
    if (refresh) {
      await this.refresh();
      this.trigger("changed", getApi(this, this.plugin));
    }
    return result;
  }
  async clear() {
    this._customIcons.clear();
    this._fuse.remove((id) => !IconIds.includes(id));
    await this.refresh();
    this.trigger("changed", getApi(this, this.plugin));
  }

  private _fuse = new Fuse<IconId>(IconIds, {
    keys: ["name", "pack"],
    includeScore: true,
    // ignoreLocation: true,
    // findAllMatches: true,
    threshold: 0.5,
    shouldSort: true,
    includeMatches: true,
  });
  search(query: string[], packs?: string[]) {
    let exp = query.map<Fuse.Expression>((s) => ({ name: s }));
    packs = packs ?? this.enabledPacknames;
    exp.push({ $or: packs.map((p) => ({ pack: `="${p}"` })) });
    return this._fuse.search({ $and: exp });
  }

  trigger(...args: PMEvents): void {
    const [name, ...rest] = args;
    super.trigger(name, ...rest);
    this.plugin.app.vault.trigger(evtPrefix + name, ...rest);
  }
  on(...args: OnArgs<PMEvents>): EventRef {
    // @ts-expect-error
    return super.on(...args);
  }
}

type OnArgs<T> = T extends [infer A, ...infer B]
  ? A extends string
    ? [name: A, callback: (...args: B) => any]
    : never
  : never;

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
