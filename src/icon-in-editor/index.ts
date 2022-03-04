import type IconSC from "../isc-main";
import getIconLivePreviewPlugin from "./view-plugin";

const setupIconPlugin = (plugin: IconSC) => {
  plugin.registerEditorExtension([
    plugin.shortcodePosField,
    getIconLivePreviewPlugin(plugin),
  ]);
};

export default setupIconPlugin;
