import { EditorView } from "@codemirror/view";
import { DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";

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
        if (update.docChanged || update.viewportChanged)
          this.decorations = icons(update.view, this.plugin);
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );

export default buildIconPlugin;
