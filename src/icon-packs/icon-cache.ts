import { Stat } from "obsidian";
import type IconSC from "../isc-main";

declare global {
  const DOMPurify: typeof import("dompurify");
}

interface IconCache {
  ctime: number;
  mtime: number;
  size: number;
  svg: SVGElement;
}

export default class FileIconCache {
  constructor(public plugin: IconSC) {}
  private get vault() {
    return this.plugin.app.vault;
  }
  private cache = new Map<string, IconCache>();
  async getIcon(normalizedPath: string): Promise<SVGElement | null> {
    const stat = await this.vault.adapter.stat(normalizedPath);
    if (!stat || stat.type !== "file") return null;
    if (this.cache.has(normalizedPath)) {
      const cache = this.cache.get(normalizedPath)!;
      if (
        cache.ctime === stat.ctime &&
        cache.mtime === stat.mtime &&
        cache.size === stat.size
      ) {
        return cache.svg.cloneNode(true) as SVGElement;
      }
    }
    const svg = await this.readIntoCache(normalizedPath, stat);
    return svg.cloneNode(true) as SVGElement;
  }
  private async readIntoCache(
    normalizedPath: string,
    stat: Stat,
  ): Promise<SVGElement> {
    const data = DOMPurify.sanitize(
        await this.vault.adapter.read(normalizedPath),
      ),
      svg = new DOMParser().parseFromString(data, "image/svg+xml")
        .documentElement as unknown as SVGElement;
    this.cache.set(normalizedPath, { ...stat, svg });
    return svg;
  }
  refresh() {
    const refresh = async (path: string) => {
      const stat = await this.vault.adapter.stat(path);
      if (!stat || stat.type !== "file") {
        this.cache.delete(path);
      } else {
        await this.readIntoCache(path, stat);
      }
      return path;
    };
    return Promise.allSettled([...this.cache.keys()].map(refresh));
  }
  clear() {
    this.cache.clear();
  }
}
