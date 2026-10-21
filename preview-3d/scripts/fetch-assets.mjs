// Downloads the CC0 assets for the 3D preview into ../assets (not committed).
// Everything comes from Poly Haven (polyhaven.com, CC0): furniture and props as
// glTF (1k textures), PBR surface textures (1k) and an HDRI for lighting.
// Run from anywhere: node preview-3d/scripts/fetch-assets.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { models, textures, hdri } from "./asset-list.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "assets");

async function download(url, file) {
  if (existsSync(file) && (await stat(file)).size > 0) return false;
  await mkdir(dirname(file), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return true;
}
const files = async (id) => (await fetch(`https://api.polyhaven.com/files/${id}`)).json();

const log = [];
await Promise.all(models.map(async (id) => {
  const g = (await files(id)).gltf["1k"].gltf;
  const dir = join(root, "polyhaven", id);
  let fresh = await download(g.url, join(dir, `${id}.gltf`));
  for (const [rel, f] of Object.entries(g.include ?? {})) fresh = (await download(f.url, join(dir, rel))) || fresh;
  if (fresh) log.push(`model ${id}`);
}));
await Promise.all(textures.map(async (id) => {
  const f = await files(id), dir = join(root, "textures", id);
  for (const [map, out] of [["Diffuse", "diffuse.jpg"], ["nor_gl", "normal.jpg"], ["Rough", "rough.jpg"]]) {
    const entry = f[map]?.["1k"]?.jpg;
    if (entry && (await download(entry.url, join(dir, out)))) log.push(`texture ${id}/${out}`);
  }
}));
const h = (await files(hdri)).hdri["1k"].hdr;
if (await download(h.url, join(root, "hdri", `${hdri}.hdr`))) log.push(`hdri ${hdri}`);
await writeFile(join(root, "LICENSE.txt"), "All assets in this folder are from Poly Haven and are CC0 (public domain): https://polyhaven.com/license\n");
console.log(log.length ? log.join("\n") : "all assets present");
