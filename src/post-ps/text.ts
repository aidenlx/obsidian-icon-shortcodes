import {
  getGlobalRegexp,
  RE_SHORTCODE,
  stripColons,
} from "../icon-packs/utils";
import IconSC from "../isc-main";

const acceptNode = (node: Node): number => {
  switch (node.nodeName) {
    case "CODE":
    case "MJX-CONTAINER":
      return NodeFilter.FILTER_REJECT;
    case "#text": {
      if (node.nodeValue && RE_SHORTCODE.test(node.nodeValue)) {
        return NodeFilter.FILTER_ACCEPT;
      } else return NodeFilter.FILTER_REJECT;
    }
    default:
      return NodeFilter.FILTER_SKIP;
  }
};

export const getNodePostProcessor = (
  plugin: IconSC,
): ((el: HTMLElement) => void) => {
  const scReplace = async (text: Text) => {
    for (const code of [
      ...text.wholeText.matchAll(getGlobalRegexp(RE_SHORTCODE)),
    ]
      .sort((a, b) => (b.index as number) - (a.index as number))
      .map((arr) => ({ text: arr[0], index: arr.index! }))) {
      await insertElToText(text, code);
    }
  };
  const insertElToText = async (
    text: Text,
    { text: pattern, index }: { text: string; index: number },
  ) => {
    const icon = await plugin.packManager.getSVGIcon(stripColons(pattern));
    if (!icon) return text;
    if (typeof icon === "string") {
      text.textContent &&
        (text.textContent = text.textContent?.replace(pattern, icon));
    } else {
      const toReplace = text.splitText(index);
      toReplace.parentElement?.insertBefore(icon, toReplace);
      toReplace.textContent = toReplace.wholeText.substring(pattern.length);
    }
  };

  return (el: HTMLElement) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, {
      acceptNode,
    });
    let currentNode: Node | null = walker.currentNode;
    while (currentNode) {
      if (currentNode.nodeType === 3) {
        const text = currentNode as Text & { __PENDING__?: Promise<any> };
        // don't wait for new node to be inserted
        (async () => {
          let textNodes = [text];
          if (text.__PENDING__) {
            // wait for prevous post processor to finish
            await text.__PENDING__;
            // rescan for new text nodes
            textNodes = [...text.parentElement!.childNodes].filter(
              (n): n is Text => n instanceof Text,
            );
          }
          const pending = Promise.all(textNodes.map(scReplace));
          // save promise to __PENDING__ to notify other async post processor
          text.__PENDING__ = pending;
          await pending;
          delete text.__PENDING__;
        })();
      }
      currentNode = walker.nextNode();
    }
  };
};

export const getMDPostProcessor =
  (plugin: IconSC) => (str: string, replacer: (shortcode: string) => string) =>
    str.replace(getGlobalRegexp(RE_SHORTCODE), (code) => {
      if (plugin.packManager.hasIcon(stripColons(code))) {
        return replacer(code);
      } else {
        return code;
      }
    });
