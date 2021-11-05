import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  FuzzyMatch,
  fuzzySearch,
  prepareQuery,
  sortSearchResults,
} from "obsidian";

import IconSC from "../isc-main";
import { EmojiRec, RE_UNDERSTORE, SCEmojiList } from "./emoji";

const CLASS_ID = "alx-isc";

export default class EmojiSuggester extends EditorSuggest<
  FuzzyMatch<EmojiRec>
> {
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
    const query = prepareQuery(context.query);
    let searchResults = SCEmojiList.reduce((results, rec) => {
      const [key] = rec,
        match = fuzzySearch(query, key);
      match && results.push({ item: rec, match });
      return results;
    }, [] as FuzzyMatch<EmojiRec>[]);
    sortSearchResults(searchResults);
    return searchResults;
  }

  renderSuggestion(suggestion: FuzzyMatch<EmojiRec>, el: HTMLElement): void {
    const [key, emoji] = suggestion.item;
    el.createDiv({ cls: `shortcode` }).setText(key.replace(RE_UNDERSTORE, " "));
    el.createDiv({ cls: `emoji` }).setText(emoji);
  }

  selectSuggestion(suggestion: FuzzyMatch<EmojiRec>): void {
    if (!this.context) return;
    const [key, emoji] = suggestion.item;
    this.context.editor.replaceRange(
      this.plugin.settings.code2emoji ? emoji : `:${key}: `,
      this.context.start,
      this.context.end,
    );
  }
}
