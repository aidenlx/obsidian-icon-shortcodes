import getMd5 from "md5";
import emojiByName from "node-emoji/lib/emoji.json";

import * as iconsets from "../icons/index";
import { IconId, SVGIconInfo } from "./types";
import { ObjtoEntries } from "./utils";

export type SVGPacknames = keyof typeof iconsets;

const EMOJI_PACK_NAME = "emoji";
const getBuiltIns = (): {
  packs: ReadonlyMap<string, SVGIconInfo>;
  ids: ReadonlyArray<IconId>;
  packnames: ReadonlyArray<string>;
} => {
  let packs = new Map<string, SVGIconInfo>(),
    ids = [] as IconId[],
    packnames = [] as string[];
  for (const [pack, icons] of ObjtoEntries(iconsets)) {
    packnames.push(pack);
    for (const [id, svg] of ObjtoEntries(icons as Record<string, string>)) {
      const md5 = getMd5(svg),
        name = id.substring(pack.length + 1);
      packs.set(id, { pack, svg, md5, name });
      ids.push({ id, pack, md5, name });
    }
  }
  packnames.push(EMOJI_PACK_NAME);
  for (const key of Object.keys(emojiByName)) {
    ids.push({ pack: EMOJI_PACK_NAME, id: key, name: key });
  }
  return { packs, ids, packnames };
};

const result = getBuiltIns();
export const SVGIconPacks = result.packs;
export const IconIds = result.ids;
export const IconPacknames = result.packnames;
