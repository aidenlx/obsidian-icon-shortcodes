import { promises } from "fs";
const { readFile } = promises;

/**
 * @type {import("esbuild").Plugin}
 */
const iconList = {
  name: "obsidian-plugin",
  setup: (build) => {
    build.onLoad(
      { filter: /src\/icons\/[^\/]+?\.txt$/, namespace: "file" },
      async ({ path }) => {
        const lines = (await readFile(path, "utf8")).split(/\r?\n/);
        return {
          contents: JSON.stringify(lines),
          loader: "json",
        };
      },
    );
  },
};
export default iconList;
