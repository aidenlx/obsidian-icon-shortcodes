import { requestUrl } from "obsidian";

const getManifest = async (branch = "master") => {
  const url = `https://raw.githubusercontent.com/aidenlx/obsidian-icon-shortcodes/${branch}/assets/manifest.json`;
  try {
    return (await requestUrl({ url })).json;
  } catch (error) {
    console.error(error);
    return null;
  }
};
const getIconPack = async (path: string, branch = "master") => {
  const url = `https://raw.githubusercontent.com/aidenlx/obsidian-icon-shortcodes/${branch}/${path}`;
  try {
    return (await requestUrl({ url })).arrayBuffer;
  } catch (error) {
    console.error(error);
    return null;
  }
};

class GitHubError extends Error {
  constructor(public response: { message: string }) {
    super("GitHub: " + response.message);
  }
}

const getManifestViaAPI = async (branch: string) => {
  const url = `https://api.github.com/repos/aidenlx/obsidian-icon-shortcodes/git/trees/${branch}?recursive=1`;
  try {
    const response = (await requestUrl({ url })).json;
    if (Array.isArray(response.tree)) {
      const manifestUrl = response.tree.find(
        (item: any) => item.path === "assets/manifest.json",
      )?.url;
      if (!manifestUrl) {
        console.error("No manifest.json for icon pack found", response);
        return null;
      } else {
        return manifestUrl;
      }
    } else {
      throw new GitHubError(response);
    }
  } catch (error) {
    if (error instanceof GitHubError) {
      console.error(error);
    } else {
      console.error(error);
    }
    return null;
  }
};

const getJSONfromBlobUrl = async (manifestUrl: string) => {
  try {
    const response = (await requestUrl({ url: manifestUrl })).json;
    if (response.encoding && response.content) {
      if (response.encoding === "base64") {
        return JSON.parse(window.atob(response.content));
      } else {
        console.error("Unsupported encoding", response);
        return null;
      }
    } else {
      throw new GitHubError(response);
    }
  } catch (error) {
    if (error instanceof GitHubError) {
      console.error(error);
    } else {
      console.error(error);
    }
    return error;
  }
};
