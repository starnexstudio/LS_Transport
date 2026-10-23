// Loads the hero scene's CC0 models, textures and HDRI (all Poly Haven) from
// public/hero-3d, the compact web copy built by preview-3d/scripts/build-web-assets.mjs
// (models as meshopt-compressed GLB with WebP textures), and prepares them: pivot at
// the centre of the footprint on the floor, shadows, clear picture glass.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { mergeStatic } from "./merge.js";

const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();

// The site may be served from a subpath (GitHub Pages); the scene sets it once.
let base = "";
export const setAssetBase = (path) => { base = path; };
export const assetUrl = (path) => `${base}${path}`;

// Fixes for models that don't come in metres with their origin on the floor.
const SCALE = { steel_frame_shelves_01: 0.1 };

// A model in a wrapper whose origin is the centre of its footprint at floor level.
export async function model(id, { shadows = true } = {}) {
  const g = await gltfLoader.loadAsync(assetUrl(`/hero-3d/models/${id}.glb`));
  const root = g.scene;
  if (SCALE[id]) root.scale.multiplyScalar(SCALE[id]);
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = shadows; o.receiveShadow = true;
    // Picture glass: its colour map has no alpha here, so it would cover the artwork
    // in flat white; make it a thin clear pane that only catches reflections.
    if (/glass/i.test(o.material.name)) {
      Object.assign(o.material, { map: null, transparent: true, opacity: 0.1, roughness: 0.04, metalness: 0, depthWrite: false, envMapIntensity: 0.3 });
      o.material.color.set("#ffffff"); o.castShadow = false;
    }
  });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x; root.position.z -= center.z; root.position.y -= box.min.y;
  const wrap = new THREE.Group();
  wrap.name = id; wrap.userData.model = true; // left alone when static geometry is merged
  wrap.add(root);
  wrap.userData.size = box.getSize(new THREE.Vector3());
  // One mesh per material: a model's parts never move apart, and fewer meshes mean
  // fewer draw calls every frame. Parts with vertex colours stay as they are.
  mergeStatic(wrap, (o) => !!o.geometry?.attributes.color);
  return wrap;
}

// PBR texture set (colour, normal, roughness).
const texCache = new Map();
export async function texture(id) {
  if (!texCache.has(id)) {
    const dir = `/hero-3d/textures/${id}/`;
    texCache.set(id, Promise.all(["diffuse.webp", "normal.webp", "rough.webp"].map((f) => texLoader.loadAsync(assetUrl(dir + f)))).then(([map, normalMap, roughnessMap]) => {
      for (const t of [map, normalMap, roughnessMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
      map.colorSpace = THREE.SRGBColorSpace;
      return { map, normalMap, roughnessMap };
    }));
  }
  return texCache.get(id);
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
  const tex = await new RGBELoader().setDataType(THREE.FloatType).loadAsync(assetUrl(`/hero-3d/hdri/${id}.hdr`));
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
