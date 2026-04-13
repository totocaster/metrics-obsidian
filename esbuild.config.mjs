import esbuild from "esbuild";
import process from "node:process";
import { builtinModules } from "node:module";

const production = process.argv.includes("production");

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  target: "es2022",
  platform: "browser",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  logLevel: "info",
  external: [
    "obsidian",
    "electron",
    ...builtinModules,
    ...builtinModules.map((moduleName) => `node:${moduleName}`),
  ],
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
