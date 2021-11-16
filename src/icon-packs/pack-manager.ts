import "./icon.less";

import cls from "classnames";
import Fuse from "fuse.js";
import getMd5 from "md5";
import svg2uri from "mini-svg-data-uri";
import emoji from "node-emoji";
import { EventRef, Events, normalizePath, Notice } from "obsidian";
import { basename, extname, join } from "path";

import IconSC from "../isc-main";
import {
  BuiltInIconIds,
  BuiltInIconPacknames,
  BuiltInSVGIconPacks,
} from "./built-ins";
import { FileIconInfo, IconId } from "./types";
import { getIconInfoFromId, sanitizeId } from "./utils";

const CUSTOM_ICON_PATH = "/icons.json";
const CUSTOM_ICON_DIR = "themes/icons";

export default class PackManager extends Events {
  private _customIcons = new Map<string, FileIconInfo>();
  private _cutomsIconPacknames: Set<string> = new Set();
  get vault() {
    return this.plugin.app.vault;
  }
  renameId(id: string, newId: string) {
    return Promise.reject(void 0);
    // Not working yet
    return this.vault.adapter.rename(
      join(this.customIconsDir, `${id}.svg`),
      join(this.customIconsDir, `${newId}.svg`),
    );
  }
  removeId(id: string) {
    return this.vault.adapter.remove(join(this.customIconsDir, `${id}.svg`));
  }
  async addIcon(id: string, svg: string) {
    const path = join(this.customIconsDir, `${id}.svg`);
    await this.vault.adapter.write(path, svg);
    return path;
  }
  get customPacknames(): string[] {
    return [...this._cutomsIconPacknames];
  }
  get customIconsFilePath() {
    return normalizePath(this.plugin.manifest.dir + CUSTOM_ICON_PATH);
  }
  get customIconsDir() {
    return join(this.vault.configDir, CUSTOM_ICON_DIR);
  }
  isPacknameExists(packname: string) {
    return (
      BuiltInIconPacknames.includes(packname) ||
      this._cutomsIconPacknames.has(packname)
    );
  }
  get enabledPacknames(): string[] {
    return [...BuiltInIconPacknames, ...this._cutomsIconPacknames].filter(
      (pack) => this.isPackEnabled(pack),
    );
  }

  hasIcon(id: string): boolean {
    return (
      emoji.hasEmoji(id) ||
      BuiltInSVGIconPacks.has(id) ||
      this._customIcons.has(id)
    );
  }

  /**
   * @param raw if given, return resource path to icon file instead of img element
   */
  getIcon(id: string, raw: true): string | null;
  getIcon(id: string, raw?: false): string | HTMLImageElement | null;
  getIcon(id: string, raw = false): string | HTMLImageElement | null {
    let info;
    if (emoji.hasEmoji(id)) return emoji.get(id);
    else if ((info = BuiltInSVGIconPacks.get(id))) {
      const { data, pack } = info,
        svgUri = svg2uri(data);
      return raw
        ? svgUri
        : createEl("img", {
            cls: cls(["isc-icon", `isc-${pack}`]),
            attr: { src: svgUri },
          });
    } else if ((info = this._customIcons.get(id))) {
      const { path, pack } = info,
        src = this.vault.adapter.getResourcePath(path);
      return raw
        ? src
        : createEl("img", {
            cls: cls(["isc-icon", `isc-${pack}`]),
            attr: { src },
          });
    } else return null;
  }

