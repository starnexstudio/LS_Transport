// Merges static meshes under a root into one mesh per material, which cuts the
// draw calls of the procedural house, street and truck from hundreds to dozens.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Only position, normal and uv survive, all non-indexed, so any primitives combine.
function clean(g) {
  const n = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
  if (!n.attributes.uv) n.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
  n.clearGroups();
  return n;
}
function slice(g, start, count) {
  const out = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(g.attributes)) out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize));
  return out;
}

// skip(object) → true keeps that object (and everything under it) as it is.
export function mergeStatic(root, skip = () => false) {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  const buckets = new Map(), done = [];
  const visit = (o) => {
    if (o !== root && skip(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible) {
      const m = o.matrixWorld.clone().premultiply(toRoot);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const base = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      const groups = Array.isArray(o.material) && o.geometry.groups.length ? o.geometry.groups : [{ start: 0, count: base.attributes.position.count, materialIndex: 0 }];
      for (const grp of groups) {
        const mat = mats[grp.materialIndex ?? 0];
        const piece = clean(slice(base, grp.start, Math.min(grp.count, base.attributes.position.count - grp.start)));
        piece.applyMatrix4(m);
        const key = `${mat.uuid}|${o.castShadow}|${o.receiveShadow}`;
        if (!buckets.has(key)) buckets.set(key, { mat, cast: o.castShadow, receive: o.receiveShadow, list: [] });
        buckets.get(key).list.push(piece);
      }
      done.push(o);
    }
    for (const c of [...o.children]) visit(c);
  };
  visit(root);
  for (const o of done) { o.parent.remove(o); if (o.children.length) for (const c of [...o.children]) root.attach(c); }
  for (const { mat, cast, receive, list } of buckets.values()) {
    const mesh = new THREE.Mesh(mergeGeometries(list), mat);
    mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.name = `merged ${mat.name || mat.type}`;
    root.add(mesh);
  }
  return root;
}
