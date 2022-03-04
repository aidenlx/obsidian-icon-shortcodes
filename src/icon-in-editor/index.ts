import { editorLivePreviewField } from "obsidian";
import { ViewPlugin, EditorView, Decoration } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";

import type IconSC from "../isc-main";
import icons from "./deco";

const buildIconPlugin = (plugin: IconSC) =>
  ViewPlugin.fromClass(
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
      decorations: (v) => v.decorations,
    },
  );

export default buildIconPlugin;
