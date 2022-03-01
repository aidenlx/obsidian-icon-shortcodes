import svg2uri from "mini-svg-data-uri";
import emojiByName from "node-emoji/lib/emoji.json";
import { setIcon } from "obsidian";

import { LucideIcon, ObsidianIcon } from "../icons";
import { BultiInIconData as BultiInIconDataType, IconInfo } from "./types";

const kabobToSnake = (name: string) => name.replace(/-/g, "_");

const LucidePackName = "luc",
  ObsidianPackName = "obs";

export type SVGPacknames = typeof LucidePackName | typeof ObsidianPackName;

class BultiInIconData implements BultiInIconDataType {
  public type = "bulti-in" as const;
  public name: string;
  /** icon shortcode */
  public id: string;
  constructor(public pack: string, private obsidianId: string) {
    this.name = kabobToSnake(obsidianId);
    this.id = `${pack}_${this.name}`;
  }
  public get data() {
    const el = createDiv();
    setIcon(
      el,
      (this.pack === LucidePackName ? "lucide-" : "") + this.obsidianId,
    );
    ["class", "height", "width"].forEach((k) =>
      el.firstElementChild?.removeAttribute(k),
    );
    el.firstElementChild?.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return el.innerHTML;
  }
  public get dataUri() {
    return svg2uri(this.data);
  }
}

const EMOJI_PACK_NAME = "emoji";
const getBuiltIns = (): {
  packs: ReadonlyMap<string, BultiInIconDataType>;
  ids: ReadonlyArray<IconInfo>;
  packnames: ReadonlyArray<string>;
} => {
  let packs = new Map<string, BultiInIconDataType>(),
    ids = [] as IconInfo[],
    packnames = [] as string[];

  for (const [pack, icons] of [
    [ObsidianPackName, ObsidianIcon],
    [LucidePackName, LucideIcon],
  ] as const) {
    packnames.push(pack);
    for (const obsidianId of icons) {
      const icon = new BultiInIconData(pack, obsidianId);
      packs.set(icon.id, icon);
      ids.push(icon);
    }
  }
  packnames.push(EMOJI_PACK_NAME);
  for (const key of Object.keys(emojiByName)) {
    ids.push({ pack: EMOJI_PACK_NAME, id: key, name: key });
  }
  return { packs, ids, packnames };
};

const result = getBuiltIns();
export const BuiltInSVGIconPacks = result.packs;
export const BuiltInIconIds = result.ids;
export const BuiltInIconPacknames = result.packnames;
