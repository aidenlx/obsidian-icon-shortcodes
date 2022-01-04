import { extension, lookup } from "mime-types";
import emoji from "node-emoji";
import { extname } from "path";

import { FileIconInfo } from "./types";

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
      str = str.substring(colonIndex + 1);
      return stripColons(str);
    }
  }

  return str;
};

export const PackPrefixPattern = /^([A-Za-z0-9]+?)_/;

export const getIconInfoFromId = (
  id: string,
  path: string,
): FileIconInfo | null => {
  const result = getPacknNameFromId(id);
  if (!result) return null;
  const { name, pack } = result;
  path = path.trim();
  return {
    id,
    pack,
    name,
    path,
    ext: extname(path),
  };
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

export const SupportedIconExt = [
  ".bmp",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
] as const;
export const iconFilePattern = /^[\w-]+\.(?:bmp|png|jpg|jpeg|gif|svg|webp)$/;
export const extPattern = /\.(?:bmp|png|jpg|jpeg|gif|svg|webp)$/;
const mimes = SupportedIconExt.map((ext) => lookup(ext));
export const getIconsFromFileList = async (
  list: FileList | null | undefined,
): Promise<{ name: string; ext: string; data: ArrayBuffer }[] | null> => {
  if (!list || list.length <= 0) return null;
  const getIcon = async (file: File) => ({
    name: file.name.replace(extPattern, ""),
    ext: "." + (extension(file.type) as string),
    data: await file.arrayBuffer(),
  });
  let promises = [] as ReturnType<typeof getIcon>[];
  for (let i = 0; i < list.length; i++) {
    const file = list[i];
    if (mimes.includes(file.type)) {
      promises.push(getIcon(file));
    }
  }
  const result = await Promise.all(promises);
  return result.length > 0 ? result : null;
};
