// Prints the node tree, animation clips and bounds of GLB files (no dependencies).
// Usage: node inspect-glb.mjs <file.glb> [...]
import { readFileSync } from "node:fs";

for (const file of process.argv.slice(2)) {
  const buf = readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const nodes = gltf.nodes ?? [];
  const lines = [];
  const walk = (i, depth) => {
    const n = nodes[i];
    const extra = [n.mesh != null ? "mesh" : "", n.skin != null ? "skin" : "", n.translation ? `t=${n.translation.map((v) => v.toFixed(2)).join(",")}` : ""].filter(Boolean).join(" ");
    lines.push(`${"  ".repeat(depth)}${n.name ?? "(node " + i + ")"} ${extra}`);
    (n.children ?? []).forEach((c) => walk(c, depth + 1));
  };
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? [];
  roots.forEach((r) => walk(r, 0));
  const anims = (gltf.animations ?? []).map((a) => a.name);
  const mins = [], maxs = [];
  for (const m of gltf.meshes ?? []) for (const p of m.primitives) {
    const acc = gltf.accessors[p.attributes.POSITION];
    if (acc.min) { mins.push(acc.min); maxs.push(acc.max); }
  }
  const bound = (arr, f) => [0, 1, 2].map((k) => f(...arr.map((v) => v[k])).toFixed(2));
  console.log(`\n=== ${file.split(/[\\/]/).pop()}  nodes=${nodes.length} skins=${(gltf.skins ?? []).length} anims=${anims.length}`);
  console.log(`mesh bounds min=${mins.length ? bound(mins, Math.min) : "-"} max=${maxs.length ? bound(maxs, Math.max) : "-"}`);
  if (anims.length) console.log("animations:", anims.join(", "));
  console.log(lines.slice(0, Number(process.env.MAXLINES ?? 60)).join("\n"));
}
