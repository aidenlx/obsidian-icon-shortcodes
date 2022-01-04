import svg2uri from "mini-svg-data-uri";
import emojiByName from "node-emoji/lib/emoji.json";

import * as iconsets from "../icons/index";
import { BultiInIconData, IconInfo } from "./types";
import { ObjtoEntries } from "./utils";

export type SVGPacknames = keyof typeof iconsets;

const EMOJI_PACK_NAME = "emoji";
const getBuiltIns = (): {
  packs: ReadonlyMap<string, BultiInIconData>;
  ids: ReadonlyArray<IconInfo>;
  packnames: ReadonlyArray<string>;
} => {
  let packs = new Map<string, BultiInIconData>(),
    ids = [] as IconInfo[],
    packnames = [] as string[];
  for (const [pack, icons] of ObjtoEntries(iconsets)) {
    packnames.push(pack);
    for (const [id, svg] of ObjtoEntries(icons as Record<string, string>)) {
      const name = id.substring(pack.length + 1);
      packs.set(id, { pack, data: svg, dataUri: svg2uri(svg), name });
      ids.push({ id, pack, name });
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
