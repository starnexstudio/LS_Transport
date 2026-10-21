// Downloads the CC0 assets for the 3D preview into ../assets (not committed).
// Everything comes from Poly Haven (polyhaven.com, CC0): furniture and props as
// glTF (1k textures), PBR surface textures (1k) and an HDRI for lighting.
// Run from anywhere: node preview-3d/scripts/fetch-assets.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "assets");

export const models = [
  // Furniture and household contents that get cleared
  "Sofa_01", "modern_arm_chair_01", "mid_century_lounge_chair", "modern_coffee_table_01", "modern_wooden_cabinet",
  "Television_01", "potted_plant_02", "wooden_table_02", "drawer_cabinet", "vintage_suitcase", "wooden_bookshelf_worn",
  "steel_frame_shelves_01", "Ottoman_01", "side_table_tall_01", "GothicCommode_01",
  "painted_wooden_chair_01", "throw_pillows_01", "wicker_basket_02",
  "ceramic_vase_02", "ceramic_vase_03", "ceramic_vase_04", "antique_ceramic_vase_01", "wooden_bowl_01",
  "alarm_clock_01", "standing_picture_frame_01", "standing_picture_frame_02", "hanging_picture_frame_01", "hanging_picture_frame_02",
];
// Room walls and floor; the truck's cargo floor and tail lift
const textures = ["beige_wall_002", "herringbone_parquet", "metal_plate", "ash_veneer"];
const hdri = "kloofendal_48d_partly_cloudy_puresky";

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
