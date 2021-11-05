import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";

import IconSC from "../isc-main";
import { SCEmojiList } from "./emoji";

const CLASS_ID = "alx-isc";

type emojiRec = typeof SCEmojiList[0];

export default class EmojiSuggester extends EditorSuggest<emojiRec> {
  constructor(public plugin: IconSC) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    if (this.plugin.settings.suggester) {
      const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
      const match = sub.match(/(?::|：：)(\S+$)/);
      if (match) {
        return {
          end: cursor,
          start: {
            ch: match.index as number,
            line: cursor.line,
          },
          query: match[1],
        };
      }
    }
    return null;
  }

  getSuggestions(context: EditorSuggestContext) {
    return SCEmojiList.filter((p) => p[0].startsWith(context.query));
  }

  renderSuggestion(suggestion: emojiRec, el: HTMLElement): void {
    const [key, emoji] = suggestion;
    el.createDiv({ cls: `shortcode` }).setText(key);
    el.createDiv({ cls: `emoji` }).setText(emoji);
  }

  selectSuggestion(suggestion: emojiRec): void {
    if (!this.context) return;
    const [key, emoji] = suggestion;
    this.context.editor.replaceRange(
      this.plugin.settings.code2emoji ? emoji : `:${key}: `,
      this.context.start,
      this.context.end,
    );
  }
}
