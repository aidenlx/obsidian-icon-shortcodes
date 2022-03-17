import { MarkdownPostProcessor } from "obsidian";

import type IconSC from "../isc-main";

const getCalloutIconPostProcessor =
  (plugin: IconSC): MarkdownPostProcessor =>
  (el, ctx) => {
    for (const calloutEl of el.querySelectorAll(".callout")) {
      const iconEl = calloutEl.querySelector(
        ".callout-title > .callout-icon",
      )! as HTMLElement;
      const observer = new MutationObserver(async (m) => {
        observer.disconnect();
        if (iconEl.childElementCount > 0) return;
        const id = getCssPropertyValue(iconEl, "--callout-icon"),
          icon = await plugin.api.getSVGIcon(id);
        if (!icon) return;
        iconEl.className += " " + icon.className;
        iconEl.replaceChildren(...icon.childNodes);
      });
      observer.observe(iconEl, { childList: true });
    }
  };
export default getCalloutIconPostProcessor;

const getCssPropertyValue = (
  el: HTMLElement,
  prop: string,
  pseudoEl?: string | null,
) => getComputedStyle(el, pseudoEl).getPropertyValue(prop).trim();
