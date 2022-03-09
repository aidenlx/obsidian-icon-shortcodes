import "./icon-manager.less";

import { enableMapSet } from "immer";
import { Modal, setIcon } from "obsidian";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { useImmer } from "use-immer";

import PackManager from "../icon-packs/pack-manager";
import { FileIconInfo, IconInfo } from "../icon-packs/types";
import IconSC from "../isc-main";
import IconPreview from "./icon-preview";

enableMapSet();

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

const ALL_UPDATE_KEY = "%ALL%";

export default class IconManager extends Modal {
  constructor(public plugin: IconSC, public pack: string) {
    super(plugin.app);
    this.titleEl.setText(`${pack} Icons`);
    this.modalEl.addClasses(["isc-icon-manager", "mod-community-theme"]);
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
const compareIconId = (a: IconInfo, b: IconInfo): number =>
  a.name.localeCompare(b.name);
const Icons = ({ pack }: { pack: string }) => {
  if (pack === "emoji") throw new TypeError("Emoji not supported");

  const { packs } = useContext(Context);
  const [filter, setFilter] = useState("");
  const [affected, setAffected] = useImmer(new Map<string, number>());
  const ids = useMemo(
    () => {
      let arr = packs
        .search(filter ? filter.trim().split(" ") : [], [pack], Infinity)
        // add an updated property to force an icon update internally
        .map(({ item }) => item as FileIconInfo);
      if (!filter) arr.sort(compareIconId);
      return arr;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, pack, affected],
  );
  useEffect(() => {
    const eventRef = packs.on("changed", (_api, affected) =>
      setAffected((draft) => {
        if (affected)
          affected.forEach((id: string) =>
            draft.set(id, (draft.get(id) || 0) + 1),
          );
        else draft.set(ALL_UPDATE_KEY, (draft.get(ALL_UPDATE_KEY) || 0) + 1);
      }),
    );
    return () => packs.offref(eventRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packs]);

  return (
    <>
      <div className="filter">
        <input
          type="text"
          placeholder="Filter"
          value={filter}
          onChange={(evt) => setFilter(evt.target.value)}
        />
      </div>
      <div className="icons">
        {ids.map((item) => {
          const updated =
            (affected.get(item.id) ?? 0) + (affected.get(ALL_UPDATE_KEY) ?? 0);
          return (
            <IconPreview
              iconInfo={item}
              updated={updated}
              key={item.id + updated}
            />
          );
        })}
      </div>
    </>
  );
};
