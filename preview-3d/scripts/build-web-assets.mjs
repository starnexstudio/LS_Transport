// Builds the compact web copy of the 3D assets that the website's hero loads
// (../../public/hero-3d): each model as one GLB (meshes simplified and
// meshopt-compressed, textures as WebP at 512 px, 256 px for small props), the
// surfaces as WebP at 512 px, the HDRI as it is, and the loading / no-WebGL
// posters. About 5 MB in all, from about 47 MB of source files.
// Run after fetch-assets: npm run build-web-assets
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { models, smallModels, textures, grayTextures, hdri } from "./asset-list.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..", "assets"), out = resolve(here, "..", "..", "public", "hero-3d");
const cli = resolve(here, "..", "node_modules", "@gltf-transform", "cli", "bin", "cli.js");
for (const dir of ["models", "textures", "hdri"]) await mkdir(join(out, dir), { recursive: true });

// Models: the scene graph stays as it is (the code looks materials up by name).
for (const id of models) {
  execFileSync(process.execPath, [
    cli, "optimize", join(src, "polyhaven", id, `${id}.gltf`), join(out, "models", `${id}.glb`),
    "--texture-compress", "webp", "--texture-size", smallModels.has(id) ? "256" : "512",
    "--simplify-error", "0.002", "--flatten", "false", "--join", "false", "--instance", "false", "--palette", "false",
  ], { stdio: ["ignore", "ignore", "inherit"] });
}

// Surfaces: colour, normal and roughness maps.
for (const id of textures) {
  await mkdir(join(out, "textures", id), { recursive: true });
  for (const map of ["diffuse", "normal", "rough"]) {
    let img = sharp(join(src, "textures", id, `${map}.jpg`)).resize(512, 512, { fit: "inside" });
    if (map === "diffuse" && grayTextures.has(id)) img = img.grayscale();
    await img.webp({ quality: map === "normal" ? 92 : 82 }).toFile(join(out, "textures", id, `${map}.webp`));
  }
}

await copyFile(join(src, "hdri", `${hdri}.hdr`), join(out, "hdri", `${hdri}.hdr`));
for (const f of await readdir(join(here, "..", "static"))) if (f.startsWith("fallback-")) await copyFile(join(here, "..", "static", f), join(out, f));
await writeFile(join(out, "LICENSE.txt"), "Models, surface textures and the HDRI are from Poly Haven and are CC0 (public domain): https://polyhaven.com/license\nThe posters are renders of the scene.\n");

let total = 0;
const walk = async (d) => { for (const e of await readdir(d, { withFileTypes: true })) e.isDirectory() ? await walk(join(d, e.name)) : (total += (await stat(join(d, e.name))).size); };
await walk(out);
console.log(`public/hero-3d: ${(total / 1048576).toFixed(1)} MB`);
