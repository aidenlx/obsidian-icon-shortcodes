import "./icon-manager.less";

import { Modal, setIcon } from "obsidian";
import React, { createContext, useContext, useState } from "react";
import ReactDOM from "react-dom";

import PackManager from "../icon-packs/pack-manager";
import { IconId, SVGIconId } from "../icon-packs/types";
import IconSC from "../isc-main";
import IconPreview from "./icon-preview";

type icons = Record<"trash" | "pencil" | "star" | "checkmark", string>;
const getIcons = (): icons => {
  const tempEl = createDiv(),
    returns: Partial<icons> = {};
  for (const icon of ["trash", "pencil", "star", "checkmark"] as const) {
    tempEl.empty();
    setIcon(tempEl, icon, 14);
    returns[icon] = tempEl.innerHTML;
  }
  return returns as icons;
};

export const Context = createContext<{ packs: PackManager; icons: icons }>(
  null as any,
);

export default class IconManager extends Modal {
  constructor(public plugin: IconSC, public pack: string) {
    super(plugin.app);
    this.titleEl.setText(`${pack} Icons`);
    this.modalEl.addClasses(["isc-icon-manager", "mod-community-theme"]);
  }

  get ids() {
    return this.plugin.packManager.iconIds
      .filter(({ pack }) => pack === this.pack)
      .map(({ id }) => id);
  }

  async onOpen() {
    this.contentEl.empty();
    ReactDOM.render(
      <Context.Provider
        value={{ packs: this.plugin.packManager, icons: getIcons() }}
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
  const [filter, setFilter] = useState("");
  const [ids, setIds] = useState(
    packs.iconIds
      .filter(({ pack: p }) => p === pack)
      .sort(compareIconId) as SVGIconId[],
  );

  const handleIdChange = (...changes: { from: string; to: string | null }[]) =>
    setIds((prev: SVGIconId[]) => {
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
    });

  return (
    <>
      <div className="filter">
        <input
          type="text"
          placeholder="Filter"
          value={filter}
          onChange={(evt) => {
            setFilter(evt.target.value);
          }}
        />
      </div>
      <div className="icons">
        {ids.map((iconId) => (
          <IconPreview
            iconId={iconId}
            onIdChange={handleIdChange}
            key={iconId.id}
          />
        ))}
      </div>
    </>
  );
};
