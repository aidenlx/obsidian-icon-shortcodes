import emoji from "node-emoji";
import emojiByName from "node-emoji/lib/emoji.json";

type EntriesFromRecord<T> = [key: keyof T, value: T[keyof T]][];

type IdIconMap = Record<string, IconInfo>;
export type IconId = { id: string; pack: string };
type IconInfo = { pack: string; svg: string };

import * as iconsets from "../icons/index";
import IconSC from "../isc-main";
const builtInPacks = Object.keys(iconsets) as string[];
const RE_UNDERSTORE_DASH = /[-_]/g;

const toEntries = <T extends Object>(obj: T) =>
  Object.entries(obj) as EntriesFromRecord<T>;

export default class IconPacks extends Map<string, IconInfo> {
  get customIcons(): IdIconMap {
    return Object.fromEntries(
      [...this].filter(([, info]) => !builtInPacks.includes(info.pack)),
    );
  }

  hasIcon(id: string): boolean {
    return emoji.hasEmoji(id) || this.has(id);
  }
  getIcon(id: string): string | HTMLSpanElement | null {
    let info;
    if (emoji.hasEmoji(id)) return emoji.get(id);
    else if ((info = this.get(id))) {
      const { svg } = info;
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
    const pattern = new RegExp(`^(?:${[...this._iconPacks].join("|")})_`);
    return id.replace(pattern, "");
  }

  isEnabled(icon: IconId): boolean {
    if (icon.pack === "emoji") return true;
    const status = this.plugin.settings.iconpack;
    return (
      icon.pack in status && status[icon.pack as keyof typeof status] === true
    );
  }

  /** store ids of both icon and emoji  */
  private _iconIds: IconId[] = [];
  private _iconPacks: Set<string> = new Set();
  get iconIds() {
    return this._iconIds;
  }
  private refresh(): void {
    this._iconIds.length = 0;
    this._iconPacks.clear();
    for (const id of Object.keys(emojiByName)) {
      this._iconIds.push({ pack: "emoji", id });
    }
    for (const [id, { pack }] of this) {
      this._iconIds.push({ pack, id });
      this._iconPacks.add(pack);
    }
  }
  constructor(public plugin: IconSC, toset?: IdIconMap) {
    super(toset ? toEntries(toset) : void 0);
    for (const [pack, icons] of toEntries(iconsets)) {
      for (const [id, svg] of toEntries(icons)) {
        this.set(id, { pack, svg });
      }
    }
    this.refresh();
  }
  setMultiple(toset: IdIconMap) {
    for (const entry of toEntries(toset)) {
      super.set(...entry);
    }
    this.refresh();
    return this;
  }
  deleteMultiple(...ids: string[]) {
    for (const id of ids) {
      super.delete(id);
    }
    this.refresh();
  }
  set(id: string, info: IconInfo) {
    const result = super.set(id, info);
    this.refresh();
    return result;
  }
  delete(id: string) {
    const result = super.delete(id);
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

export const isIconPackRec = (obj: any): obj is IdIconMap => {
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
