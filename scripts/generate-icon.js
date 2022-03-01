import child_process from "child_process";
import glob from "fast-glob";
import { promises as fs } from "fs";
import { basename, join } from "path";
import { promisify } from "util";

const { mkdir, copyFile, rm } = fs,
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
const zip = async (targetDir) =>
  exec(`zip -jr ${targetDir}.zip ${targetDir}/*.svg`);

/**
 * @param {string} faPath
 * @returns {Promise<Promise<void>[]>}
 */
const importFontAwesome = async (faPath) => {
  const bundleName = "fa";
  const series = (
    await glob([join(faPath, "*")], { onlyDirectories: true })
  ).map((path) => basename(path));

  const seriesPattern = series.map((s) => ({
    series: s,
    prefix: bundleName + s[0],
  }));

  return seriesPattern.map(async ({ series, prefix }) => {
    let copyQueue = [];
    const writeTo = join(iconsDir, `${bundleName}-${series}`);
    await prepareFolder(writeTo);
    for (const path of await glob([join(faPath, series, "**/*.svg")])) {
      let varName = basename(path).slice(0, -4).replace(/-/g, "_");
      copyQueue.push(copyFile(path, join(writeTo, `${prefix}_${varName}.svg`)));
    }
    await Promise.all(copyQueue);
    return zip(writeTo);
  });
};

/**
 * @param {string} faPath
 */
const importRemixicon = async (faPath) => {
  const bundleName = "ri";
  const series = ["fill", "line"];

  const seriesPattern = series.map((s) => ({
      series: s,
      prefix: bundleName + s[0],
      suffix: "_" + s,
    })),
    files = await glob([join(faPath, "**/*.svg")]);

  let folderQueueMap = {};
  for (const path of files) {
    let varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      importPath = path.replace(/^node_modules\//, "");
    let matched = false;
    const copy = async (folder, filename) => {
      const writeTo = join(iconsDir, folder);
      if (!folderQueueMap[folder]) {
        await prepareFolder(writeTo);
        folderQueueMap[folder] = [];
      }
      folderQueueMap[folder].push(
        copyFile(path, join(writeTo, `${filename}.svg`)),
      );
    };
    for (const { series, prefix, suffix } of seriesPattern) {
      if (varName.endsWith(suffix)) {
        matched = true;
        await copy(
          `${bundleName}-${series}`,
          `${prefix}_${varName.slice(0, -suffix.length)}`,
        );
        break;
      }
    }
    if (!matched) {
      if (importPath.includes("Editor/")) {
        const { series, prefix } = seriesPattern.find(
          (f) => f.series === "line",
        );
        await copy(`${bundleName}-${series}`, `${prefix}_${varName}`);
      } else
        console.error(
          "unexpected suffix in %s, skipping...",
          "node_modules/" + importPath,
        );
    }
  }
  for (const [folder, queue] of Object.entries(folderQueueMap)) {
    Promise.all(queue).then(() => zip(join(iconsDir, folder)));
  }
};

(async () => {
  importFontAwesome("node_modules/@fortawesome/fontawesome-free/svgs");
  importRemixicon("node_modules/remixicon/icons");
})();
