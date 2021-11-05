// From https://github.com/rhysd/remark-emoji/blob/master/index.js

import emoji from "node-emoji";

export const RE_SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;
const RE_UNDERSTORE = /_/g;
const RE_DASH = /-/g;

import emojiByName from "node-emoji/lib/emoji.json";

export const SCEmojiList = (
  [...Object.entries(emojiByName)] as [key: string, emoji: string][]
).map((entry) => {
  const [key, emoji] = entry;
  if (key.startsWith("man-")) {
    return [`${key.substring(4).replace(RE_DASH, "_")}_man`, emoji];
  } else if (key.startsWith("woman-")) {
    return [`${key.substring(6).replace(RE_DASH, "_")}_woman`, emoji];
  } else return entry;
});

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
 * padSpaceAfter:
 * Setting to true means that an extra whitespace is added after emoji.
 * This is useful when browser handle emojis with half character length
 * and following character is hidden. Default value is false.
 */
const pad = false;

/**
 * @returns html or emoji text
 */
export const getEmoji = (key: string) => {
  let got = emoji.get(key);
  got = patch(key, got);
  if (pad && got !== key) {
    return got + " ";
  }
  return got;
};
