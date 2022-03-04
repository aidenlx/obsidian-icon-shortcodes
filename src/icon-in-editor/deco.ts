import { syntaxTree } from "@codemirror/language";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
import type { NodeType } from "@lezer/common";
import { editorLivePreviewField } from "obsidian";

import {
  getGlobalRegexp,
  RE_SHORTCODE,
  stripColons,
} from "../icon-packs/utils";
import type IconSC from "../isc-main";
import IconWidget from "./widget";

const allowedTypes = [
  "link-alias",
  "comment",
  "header",
  "strong",
  "em",
  "strikethrough",
  "quote",
  "link",
  "list-1",
  "list-2",
  "list-3",
  "highlight",
  "hmd-footref2",
  "footref",
];
const excludeTypes = ["formatting", "comment-start", "comment-end"];
const shouldNodeHaveIcon = (type: NodeType) => {
  const nodeProps = type.prop(tokenClassNodeProp);
  if (!nodeProps) return false;
  const props = new Set(nodeProps?.split(" "));
  return (
    excludeTypes.every((t) => !props.has(t)) &&
    allowedTypes.some((t) => props.has(t))
  );
};

const icons = (view: EditorView, plugin: IconSC) => {
  let ranges: [code: string, from: number, to: number][] = [];
  const getShortcodeRange = (from: number, to: number): void => {
    const text = view.state.doc.sliceString(from, to);
    if (!text.trim()) return;
    for (const match of text.matchAll(getGlobalRegexp(RE_SHORTCODE))) {
      const code = stripColons(match[0]);
      if (plugin.packManager.hasIcon(code)) {
        ranges.push([
          code,
          from + match.index!,
          from + match.index! + match[0].length,
        ]);
      }
    }
  };
  for (let { from, to } of view.visibleRanges) {
    let prevTo = from;
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (type, from, to) => {
        if (from !== prevTo) getShortcodeRange(prevTo, from);
        prevTo = to;
        if (shouldNodeHaveIcon(type)) {
          getShortcodeRange(from, to);
        }
      },
    });
    if (prevTo !== to) getShortcodeRange(prevTo, from);
  }
  return Decoration.set(
    ranges.map(([code, from, to]) => {
      const widget = new IconWidget(code, plugin);
      widget.setPos(from, to);
      if (view.state.field(editorLivePreviewField)) {
        return Decoration.replace({ widget, side: 1 }).range(from, to);
      } else {
        return Decoration.widget({ widget, side: 1 }).range(to);
      }
    }),
  );
};

export default icons;
