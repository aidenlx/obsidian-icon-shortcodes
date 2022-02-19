import glob from "fast-glob";
import { promises as fs } from "fs";
import { dirname } from "path";

const copy = async (srcPath) => {
  const cpTo = dts.replace("src/", "lib/");
  await fs.mkdir(dirname(cpTo), { recursive: true });
  await fs.copyFile(dts, cpTo);
};

await glob("src/**/*.d.ts").map(copy);
