// Builds the compact web copy of the 3D assets that the website's hero loads
// (../../public/hero-3d): each model as one GLB (meshes simplified to about a
// quarter and meshopt-compressed, textures as WebP at 512 px, 256 px for small props), the
// surfaces as WebP at 512 px, the HDRI at half size (512 × 256, plenty for
// ambient light and soft reflections), and the loading / no-WebGL posters. About
// 4 MB in all, from about 47 MB of source files.
// Run after fetch-assets: npm run build-web-assets
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
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
    // Simplified to about a quarter of the vertices, within 1 % of the model's size:
    // the pieces are small on screen, and their triangles were most of each frame's cost.
    "--simplify-ratio", "0.25", "--simplify-error", "0.01",
    "--flatten", "false", "--join", "false", "--instance", "false", "--palette", "false",
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

await writeFile(join(out, "hdri", `${hdri}.hdr`), halveHDR(await readFile(join(src, "hdri", `${hdri}.hdr`))));
for (const f of await readdir(join(here, "..", "static"))) if (f.startsWith("fallback-")) await copyFile(join(here, "..", "static", f), join(out, f));
await writeFile(join(out, "LICENSE.txt"), "Models, surface textures and the HDRI are from Poly Haven and are CC0 (public domain): https://polyhaven.com/license\nThe posters are renders of the scene.\n");

let total = 0;
const walk = async (d) => { for (const e of await readdir(d, { withFileTypes: true })) e.isDirectory() ? await walk(join(d, e.name)) : (total += (await stat(join(d, e.name))).size); };
await walk(out);
console.log(`public/hero-3d: ${(total / 1048576).toFixed(1)} MB`);

// Radiance .hdr (RGBE): read, average each 2 × 2 block, write back run-length encoded.
function halveHDR(buf) {
  const end = buf.indexOf("\n\n") + 2, lineEnd = buf.indexOf("\n", end);
  const [, h, w] = buf.toString("latin1", end, lineEnd).match(/-Y (\d+) \+X (\d+)/).map(Number);
  const rgb = new Float32Array(w * h * 3), line = new Uint8Array(w * 4);
  let p = lineEnd + 1;
  for (let y = 0; y < h; y++) {
    if (buf[p] === 2 && buf[p + 1] === 2) {
      p += 4;
      for (let c = 0; c < 4; c++) for (let x = 0; x < w; ) {
        let n = buf[p++];
        if (n > 128) { n -= 128; const v = buf[p++]; while (n--) line[(x++) * 4 + c] = v; }
        else while (n--) line[(x++) * 4 + c] = buf[p++];
      }
    } else { line.set(buf.subarray(p, p + w * 4)); p += w * 4; }
    for (let x = 0; x < w; x++) {
      const e = line[x * 4 + 3], f = e ? Math.pow(2, e - 136) : 0;
      for (let c = 0; c < 3; c++) rgb[(y * w + x) * 3 + c] = line[x * 4 + c] * f;
    }
  }
  const W = w >> 1, H = h >> 1, out = [Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`, "latin1")];
  const row = new Uint8Array(W * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = [0, 1, 2].map((c) => (rgb[((2 * y) * w + 2 * x) * 3 + c] + rgb[((2 * y) * w + 2 * x + 1) * 3 + c] + rgb[((2 * y + 1) * w + 2 * x) * 3 + c] + rgb[((2 * y + 1) * w + 2 * x + 1) * 3 + c]) / 4);
      const m = Math.max(...v);
      if (m < 1e-32) { row.fill(0, x * 4, x * 4 + 4); continue; }
      const e = Math.floor(Math.log2(m)) + 1, scale = 256 / Math.pow(2, e);
      for (let c = 0; c < 3; c++) row[x * 4 + c] = Math.min(255, Math.floor(v[c] * scale));
      row[x * 4 + 3] = e + 128;
    }
    const bytes = [2, 2, W >> 8, W & 255];
    for (let c = 0; c < 4; c++) {
      const ch = Array.from({ length: W }, (_, x) => row[x * 4 + c]);
      for (let i = 0; i < W; ) {
        let run = 1;
        while (i + run < W && run < 127 && ch[i + run] === ch[i]) run++;
        if (run >= 4) { bytes.push(128 + run, ch[i]); i += run; continue; }
        let j = i; // literal stretch until the next run of 4 or more
        while (j < W && j - i < 128 && !(j + 3 < W && ch[j] === ch[j + 1] && ch[j] === ch[j + 2] && ch[j] === ch[j + 3])) j++;
        bytes.push(j - i, ...ch.slice(i, j)); i = j;
      }
    }
    out.push(Buffer.from(bytes));
  }
  return Buffer.concat(out);
}
