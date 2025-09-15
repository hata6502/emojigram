import * as esbuild from "esbuild";

await Promise.all(
  [{ entryPoints: ["src/index.tsx"], outfile: "public/index.js" }].map(
    (options) =>
      esbuild.build({
        ...options,
        bundle: true,
        format: "esm",
        minify: true,
      }),
  ),
);
