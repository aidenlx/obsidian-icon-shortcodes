import "./browser-packs.less";

import assertNever from "assert-never";
import cls from "classnames";
import { Modal, requestUrl } from "obsidian";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  FiAward,
  FiDownload,
  FiExternalLink,
  FiHome,
  FiImage,
} from "react-icons/fi";

import IconSC from "../isc-main";
import Loading from "./loading";

export default class BrowserPacks extends Modal {
  constructor(public plugin: IconSC) {
    super(plugin.app);
    this.modalEl.addClass("mod-browser-packs");
  }
  onOpen(): void {
    ReactDOM.render(
      <BrowserPackView getIconPack={this.getIconPack.bind(this)} />,
      this.contentEl,
    );
  }
  onClose(): void {
    ReactDOM.unmountComponentAtNode(this.contentEl);
  }

  async getIconPack(path: string, branch?: string): Promise<boolean> {
    const url = `${getIconPackBundleUrl(path, branch)}?${Date.now()}`;
    try {
      const zip = (await requestUrl({ url })).arrayBuffer;
      await this.plugin.packManager.importIcons(
        { name: url.split("/").pop()!, data: zip },
        false,
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

const getIconPackBundleUrl = (path: string, branch = "master") =>
  `https://raw.githubusercontent.com/aidenlx/obsidian-icon-shortcodes/${branch}/${path}`;

interface IconPackManifestRaw {
  path: string;
  count: number;
  series: string;
  description: string;
  license: string;
  bundleName: string;
  packId: string;
  homepage: string;
  style: string;
}

type commonKeys = "series" | "description" | "homepage" | "license";
type StyleInfo = Omit<IconPackManifestRaw, commonKeys>;
type IconPackManifest = Pick<IconPackManifestRaw, commonKeys> &
  Record<"styles", StyleInfo[]> &
  Record<"count", number>;

const getManifestList = async (branch = "master"): Promise<IconPackManifest[]> => {
  const url = `https://raw.githubusercontent.com/aidenlx/obsidian-icon-shortcodes/${branch}/assets/manifest.json?${Date.now()}`,
    rawList = (await requestUrl({ url })).json as IconPackManifestRaw[];
  let list: IconPackManifest[] = [];
  for (const manifest of rawList) {
    let last = list.last();
    if (last?.series === manifest.series) {
      last.styles.push(manifest);
      last.count += manifest.count;
    } else {
      list.push({
        homepage: manifest.homepage,
        description: manifest.description,
        series: manifest.series,
        license: manifest.license,
        styles: [manifest],
        count: manifest.count,
      });
    }
  }
  return list;
};

const BrowserPackView = ({
  getIconPack,
}: {
  getIconPack: (path: string, branch?: string) => Promise<boolean>;
}) => {
  const [manifestList, setManifestList] = useState<
    IconPackManifest[] | null | Error
  >(null);
  useEffect(() => {
    getManifestList().then(setManifestList).catch(setManifestList);
  }, []);
  if (manifestList === null) {
    return (
      <div className="loading">
        <Loading type="spin" className="loading-indicator" />
        <div>Loading Icon Pack List...</div>
      </div>
    );
  } else if (Array.isArray(manifestList)) {
    return (
      <div className="icon-pack-list">
        {manifestList.map((manifest) => (
          <IconPackManifest
            key={manifest.homepage}
            manifest={manifest}
            onDownload={(path) => getIconPack(path)}
          />
        ))}
      </div>
    );
  } else {
    console.error(manifestList);
    return (
      <div className="error">
        Failed to Load Icon Pack List:
        <div className="mod-warning">
          {manifestList.message ?? manifestList.toString()}
        </div>
      </div>
    );
  }
};

interface ManifestErrorState {
  state: "error";
  error: unknown;
}
type ManifestState =
  | ManifestErrorState
  | Record<"state", "display" | "downloading" | "done">;

const PackManifestClass = "pack-manifest";
const IconPackManifest = ({
  manifest: { series, styles, description, count, homepage, license },
  onDownload,
}: {
  manifest: IconPackManifest;
  onDownload: (path: string) => Promise<boolean>;
}) => {
  const getSubClass = useCallback(
    (className: string) => `${PackManifestClass}-${className}`,
    [],
  );
  return (
    <div className={PackManifestClass}>
      <div className={getSubClass("title")}>{series}</div>
      <div className={getSubClass("details")}>
        <span
          className={getSubClass("license")}
          aria-label={"License: " + license}
        >
          <FiAward size="0.9em" />
        </span>
        <span
          className={getSubClass("count")}
          aria-label={`${count} icons in total`}
        >
          <FiImage size="0.9em" />
          <span className={"icon-text"}>{count}</span>
        </span>
      </div>
      <div className={getSubClass("desc")}>
        <div
          className={getSubClass("homepage")}
          aria-label={homepage}
          onClick={() => window.open(homepage)}
        >
          <FiHome />
          <a className={"icon-text"}>Home Page</a>
        </div>
        {description}
      </div>
      <div className="styles-list">
        {styles.map((style) => (
          <IconPackStyle
            key={style.bundleName}
            styleInfo={style}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
};

const StyleInfoClass = "style-info",
  getStyleInfoClass = (...classes: string[]) => cls(StyleInfoClass, ...classes);
const IconPackStyle = ({
  styleInfo: { count, packId, path, style },
  onDownload,
}: {
  styleInfo: StyleInfo;
  onDownload: (path: string) => Promise<boolean>;
}) => {
  const getSubClass = useCallback(
    (className: string) => `${StyleInfoClass}-${className}`,
    [],
  );
  const [state, setState] = useState<ManifestState>({ state: "display" });
  switch (state.state) {
    case "display":
      return (
        <div className={getStyleInfoClass()}>
          <div className={getSubClass("title")}>
            {style ? style : "regular"}
            <span
              className={getSubClass("pack-id")}
              aria-label="Pack id used as shortcode prefix"
            >
              {packId}
            </span>
          </div>

          <div className={getSubClass("details")}>
            <div
              className={getSubClass("count")}
              aria-label={`${count} icons in total`}
            >
              <FiImage size="0.9em" />
              <span className={"icon-text"}>{count}</span>
            </div>
          </div>
          <div className={getSubClass("button-container")}>
            <button
              className={getSubClass("download")}
              onClick={async () => {
                setState({ state: "downloading" });
                try {
                  setState({ state: "done" });
                  await onDownload(path);
                } catch (error) {
                  setState({ state: "error", error });
                }
              }}
              aria-label="Download"
            >
              <FiDownload />
            </button>
            <button
              aria-label="Download via Browser"
              onClick={() => window.open(getIconPackBundleUrl(path))}
            >
              <FiExternalLink />
            </button>
          </div>
        </div>
      );
    case "downloading":
      return (
        <div className={getStyleInfoClass("downloading")}>
          <Loading type="bubbles" className="loading-indicator" />
          <div>Downloading...</div>
        </div>
      );
    case "done":
      return <div className={getStyleInfoClass("done")}>Downloaded</div>;
    case "error":
      console.error(state.error);
      return (
        <div className={getStyleInfoClass("error")}>
          Failed to Download:
          <div className="mod-warning">
            {state.error instanceof Error
              ? state.error.message
              : (state.error as any)?.toString()}
          </div>
        </div>
      );
    default:
      assertNever(state);
  }
};
