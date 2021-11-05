import { MarkdownPostProcessor } from "obsidian";

import { getEmoji, RE_SHORTCODE } from "./emoji";

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

const scReplace = (node: Text) => {
  if (node.textContent)
    node.textContent = node.textContent.replace(RE_SHORTCODE, (code) =>
      getEmoji(code),
    );
};

const ShortcodeProcessor: MarkdownPostProcessor = (el: HTMLElement) => {
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

export default ShortcodeProcessor;
