const { writeFile } = require("fs-extra");
const { basename, dirname, join } = require("path");

const fg = require("fast-glob");

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
  let lines = (await fg([join(faPath, "**/*.svg")])).map((path) => {
    const varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      type = basename(dirname(path)),
      prefix = `fa_${type === "regular" ? "" : type + "_"}`,
      importPath = path.replace(/^node_modules\//, "");
    return `export { default as ${prefix}${varName} } from "${importPath}";`;
  });
  await writeFile(join(iconsDir, bundleName + ".ts"), formatLines(lines));
  return bundleName;
};

/**
 * @param {string} faPath
 */
const importRemixicon = async (faPath) => {
  const bundleName = "ri";
  let lines = (await fg([join(faPath, "**/*.svg")])).map((path) => {
    const varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      importPath = path.replace(/^node_modules\//, "");
    return `export { default as ri_${varName} } from "${importPath}";`;
  });
  await writeFile(join(iconsDir, bundleName + ".ts"), formatLines(lines));
  return bundleName;
};

(async (writeTo) => {
  const all = await Promise.all([
    importFontAwesome("node_modules/@fortawesome/fontawesome-free/svgs"),
    importRemixicon("node_modules/remixicon/icons"),
  ]);
  let lines = all.map((name) => `export * as ${name} from "./${name}";`);
  await writeFile(writeTo, formatLines(lines));
})("src/icons/index.ts");
