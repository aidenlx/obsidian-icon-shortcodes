import compareVersions, { compare, satisfies } from "compare-versions";
import emoji from "node-emoji";

import PackManager from "../icon-packs/pack-manager";
import { IconData, IconInfo } from "../icon-packs/types";
import IconSC from "../isc-main";
import { EmojiSuggesterModal } from "../modules/suggester";

export default interface IconSCAPI {
  hasIcon: (id: string) => boolean;

  /**
   * @param id accept shortcode with colons
   * @param raw if true, return string (emoji) or data uri/resource path instead of span element
   * @returns string (emoji) or data uri/resource path (icons); null if given id is not found
   */
  getIcon(id: string, raw: true): string | null;
  /**
   * @param id accept shortcode with colons
   * @param raw if true, return svg data uri instead of span element
   * @returns span element containing the icon string(emoji) or img element; null if given id is not found
   */
  getIcon(id: string, raw?: false): HTMLSpanElement | null;

  /**
   * get raw svg content of icon when available
   * @param id accept shortcode with colons
   * @param raw if true, return svg content (when given svg icon) /  instead of span element
   * @returns string (emoji) or svg content (svg icon) or resource path (bitmap icon); null if given id is not found
   */
  getSVGIcon(id: string, raw: true): Promise<string | null>;
  /**
   * get inline svg version of icon when available
   * @param id accept shortcode with colons
   * @param raw if true, return string (emoji) or svg content (svg icon) or resource path (bitmap icon) instead of span element
   * @returns span element containing the emoji string or svg element (svg icon) or img element (bitmap icon); null if given id is not found
   */
  getSVGIcon(id: string, raw?: false): Promise<HTMLSpanElement | null>;

  /**
   * @param id accept shortcode with colons
   * @returns full data (including character/path/svg content depending on specific type) about icon
   * if given id is found; null if given id is not found
   */
  getIconData(id: string): IconData | null;

  /**
   * Prompt user for icon, available since v0.6.1
   * @returns icon info including id if user choose one; null if user cancel
   */
  getIconFromUser(): Promise<IconInfo | null>;

  isEmoji: (str: string) => boolean;

  /**
   * @param replacer takes a vaild and existing :shortcode: and returns a string
   */
  postProcessor(input: string, replacer: (shortcode: string) => string): string;
  postProcessor(input: HTMLElement): void;

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
  | [name: "changed", api: IconSCAPI, affected?: string[]]
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
  getIconData: packManager.getIconData.bind(packManager),
  getSVGIcon: packManager.getSVGIcon.bind(packManager),
  getIconFromUser: () => new EmojiSuggesterModal(plugin).open(),
  isEmoji: emoji.hasEmoji.bind(emoji),
  postProcessor: plugin.postProcessor.bind(plugin),
  version: {
    get current() {
      return plugin.manifest.version;
    },
    compare: (op, ver) => compare(plugin.manifest.version, ver, op),
    satisfies: (range) => satisfies(plugin.manifest.version, range),
  },
});
