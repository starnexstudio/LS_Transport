// Loads the CC0 models and textures and prepares them for the scene:
// real-world scale, L&S colours, shadows, and separate trolley wheels.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const gltfLoader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const load = (url) => new Promise((resolve, reject) => gltfLoader.load(url, resolve, undefined, reject));

export const TEAL = new THREE.Color("#007782");
export const ORANGE = new THREE.Color("#FF581C");

function shadows(root) {
  root.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return root;
}

// Scale so the model's height (or another axis) matches a real size in metres,
// and move its pivot to the centre of its footprint at floor level.
export function normalize(root, { height, length, axis = "y" }) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const s = height ? height / size.y : length / size[axis];
  root.scale.multiplyScalar(s);
  box.setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x; root.position.z -= center.z; root.position.y -= box.min.y;
  const wrap = new THREE.Group();
  wrap.add(root);
  wrap.userData.size = box.getSize(new THREE.Vector3());
  return wrap;
}

export async function texture(id, repeat = [1, 1], { srgb = true } = {}) {
  const base = `assets/textures/${id}/`;
  const set = (t, color) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 4;
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const [map, normalMap, roughnessMap] = await Promise.all(
    ["diffuse.jpg", "normal.jpg", "rough.jpg"].map((f) => texLoader.loadAsync(base + f)),
  );
  return { map: set(map, srgb), normalMap: set(normalMap), roughnessMap: set(roughnessMap) };
}

// Kenney's van palette: greens become white (light) or L&S orange (dark).
function recolourPalette(tex) {
  const img = tex.image;
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    if (g > r + 0.08 && g > b + 0.03) {
      const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      if (l > 0.42) { const w = 0.86 + 0.14 * Math.min(1, (l - 0.42) / 0.4); d[i] = d[i + 1] = d[i + 2] = w * 255; }
      else { const k = 0.55 + l; d[i] = 255 * Math.min(1, k); d[i + 1] = 88 * k; d[i + 2] = 28 * k; }
    }
  }
  ctx.putImageData(data, 0, 0);
  const out = new THREE.CanvasTexture(canvas);
  out.flipY = tex.flipY; out.colorSpace = THREE.SRGBColorSpace; out.magFilter = tex.magFilter; out.minFilter = tex.minFilter;
  return out;
}

// Split a single-mesh hand truck into body and two wheels (triangles near the axle).
function splitTrolley(root) {
  const mesh = []; root.traverse((o) => { if (o.isMesh) mesh.push(o); });
  const src = mesh[0];
  const geo = src.geometry.index ? src.geometry.toNonIndexed() : src.geometry.clone();
  geo.applyMatrix4(src.matrixWorld);
  const pos = geo.attributes.position;
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const size = box.getSize(new THREE.Vector3());
  // Wheels sit at the bottom-back; find them as the lowest band of geometry.
  const wheelTop = box.min.y + size.y * 0.2;
  const keep = { body: [], left: [], right: [] };
  const midX = (box.min.x + box.max.x) / 2;
  for (let t = 0; t < pos.count; t += 3) {
    let maxY = -Infinity, cx = 0;
    for (let k = 0; k < 3; k++) { maxY = Math.max(maxY, pos.getY(t + k)); cx += pos.getX(t + k) / 3; }
    const wheelSide = Math.abs(cx - midX) > size.x * 0.28;
    const bucket = maxY < wheelTop && wheelSide ? (cx < midX ? "left" : "right") : "body";
    keep[bucket].push(t);
  }
  const build = (tris) => {
    const g = new THREE.BufferGeometry();
    for (const name of Object.keys(geo.attributes)) {
      const a = geo.attributes[name]; const arr = new a.array.constructor(tris.length * 3 * a.itemSize);
      tris.forEach((t, j) => { for (let k = 0; k < 3; k++) for (let c = 0; c < a.itemSize; c++) arr[(j * 3 + k) * a.itemSize + c] = a.array[(t + k) * a.itemSize + c]; });
      g.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize));
    }
    return g;
  };
  const group = new THREE.Group();
  const body = new THREE.Mesh(build(keep.body), src.material); group.add(body);
  const wheels = [];
  for (const side of ["left", "right"]) {
    if (!keep[side].length) continue;
    const g = build(keep[side]); g.computeBoundingBox();
    const c = g.boundingBox.getCenter(new THREE.Vector3());
    g.translate(-c.x, -c.y, -c.z);
    const w = new THREE.Mesh(g, src.material); w.name = `trolley-wheel-${side}`; w.position.copy(c); group.add(w); wheels.push(w);
  }
  group.userData.wheels = wheels;
  group.userData.wheelRadius = wheels.length ? new THREE.Box3().setFromObject(wheels[0]).getSize(new THREE.Vector3()).y / 2 : 0.12;
  return shadows(group);
}

export async function loadAll() {
  const [worker, van, sofa, chair, wardrobe, box, trolley] = await Promise.all([
    load("assets/models/characters/worker.glb"),
    load("assets/models/vehicles/delivery.glb"),
    load("assets/polyhaven/Sofa_01/Sofa_01.gltf"),
    load("assets/polyhaven/ArmChair_01/ArmChair_01.gltf"),
    load("assets/polyhaven/painted_wooden_cabinet_02/painted_wooden_cabinet_02.gltf"),
    load("assets/polyhaven/cardboard_box_01/cardboard_box_01.gltf"),
    load("assets/polyhaven/hand_truck/hand_truck.gltf"),
  ]);

  // Worker uniform in L&S colours.
  worker.scene.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map((m) => {
      const c = m.clone();
      if (m.name === "Worker_Vest") c.color.copy(TEAL);
      if (m.name === "Worker_Yellow") c.color.copy(ORANGE);
      if (m.name === "LightBrown") c.color.set("#0b4f56");
      if (m.name === "Brown" || m.name === "Brown2") c.color.set("#2d3436");
      return c;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
    o.castShadow = true; o.frustumCulled = false;
  });

  // Van: delivery body in white with orange trim.
  van.scene.traverse((o) => {
    if (o.isMesh && o.material.map) { o.material = o.material.clone(); o.material.map = recolourPalette(o.material.map); }
  });
  shadows(van.scene);

  const prepped = {
    workerGltf: worker,
    van: van.scene,
    sofa: normalize(shadows(sofa.scene), { length: 1.9, axis: "x" }),
    chair: normalize(shadows(chair.scene), { height: 0.95 }),
    wardrobe: normalize(shadows(wardrobe.scene), { height: 2.0 }),
    box: normalize(shadows(box.scene), { height: 0.36 }),
    trolley: null,
  };
  trolley.scene.updateMatrixWorld(true);
  prepped.trolley = normalize(splitTrolley(trolley.scene), { height: 1.25 });
  return prepped;
}

// A new worker instance with its own skeleton and animation mixer.
export function makeWorker(assets) {
  const root = cloneSkinned(assets.workerGltf.scene);
  const mixer = new THREE.AnimationMixer(root);
  const clip = (name) => assets.workerGltf.animations.find((a) => a.name.endsWith("|" + name));
  return { root, mixer, clips: { walk: clip("Walk"), idle: clip("Idle_Neutral") || clip("Idle"), interact: clip("Interact") } };
}

export { cloneSkinned };
