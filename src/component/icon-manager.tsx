import "./icon-manager.less";

import { Modal, setIcon } from "obsidian";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactDOM from "react-dom";

import PackManager from "../icon-packs/pack-manager";
import { FuzzyMatch, IconId, SVGIconId } from "../icon-packs/types";
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

const compareIconId = (a: FuzzyMatch<IconId>, b: FuzzyMatch<IconId>): number =>
  a.item.name.localeCompare(b.item.name);
const Icons = ({ pack }: { pack: string }) => {
  if (pack === "emoji") throw new TypeError("Emoji not supported");

  const { packs } = useContext(Context);
  const [filter, setFilter] = useState("");
  const [changed, setChanged] = useState(0);
  const ids = useMemo(
    () => {
      const arr = packs.search(filter ? filter.trim().split(" ") : [], [pack]);
      if (filter) return arr;
      else return arr.sort(compareIconId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, pack, changed],
  );
  useEffect(() => {
    const handler = () => setChanged((prev) => prev + 1);
    packs.on("changed", handler);
    return () => packs.off("changed", handler);
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
        {ids.map((fuzzy) => (
          <IconPreview
            iconId={fuzzy.item as SVGIconId}
            key={fuzzy.item.id + (fuzzy.item.md5 ?? "")}
          />
        ))}
      </div>
    </>
  );
};
