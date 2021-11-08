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
  getIcon(id: string): string | HTMLSpanElement | null {
    let info;
    if (emoji.hasEmoji(id)) return emoji.get(id);
    else if ((info = this.get(id))) {
      const { svg } = info;
      return createEl("img", {
        cls: "alx-isc-icon",
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
  private refresh(save = true): void {
    this._iconIds.length = 0;
    this._iconPacks.clear();
    for (const id of Object.keys(emojiByName)) {
      this._iconIds.push({ pack: "emoji", id });
    }
    for (const [id, { pack }] of this) {
      this._iconIds.push({ pack, id });
      this._iconPacks.add(pack);
    }
    if (save) this.plugin.saveCustomIcons();
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
  addFromFiles(pack: string, icons: { name: string; svg: string }[]) {
    if (builtInPacks.includes(pack)) {
      console.error("failed to add pack: pack name %s reserved", pack);
      return;
    }
    let addedIds = [] as string[];
    for (const { name, svg } of icons) {
      const id = `${pack}_${name}`;
      if (this.has(id))
        console.warn("icon id %s already exists, overriding...", id);
      super.set(id, { pack, svg });
      addedIds.push(id);
    }
    this.refresh();
    return addedIds;
  }
  setMultiple(toset: IdIconMap | EntriesFromRecord<IdIconMap>) {
    const entries = Array.isArray(toset) ? toset : toEntries(toset);
    for (const entry of entries) {
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

export const getIconInfoFromId = (id: string, svg: string): IconInfo | null => {
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
  svg = svg.trim();
  if (svg.startsWith("<svg")) {
    return { pack, svg };
  } else {
    console.error("invalild svg given in icon %s: %o", id, svg);
    return null;
  }
};
