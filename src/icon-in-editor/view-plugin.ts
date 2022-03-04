import { DecorationSet, PluginField, ViewUpdate } from "@codemirror/view";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";

import type IconSC from "../isc-main";
import icons from "./deco";
import getMenu from "./get-menu";

const getIconLivePreviewPlugin = (plugin: IconSC) => {
  class IconPlugin {
    decorations: DecorationSet;
    plugin: IconSC;

    constructor(view: EditorView) {
      this.plugin = plugin;
      this.decorations = icons(view, this.plugin);
    }

    update(update: ViewUpdate) {
      const prevMode = update.startState.field(editorLivePreviewField),
        currMode = update.state.field(editorLivePreviewField);
      if (
        update.docChanged ||
        update.viewportChanged ||
        prevMode !== currMode
      ) {
        this.decorations = icons(update.view, plugin);
      }
    }
  }

  return ViewPlugin.fromClass(IconPlugin, {
    eventHandlers: {
      mousedown: IconClickHandler,
    },
    decorations: (v) => v.decorations,
    provide: PluginField.atomicRanges.from((v) => v.decorations),
  });
  /* eslint-disable prefer-arrow/prefer-arrow-functions */
  function IconClickHandler(
    this: IconPlugin,
    evt: MouseEvent,
    view: EditorView,
  ) {
    let target = evt.target as HTMLElement;
    if (
      target.matches("span.cm-isc") ||
      target.parentElement?.matches("span.cm-isc")
    ) {
      const elFrom = view.posAtDOM(target);
      let anchor: number = -1,
        head: number = -1;
      this.decorations.between(elFrom - 1, elFrom + 1, (from, to, value) => {
        if (elFrom >= from && elFrom <= to) {
          (anchor = from), (head = to);
          return;
        }
      });
      if (anchor < 0 || head < 0) {
        console.error("no range found for", target);
        return;
      }
      wait(0).then(() => view.dispatch({ selection: { anchor, head } }));
      if (evt.button === 0 || evt.button === 1) {
        const menu = getMenu(anchor, head, plugin, view);
        wait(100).then(() => menu.showAtMouseEvent(evt));
      }
    }
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export default getIconLivePreviewPlugin;
