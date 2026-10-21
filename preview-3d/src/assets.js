// Loads the CC0 models, textures and HDRI (all Poly Haven) and prepares them:
// pivot at the centre of the footprint on the floor, shadows, lighter textures.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { MeshoptSimplifier } from "meshoptimizer/simplifier";

const gltfLoader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();

export const TEAL = new THREE.Color("#007782");
export const ORANGE = new THREE.Color("#FF581C");

// Fixes for models that don't come in metres with their origin on the floor.
const SCALE = { steel_frame_shelves_01: 0.1 };

// Downscale a model's textures: the pieces are small on screen, and it keeps
// GPU memory reasonable on phones.
async function shrink(root, max) {
  const seen = new Set(), jobs = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "alphaMap", "emissiveMap"]) {
        const t = m[key];
        if (!t || seen.has(t) || !t.image || t.image.width <= max) continue;
        seen.add(t);
        const k = max / Math.max(t.image.width, t.image.height);
        jobs.push(createImageBitmap(t.image, { resizeWidth: Math.round(t.image.width * k), resizeHeight: Math.round(t.image.height * k), resizeQuality: "high" })
          .then((bmp) => { t.image = bmp; t.needsUpdate = true; }));
      }
    }
  });
  await Promise.all(jobs);
}

// Thin out dense meshes: the scanned models carry far more triangles than they need
// at the size they appear on screen. meshoptimizer keeps UV seams and silhouettes.
async function lighten(root, maxTris = 4000, keep = 0.3, error = 0.01) {
  await MeshoptSimplifier.ready;
  const done = new Set();
  root.traverse((o) => {
    const g = o.geometry;
    if (!o.isMesh || !g?.index || done.has(g)) return;
    done.add(g);
    const tris = g.index.count / 3;
    if (tris <= maxTris) return;
    const pos = g.attributes.position;
    const positions = pos.isInterleavedBufferAttribute ? Float32Array.from({ length: pos.count * 3 }, (_, i) => pos.getComponent(Math.floor(i / 3), i % 3)) : pos.array;
    const target = Math.max(maxTris, Math.floor(tris * keep)) * 3;
    const [indices] = MeshoptSimplifier.simplify(Uint32Array.from(g.index.array), positions, 3, target, error);
    if (indices.length >= 3) g.setIndex(new THREE.BufferAttribute(indices, 1));
  });
}

// A model in a wrapper whose origin is the centre of its footprint at floor level.
export async function model(id, { texSize = 512, shadows = true } = {}) {
  const g = await gltfLoader.loadAsync(`assets/polyhaven/${id}/${id}.gltf`);
  const root = g.scene;
  if (SCALE[id]) root.scale.multiplyScalar(SCALE[id]);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = shadows; o.receiveShadow = true; } });
  await Promise.all([shrink(root, texSize), lighten(root)]);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x; root.position.z -= center.z; root.position.y -= box.min.y;
  const wrap = new THREE.Group();
  wrap.name = id; wrap.userData.model = true; // left alone when static geometry is merged
  wrap.add(root);
  wrap.userData.size = box.getSize(new THREE.Vector3());
  return wrap;
}

// PBR texture set (colour, normal, roughness). `gray` desaturates the colour map,
// e.g. to turn warm photo paving or roof tiles into grey and anthracite ones.
const texCache = new Map();
export async function texture(id, { gray = 0 } = {}) {
  const key = `${id}|${gray}`;
  if (!texCache.has(key)) {
    const base = `assets/textures/${id}/`;
    texCache.set(key, Promise.all(["diffuse.jpg", "normal.jpg", "rough.jpg"].map((f) => texLoader.loadAsync(base + f))).then(([map, normalMap, roughnessMap]) => {
      if (gray) {
        const c = document.createElement("canvas"); c.width = map.image.width; c.height = map.image.height;
        const g = c.getContext("2d"); g.filter = `grayscale(${gray})`; g.drawImage(map.image, 0, 0);
        map.image = c;
      }
      for (const t of [map, normalMap, roughnessMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
      map.colorSpace = THREE.SRGBColorSpace;
      return { map, normalMap, roughnessMap };
    }));
  }
  return texCache.get(key);
}
// A material from a texture set; UVs are expected in metres, `tile` metres per repeat.
export function surface(set, { tile = 1, color = "#ffffff", roughness = 1, normalScale = 1, noMap = false, ...rest } = {}) {
  const t = (tex) => { const c = tex.clone(); c.repeat.set(1 / tile, 1 / tile); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({
    map: noMap ? null : t(set.map), normalMap: t(set.normalMap), roughnessMap: t(set.roughnessMap),
    normalScale: new THREE.Vector2(normalScale, normalScale), color, roughness, ...rest,
  });
}

// HDRI for image-based lighting, plus the direction of its sun (brightest texel).
export async function hdri(id) {
  const tex = await new RGBELoader().setDataType(THREE.FloatType).loadAsync(`assets/hdri/${id}.hdr`);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const { width: w, height: h, data } = tex.image;
  let best = 0, bi = 0;
  for (let i = 0; i < w * h; i++) { const l = data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]; if (l > best) { best = l; bi = i; } }
  // Inverse of three's equirect lookup: u = atan2(z, x) / 2π + 0.5, v = asin(y) / π + 0.5 (row 0 = top).
  const u = ((bi % w) + 0.5) / w, v = 1 - (Math.floor(bi / w) + 0.5) / h;
  const ang = (u - 0.5) * Math.PI * 2, lat = (v - 0.5) * Math.PI;
  const sun = new THREE.Vector3(Math.cos(ang) * Math.cos(lat), Math.sin(lat), Math.sin(ang) * Math.cos(lat));
  return { tex, sun };
}

export const loadImage = (src) => new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
