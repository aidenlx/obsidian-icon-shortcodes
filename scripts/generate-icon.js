const { readFile, writeFile } = require("fs-extra");
const { basename, dirname, join } = require("path");

const fg = require("fast-glob");

const importFontAwesome = async (faPath) =>
  (await fg([join(faPath, "**/*.svg")])).map((path) => {
    const varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      type = basename(dirname(path)),
      prefix = `fa_${type === "regular" ? "" : type + "_"}`,
      importPath = path.replace(/^node_modules\//, "");
    return `export { default as ${prefix}${varName} } from "${importPath}";`;
  });
const importRemixicon = async (faPath) =>
  (await fg([join(faPath, "**/*.svg")])).map((path) => {
    const varName = basename(path).slice(0, -4).replace(/-/g, "_"),
      importPath = path.replace(/^node_modules\//, "");
    return `export { default as ri_${varName} } from "${importPath}";`;
  });

(async (writeTo) => {
  let lines = ["/* eslint-disable simple-import-sort/exports */"];
  lines.push(
    ...(await importFontAwesome(
      "node_modules/@fortawesome/fontawesome-free/svgs",
    )),
    ...(await importRemixicon("node_modules/remixicon/icons")),
  );
  lines.push("");
  await writeFile(writeTo, lines.join("\n"));
})("src/icons.ts");
