import "./icon.less";

import cls from "classnames";
import Fuse from "fuse.js";
import JSZip from "jszip";
import svg2uri from "mini-svg-data-uri";
import emoji from "node-emoji";
import { EventRef, Events, normalizePath, Notice, Platform } from "obsidian";
import { basename, join } from "path";
import { ArrayBuffer as AB } from "spark-md5";

import IconSC from "../isc-main";
import {
  BuiltInIconIds,
  BuiltInIconPacknames,
  BuiltInSVGIconPacks,
} from "./built-ins";
import { FileIconId, FileIconInfo, IconId, isFileIconId } from "./types";
import {
  extPattern,
  getIconInfoFromId,
  getIconsFromFileList,
  iconFilePattern,
  sanitizeId,
} from "./utils";

const CUSTOM_ICON_PATH = "/icons.json";
const CUSTOM_ICON_DIR = "icons";

export default class PackManager extends Events {
  private _customIcons = new Map<string, FileIconInfo>();
  private _cutomsIconPacknames: Set<string> = new Set();
  get vault() {
    return this.plugin.app.vault;
  }
  async renameId(id: string, newId: string): Promise<string> {
    const idInfo = this._customIcons.get(id);
    if (!idInfo) throw new Error("No such icon " + id);
    const { ext, path } = idInfo;
    const newPath = join(this.customIconsDir, newId + ext);
    return Promise.reject();
    // Not working yet
    await this.vault.adapter.rename(path, newPath);
    return newPath;
  }
  removeId(id: string) {
    const idInfo = this._customIcons.get(id);
    if (!idInfo) throw new Error("No such icon " + id);
    return this.vault.adapter.remove(idInfo.path);
  }
  async addIcon(id: string, ext: string, data: ArrayBuffer) {
    const path = join(this.customIconsDir, id + ext);
    await this.vault.adapter.writeBinary(path, data);
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
    if (!(await this.vault.adapter.exists(this.customIconsDir))) {
      await this.vault.adapter.mkdir(this.customIconsDir);
      return;
    }
    const iconlist = await this.vault.adapter.list(this.customIconsDir);

    let info;
    const queue = iconlist.files.map(async (path) => {
      if (!extPattern.test(path)) return;
      const id = basename(path).replace(extPattern, ""),
        data = await this.vault.adapter.readBinary(path);
      if ((info = getIconInfoFromId(id, path, data))) {
        this._customIcons.set(id, info);
        const { md5, name, pack, ext, path } = info,
          iconId: FileIconId = { id, md5, name, pack, ext, path };
        this._fuse.add(iconId);
      } else {
        console.warn(
          "Failed to load icon data (raw value: %o) for id %s, skipping...",
          path,
          id,
        );
      }
    });
    for (const result of await Promise.allSettled(queue)) {
      if (result.status === "rejected")
        console.error("Failed to load icon", result.reason);
    }
    this._loaded = true;
    this.refresh();
    this.trigger("initialized", this);
  }
  async backupCustomIcons(): Promise<void> {
    let zip = new JSZip();
    const iconlist = await this.vault.adapter.list(this.customIconsDir);
    for (const filepath of iconlist.files) {
      zip.file(basename(filepath), this.vault.adapter.readBinary(filepath));
    }
    const bakFilePath = "custom-icons.zip";
    await this.vault.createBinary(
      bakFilePath,
      await zip.generateAsync({ type: "arraybuffer" }),
    );
    if (Platform.isDesktopApp) {
      // open vault dir in explorer
      this.plugin.app.openWithDefaultApp("");
    } else {
      new Notice(
        `icons have been saved to ${bakFilePath}, ` +
          "enable 'Detect all file extension' in 'Files & Links' to visit it",
      );
    }
  }
  async importCustomIcons(
    files: FileList,
    zipNameAsPack: boolean,
  ): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== "application/zip") continue;
      const packName = file.name.replace(/\.zip$/, ""),
        zip = await JSZip.loadAsync(file);
      const queue = zip.file(iconFilePattern).map(async (file) => {
        let { name } = file;
        if (zipNameAsPack && !name.startsWith(packName + "_"))
          name = packName + "_" + name;
        const writeTo = join(this.customIconsDir, name);
        if (await this.vault.adapter.exists(writeTo)) {
          console.warn("icon %s already exists, overriding...", name);
        }
        this.vault.adapter.writeBinary(
          writeTo,
          await file.async("arraybuffer"),
        );
        return name;
      });
      const addedIcons = (await Promise.allSettled(queue)).reduce(
        (arr, result) => {
          if (result.status === "rejected") {
            console.error("Failed to import icon", result.reason);
          } else {
            arr.push(result.value);
          }
          return arr;
        },
        [] as string[],
      );
      new Notice(
        addedIcons.length + " icons imported, restart obsidian to take effects",
      );
      return; // only import the first zip file
    }
  }

  async addFromFiles(pack: string, files: FileList) {
    const icons = await getIconsFromFileList(files);
    if (!icons) {
      new Notice("No SVG file found in dropped items");
      return;
    }

    if (BuiltInIconPacknames.includes(pack)) {
      console.error("failed to add pack: pack name %s reserved", pack);
      return;
    }
    const writeQueue = icons.reduce((arr, { name, ext, data }) => {
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
            const info = {
              pack,
              name,
              ext,
              path: await this.addIcon(id, ext, data),
              md5: AB.hash(data),
            };
            this.set(id, info, false);
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
    this._fuse.remove((icon) => isFileIconId(icon) && ids.includes(icon.id));
    const queue = ids.map(async (id) => {
      this._customIcons.delete(id);
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
    predicate: (key: string, value: Omit<FileIconId, "id">) => boolean,
  ): Promise<void> {
    let toDelete = new Set<string>();
    for (const [key, value] of this._customIcons) {
      if (!predicate(key, value)) {
        this._customIcons.delete(key);
        toDelete.add(key);
      }
    }
    this._fuse.remove((icon) => {
      const result = isFileIconId(icon) && !predicate(icon.id, icon);
      if (result) toDelete.add(icon.path);
      return result;
    });
    if (toDelete.size === 0) return;
    this.refresh();
    this.trigger("changed", this);
    const queue = [...toDelete].map(async (path) => {
      try {
        await this.vault.adapter.remove(path);
      } catch (error) {
        throw new IconFileOpError("delete", basename(path), error);
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
    let info = this._customIcons.get(id);
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
      info.path = await this.renameId(id, newId);
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
        await this.renameId(targetId, targetId + "_temp");
        info.path = await this.renameId(id, targetId);
        this.set(targetId, info, false);
        temp.path = await this.renameId(targetId + "_temp", id);
        this.set(id, temp, false);
      } else {
        info.path = await this.renameId(id, targetId);
        this.set(targetId, info, false);
        this.delete(id, false, false);
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
    const { md5, pack, path, ext } = info,
      iconId: FileIconId = {
        id,
        md5,
        name: id.substring(pack.length + 1),
        pack,
        path,
        ext,
      };
    this._fuse.add(iconId);
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
