import PackManager from "../icon-packs/pack-manager";
import getShortcodeProcessor from "../modules/post-ps";

export default interface IconSCAPI {
  hasIcon: PackManager["hasIcon"];
  /**
   * @param id accept shortcode with colons
   * @param raw if true, return svg data uri instead of img element
   * @returns emoji character if given emoji shortcode; svg data uri or img element if given svg shortcode; null if given id is not found
   */
  getIcon: PackManager["getIcon"];
  isEmoji: (str: string) => boolean;
  postProcessor: ReturnType<typeof getShortcodeProcessor>;
}

export const evtPrefix = "iconsc:" as const;
export type PMEvents =
  | [name: "changed", api: IconSCAPI]
  | [name: "initialized", api: IconSCAPI];

declare global {
  // Must use var, no const/let
  var IconSCAPIv0: IconSCAPI | undefined;
}
export type API_NAME = "IconSCAPIv0";
