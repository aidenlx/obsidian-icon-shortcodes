import { MarkdownPostProcessor } from "obsidian";

import IconSC from "../isc-main";
import { stripColons } from "./icon-packs";

const RE_SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;

const acceptNode = (node: Node): number => {
  switch (node.nodeName) {
    case "CODE":
    case "MJX-CONTAINER":
      return NodeFilter.FILTER_REJECT;
    case "#text": {
      RE_SHORTCODE.lastIndex = 0;
      if (node.nodeValue && RE_SHORTCODE.test(node.nodeValue)) {
        return NodeFilter.FILTER_ACCEPT;
      } else return NodeFilter.FILTER_REJECT;
    }
    default:
      return NodeFilter.FILTER_SKIP;
  }
};

const getShortcodeProcessor = (plugin: IconSC): MarkdownPostProcessor => {
  const scReplace = (text: Text) => {
    RE_SHORTCODE.lastIndex = 0;
    for (const code of [...text.wholeText.matchAll(RE_SHORTCODE)]
      .sort((a, b) => (a.index as number) - (b.index as number))
      .map((arr) => arr[0])) {
      text = insertElToText(text, code);
    }
  };
  const insertElToText = (text: Text, pattern: string) => {
    const index = text.wholeText.indexOf(pattern);
    if (index < 0) return text;
    const icon = plugin.iconPacks.getIcon(stripColons(pattern));
    if (!icon) return text;
    if (typeof icon === "string") {
      text.textContent &&
        (text.textContent = text.textContent?.replace(pattern, icon));
    } else {
      text = text.splitText(index);
      text.parentElement?.insertBefore(icon, text);
      text.textContent = text.wholeText.substring(pattern.length);
    }
    return text;
  };

  return (el: HTMLElement) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode,
    });
    let currentNode: Node | null = walker.currentNode;
    while (currentNode) {
      if (currentNode.nodeType === 3) {
        scReplace(currentNode as Text);
      }
      currentNode = walker.nextNode();
    }
  };
};

export default getShortcodeProcessor;
