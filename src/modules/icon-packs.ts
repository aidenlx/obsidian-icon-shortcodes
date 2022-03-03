import { requestUrl } from "obsidian";

export const getIconPackBundleUrl = (
  path: string,
  branch = "master",
  alt = false,
) =>
  `https://${
    alt ? "raw.staticdn.net" : "raw.githubusercontent.com"
  }/aidenlx/obsidian-icon-shortcodes/${branch}/${path}`;

export interface IconPackManifestRaw {
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

export class GitHubError extends Error {
  constructor(public response: { message: string }) {
    super("GitHub: " + response.message);
  }
}

export const getManifestViaAPI = async (branch = "master") => {
  const url = `https://api.github.com/repos/aidenlx/obsidian-icon-shortcodes/git/trees/${branch}?recursive=1&${Date.now()}`;
  const response = (await requestUrl({ url })).json;
  if (Array.isArray(response.tree)) {
    const manifestUrl = response.tree.find(
      (item: any) => item.path === "assets/manifest.json",
    )?.url;
    if (!manifestUrl) {
      console.error(response);
      throw new Error("No manifest.json for icon pack found");
    } else {
      return await getJSONfromBlobUrl(manifestUrl);
    }
  } else {
    throw new GitHubError(response);
  }
};

const getJSONfromBlobUrl = async (
  manifestUrl: string,
): Promise<IconPackManifestRaw[]> => {
  const response = (await requestUrl({ url: manifestUrl })).json;
  if (response.encoding && response.content) {
    if (response.encoding === "base64") {
      return JSON.parse(window.atob(response.content)) as IconPackManifestRaw[];
    } else {
      console.error(response);
      throw new TypeError("Unsupported encoding");
    }
  } else {
    throw new GitHubError(response);
  }
};
