import "./icon.less";

import cls from "classnames";
import Fuse from "fuse.js";
import JSZip from "jszip";
import emoji from "node-emoji";
import {
  EventRef,
  Events,
  normalizePath,
  Notice,
  Platform,
  Vault,
} from "obsidian";
import { basename, join } from "path";

import IconSC from "../isc-main";
import { evtPrefix, PMEvents } from "../typings/api";
import {
  BuiltInIconIds,
  BuiltInIconPacknames,
  BuiltInSVGIconPacks,
} from "./built-ins";
import {
  BultiInIconData,
  EmojiIconData,
  IconData,
  IconInfo,
  isFileIconInfo,
} from "./types";
import {
  extPattern,
  getClsForIcon,
  getIconsFromFileList,
  iconFilePattern,
  sanitizeId,
  stripColons,
} from "./utils";
import { FileIconData } from "./file-icon";

const CUSTOM_ICON_PATH = "/icons.json";
const CUSTOM_ICON_DIR = "icons";

export default class PackManager extends Events {
  private _customIcons = new Map<string, FileIconData>();
  private _cutomsIconPacknames: Set<string> = new Set();
  get vault() {
    return this.plugin.app.vault;
  }
  async renameIconFile(
    id: string,
    ext: string,
    newId: string,
  ): Promise<string> {
    const newPath = join(this.customIconsDir, newId + ext),
      path = join(this.customIconsDir, id + ext);
    await this.vault.adapter.rename(path, newPath);
    return newPath;
  }
  removeIconFile(id: string, ext: string) {
    const path = join(this.customIconsDir, id + ext);
    return this.vault.adapter.remove(path);
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
    return this._isBuiltIn(id) || this._customIcons.has(id);
  }
  private _isBuiltIn(id: string): boolean {
    return emoji.hasEmoji(id) || BuiltInSVGIconPacks.has(id);
  }

  private _getEmojiIcon(id: string, raw = false): string | HTMLSpanElement {
    return raw
      ? emoji.get(id)
      : createSpan({
          cls: [
            ...getClsForIcon({ pack: "emoji", name: id, id: id }),
            "isc-emoji-icon",
          ],
          text: emoji.get(id),
        });
  }

  /**
   * @param id accept shortcode with colons
   * @param raw if given, return resource path to icon file instead of img element
   */
  getIcon(id: string, raw: true): string | null;
  getIcon(id: string, raw?: false): HTMLSpanElement | null;
  getIcon(id: string, raw = false): string | HTMLSpanElement | null {
    id = stripColons(id);
    if (emoji.hasEmoji(id)) return this._getEmojiIcon(id, raw);
    else if (BuiltInSVGIconPacks.has(id)) {
      const icon = BuiltInSVGIconPacks.get(id)!;
      return raw ? icon.dataUri : icon.getDOM(false);
    } else if (this._customIcons.has(id)) {
      const icon = this._customIcons.get(id)!;
      return raw ? icon.resourcePath : icon.getDOM(false);
    } else return null;
  }

  async getSVGIcon(id: string, raw: true): Promise<string | null>;
  async getSVGIcon(id: string, raw?: false): Promise<HTMLSpanElement | null>;
  async getSVGIcon(
    id: string,
    raw = false,
  ): Promise<string | HTMLSpanElement | null> {
    id = stripColons(id);
    if (emoji.hasEmoji(id)) return this._getEmojiIcon(id, raw);
    else if (BuiltInSVGIconPacks.has(id)) {
      const icon = BuiltInSVGIconPacks.get(id)!,
        el = icon.getDOM(true);
      return raw ? el.innerHTML : el;
    } else if (this._customIcons.has(id)) {
      const icon = this._customIcons.get(id)!,
        el = await icon.getDOM(true);
      return raw ? el.innerHTML : el;
    } else return null;
  }

  getIconData(id: string): IconData | null {
    id = stripColons(id);
    if (emoji.hasEmoji(id)) {
      return {
        id,
        name: id,
        pack: "emoji",
        char: emoji.get(id),
        type: "emoji",
      } as EmojiIconData;
    } else if (BuiltInSVGIconPacks.has(id)) {
      return BuiltInSVGIconPacks.get(id) as BultiInIconData;
    } else if (this._customIcons.has(id)) {
      return this._customIcons.get(id)!;
    } else return null;
  }

