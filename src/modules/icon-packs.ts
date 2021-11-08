import emoji from "node-emoji";
import emojiByName from "node-emoji/lib/emoji.json";

type IconPackRecord = Record<string, Record<string, string>>;
type IconPackEntries = [pack: string, icons: Record<string, string>][];
export type IconRec = { id: string; pack: string };

import * as iconsets from "../icons/index";
import IconSC from "../isc-main";
const builtInPacks = Object.keys(iconsets) as string[];
const RE_UNDERSTORE_DASH = /[-_]/g;

export default class IconPacks extends Map<string, Record<string, string>> {
  getCustomIcons() {
    let data = Object.fromEntries(this);
    for (const toDelete of builtInPacks) {
      delete data[toDelete];
    }
    return data as IconPackRecord;
  }

  /** store icon id-svg map */
  private _iconMap: Map<string, string> = new Map();
  hasIcon(id: string): boolean {
    return emoji.hasEmoji(id) || this._iconMap.has(id);
  }
  getIcon(id: string): string | HTMLSpanElement | null {
    if (emoji.hasEmoji(id)) return emoji.get(id);
    else if (this._iconMap.has(id)) {
      const svg = this._iconMap.get(id) as string;
      return createEl(
        "span",
        { cls: "alx-isc-icon" },
        (el) => (el.innerHTML = svg.trim()),
      );
    } else return null;
  }
  getNameFromId(id: string): string | null {
    if (!this.hasIcon(id)) return null;
    return this.stripPackPrefix(id).replace(RE_UNDERSTORE_DASH, " ");
  }

  private stripPackPrefix(id: string): string {
    const pattern = new RegExp(`^(?:${[...this.keys()].join("|")})_`);
    return id.replace(pattern, "");
  }
  /** store ids of both icon and emoji  */
  private _iconIds: IconRec[] = [];
  get iconIds() {
    return this._iconIds;
  }

  isEnabled(icon: IconRec): boolean {
    if (icon.pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return (
      icon.pack in status && status[icon.pack as keyof typeof status] === true
    );
  }

  private refresh(): void {
    this._iconIds.length = 0;
    this._iconMap.clear();
    for (const id of Object.keys(emojiByName)) {
      this._iconIds.push({ pack: "emoji", id });
    }
    for (const [pack, icons] of this.entries()) {
      for (const [id, svg] of Object.entries(icons)) {
        this._iconIds.push({ pack, id });
        this._iconMap.set(id, svg);
      }
    }
  }
  constructor(public plugin: IconSC, toset?: IconPackRecord) {
    super(toset ? Object.entries(toset) : void 0);
    this.setMultiple(iconsets);
  }
  setMultiple(toset: IconPackRecord) {
    for (const [pack, icons] of Object.entries(toset) as IconPackEntries) {
      super.set(pack, icons);
    }
    this.refresh();
    return this;
  }
  deleteMultiple(...packs: string[]) {
    for (const pack of packs) {
      super.delete(pack);
    }
    this.refresh();
  }
  set(pack: string, icons: Record<string, string>) {
    const result = super.set(pack, icons);
    this.refresh();
    return result;
  }
  delete(pack: string) {
    const result = super.delete(pack);
    this.refresh();
    return result;
  }
  clear() {
    super.clear();
    this.refresh();
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

export const isIconPackRec = (obj: any): obj is IconPackRecord => {
  if (!(obj instanceof Object)) return false;
  for (const pack in obj) {
    if (typeof pack !== "string" || !(obj[pack] instanceof Object)) {
      console.error("invaild pack: pack %o, data %o", pack, obj[pack]);
      return false;
    }
    for (const id in obj[pack]) {
      const svg = obj[pack][id];
      if (typeof id !== "string" || typeof svg !== "string") {
        console.error("invaild value: pack %o, id %o, svg %o", pack, id, svg);
        return false;
      }
    }
  }
  return true;
};
