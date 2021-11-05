// From https://github.com/rhysd/remark-emoji/blob/master/index.js

import emoji from "node-emoji";

import { fa, ri } from "../icons/index";

const icons = { ...fa, ...ri };

export const RE_SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;
export const RE_UNDERSTORE = /_/g;
const RE_DASH = /-/g;

import emojiByName from "node-emoji/lib/emoji.json";

const IconSCs: string[] = [...Object.keys(icons)];
const EmojiSCs: string[] = ([...Object.keys(emojiByName)] as string[]).map(
  (key) => {
    if (key.startsWith("man-")) {
      return `${key.substring(4).replace(RE_DASH, "_")}_man`;
    } else if (key.startsWith("woman-")) {
      return `${key.substring(6).replace(RE_DASH, "_")}_woman`;
    } else return key;
  },
);
export const Shortcodes = ([] as string[]).concat(IconSCs, EmojiSCs);

/** Workaround for #19. :man-*: and :woman-*: are now :*_man: and :*_woman: on GitHub. node-emoji
 * does not support the new short codes. Convert new to old.
 * TODO: Remove this workaround when this PR is merged and shipped: https://github.com/omnidan/node-emoji/pull/112
 */
const patch = (matchKey: string, gotEmoji: string) => {
  if (matchKey.endsWith("_man:") && gotEmoji === matchKey) {
    // :foo_bar_man: -> man-foo-bar
    const old = "man-" + matchKey.slice(1, -5).replace(RE_UNDERSTORE, "-");
    const s = emoji.get(old);
    if (s !== old) {
      gotEmoji = s;
    }
  } else if (matchKey.endsWith("_woman:") && gotEmoji === matchKey) {
    // :foo_bar_woman: -> woman-foo-bar
    const old = "woman-" + matchKey.slice(1, -7).replace(RE_UNDERSTORE, "-");
    const s = emoji.get(old);
    if (s !== old) {
      gotEmoji = s;
    }
  }
  return gotEmoji;
};

/**
 * @returns html or emoji text
 */
export const getIcon = (key: string): string | HTMLElement | null => {
  key = stripColons(key);
  const got = patch(key, emoji.get(key));
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

export const isEmoji = (key: string): boolean => {
  let result = emoji.hasEmoji(key);
  if (result) return true;
  if (key.endsWith("_man:")) {
    // :foo_bar_man: -> man-foo-bar
    const old = "man-" + key.slice(1, -5).replace(RE_UNDERSTORE, "-");
    return emoji.hasEmoji(old);
  } else if (key.endsWith("_woman:")) {
    // :foo_bar_woman: -> woman-foo-bar
    const old = "woman-" + key.slice(1, -7).replace(RE_UNDERSTORE, "-");
    return emoji.hasEmoji(old);
  } else return false;
};

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
