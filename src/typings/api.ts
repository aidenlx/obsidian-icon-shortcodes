import PackManager from "../icon-packs/pack-manager";
import getShortcodeProcessor from "../modules/post-ps";

export default interface IconSCAPI {
  hasIcon: PackManager["hasIcon"];
  /**
   * @param raw if true, return svg data uri instead of img element
   * @returns emoji character if given emoji shortcode; svg data uri or img element if given svg shortcode; null if given id is not found
   */
  getIcon: PackManager["getIcon"];
  postProcessor: ReturnType<typeof getShortcodeProcessor>;
}

declare global {
  // Must use var, no const/let
  var IconSCAPIv0: IconSCAPI | undefined;
}
export type API_NAME = "IconSCAPIv0";
