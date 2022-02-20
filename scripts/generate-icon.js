import glob from "fast-glob";
import { promises as fs } from "fs";
import { basename, join } from "path";

const { writeFile, mkdir } = fs;

const formatLines = (lines) => {
  lines.unshift("/* eslint-disable simple-import-sort/exports */");
  lines.push("");
  return lines.join("\n");
};
const iconsDir = "src/icons";

/**
 * @param {string} faPath
 */
const importFontAwesome = async (faPath) => {
  const bundleName = "fa";
  const series = (
    await glob([join(faPath, "*")], { onlyDirectories: true })
  ).map((path) => basename(path));

  const files = series.map((s) => ({
    series: s,
    prefix: bundleName + s[0],
    lines: [],
  }));
  for (const { series, lines, prefix } of files) {
    for (const path of await glob([join(faPath, series, "**/*.svg")])) {
      let varName = basename(path).slice(0, -4).replace(/-/g, "_"),
        importPath = path.replace(/^node_modules\//, "");
      lines.push(
        `export ` +
          `{ default as ${prefix}_${varName} }` +
          ` from "${importPath}";`,
      );
    }
  }

  for (const { prefix, lines } of files) {
    await writeFile(join(iconsDir, prefix + ".ts"), formatLines(lines));
  }
  return files.map(({ prefix }) => prefix);
};

/**
 * @param {string} faPath
 */
const importRemixicon = async (faPath) => {
  const bundleName = "ri";
  const series = ["fill", "line"];

  const files = series.map((s) => ({
    series: s,
    prefix: bundleName + s[0],
    suffix: "_" + s,
    lines: [],
  }));
  for (const path of await glob([join(faPath, "**/*.svg")])) {
    let varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      importPath = path.replace(/^node_modules\//, "");

    let matched = false;
    for (const { prefix, suffix, lines } of files) {
      if (varName.endsWith(suffix)) {
        matched = true;
        lines.push(
          `export ` +
            `{ default as ${prefix}_${varName.slice(0, -suffix.length)} }` +
            ` from "${importPath}";`,
        );
        break;
      }
    }
    if (!matched) {
      let file;
      if (
        importPath.includes("Editor/") &&
        (file = files.find((f) => f.series === "line"))
      ) {
        const { prefix, lines } = file;
        lines.push(
          `export ` +
            `{ default as ${prefix}_${varName} }` +
            ` from "${importPath}";`,
        );
      } else
        console.error(
          "unexpected suffix in %s, skipping...",
          "node_modules/" + importPath,
        );
    }
  }

  for (const { prefix, lines } of files) {
    await writeFile(join(iconsDir, prefix + ".ts"), formatLines(lines));
  }
  return files.map(({ prefix }) => prefix);
};

(async (writeTo) => {
  try {
    await mkdir(iconsDir);
  } catch (err) {
    if (err && err.code !== "EEXIST") throw err;
  }

  const all = await Promise.all([
    importFontAwesome("node_modules/@fortawesome/fontawesome-free/svgs"),
    importRemixicon("node_modules/remixicon/icons"),
  ]);
  let lines = all.flat().map((name) => `export * as ${name} from "./${name}";`);
  await writeFile(writeTo, formatLines(lines));
})("src/icons/index.ts");
