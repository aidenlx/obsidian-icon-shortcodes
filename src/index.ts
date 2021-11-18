import "obsidian";

import { Plugin } from "obsidian";

import IconSCAPI, { evtPrefix, PMEvents } from "./typings/api";

// EVENTS

type OnArgs<T> = T extends [infer A, ...infer B]
  ? A extends string
    ? [name: `${typeof evtPrefix}${A}`, callback: (...args: B) => any]
    : never
  : never;
declare module "obsidian" {
  interface Vault {
    on(...args: OnArgs<PMEvents>): EventRef;
  }
}

// UTIL FUNCTIONS

export const getApi = (plugin?: Plugin): IconSCAPI | undefined => {
  if (plugin)
    return plugin.app.plugins.plugins["obsidian-icon-shortcodes"]?.api;
  else return window["IconSCAPIv0"];
};

export const isPluginEnabled = (plugin: Plugin) =>
  plugin.app.plugins.enabledPlugins.has("obsidian-icon-shortcodes");
