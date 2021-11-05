// From https://github.com/rhysd/remark-emoji/blob/master/index.js

import emoji from "node-emoji";

import { fa, ri } from "../icons/index";

const icons = { ...fa, ...ri };

export const RE_SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;
export const RE_UNDERSTORE = /_/g;
const RE_DASH = /-/g;

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
