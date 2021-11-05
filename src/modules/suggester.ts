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
import { getIcon, isEmoji, RE_UNDERSTORE, Shortcodes } from "./icon";

const CLASS_ID = "alx-isc";

export default class EmojiSuggester extends EditorSuggest<FuzzyMatch<string>> {
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
    let searchResults = Shortcodes.reduce((results, key) => {
      const match = fuzzySearch(query, key);
      match && results.push({ item: key, match });
      return results;
    }, [] as FuzzyMatch<string>[]);
    sortSearchResults(searchResults);
    return searchResults;
  }

  renderSuggestion(suggestion: FuzzyMatch<string>, el: HTMLElement): void {
    const { item: key } = suggestion,
      icon = getIcon(key);
    if (!icon) throw new TypeError("Failed to get icon for key: " + key);

    el.createDiv({ cls: `shortcode` }).setText(key.replace(RE_UNDERSTORE, " "));
    el.createDiv({ cls: `emoji` }, (el) =>
      typeof icon === "string" ? (el.textContent = icon) : el.appendChild(icon),
    );
  }

  selectSuggestion(suggestion: FuzzyMatch<string>): void {
    if (!this.context) return;
    const { item: key } = suggestion;
    this.context.editor.replaceRange(
      this.plugin.settings.code2emoji && isEmoji(key)
        ? (getIcon(key) as string)
        : `:${key}:`,
      this.context.start,
      this.context.end,
    );
  }
}