  isPackEnabled(pack: string): boolean {
    if (pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return !(pack in status) || status[pack as keyof typeof status] === true;
  }

  private refreshPackNames() {
    this._cutomsIconPacknames.clear();
    for (const [, { pack }] of this._customIcons) {
      this._cutomsIconPacknames.add(pack);
    }
  }
  constructor(public plugin: IconSC) {
    super();
  }

  private _loaded = false;
  async loadIcons(): Promise<void> {
    if (this._loaded) {
      this._fuse.setCollection([]);
      this._customIcons.clear();
      this._cutomsIconPacknames.clear();
      this._loaded = false;
    }
    if (!(await this.vault.adapter.exists(this.customIconsDir))) {
      await this.vault.adapter.mkdir(this.customIconsDir);
      return;
    }
    const iconlist = await this.vault.adapter.list(this.customIconsDir);

    let info;
    const queue = iconlist.files.map(async (path) => {
      if (!extPattern.test(path)) return;
      const id = basename(path).replace(extPattern, "");
      const icon = FileIconData.getData(id, path, this.plugin);
      if (!icon) {
        console.warn(
          "Failed to load icon data (raw value: %o) for id %s, skipping...",
          path,
          id,
        );
      } else {
        this._customIcons.set(id, icon);
        this._fuse.add(icon);
      }
    });
    for (const result of await Promise.allSettled(queue)) {
      if (result.status === "rejected")
        console.error("Failed to load icon", result.reason);
    }
    this._loaded = true;
    this.refreshPackNames();
    this.trigger("initialized", this.plugin.api);
  }
  async backupIcons(pack?: string): Promise<void> {
    let zip = new JSZip();
    const iconlist = await this.vault.adapter.list(this.customIconsDir);
    for (const filepath of iconlist.files) {
      if (!pack || basename(filepath).startsWith(pack + "_")) {
        zip.file(basename(filepath), this.vault.adapter.readBinary(filepath));
      }
    }
    const bakFilePath = `${pack ?? "custom-icons"}.zip`;
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

  async importIconsFromFileList(list: FileList, zipNameAsPack = false) {
    let queue = [] as Promise<string>[];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (file.type !== "application/zip") continue;
      queue.push(this.importIcons(file, zipNameAsPack));
    }
    return Promise.allSettled(queue);
  }

  /**
   *
   * @param files
   * @param zipNameAsPack if true, use zip filename as pack name; otherwise, get pack name from each icon's id
   * @returns
   */
  async importIcons(
    file: File | { name: string; data: ArrayBuffer },
    zipNameAsPack: boolean,
  ): Promise<string> {
    const packNameFromZip = file.name.replace(/\.zip$/, "");
    let zip;
    if (file instanceof File) {
      zip = await JSZip.loadAsync(file);
    } else {
      zip = await JSZip.loadAsync(file.data);
    }
    const queue = zip.file(iconFilePattern).map(async (file) => {
      let { name } = file;
      if (zipNameAsPack && !name.startsWith(packNameFromZip + "_"))
        name = packNameFromZip + "_" + name;
      const id = this.getAvailableId(name);
      const writeTo = join(this.customIconsDir, id);
      if (await this.vault.adapter.exists(writeTo)) {
        return Promise.reject(`icon ${id} already exists, skipping..`);
      }
      await this.vault.adapter.writeBinary(
        writeTo,
        await file.async("arraybuffer"),
      );
      return id;
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
    new Notice(addedIcons.length + " icons imported");
    return file.name;
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
      let id = sanitizeId(`${pack}_${name}`);
      if (!id) {
        console.warn("failed to add icon: id %s invalid, skipping...", id);
        return arr;
      }
      id = this.getAvailableId(id);
      if (this._customIcons.has(id)) {
        arr.push(Promise.reject(`icon ${id} already exists, skipping..`));
        return arr;
      }
      arr.push(
        (async () => {
          try {
            const path = await this.addIcon(id, ext, data);
            this.set(
              id,
              new FileIconData(id, name, pack, path, this.plugin),
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
    this.refreshPackNames();
    this.trigger("changed", this.plugin.api, addedIds);
    new Notice(addedIds.length.toString() + " icons added");
  }
  async deleteMultiple(...ids: string[]): Promise<void> {
    this._fuse.remove((icon) => isFileIconInfo(icon) && ids.includes(icon.id));
    const queue = ids.map(async (id) => {
      const info = this._customIcons.get(id);
      if (!info)
        throw new IconFileOpError(
          "delete",
          id,
          "No icon found in _customIcons",
        );
      this._customIcons.delete(id);
      try {
        await this.removeIconFile(id, info.ext);
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
      this.refreshPackNames();
      this.trigger("changed", this.plugin.api, ids);
    }
  }
  async filter(
    predicate: (key: string, value: Omit<FileIconData, "id">) => boolean,
  ): Promise<void> {
    // id - path map
    let IconsToDelete = new Map<string, string>();
    for (const [id, data] of this._customIcons) {
      if (!predicate(id, data)) {
        this._customIcons.delete(id);
        IconsToDelete.set(id, data.path);
      }
    }
    this._fuse.remove((icon) => IconsToDelete.has(icon.id));
    if (IconsToDelete.size === 0) return;
    this.refreshPackNames();
    this.trigger("changed", this.plugin.api, [...IconsToDelete.keys()]);
    const queue = [...IconsToDelete.values()].map(async (path) => {
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
      info.path = await this.renameIconFile(id, info.ext, newId);
    } catch (error) {
      throw new IconFileOpError("rename", id, error, newId);
    }
    this.set(renameTo, info, false);
    this.delete(id, false, false);
    this.refreshPackNames();
    this.trigger("changed", this.plugin.api, [id, newId]);
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
    if (this._isBuiltIn(targetId)) {
      console.log(
        "failed to star icon: new id %s exists in built-in icons",
        targetId,
      );
      return null;
    }

    try {
      const { ext } = info;
      if (this._customIcons.has(targetId)) {
        const temp = this._customIcons.get(targetId) as FileIconData,
          { ext: targetExt } = temp;
        await this.renameIconFile(targetId, targetExt, targetId + "_temp");
        info.path = await this.renameIconFile(id, ext, targetId);
        this.set(targetId, info, false);
        temp.path = await this.renameIconFile(
          targetId + "_temp",
          targetExt,
          id,
        );
        this.set(id, temp, false);
      } else {
        info.path = await this.renameIconFile(id, ext, targetId);
        this.set(targetId, info, false);
        this.delete(id, false, false);
      }
    } catch (error) {
      new IconFileOpError("rename", id, error, targetId);
    }

    this.refreshPackNames();
    this.trigger("changed", this.plugin.api, [id, targetId]);
    return targetId;
  }

  private getAvailableId(id: string): string {
    if (!this.hasIcon(id)) return id;
    let i = 1,
      newId = `${id}_${i}`;
    while (this.hasIcon(newId)) {
      newId = `${id}_${++i}`;
    }
    return `${id}_${i}`;
  }

  /** set info in database, no file changes */
  set(id: string, info: FileIconData, refresh = true): void {
    if (this._customIcons.get(id) === info) return;
    this._customIcons.set(id, info);
    this._fuse.remove((icon) => icon.id === id);
    this._fuse.add(info);
    if (refresh) {
      this.refreshPackNames();
      this.trigger("changed", this.plugin.api, [id]);
    }
  }

  async delete(
    id: string,
    refresh = true,
    deleteFile = true,
  ): Promise<boolean> {
    const info = this._customIcons.get(id);
    if (!info) return false;
    if (deleteFile) {
      try {
        await this.removeIconFile(id, info.ext);
      } catch (error) {
        throw new IconFileOpError("delete", id, error);
      }
    }
    const result = this._customIcons.delete(id);
    this._fuse.remove((icon) => icon.id === id);
    if (refresh) {
      this.refreshPackNames();
      this.trigger("changed", this.plugin.api, [id]);
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
    this.refreshPackNames();
    this.trigger("changed", this.plugin.api);
  }

  private _fuse = new Fuse<IconInfo>(BuiltInIconIds, {
    keys: ["name", "pack"],
    includeScore: true,
    // ignoreLocation: true,
    findAllMatches: true,
    threshold: 0.5,
    shouldSort: true,
    includeMatches: true,
    useExtendedSearch: true,
  });
  search(query: string[], packs?: string[], limit?: number) {
    let exp = query.map<Fuse.Expression>((s) => ({ name: s }));
    packs = packs ?? this.enabledPacknames;
    exp.push({ $or: packs.map((p) => ({ pack: `=${p}` })) });
    return this._fuse.search({ $and: exp }, { limit: limit ?? 20 });
  }
  getAllIds(packs?: string[], limit?: number) {
    let exp = (packs ?? this.enabledPacknames).map((p) => ({
      pack: `=${p}`,
    }));
    return this._fuse.search({ $or: exp }, { limit: limit ?? 20 });
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

class IconFileOpError extends Error {
  constructor(op: string, id: string, srcErr: any, newId?: string) {
    super(
      `Error while ${op} on ${id}${newId ? "=>" + newId : ""}: ${
        srcErr instanceof Error ? `${srcErr.name}: ${srcErr.message}` : srcErr
      }`,
    );
    console.error(`${op} on ${id}${newId ? "=>" + newId : ""}`, srcErr);
    this.name = "SaveIconError";
  }
}
