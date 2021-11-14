import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
} from "obsidian";

import { FuzzyMatch, IconId } from "../icon-packs/types";
import IconSC from "../isc-main";

const CLASS_ID = "isc";

export default class EmojiSuggester extends EditorSuggest<FuzzyMatch<IconId>> {
  constructor(public plugin: IconSC) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
  }

  get packManager() {
    return this.plugin.packManager;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    if (!this.plugin.settings.suggester) return null;
    const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
    const match = sub.match(/(?::|：：)([^:\s]+$)/);
    if (!match) return null;
    const prevSC = (match.input as string)
      .substring(0, match.index)
      .match(/:([^\s:]+$)/);
    if (prevSC && this.packManager.hasIcon(prevSC[1])) return null;
    return {
      end: cursor,
      start: {
        ch: match.index as number,
        line: cursor.line,
      },
      query: match[1],
    };
  }

  getSuggestions(context: EditorSuggestContext) {
    return this.packManager
      .search(context.query.replace(/^\+|\+$/g, "").split(/[+]/g))
      .slice(0, 20);
  }

  renderSuggestion(suggestion: FuzzyMatch<IconId>, el: HTMLElement): void {
    const { id, name } = suggestion.item,
      result = this.packManager.getIcon(id);
    if (!result) throw new TypeError("Failed to get icon for key: " + id);

    const icon = result;
    el.createDiv({ cls: `shortcode` }).setText(name.replace(/[_-]/g, " "));
    el.createDiv({ cls: `icon` }, (el) =>
      typeof icon === "string" ? (el.textContent = icon) : el.appendChild(icon),
    );
  }

  selectSuggestion(suggestion: FuzzyMatch<IconId>): void {
    if (!this.context) return;
    const { id, pack } = suggestion.item;
    this.context.editor.replaceRange(
      this.plugin.settings.code2emoji && pack === "emoji"
        ? (this.packManager.getIcon(id) as string)
        : `:${id}:`,
      this.context.start,
      this.context.end,
    );
  }
}
