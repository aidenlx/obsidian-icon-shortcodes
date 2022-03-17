import type IconSC from "../isc-main";
import getCalloutIconPostProcessor from "./callout-icon";
import { getMDPostProcessor, getNodePostProcessor } from "./text";

const setupPostProcessors = (plugin: IconSC) => {
  plugin.registerMarkdownPostProcessor(plugin._nodeProcessor);
  plugin.registerMarkdownPostProcessor(getCalloutIconPostProcessor(plugin));
};

export { getMDPostProcessor, getNodePostProcessor, setupPostProcessors };
