// The scene: one living room shown as a cutaway (front and right walls removed),
// packed full for the move, standing on the page's teal like a model.
// Units are metres; +x right (towards the van), +z towards the camera.
import * as THREE from "three";
import { texture, surface } from "./assets.js";
import { mergeStatic } from "./merge.js";

// Inside of the room: x0..x1 across, z0 (back wall) ..z1 (open front), floor top F,
// walls H high and t thick. The right side (x1) is open towards the van.
export const ROOM = { x0: -6.0, x1: 0.0, z0: -4.2, z1: 0.6, F: 0.3, H: 2.7, t: 0.2 };

// Soft contact shadow: a blurred dark rounded rectangle lying on the ground, the
// ambient occlusion where a footprint meets the floor that the sun's shadow misses.
export function contactShadow(w, d, x, z, strength = 0.5) {
  const res = 256, pad = 0.18, c = document.createElement("canvas");
  c.width = c.height = res;
  const g = c.getContext("2d");
  g.filter = `blur(${res * 0.05}px)`;
  g.fillStyle = "#00262c";
  const m = res * pad;
  g.beginPath(); g.roundRect(m, m, res - 2 * m, res - 2 * m, res * 0.06); g.fill();
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: strength, depthWrite: false, toneMapped: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w / (1 - 2 * pad), d / (1 - 2 * pad)), mat);
  plane.rotation.x = -Math.PI / 2; plane.position.set(x, 0.004, z); plane.renderOrder = -1;
  return plane;
}

// Box whose UVs are in metres on every face, so tiled textures keep their scale.
function blockGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * faces[f][0], uv.getY(i) * faces[f][1]); }
  return g;
}
function block(w, h, d, mat, x, y, z, parent, { cast = true } = {}) {
  const m = new THREE.Mesh(blockGeo(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true;
  parent.add(m);
  return m;
}

export async function buildWorld(scene) {
  const [paintT, parquet] = await Promise.all([texture("beige_wall_002"), texture("herringbone_parquet")]);
  const M = {
    paint: surface(paintT, { tile: 2.0, color: "#f5f2ec", roughness: 0.95, normalScale: 0.3, noMap: true }),
    floor: surface(parquet, { tile: 1.3, roughness: 0.55 }),
    cut: new THREE.MeshStandardMaterial({ color: "#d9d3c9", roughness: 0.95 }),
    slab: new THREE.MeshStandardMaterial({ color: "#c7c0b4", roughness: 0.95 }),
    trim: new THREE.MeshStandardMaterial({ color: "#f4f3ef", roughness: 0.5 }),
  };
  const world = new THREE.Group(); world.name = "World"; scene.add(world);
  const { x0, x1, z0, z1, F, H, t } = ROOM;

  // ---------- Ground: invisible, it only catches shadows; the page's teal shows through ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.ShadowMaterial({ color: "#00313a", opacity: 0.5 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  world.add(contactShadow(x1 - x0 + t + 0.6, z1 - z0 + t + 0.6, (x0 - t + x1) / 2, (z0 - t + z1) / 2, 0.6));

  // ---------- The room: floor slab and two walls, with their cut edges showing ----------
  // Box faces: +x, −x, +y, −y, +z, −z.
  block(x1 - x0 + t, F, z1 - z0 + t, [M.slab, M.slab, M.floor, M.slab, M.slab, M.slab], (x0 - t + x1) / 2, F / 2, (z0 - t + z1) / 2, world);
  block(x1 - x0 + t, H, t, [M.cut, M.cut, M.cut, M.cut, M.paint, M.paint], (x0 - t + x1) / 2, F + H / 2, z0 - t / 2, world); // back
  block(t, H, z1 - z0, [M.paint, M.paint, M.cut, M.cut, M.cut, M.cut], x0 - t / 2, F + H / 2, (z0 + z1) / 2, world); // left
  // Skirting boards, a switch and two sockets
  block(x1 - x0, 0.07, 0.015, M.trim, (x0 + x1) / 2, F + 0.035, z0 + 0.008, world);
  block(0.015, 0.07, z1 - z0, M.trim, x0 + 0.008, F + 0.035, (z0 + z1) / 2, world);
  block(0.08, 0.08, 0.012, M.trim, x1 - 0.35, F + 1.05, z0 + 0.006, world);
  for (const z of [-3.35, 0.15]) block(0.012, 0.075, 0.075, M.trim, x0 + 0.006, F + 0.3, z, world);

  mergeStatic(world);
  return { world, M };
}
