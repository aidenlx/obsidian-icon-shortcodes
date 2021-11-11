import "./icon-manager.less";

import { Modal, setIcon } from "obsidian";
import React, { createContext, useContext, useState } from "react";
import ReactDOM from "react-dom";

import IconSC from "../isc-main";
import IconPacks, { IconId, SVGIconId } from "./icon-packs";
import IconPreview from "./icon-preview";

type icons = Record<"trash" | "pencil" | "star", string>;
const getIcons = (): icons => {
  const tempEl = createDiv(),
    returns: Partial<icons> = {};
  for (const icon of ["trash", "pencil", "star"] as const) {
    tempEl.empty();
    setIcon(tempEl, icon, 14);
    returns[icon] = tempEl.innerHTML;
  }
  return returns as icons;
};

export const Context = createContext<{ packs: IconPacks; icons: icons }>(
  null as any,
);

export default class IconManager extends Modal {
  constructor(public plugin: IconSC, public pack: string) {
    super(plugin.app);
    this.titleEl.setText(`${pack} Icons`);
    this.modalEl.addClasses(["isc-icon-manager", "mod-community-theme"]);
  }

  get ids() {
    return this.plugin.iconPacks.iconIds
      .filter(({ pack }) => pack === this.pack)
      .map(({ id }) => id);
  }

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("icons");
    ReactDOM.render(
      <Context.Provider
        value={{ packs: this.plugin.iconPacks, icons: getIcons() }}
      >
        <Icons pack={this.pack} />
      </Context.Provider>,
      this.contentEl,
    );
  }
  onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
  }
}

const compareIconId = (a: IconId, b: IconId): number =>
  a.id.localeCompare(b.id);
const Icons = ({ pack }: { pack: string }) => {
  if (pack === "emoji") throw new TypeError("Emoji not supported");

  const { packs } = useContext(Context);
  const [ids, setIds] = useState(
    packs.iconIds
      .filter(({ pack: p }) => p === pack)
      .sort(compareIconId) as SVGIconId[],
  );
  return (
    <>
      {ids.map((iconId) => (
        <IconPreview
          iconId={iconId}
          onIdChange={(...changes) =>
            setIds((prev) => {
              for (const { from, to } of changes) {
                const i = prev.findIndex((val) => val.id === from);
                if (i < 0) {
                  console.error("%s icon not found", from, from);
                  continue;
                }
                if (to) {
                  prev[i].id = to;
                } else {
                  prev.splice(i, 1);
                }
              }
              return prev.concat().sort(compareIconId);
            })
          }
          key={iconId.id}
        />
      ))}
    </>
  );
};
