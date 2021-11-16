import { TFile } from "obsidian";
import { join } from "path";

import IconSC from "../isc-main";

const jsonToSvg = async (plugin: IconSC) => {
  const { vault } = plugin.app;
  const data = await vault.readJson(plugin.packManager.customIconsFilePath);
  let path = plugin.packManager.customIconsDir;
  if (!(await vault.adapter.exists(path))) {
    await vault.adapter.mkdir(path);
  }
  await Promise.allSettled(
    Object.entries(data).reduce((arr, [id, svg]) => {
      if (typeof id === "string" && typeof svg === "string") {
        const filePath = join(path, `${id}.svg`);
        arr.push(vault.create(filePath, svg));
      }
      return arr;
    }, [] as Promise<TFile>[]),
  );
};
export default jsonToSvg;
