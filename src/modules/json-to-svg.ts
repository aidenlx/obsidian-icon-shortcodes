import { Notice, TFile } from "obsidian";
import { join } from "path";

import IconSC from "../isc-main";
import { confirm } from "./dialog";

const jsonToSvg = async (plugin: IconSC) => {
  const { vault } = plugin.app;
  const data = (await vault.readJson(
    plugin.packManager.customIconsFilePath,
  )) as Record<string, string>;
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

const tryUpdateIcons = async (plugin: IconSC) => {
  if (
    (await plugin.app.vault.adapter.exists(
      plugin.packManager.customIconsFilePath,
    )) &&
    !plugin.settings.isMigrated
  ) {
    const message =
      "Found custom icons that have not been upgraded, update icons now?";
    if (await confirm(message, plugin.app)) {
      try {
        await jsonToSvg(plugin);
        plugin.settings.isMigrated = true;
        await plugin.saveSettings();
        new Notice(
          "Icon update complete, you can now find icon files in " +
            plugin.packManager.customIconsDir,
        );
      } catch (error) {
        new Notice("Failed to update icons, check console for more details");
        console.error(error);
      }
    }
  }
};

export default tryUpdateIcons;
