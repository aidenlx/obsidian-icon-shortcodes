import svg2uri from "mini-svg-data-uri";
import emoji from "node-emoji";
import emojiByName from "node-emoji/lib/emoji.json";

type EntriesFromRecord<T> = [key: keyof T, value: T[keyof T]][];

type IdIconMap = Record<string, IconInfo>;
export type IconId = { id: string; pack: string };
type IconInfo = { pack: string; svg: string };

import * as iconsets from "../icons/index";
export type BuiltInPacks = keyof typeof iconsets;

export const builtInPacks = (Object.keys(iconsets) as string[]).concat([
  "emoji",
]);
const RE_UNDERSTORE_DASH = /[-_]/g;

const toEntries = <T extends Object>(obj: T) =>
  Object.entries(obj) as EntriesFromRecord<T>;

import IconSC from "../isc-main";

type exportIcons = {
  [key: Parameters<typeof getIconInfoFromId>[0]]: Parameters<
    typeof getIconInfoFromId
  >[1];
};
export default class IconPacks extends Map<string, IconInfo> {
  get customIcons(): exportIcons | null {
    let icons = [...this]
      .filter(([, info]) => !builtInPacks.includes(info.pack))
      .map(([id, { svg }]) => [id, svg] as [key: string, value: string]);
    return icons.length > 0 ? Object.fromEntries(icons) : null;
  }
  get customPacks(): string[] {
    return [...this._iconPacks].filter((pack) => !builtInPacks.includes(pack));
  }

  hasIcon(id: string): boolean {
    return emoji.hasEmoji(id) || this.has(id);
  }
  getIcon(id: string): string | HTMLImageElement | null {
    let info;
    if (emoji.hasEmoji(id)) return emoji.get(id);
    else if ((info = this.get(id))) {
      const { svg } = info;
      return createEl("img", {
        cls: "isc-icon",
        attr: { src: svg2uri(svg) },
      });
    } else return null;
  }
  getNameFromId(id: string): string | null {
    if (!this.hasIcon(id)) return null;
    return this.stripPackPrefix(id).replace(RE_UNDERSTORE_DASH, " ");
  }

  private stripPackPrefix(id: string): string {
    const pattern = new RegExp(`^(?:${[...this._iconPacks].join("|")})_`);
    return id.replace(pattern, "");
  }

  isEnabled(icon: IconId): boolean {
    if (icon.pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return (
      !(icon.pack in status) ||
      status[icon.pack as keyof typeof status] === true
    );
  }

  /** store ids of both icon and emoji  */
  private _iconIds: IconId[] = [];
  private _iconPacks: Set<string> = new Set();
  get iconIds() {
    return this._iconIds;
  }
  private async refresh(save = true): Promise<void> {
    this._iconIds.length = 0;
    this._iconPacks.clear();
    for (const id of Object.keys(emojiByName)) {
      this._iconIds.push({ pack: "emoji", id });
    }
    for (const [id, { pack }] of this) {
      this._iconIds.push({ pack, id });
      this._iconPacks.add(pack);
    }
    if (save) return this.plugin.saveCustomIcons();
  }
  constructor(public plugin: IconSC, toset?: IdIconMap) {
    super(toset ? toEntries(toset) : void 0);
    for (const [pack, icons] of toEntries(iconsets)) {
      for (const [id, svg] of toEntries(icons)) {
        super.set(id, { pack, svg });
      }
    }
    this.refresh(false);
  }
  async addFromFiles(pack: string, icons: { name: string; svg: string }[]) {
    if (builtInPacks.includes(pack)) {
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
      if (this.has(id))
        console.warn("icon id %s already exists, overriding...", id);
      super.set(id, { pack, svg });
      addedIds.push(id);
    }
    await this.refresh();
    return addedIds;
  }
  async setMultiple(toset: IdIconMap | EntriesFromRecord<IdIconMap>) {
    const entries = Array.isArray(toset) ? toset : toEntries(toset);
    for (const entry of entries) {
      super.set(...entry);
    }
    await this.refresh();
    return this;
  }
  async deleteMultiple(...ids: string[]) {
    for (const id of ids) {
      super.delete(id);
    }
    await this.refresh();
  }
  async filter(
    predicate: (key: string, value: IconInfo) => boolean,
  ): Promise<void> {
    let changed = false;
    for (const [key, value] of this.entries()) {
      if (!predicate(key, value)) {
        super.delete(key);
        changed || (changed = true);
      }
    }
    if (changed) return this.refresh();
  }
  async rename(id: string, newId: string): Promise<string | null> {
    if (this.has(newId)) {
      console.log("failed to rename icon: id %s already exists", newId);
      return null;
    }
    const info = this.get(id);
    if (!info) {
      console.log("failed to rename icon: id %s not found", id);
      return null;
    }
    const renameTo = sanitizeId(newId);
    if (!renameTo) {
      console.log("failed to rename icon: id %s invalid", id);
      return null;
    }
    super.set(renameTo, info);
    super.delete(id);
    await this.refresh();
    return newId;
  }
  async star(id: string): Promise<string | null> {
    const targetId = id.replace(/_\d?$/, "");
    if (targetId === id) {
      console.log("failed to star icon: no suffix found for id %s", id);
      return null;
    }
    const info = this.get(id);
    if (!info) {
      console.log("failed to star icon: id %s not found", id);
      return null;
    }
    if (this.has(targetId)) {
      const temp = this.get(targetId) as IconInfo;
      super.set(targetId, info);
      super.set(id, temp);
    } else {
      super.set(targetId, info);
      super.delete(id);
    }
    await this.refresh();
    return targetId;
  }

  // @ts-expect-error
  async set(id: string, info: IconInfo): Promise<this> {
    const result = super.set(id, info);
    await this.refresh();
    return result;
  }

  // @ts-expect-error
  async delete(id: string): Promise<boolean> {
    const result = super.delete(id);
    await this.refresh();
    return result;
  }
  async clear() {
    super.clear();
    await this.refresh();
  }
}

/**
 * Removes colons on either side
 * of the string if present
 * @param  {string} str
 * @return {string}
 */
export const stripColons = (str: string): string => {
  var colonIndex = str.indexOf(":");
  if (colonIndex > -1) {
    // :emoji: (http://www.emoji-cheat-sheet.com/)
    if (colonIndex === str.length - 1) {
      str = str.substring(0, colonIndex);
      return stripColons(str);
    } else {
      str = str.substr(colonIndex + 1);
      return stripColons(str);
    }
  }

  return str;
};

export const getIconInfoFromId = (id: string, svg: string): IconInfo | null => {
  const result = getPacknNameFromId(id);
  if (!result) return null;
  svg = svg.trim();
  return { pack: result.pack, svg };
};
export const getPacknNameFromId = (
  id: string,
): { pack: string; name: string } | null => {
  let indexOfDash;
  if ((indexOfDash = id.indexOf("_")) < 0) {
    console.error("No pack id found in: ", id);
    return null;
  }
  const pack = id.substring(0, indexOfDash),
    name = id.substring(indexOfDash + 1);
  if (!name || !pack) {
    console.error("Missing icon name or pack id in: ", id);
    return null;
  }
  return { pack, name };
};

const sanitizeId = (id: string): string | null => {
  const result = getPacknNameFromId(id);
  if (!result) {
    console.log("failed to rename icon: id %s invalid", id);
    return null;
  }
  return `${result.pack}_${result.name
    .trim()
    .replace(/[ -]+/g, "_")
    .replace(/\s+/g, "")}`;
};
