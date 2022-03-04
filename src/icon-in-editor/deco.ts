import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";

import type IconSC from "../isc-main";
import IconWidget from "./widget";

const icons = (view: EditorView, plugin: IconSC) => {
  let ranges: [iconId: string, from: number, to: number][] = [];
  const SCInfo = view.state.field(plugin.shortcodePosField);
  for (let { from, to } of view.visibleRanges) {
    SCInfo.between(from, to, (from, to, { iconId }) => {
      ranges.push([iconId, from, to]);
    });
  }
  return Decoration.set(
    ranges.map(([iconId, from, to]) => {
      const widget = new IconWidget(iconId, plugin);
      widget.setPos(from, to);
      const spec = { widget, side: -1, from, to };
      if (view.state.field(editorLivePreviewField)) {
        return Decoration.replace(spec).range(from, to);
      } else {
        return Decoration.widget(spec).range(to);
      }
    }),
  );
};

export default icons;
