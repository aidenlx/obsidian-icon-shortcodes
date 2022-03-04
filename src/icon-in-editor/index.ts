import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";

import type IconSC from "../isc-main";
import icons from "./deco";
import getMenu from "./get-menu";

const setupIconPlugin = (plugin: IconSC) => {
  const viewPlugin = ViewPlugin.fromClass(
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
          this.decorations = icons(update.view, this.plugin);
        }
      }
    },
    {
      eventHandlers: {
        mousedown: (evt, view) => {
          let target = evt.target as HTMLElement;
          if (
            target.matches("span.cm-isc") ||
            target.parentElement?.matches("span.cm-isc")
          ) {
            const from = view.posAtDOM(target),
              widget = view.plugin(viewPlugin)?.decorations.iter(from).value;
            if (!widget) return;
            const menu = getMenu(
              widget.spec.from,
              widget.spec.to,
              plugin,
              view,
            );
            wait(100).then(() => menu.showAtMouseEvent(evt));
          }
        },
      },
      decorations: (v) => v.decorations,
    },
  );
  plugin.registerEditorExtension(viewPlugin);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default setupIconPlugin;
