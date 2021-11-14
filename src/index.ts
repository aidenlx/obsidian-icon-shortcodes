import "obsidian";

import { Plugin } from "obsidian";

import IconSCAPI from "./typings/api";

// EVENTS

// type OnArgs<T> = T extends [infer A, ...infer B]
//   ? A extends string
//     ? [name: A, callback: (...args: B) => any]
//     : never
//   : never;
// type EventsOnArgs = OnArgs<FNCEvents>;

// declare module "obsidian" {
//   interface Vault {
//     on(...args: EventsOnArgs): EventRef;
//   }
// }

// UTIL FUNCTIONS

export const getApi = (plugin?: Plugin): IconSCAPI | undefined => {
  if (plugin)
    return plugin.app.plugins.plugins["obsidian-icon-shortcodes"]?.api;
  else return window["IconSCAPIv0"];
};

export const isPluginEnabled = (plugin: Plugin) =>
  plugin.app.plugins.enabledPlugins.has("obsidian-icon-shortcodes");
