import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import cls from "classnames";
import { Platform } from "obsidian";

import type IconSC from "../isc-main";

abstract class LPWidget extends WidgetType {
  start = -1;
  end = -1;
  setPos(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
  hookClickHandler(view: EditorView, el: HTMLElement) {
    el.addEventListener("click", (evt) => {
      evt.defaultPrevented ||
        (this.selectElement(view, el), evt.preventDefault());
    });
  }
  // addEditButton(e, t) {
  //   var n = this,
  //     i = t.createDiv("edit-block-button");
  //   Xy(i, Ov),
  //     nn(i, "Edit this block"),
  //     i.addEventListener("click", function () {
  //       n.selectElement(e, t);
  //     });
  // }
  selectElement(view: EditorView, el: HTMLElement) {
    let { start, end } = this;
    if (start < 0 || end < 0) {
      try {
        var pos = view.posAtDOM(el);
        view.dispatch({ selection: { head: pos, anchor: pos } });
        view.focus();
      } catch (e) {}
    } else {
      if (Platform.isMobile) end = start;
      try {
        view.dispatch({ selection: { head: start, anchor: end } });
        view.focus();
      } catch (e) {}
    }
  }
  // resizeWidget(e, t) {
  //   XB &&
  //     new XB(function () {
  //       return e.requestMeasure();
  //     }).observe(t, { box: "border-box" });
  // }
}
export default class IconWidget extends LPWidget {
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
    this.hookClickHandler(view, wrap);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
