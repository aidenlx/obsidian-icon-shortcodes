import { syntaxTree } from "@codemirror/language";
import { EditorState, StateField } from "@codemirror/state";
import {
  Range,
  RangeSet,
  RangeSetBuilder,
  RangeValue,
} from "@codemirror/rangeset";
import {
  getGlobalRegexp,
  RE_SHORTCODE,
  stripColons,
} from "../icon-packs/utils";
import type IconSC from "../isc-main";
import type { NodeType } from "@lezer/common";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import UnionRanges from "../modules/union";

class ShortcodePos extends RangeValue {
  constructor(public text: string) {
    super();
  }
  get iconId(): string {
    return stripColons(this.text);
  }
  eq(other: RangeValue): boolean {
    return other instanceof ShortcodePos && other.text === this.text;
  }
}

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

const getShortcodePosField = (plugin: IconSC) => {
  const getShortcodeRanges = (
    state: EditorState,
    from: number,
    to: number,
    addToRangeArr: (from: number, to: number, value: ShortcodePos) => void,
  ) => {
    const saveRange = (from: number, to: number): void => {
      const text = state.doc.sliceString(from, to);
      if (!text.trim()) return;
      for (const { 0: rawCode, index: offset } of text.matchAll(
        getGlobalRegexp(RE_SHORTCODE),
      )) {
        if (plugin.packManager.hasIcon(stripColons(rawCode))) {
          addToRangeArr(
            from + offset!,
            from + offset! + rawCode.length,
            new ShortcodePos(rawCode),
          );
        }
      }
    };
    let prevTo = from;
    syntaxTree(state).iterate({
      from,
      to,
      enter: (type, from, to) => {
        if (type.name === "Document") return;
        if (from !== prevTo) saveRange(prevTo, from);
        prevTo = to;
        if (shouldNodeHaveIcon(type)) {
          saveRange(from, to);
        }
      },
    });
    if (prevTo !== to) saveRange(prevTo, to);
  };
  return StateField.define<RangeSet<ShortcodePos>>({
    create: (state) => {
      let rangeset = new RangeSetBuilder<ShortcodePos>();
      getShortcodeRanges(
        state,
        0,
        state.doc.length - 1,
        rangeset.add.bind(rangeset),
      );
      return rangeset.finish();
    },
    update: (rangeset, tr) => {
      if (!tr.docChanged) return rangeset;
      rangeset = rangeset.map(tr.changes);
      let changedLines: [lineStart: number, lineEnd: number][] = [];
      tr.changes.iterChangedRanges((_f, _t, from, to) => {
        // filter those that no longer a vaild shortcode
        rangeset = rangeset.update({
          filter: (from: number, to: number, value: ShortcodePos) => {
            const text = tr.state.sliceDoc(from, to);
            return text === value.text;
          },
          filterFrom: from,
          filterTo: to,
        });
        // include lines that have changed
        changedLines.push([
          tr.state.doc.lineAt(from).number,
          tr.state.doc.lineAt(to).number,
        ]);
      });
      let newShortcodeRanges: Range<ShortcodePos>[] = [];
      for (const [start, end] of UnionRanges(changedLines)) {
        for (let l = start; l <= end; l++) {
          getShortcodeRanges(
            tr.state,
            tr.state.doc.line(l).from,
            tr.state.doc.line(l).to,
            (from, to, value) => {
              newShortcodeRanges.push(value.range(from, to));
            },
          );
        }
      }
      rangeset = rangeset.update({ add: newShortcodeRanges });
      return rangeset;
    },
  });
};
export type ShortcodePosField = StateField<RangeSet<ShortcodePos>>;

export default getShortcodePosField;