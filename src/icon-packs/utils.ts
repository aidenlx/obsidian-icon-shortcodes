import md5 from "md5";
import emoji from "node-emoji";

import { SVGIconInfo } from "./types";

export type EntriesFromRecord<T> = [key: keyof T, value: T[keyof T]][];

export const ObjtoEntries = <T extends Object>(obj: T) =>
  Object.entries(obj) as EntriesFromRecord<T>;

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

export const PackPrefixPattern = /^([A-Za-z0-9]+?)_/;

export const getIconInfoFromId = (
  id: string,
  svg: string,
): SVGIconInfo | null => {
  const result = getPacknNameFromId(id);
  if (!result) return null;
  const { name, pack } = result;
  svg = svg.trim();
  return { pack, name, svg, md5: md5(svg) };
};
export const getPacknNameFromId = (
  id: string,
): { pack: string; name: string } | null => {
  if (emoji.hasEmoji(id)) return { pack: "emoji", name: id };
  const match = id.match(PackPrefixPattern);
  if (!match) {
    console.error("No vaild pack id found in: ", id);
    return null;
  }
  const [str, packname] = match;
  return { pack: packname, name: id.substring(str.length) };
};

export const sanitizeId = (id: string): string | null => {
  const result = getPacknNameFromId(id);
  if (!result) {
    console.log("failed to rename icon: id %s invalid", id);
    return null;
  }
  return `${result.pack}_${sanitizeName(result.name)}`;
};
export const sanitizeName = (name: string): string =>
  name.trim().replace(/[ -]+/g, "_").replace(/\s+/g, "").toLocaleLowerCase();
