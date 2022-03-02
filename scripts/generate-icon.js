import child_process from "child_process";
import glob from "fast-glob";
import { promises as fs } from "fs";
import { basename, join } from "path";
import { promisify } from "util";

const { mkdir, copyFile, rm, writeFile } = fs,
  exec = promisify(child_process.exec);

const iconsDir = "assets";

const prepareFolder = async (dir) => {
  try {
    await rm(dir, { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
};
const zip = async (targetDir) => {
  await exec(`zip -jr ${targetDir}.zip ${targetDir}/*.svg`);
  rm(targetDir, { recursive: true });
};

let folderQueueMap = {};

const prepare = async (folder) => {
  if (!folderQueueMap[folder]) {
    await prepareFolder(join(iconsDir, folder));
    folderQueueMap[folder] = [];
  }
};
const copy = async (from, folder, packId, iconName) => {
  folderQueueMap[folder].push(
    copyFile(from, join(iconsDir, folder, `${packId}_${iconName}.svg`)),
  );
};

const fontAwesome = {
  series: "Font Awesome (Free)",
  bundleName: "fa",
  description:
    "the Internet's icon library and toolkit, used by millions of designers, developers, and content creators.",
  license: "CC BY 4.0 License",
  homepage: "https://fontawesome.com",
};
/**
 * @param {string} packDir
 */
const exportFontAwesome = async (packDir) => {
  const { bundleName } = fontAwesome;
  const styles = (
    await glob([join(packDir, "*")], { onlyDirectories: true })
  ).map((path) => basename(path));

  const patterns = styles.map((style) => ({
    bundleName: `${bundleName}-${style}`,
    style,
    packId: bundleName + style[0],
  }));

  for (const { bundleName, style, packId } of patterns) {
    await prepare(bundleName);
    for (const path of await glob([join(packDir, style, "**/*.svg")])) {
      let iconName = basename(path).slice(0, -4).replace(/-/g, "_");
      copy(path, bundleName, packId, iconName);
    }
  }
  return patterns.map(({ bundleName, style, packId }) => ({
    ...fontAwesome,
    bundleName,
    style,
    packId,
  }));
};

const remixicon = {
  series: "Remix Icon",
  bundleName: "ri",
  description:
    "a set of open-source neutral-style system symbols elaborately crafted for designers and developers.",
  license: "Apache-2.0 License",
  homepage: "http://remixicon.com",
};
/**
 * @param {string} packDir
 */
const exportRemixicon = async (packDir) => {
  const { bundleName } = remixicon;
  const styles = ["fill", "line"];

  const patterns = styles.map((style) => ({
      bundleName: `${bundleName}-${style}`,
      style,
      packId: bundleName + style[0],
      suffix: "_" + style,
    })),
    files = await glob([join(packDir, "**/*.svg")]);

  for (const path of files) {
    let iconName = basename(path).slice(0, -4).replace(/-/g, "_"),
      importPath = path.replace(/^node_modules\//, "");
    let matched = false;

    for (const { bundleName, packId, suffix } of patterns) {
      if (iconName.endsWith(suffix)) {
        matched = true;
        await prepare(bundleName);
        copy(path, bundleName, packId, iconName.slice(0, -suffix.length));
        break;
      }
    }
    if (!matched) {
      if (importPath.includes("Editor/")) {
        const { bundleName, packId } = patterns.find((f) => f.style === "line");
        await prepare(bundleName);
        copy(path, bundleName, packId, iconName);
      } else
        console.error(
          "unexpected suffix in %s, skipping...",
          "node_modules/" + importPath,
        );
    }
  }
  return patterns.map(({ bundleName, style, packId }) => ({
    ...remixicon,
    bundleName,
    style,
    packId,
  }));
};

const rpgawesome = {
  series: "RPG Awesome",
  bundleName: "rpg-awesome",
  packId: "rpg",
  style: "",
  description:
    "a suite of 495 pictographic, rpg and fantasy themes icons for easy scalable vector graphics on websites",
  license: "BSD-2-Clause License",
  homepage: "http://nagoshiashumari.github.io/Rpg-Awesome/",
};
const exportRPGAwesome = async (packDir) => {
  const { bundleName, packId } = rpgawesome;
  for (const path of await glob([join(packDir, "*.svg")])) {
    let iconName = basename(path).slice(0, -4).replace(/-/g, "_");
    await prepare(bundleName);
    copy(path, bundleName, packId, iconName);
  }
  return rpgawesome;
};

(async () => {
  let manifestList = (
    await Promise.all([
      exportFontAwesome("node_modules/@fortawesome/fontawesome-free/svgs"),
      exportRemixicon("node_modules/remixicon/icons"),
      exportRPGAwesome("node_modules/rpg-awsome-raw/Font"),
    ])
  ).flat();
  await Promise.all(
    Object.entries(folderQueueMap).map(async ([folder, queue]) => {
      await Promise.all(queue);
      console.log(`${folder} done: ` + queue.length);
      return zip(join(iconsDir, folder));
    }),
  );
  for (let manifest of manifestList) {
    manifest.path = join(iconsDir, manifest.bundleName + ".zip");
    const queue = folderQueueMap[manifest.bundleName];
    manifest.count = queue.length;
  }
  for (const [zipFileName, queue] of Object.entries(folderQueueMap)) {
    manifestList[zipFileName] = {
      path: join(iconsDir, zipFileName + ".zip"),
      count: queue.length,
    };
  }
  manifestList.sort(({ bundleName: a }, { bundleName: b }) =>
    a.localeCompare(b),
  );
  // sort keys
  manifestList = manifestList.map((obj) =>
    Object.fromEntries(
      Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
  for (const manifest of manifestList) {
    if (!checkFields(manifest)) {
      console.error(manifest);
      throw new TypeError("manifest missing fields");
    }
  }
  writeFile(
    join(iconsDir, "manifest.json"),
    JSON.stringify(manifestList, null, 2),
  );
})();

const fields = [
  "series",
  "style",
  "bundleName",
  "packId",
  "path",
  "count",
  "description",
  "license",
  "homepage",
];
const checkFields = (manifest) => {
  const keys = Object.keys(manifest);
  return fields.every((field) => keys.includes(field));
};