  isPackEnabled(pack: string): boolean {
    if (pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return !(pack in status) || status[pack as keyof typeof status] === true;
  }

  private refresh() {
    this._cutomsIconPacknames.clear();
    for (const [, { pack }] of this._customIcons) {
      this._cutomsIconPacknames.add(pack);
    }
  }
  constructor(public plugin: IconSC) {
    super();
  }

  private _loaded = false;
  async loadCustomIcons(): Promise<void> {
    if (this._loaded) return;
    const { vault } = this.plugin.app,
      iconlist = await vault.adapter.list(this.customIconsDir);

    let info;
    for (const path of iconlist.files) {
      if (extname(path) !== ".svg") continue;
      const svg = path,
        id = basename(path, ".svg");
      if ((info = getIconInfoFromId(id, svg))) {
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
    this.refresh();
    this.trigger("initialized", this);
  }

  async addFromFiles(pack: string, files: FileList) {
    const icons = await getSVGIconFromFileList(files);
    if (!icons) {
      new Notice("No SVG file found in dropped items");
      return;
    }

    if (BuiltInIconPacknames.includes(pack)) {
      console.error("failed to add pack: pack name %s reserved", pack);
      return;
    }
    const writeQueue = icons.reduce((arr, { name, svg }) => {
      const id = sanitizeId(`${pack}_${name}`);
      if (!id) {
        console.warn("failed to add icon: id %s invalid, skipping...", id);
        return arr;
      }
      if (this._customIcons.has(id))
        console.warn("icon id %s already exists, overriding...", id);
      arr.push(
        (async () => {
          try {
            this.set(
              id,
              {
                pack,
                name,
                path: await this.addIcon(id, svg),
                md5: getMd5(svg),
              },
              false,
            );
          } catch (error) {
            throw new IconFileOpError("add", id, error);
          }

          return id;
        })(),
      );
      return arr;
    }, [] as Promise<string>[]);
    let addedIds = [] as string[];
    for (const result of await Promise.allSettled(writeQueue)) {
      if (result.status === "rejected") {
        console.error("Failed to add icon, details: ", result.reason);
      } else {
        addedIds.push(result.value);
      }
    }
    this.refresh();
    this.trigger("changed", this);
    new Notice(addedIds.length.toString() + " icons added");
  }
  async deleteMultiple(...ids: string[]): Promise<void> {
    const queue = ids.map(async (id) => {
      this._customIcons.delete(id);
      this._fuse.remove((icon) => ids.includes(icon.id));
      try {
        await this.removeId(id);
      } catch (error) {
        throw new IconFileOpError("delete", id, error);
      }
    });
    let changed = false;
    for (const result of await Promise.allSettled(queue)) {
      if (result.status === "rejected") {
        console.error("Failed to remove icon file, details: ", result.reason);
      } else {
        changed || (changed = true);
      }
    }
    if (changed) {
      this.refresh();
      this.trigger("changed", this);
    }
  }
  async filter(
    predicate: (key: string, value: Omit<IconId, "id">) => boolean,
  ): Promise<void> {
    let toDelete = new Set<string>();
    for (const [key, value] of this._customIcons) {
      if (!predicate(key, value)) {
        this._customIcons.delete(key);
        toDelete.add(key);
      }
    }
    this._fuse.remove((icon) => {
      const result = !predicate(icon.id, icon);
      if (result) {
        toDelete.add(icon.id);
      }
      return result;
    });
    if (toDelete.size === 0) return;
    this.refresh();
    this.trigger("changed", this);
    const queue = [...toDelete].map(async (id) => {
      try {
        await this.vault.adapter.remove(join(this.customIconsDir, `${id}.svg`));
      } catch (error) {
        throw new IconFileOpError("delete", id, error);
      }
    });
    for (const result of await Promise.allSettled(queue)) {
      if (result.status === "rejected") {
        console.error("Failed to remove icon file, details: ", result.reason);
      }
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
    try {
      await this.renameId(id, newId);
    } catch (error) {
      throw new IconFileOpError("rename", id, error, newId);
    }
    this.set(renameTo, info, false);
    this.delete(id, false, false);
    this.refresh();
    this.trigger("changed", this);
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
    if (this.hasIcon(targetId)) {
      console.log(
        "failed to star icon: new id %s exists in built-in icons",
        targetId,
      );
      return null;
    }

    try {
      if (this._customIcons.has(targetId)) {
        const temp = this._customIcons.get(targetId) as FileIconInfo;
        this.set(targetId, info, false);
        this.set(id, temp, false);
        await this.renameId(targetId, targetId + "_temp");
        await this.renameId(id, targetId);
        await this.renameId(targetId + "_temp", id);
      } else {
        this.set(targetId, info, false);
        this.delete(id, false, false);
        await this.renameId(id, targetId);
      }
    } catch (error) {
      new IconFileOpError("rename", id, error, targetId);
    }

    this.refresh();
    this.trigger("changed", this);
    return targetId;
  }

  /** set info in database, no file changes */
  set(id: string, info: FileIconInfo, refresh = true): void {
    this._customIcons.set(id, info);
    this._fuse.remove((icon) => icon.id === id);
    const { md5, pack } = info;
    this._fuse.add({ id, md5, name: id.substring(pack.length + 1), pack });
    if (refresh) {
      this.refresh();
      this.trigger("changed", this);
    }
  }

  async delete(
    id: string,
    refresh = true,
    deleteFile = true,
  ): Promise<boolean> {
    if (deleteFile) {
      try {
        await this.removeId(id);
      } catch (error) {
        throw new IconFileOpError("delete", id, error);
      }
    }
    const result = this._customIcons.delete(id);
    this._fuse.remove((icon) => icon.id === id);
    if (refresh) {
      this.refresh();
      this.trigger("changed", this);
    }
    return result;
  }
  async clear() {
    const queue = (
      await this.vault.adapter.list(this.customIconsDir)
    ).files.map((path) => this.vault.adapter.remove(path));
    for (const result of await Promise.allSettled(queue)) {
      if (result.status === "rejected") {
        console.error("Failed to remove icon file, details: ", result.reason);
      }
    }
    this._customIcons.clear();
    this._fuse.remove((id) => !BuiltInIconIds.includes(id));
    this.refresh();
    this.trigger("changed", this);
  }

  private _fuse = new Fuse<IconId>(BuiltInIconIds, {
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
    // @ts-expect-error
    super.trigger(...args);
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
type PMEvents =
  | [name: "changed", manager: PackManager]
  | [name: "initialized", manager: PackManager];

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

class IconFileOpError extends Error {
  constructor(op: string, id: string, srcErr: any, newId?: string) {
    super(
      `Error while ${op} on ${id}${newId ? "=>" + newId : ""}: ${
        srcErr instanceof Error
          ? `${srcErr.name}: ${srcErr.message}`
          : srcErr.toString()
      }`,
    );
    this.name = "SaveIconError";
  }
}
