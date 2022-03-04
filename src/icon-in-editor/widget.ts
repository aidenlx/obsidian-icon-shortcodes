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
    const icon = this.plugin.packManager.getIcon(this.id);
    let wrap = createSpan({
      cls: cls("cm-isc", {
        "cm-isc-emoji": typeof icon === "string",
        "cm-isc-img": icon instanceof HTMLImageElement,
      }),
      // attr: { "aria-hidden": "true" },
    });
    if (icon) {
      wrap.append(icon);
    } else {
      wrap.append(`:${this.id}:`);
    }
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
