// Downloads the CC0 assets for the 3D preview into ../assets (not committed).
//   Kenney packs (kenney.nl, CC0): Mini Characters, Car Kit, Furniture Kit
//   Poly Haven (polyhaven.com, CC0): furniture models + PBR textures (1k)
// Run from anywhere: node preview-3d/scripts/fetch-assets.mjs
import { mkdir, writeFile, readdir, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "assets");
const downloads = join(root, "_downloads");

const kenney = {
  "kenney-mini-characters": "https://kenney.nl/media/pages/assets/mini-characters/bfc7e272b4-1774770718/kenney_mini-characters.zip",
  "kenney-car-kit": "https://kenney.nl/media/pages/assets/car-kit/1a312ec241-1775131960/kenney_car-kit.zip",
  "kenney-furniture-kit": "https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip",
};
// Kenney models copied into assets/models/<set>/ (with their Textures folder).
const curate = {
  "kenney-mini-characters": { dir: "Models/GLB format", to: "characters", files: ["character-male-a.glb", "character-male-b.glb", "character-male-c.glb"] },
  "kenney-car-kit": { dir: "Models/GLB format", to: "vehicles", files: ["van.glb", "delivery.glb", "wheel-default.glb"] },
  "kenney-furniture-kit": { dir: "Models/GLTF format", to: "furniture", files: ["loungeSofa.glb", "loungeChair.glb", "bookcaseClosedDoors.glb", "bookcaseOpen.glb", "cardboardBoxClosed.glb", "rugRectangle.glb"] },
};
const polyModels = ["Sofa_01", "ArmChair_01", "cardboard_box_01", "hand_truck", "painted_wooden_cabinet_02"];
const polyTextures = ["clay_roof_tiles", "painted_plaster_wall", "herringbone_parquet", "grey_roof_tiles", "asphalt_02", "leafy_grass", "concrete_floor_02", "brick_pavement_02"];

async function download(url, file) {
  if (existsSync(file) && (await stat(file)).size > 0) return false;
  await mkdir(dirname(file), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return true;
}

const log = [];
for (const [name, url] of Object.entries(kenney)) {
  const zip = join(downloads, name, "pack.zip");
  if (await download(url, zip)) log.push(`downloaded ${name}`);
  const out = join(downloads, name, "x");
  if (!existsSync(out)) execFileSync("unzip", ["-q", "-o", zip, "-d", out]);
  const c = curate[name];
  const src = join(out, c.dir), dest = join(root, "models", c.to);
  await mkdir(dest, { recursive: true });
  for (const f of c.files) await copyFile(join(src, f), join(dest, f));
  // Some packs embed colours in the materials and ship no texture folder.
  if (existsSync(join(src, "Textures"))) {
    await mkdir(join(dest, "Textures"), { recursive: true });
    for (const t of await readdir(join(src, "Textures"))) await copyFile(join(src, "Textures", t), join(dest, "Textures", t));
  }
  await copyFile(join(out, "License.txt"), join(dest, `LICENSE-${name}.txt`));
}

for (const id of polyModels) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const g = files.gltf["1k"].gltf;
  const dir = join(root, "polyhaven", id);
  await download(g.url, join(dir, `${id}.gltf`));
  for (const [rel, f] of Object.entries(g.include ?? {})) await download(f.url, join(dir, rel));
  log.push(`model ${id}`);
}
for (const id of polyTextures) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const dir = join(root, "textures", id);
  for (const [map, out] of [["Diffuse", "diffuse.jpg"], ["nor_gl", "normal.jpg"], ["Rough", "rough.jpg"]]) {
    const entry = files[map]?.["1k"]?.jpg;
    if (entry) await download(entry.url, join(dir, out));
  }
  log.push(`texture ${id}`);
}
await writeFile(join(root, "polyhaven", "LICENSE.txt"), "All Poly Haven assets are CC0 (public domain): https://polyhaven.com/license\n");

// Rigged worker: "Worker" on poly.pizza (https://poly.pizza/m/Yg2bQZO6Hj), CC0 public domain.
const workerFile = join(root, "models", "characters", "worker.glb");
if (await download("https://static.poly.pizza/3a5f3056-ffe6-42eb-bd52-122afcbd22b2.glb", workerFile)) log.push("model worker");
await writeFile(join(root, "models", "characters", "LICENSE-worker.txt"), "\"Worker\" from https://poly.pizza/m/Yg2bQZO6Hj – CC0 1.0 Public Domain.\n");
console.log(log.join("\n"));
