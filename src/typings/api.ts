import compareVersions, { compare, satisfies } from "compare-versions";
import emoji from "node-emoji";
import { MarkdownPostProcessor, PluginManifest } from "obsidian";

import PackManager from "../icon-packs/pack-manager";
import IconSC from "../isc-main";
import { EmojiSuggesterModal } from "../modules/suggester";

export default interface IconSCAPI {
  hasIcon: (id: string) => boolean;

  /**
   * @param id accept shortcode with colons
   * @param raw if true, return svg data uri instead of img element
   * @returns emoji character if given emoji shortcode; svg data uri if given svg shortcode; null if given id is not found
   */
  getIcon(id: string, raw: true): string | null;
  /**
   * @param id accept shortcode with colons
   * @param raw if true, return svg data uri instead of img element
   * @returns emoji character if given emoji shortcode; img element if given svg shortcode; null if given id is not found
   */
  getIcon(
    id: string,
    raw?: false | undefined,
  ): string | HTMLImageElement | null;

  /**
   * @param raw if true, return svg data uri instead of img element
   * @returns emoji character if given emoji shortcode; svg data uri if given svg shortcode; null if no icon selected
   */
  getIconFromUser(raw: true): Promise<string | null>;
  /**
   * @param raw if true, return svg data uri instead of img element
   * @returns emoji character if given emoji shortcode; img element if given svg shortcode; null if no icon selected
   */
  getIconFromUser(raw?: false): Promise<string | HTMLImageElement | null>;

  isEmoji: (str: string) => boolean;
  postProcessor: MarkdownPostProcessor;
  version: {
    current: string;
    /**
     * Compare [semver](https://semver.org/) version strings using the specified operator.
     *
     * @param verToCompare version to compare
     * @param operator Allowed arithmetic operator to use
     * @returns `true` if the comparison between the verToCompare and the current version satisfies the operator, `false` otherwise.
     *
     * @example
     * ```
     * currVer = '10.1.1';
     * compare('<', '10.2.2'); // return true
     * compare('<=', '10.2.2'); // return true
     * compare('>=' '10.2.2'); // return false
     * ```
     */
    compare(
      operator: compareVersions.CompareOperator,
      verToCompare: string,
    ): boolean;
    /**
     * Match [npm semver](https://docs.npmjs.com/cli/v6/using-npm/semver) version range.
     *
     * @param range Range pattern for version
     * @returns `true` if the current version number is within the range, `false` otherwise.
     *
     * @example
     * ```
     * currVer = '1.1.0';
     * satisfies('^1.0.0'); // return true
     * satisfies('~1.0.0'); // return false
     * ```
     */
    satisfies(range: string): boolean;
  };
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

export const getApi = (
  packManager: PackManager,
  plugin: IconSC,
): IconSCAPI => ({
  hasIcon: packManager.hasIcon.bind(packManager),
  getIcon: packManager.getIcon.bind(packManager),
  getIconFromUser: async (raw) => {
    const id = await new EmojiSuggesterModal(plugin).open();
    if (!id) return null;
    else {
      return plugin.packManager.getIcon(id.id, raw as any);
    }
  },
  isEmoji: emoji.hasEmoji.bind(emoji),
  postProcessor: plugin.postProcessor,
  version: {
    get current() {
      return plugin.manifest.version;
    },
    compare: (op, ver) => compare(plugin.manifest.version, ver, op),
    satisfies: (range) => satisfies(plugin.manifest.version, range),
  },
});
