import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import cls from "classnames";

import type IconSC from "../isc-main";
export default class IconWidget extends WidgetType {
  constructor(public id: string, public plugin: IconSC) {
    super();
  }

  eq(other: IconWidget) {
    return other instanceof IconWidget && other.id === this.id;
  }

  toDOM(view: EditorView) {
    let wrap = createSpan({
      cls: "cm-isc-icon",
      attr: { "aria-label": this.id.replace(/_/g, " ") },
    });

    this.plugin.packManager.getSVGIcon(this.id).then((span) => {
      if (!span) {
        wrap.append(`:${this.id}:`);
      } else {
        span.classList.forEach((cls) => wrap.addClass(cls));
        wrap.replaceChildren(...span.childNodes);
      }
    });
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
