import getMd5 from "md5";
import emojiByName from "node-emoji/lib/emoji.json";

import * as iconsets from "../icons/index";
import { IconId, IconInfo } from "./types";
import { ObjtoEntries } from "./utils";

export type SVGPacknames = keyof typeof iconsets;

const EMOJI_PACK_NAME = "emoji";
const getBuiltIns = (): {
  packs: ReadonlyMap<string, IconInfo>;
  ids: ReadonlyArray<IconId>;
  packnames: ReadonlyArray<string>;
} => {
  let packs = new Map<string, IconInfo>(),
    ids = [] as IconId[],
    packnames = [] as string[];
  for (const [pack, icons] of ObjtoEntries(iconsets)) {
    packnames.push(pack);
    for (const [id, svg] of ObjtoEntries(icons)) {
      const md5 = getMd5(svg);
      packs.set(id, { pack, svg, md5 });
      ids.push({ id, pack, md5 });
    }
  }
  packnames.push(EMOJI_PACK_NAME);
  for (const key of Object.keys(emojiByName)) {
    ids.push({ pack: EMOJI_PACK_NAME, id: key });
  }
  return { packs, ids, packnames };
};

const result = getBuiltIns();
export const SVGIconPacks = result.packs;
export const IconPacknames = result.packnames;
export const IconIds = result.ids;
