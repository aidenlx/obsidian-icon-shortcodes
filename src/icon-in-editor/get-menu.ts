import { EditorView } from "@codemirror/view";
import { Menu } from "obsidian";

import IconSC from "../isc-main";

const getMenu = (
  start: number,
  end: number,
  plugin: IconSC,
  view: EditorView,
) => {
  return new Menu(plugin.app)
    .addItem((item) =>
      item
        .setIcon("image-glyph")
        .setTitle("Change Icon")
        .onClick(async () => {
          const icon = await plugin.api.getIconFromUser();
          if (!icon) return;
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
          view.dispatch({
            changes: { from: start, to: end, insert: "" },
          });
        }),
    );
};
export default getMenu;
