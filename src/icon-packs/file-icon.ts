import { FileSystemAdapter } from "obsidian";
import IconSC from "../isc-main";
import { FileIconData as FileIconDataType } from "./types";
import { extname } from "path";

import { getClsForIcon, getPacknNameFromId } from "./utils";

export default class FileIconData implements FileIconDataType {
  static getData(
    id: string,
    path: string,
    plugin: IconSC,
  ): FileIconData | null {
    const result = getPacknNameFromId(id);
    if (!result || result.pack === "emoji") return null;
    return new FileIconData(id, result.name, result.pack, path, plugin);
  }

  public get type() {
    return "file" as const;
  }
  public path: string;
  constructor(
    private _id: string,
    private _name: string,
    private _pack: string,
    path: string,
    private plugin: IconSC,
  ) {
    this.path = path.trim();
  }
  private get vault() {
    return this.plugin.app.vault;
  }

  public get id() {
    return this._id;
  }
  public get pack() {
    return this._pack;
  }
  public get name() {
    return this._name;
  }
  public get ext() {
    return extname(this.path);
  }
  public get fsPath() {
    if (this.vault.adapter instanceof FileSystemAdapter) {
      return this.vault.adapter.getFullPath(this.path);
    } else return null;
  }
  public get resourcePath() {
    return this.vault.adapter.getResourcePath(this.path);
  }

  public get isSVG() {
    return this.ext === ".svg";
  }
  public getDOM(svg: true): Promise<HTMLSpanElement>;
  public getDOM(svg: false): HTMLSpanElement;
  public getDOM(svg = true): Promise<HTMLSpanElement> | HTMLSpanElement {
    const el = createSpan({ cls: getClsForIcon(this) });
    if (svg && this.isSVG) {
      el.addClass("isc-svg-icon");
      return (async () => {
        const svgEl = await this.plugin.fileIconCache.getIcon(this.path);
        if (svgEl) {
          this.fixFillColor(svgEl);
          el.append(svgEl);
        } else {
          console.error("failed to get icon data for", this.path);
        }
        return el;
      })();
    } else {
      el.addClass("isc-img-icon");
      el.createEl("img", { attr: { src: this.resourcePath } });
      return el;
    }
  }

  fixFillColor(svg: SVGElement): void {
    if (!packToPatch.includes(this.pack)) return;
    for (const pathEl of svg.getElementsByTagName("path")) {
      if (!pathEl.hasAttribute("fill")) {
        pathEl.setAttribute("fill", "currentColor");
      }
    }
  }
}
const packToPatch = ["fab", "far", "fas", "rif", "ril"];
