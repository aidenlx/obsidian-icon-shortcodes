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
import { IconRec } from "./icon-packs";

const CLASS_ID = "alx-isc";

export default class EmojiSuggester extends EditorSuggest<FuzzyMatch<IconRec>> {
  constructor(public plugin: IconSC) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
  }

  get iconPacks() {
    return this.plugin.iconPacks;
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
    let searchResults = this.iconPacks.iconIds.reduce((results, rec) => {
      if (this.iconPacks.isEnabled(rec)) {
        const match = fuzzySearch(query, rec.id);
        match && results.push({ item: rec, match });
      }
      return results;
    }, [] as FuzzyMatch<IconRec>[]);
    sortSearchResults(searchResults);
    return searchResults;
  }

  renderSuggestion(suggestion: FuzzyMatch<IconRec>, el: HTMLElement): void {
    const { id } = suggestion.item,
      result = this.iconPacks.getIcon(id);
    if (!result) throw new TypeError("Failed to get icon for key: " + id);

    const icon = result;
    el.createDiv({ cls: `shortcode` }).setText(
      this.iconPacks.getNameFromId(id) as string,
    );
    el.createDiv({ cls: `icon` }, (el) =>
      typeof icon === "string" ? (el.textContent = icon) : el.appendChild(icon),
    );
  }

  selectSuggestion(suggestion: FuzzyMatch<IconRec>): void {
    if (!this.context) return;
    const { id, pack } = suggestion.item;
    this.context.editor.replaceRange(
      this.plugin.settings.code2emoji && pack === "emoji"
        ? (this.iconPacks.getIcon(id) as string)
        : `:${id}:`,
      this.context.start,
      this.context.end,
    );
  }
}
