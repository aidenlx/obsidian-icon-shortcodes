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
  // await exec(`zip -jr ${targetDir}.zip ${targetDir}/*.svg`);
  rm(targetDir, { recursive: true });
};

let folderQueueMap = {};

const prepare = async (folder) => {
  if (!folderQueueMap[folder]) {
    await prepareFolder(join(iconsDir, folder));
    folderQueueMap[folder] = [];
  }
};
const copy = async (from, folder, filename) => {
  folderQueueMap[folder].push(
    copyFile(from, join(iconsDir, folder, `${filename}.svg`)),
  );
};

const fontAwesome = {
  series: "Font Awesome (Free)",
  description:
    "the Internet's icon library and toolkit, used by millions of designers, developers, and content creators.",
  license: "CC BY 4.0 License",
  homepage: "https://fontawesome.com",
};
/**
 * @param {string} packDir
 * @returns {Promise<Promise<void>[]>}
 */
const exportFontAwesome = async (packDir) => {
  const bundleName = "fa";
  const series = (
    await glob([join(packDir, "*")], { onlyDirectories: true })
  ).map((path) => basename(path));

  const seriesPattern = series.map((s) => ({
    series: s,
    prefix: bundleName + s[0],
  }));

  for (const { series, prefix } of seriesPattern) {
    let folder = `${bundleName}-${series}`;
    await prepare(folder);
    for (const path of await glob([join(packDir, series, "**/*.svg")])) {
      let varName = basename(path).slice(0, -4).replace(/-/g, "_");
      copy(path, folder, `${prefix}_${varName}`);
    }
  }
};

const remixicon = {
  series: "Remix Icon",
  description:
    "a set of open-source neutral-style system symbols elaborately crafted for designers and developers.",
  license: "Apache-2.0 License",
  homepage: "http://remixicon.com",
};
/**
 * @param {string} packDir
 */
const exportRemixicon = async (packDir) => {
  const bundleName = "ri";
  const series = ["fill", "line"];

  const seriesPattern = series.map((s) => ({
      series: s,
      prefix: bundleName + s[0],
      suffix: "_" + s,
    })),
    files = await glob([join(packDir, "**/*.svg")]);

  for (const path of files) {
    let varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      importPath = path.replace(/^node_modules\//, "");
    let matched = false;

    for (const { series, prefix, suffix } of seriesPattern) {
      const folder = `${bundleName}-${series}`;
      if (varName.endsWith(suffix)) {
        matched = true;
        await prepare(folder);
        copy(path, folder, `${prefix}_${varName.slice(0, -suffix.length)}`);
        break;
      }
    }
    if (!matched) {
      if (importPath.includes("Editor/")) {
        const { series, prefix } = seriesPattern.find(
          (f) => f.series === "line",
        );
        const folder = `${bundleName}-${series}`;
        await prepare(folder);
        copy(path, folder, `${prefix}_${varName}`);
      } else
        console.error(
          "unexpected suffix in %s, skipping...",
          "node_modules/" + importPath,
        );
    }
  }
};

const rpgawesome = {
  series: "RPG Awesome",
  style: "",
  description:
    "a suite of 495 pictographic, rpg and fantasy themes icons for easy scalable vector graphics on websites",
  license: "BSD-2-Clause License",
  homepage: "http://nagoshiashumari.github.io/Rpg-Awesome/",
};
const exportRPGAwesome = async (packDir) => {
  const bundleName = "rpg-awesome",
    prefix = "rpg";
  for (const path of await glob([join(packDir, "*.svg")])) {
    let varName = basename(path).slice(0, -4).replace(/-/g, "_");
    await prepare(bundleName);
    copy(path, bundleName, `${prefix}_${varName}`);
  }
};

(async () => {
  await Promise.all([
    exportFontAwesome("node_modules/@fortawesome/fontawesome-free/svgs"),
    exportRemixicon("node_modules/remixicon/icons"),
    exportRPGAwesome("node_modules/rpg-awsome-raw/Font"),
  ]);
  await Promise.all(
    Object.entries(folderQueueMap).map(async ([folder, queue]) => {
      await Promise.all(queue);
      console.log(`${folder} done: ` + queue.length);
      return zip(join(iconsDir, folder));
    }),
  );
  let manifest = {};
  for (const [zipFileName, queue] of Object.entries(folderQueueMap)) {
    manifest[zipFileName] = {
      path: join(iconsDir, zipFileName + ".zip"),
      count: queue.length,
    };
    if (zipFileName.startsWith("fa")) {
      Object.assign(manifest[zipFileName], fontAwesome, {
        style: zipFileName.split("-").pop(),
      });
    } else if (zipFileName.startsWith("ri")) {
      Object.assign(manifest[zipFileName], remixicon, {
        style: zipFileName.split("-").pop(),
      });
    } else if (zipFileName === "rpg-awesome") {
      Object.assign(manifest[zipFileName], rpgawesome);
    }
  }
  manifest = Object.entries(manifest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, info]) => info);
  writeFile(join(iconsDir, "manifest.json"), JSON.stringify(manifest, null, 2));
})();
