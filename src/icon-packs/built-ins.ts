import svg2uri from "mini-svg-data-uri";
import emojiByName from "node-emoji/lib/emoji.json";
import { setIcon } from "obsidian";

import { LucideIcon, ObsidianIcon } from "../icons";
import { BultiInIconData as BultiInIconDataType, IconInfo } from "./types";
import { getClsForIcon } from "./utils";

const kabobToSnake = (name: string) => name.replace(/-/g, "_");

const LucidePackName = "luc",
  ObsidianPackName = "obs";

export type SVGPacknames = typeof LucidePackName | typeof ObsidianPackName;

const removeBultiInIconAttrs = (el: HTMLElement) =>
  ["class", "height", "width"].forEach((k) =>
    el.firstElementChild?.removeAttribute(k),
  );
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
    removeBultiInIconAttrs(el);
    el.firstElementChild?.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return el.innerHTML;
  }
  public get dataUri() {
    return svg2uri(this.data);
  }
  public getDOM(svg: boolean): HTMLSpanElement {
    const el = createSpan({ cls: getClsForIcon(this) });
    if (svg) {
      el.addClass("isc-svg-icon");
      setIcon(
        el,
        (this.pack === LucidePackName ? "lucide-" : "") + this.obsidianId,
      );
      removeBultiInIconAttrs(el);
    } else {
      el.addClass("isc-img-icon");
      el.createEl("img", { attr: { src: this.dataUri } });
    }
    return el;
  }
}

const EMOJI_PACK_NAME = "emoji";
const getBuiltIns = (): {
  packs: ReadonlyMap<string, BultiInIconData>;
  ids: ReadonlyArray<IconInfo>;
  packnames: ReadonlyArray<string>;
} => {
  let packs = new Map<string, BultiInIconData>(),
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
