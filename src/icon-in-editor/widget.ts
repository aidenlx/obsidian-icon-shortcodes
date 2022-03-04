import type { EditorView, Rect } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import cls from "classnames";
import { Menu, Platform } from "obsidian";
import type IconSC from "../isc-main";

abstract class LPWidget extends WidgetType {
  start = -1;
  end = -1;
  menu?: Menu;
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
    let coord: Rect | null = null;

    if (start < 0 || end < 0) {
      try {
        var pos = view.posAtDOM(el);
        view.dispatch({ selection: { head: pos, anchor: pos } });
        view.focus();
        coord = view.coordsAtPos(pos);
      } catch (e) {}
    } else {
      if (Platform.isMobile) end = start;
      try {
        view.dispatch({ selection: { head: start, anchor: end } });
        view.focus();
        coord = view.coordsAtPos(start);
      } catch (e) {}
    }
    if (coord)
      this.menu?.showAtPosition({ ...coord, x: coord.left, y: coord.top });
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
    this.menu = new Menu(this.plugin.app)
      .addItem((item) =>
        item
          .setIcon("image-glyph")
          .setTitle("Change Icon")
          .onClick(async () => {
            const icon = await this.plugin.api.getIconFromUser();
            if (!icon) return;
            const { start, end } = this;
            view.dispatch({
              changes: { from: start, to: end, insert: `:${icon.id}:` },
            });
          }),
      )
      .addItem((item) =>
        item
          .setIcon("trash")
          .setTitle("Delete Icon")
          .onClick(() => {
            const { start, end } = this;
            view.dispatch({
              changes: { from: start, to: end, insert: "" },
            });
          }),
      );
    return wrap;
  }

  ignoreEvent() {
    return true;
  }
}
