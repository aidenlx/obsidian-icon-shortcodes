// From https://github.com/rhysd/remark-emoji/blob/master/index.js

import emoji from "node-emoji";

import * as iconsets from "../icons/index";

const icons = { ...iconsets.fa, ...iconsets.ri };
export const RE_PACK_PREFIX = new RegExp(
  `^(?:${[...Object.keys(iconsets)].join("|")})_`,
);

/**
 * @returns null if no icon pack is disabled
 */
export const getDisabledPackPrefix = (
  setting: Record<IconPackNames, boolean>,
): RegExp | null => {
  const names = [...Object.keys(iconsets)].filter(
    (name) => !setting[name as IconPackNames],
  );
  if (names.length === 0) return null;
  else return new RegExp(`^(?:${names.join("|")})_`);
};
export type IconPackNames = keyof typeof iconsets;

export const RE_SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;
export const RE_UNDERSTORE_DASH = /[-_]/g;

import emojiByName from "node-emoji/lib/emoji.json";

const IconSCs: string[] = [...Object.keys(icons)];
const EmojiSCs: string[] = [...Object.keys(emojiByName)];
export const Shortcodes = ([] as string[]).concat(IconSCs, EmojiSCs);

/**
 * @returns html or emoji text
 */
export const getIcon = (key: string): string | HTMLElement | null => {
  key = stripColons(key);
  const got = emoji.get(key);
  if (stripColons(got) !== key) return got;
  if (key in icons) {
    const src = icons[key as keyof typeof icons];
    return createEl(
      "span",
      { cls: "alx-isc-icon" },
      (el) => (el.innerHTML = src.trim()),
    );
  }
  return null;
};

export const isEmoji = (key: string): boolean => emoji.hasEmoji(key);

/**
 * Removes colons on either side
 * of the string if present
 * @param  {string} str
 * @return {string}
 */
const stripColons = (str: string): string => {
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
