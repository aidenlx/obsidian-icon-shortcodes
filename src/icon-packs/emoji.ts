import emoji from "node-emoji";

import type { EmojiIconData as EmojiIconDataType } from "./types";
import { getClsForIcon } from "./utils";

export default class EmojiIconData implements EmojiIconDataType {
  constructor(public name: string) {}
  public get id() {
    return this.name;
  }
  public get pack() {
    return "emoji" as const;
  }
  public get type() {
    return "emoji" as const;
  }
  public get char() {
    return emoji.get(this.name);
  }

  static getData(name: string) {
    if (emoji.hasEmoji(name)) {
      return new EmojiIconData(name);
    } else {
      return null;
    }
  }

  public getDOM(svg = true) {
    return createSpan({
      cls: [getClsForIcon(this), "isc-char-icon"],
      text: this.char,
    });
  }
}
