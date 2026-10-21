// Master timeline. Everything is a pure function of time t (seconds), so any
// scroll position maps to one exact state and scrolling up replays it backwards.
import * as THREE from "three";
import { Worker } from "./rig.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0), XAXIS = V(1, 0, 0), ZAXIS = V(0, 0, 1);
const ease = (u) => u * u * (3 - 2 * u);
const clamp01 = (u) => Math.min(1, Math.max(0, u));
const lerp = THREE.MathUtils.lerp;
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const fwd = (yaw) => V(Math.sin(yaw), 0, Math.cos(yaw));
const qAxis = (axis, a) => new THREE.Quaternion().setFromAxisAngle(axis, a);
const qYaw = (a) => qAxis(UP, a);
// Yaw of a frame whose +x points along d (carry frames: +x towards the front carrier).
const frameYaw = (d) => Math.atan2(-d.z, d.x);
const lerpAngle = (a, b, u) => a + ((((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * u;
const slope = (back, front) => Math.atan2(front.y - back.y, Math.hypot(front.x - back.x, front.z - back.z));
const P3 = (v, w) => (w == null ? [v.x, v.y, v.z] : [v.x, v.y, v.z, w]);
// Inverse of ease() on [0, 1].
const invEase = (v) => { let a = 0, b = 1; for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (ease(m) < v) a = m; else b = m; } return (a + b) / 2; };
// Shift waypoints sideways so two people walking the same way don't overlap.
const lane = (pts, d) => pts.map((q, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1;
  return [q[0] + (dz / l) * d, q[1], q[2] - (dx / l) * d, q[3]];
});

// Polyline with per-segment time weights (hidden stretches go faster).
export class Path {
  constructor(points) {
    this.p = points.map((q) => V(q[0], q[1], q[2]));
    this.w = points.map((q) => q[3] ?? 1);
    this.cum = [0]; this.tcum = [0];
    for (let i = 1; i < this.p.length; i++) {
      const d = this.p[i].distanceTo(this.p[i - 1]);
      this.cum.push(this.cum[i - 1] + d);
      this.tcum.push(this.tcum[i - 1] + d * this.w[i]);
    }
    this.length = this.cum.at(-1); this.tlength = this.tcum.at(-1);
  }
  at(s, out = new THREE.Vector3()) {
    s = Math.min(this.length, Math.max(0, s));
    let i = 1; while (i < this.cum.length - 1 && this.cum[i] < s) i++;
    const seg = this.cum[i] - this.cum[i - 1] || 1;
    return out.lerpVectors(this.p[i - 1], this.p[i], (s - this.cum[i - 1]) / seg);
  }
  // Arc length reached after a share u of the path's travel time.
  sAtTime(u) { return this.sAtT(clamp01(u) * this.tlength); }
  sAtT(tt) {
    tt = Math.min(this.tlength, Math.max(0, tt));
    let i = 1; while (i < this.tcum.length - 1 && this.tcum[i] < tt) i++;
    const seg = this.tcum[i] - this.tcum[i - 1] || 1;
    return this.cum[i - 1] + (this.cum[i] - this.cum[i - 1]) * (tt - this.tcum[i - 1]) / seg;
  }
  timeAt(s) {
    s = Math.min(this.length, Math.max(0, s));
    let i = 1; while (i < this.cum.length - 1 && this.cum[i] < s) i++;
    return this.tcum[i - 1] + (s - this.cum[i - 1]) * this.w[i];
  }
  nearest(p) {
    let best = 0, bd = Infinity;
    for (let s = 0; s <= this.length; s += 0.02) { const d = this.at(s).distanceTo(p); if (d < bd) { bd = d; best = s; } }
    return best;
  }
  // Point at arc length x, extrapolated straight beyond both ends.
  ext(x) {
    if (x < 0) return this.p[0].clone().add(this.p[0].clone().sub(this.p[1]).normalize().multiplyScalar(-x));
    if (x > this.length) return this.p.at(-1).clone().add(this.p.at(-1).clone().sub(this.p.at(-2)).normalize().multiplyScalar(x - this.length));
    return this.at(x);
  }
  // Point ahead (dir +1) or behind (dir -1) of s at straight-line distance d,
  // so two carriers stay exactly one object length apart on curves too.
  chord(s, d, dir) {
    const c = this.ext(s);
    let near = s, far = s + dir * d * 4;
    for (let k = 0; k < 32; k++) {
      const m = (near + far) / 2;
      if (this.ext(m).distanceTo(c) < d) near = m; else far = m;
    }
    return this.ext((near + far) / 2);
  }
}

export function buildSequence(ctx) {
  const { scene, assets, van, H } = ctx;
  const F0 = H.floor0, F1 = H.floor1, G = 0.05;
  const REACH = Worker.reach, HAND = 0.74, SPEED = 1.5;

  // ---------- Van: parked nose-first in the drive, rear and ramp towards the street ----------
  const parked = { pos: V(-11.5, 0, -3.81), yaw: Math.PI };
  van.scale.set(1.6, 1.9, 1.9); // Kenney's delivery truck stretched to removal-van size; wheels stay round
  van.position.copy(parked.pos); van.rotation.set(0, parked.yaw, 0); scene.add(van); van.updateMatrixWorld(true);
  const door = van.getObjectByName("door");
  const vanWheels = ["wheel-front-left", "wheel-front-right", "wheel-back-left", "wheel-back-right"].map((n) => van.getObjectByName(n));
  for (const w of vanWheels) w.rotation.order = "YXZ"; // steer, then roll
  const WHEEL_R = 0.3 * van.scale.y;
  const hit = new THREE.Raycaster(van.localToWorld(V(0, 1.3, -0.9)), V(0, -1, 0), 0, 3).intersectObject(van, true).find((h) => h.object.name !== "door");
  const FY = hit ? hit.point.y : 0.5 * van.scale.y;            // cargo floor
  const REAR = -1.48 * van.scale.z, FRONT = 0.2 * van.scale.z; // cargo opening and front wall (van-local z, metres)
  // Van-local metres (x right, z forward) to world, for a van pose.
  const toW = (p, f = parked) => p.clone().applyAxisAngle(UP, f.yaw).add(f.pos);
  const qW = (q, f = parked) => qYaw(f.yaw).multiply(q);

  // Aluminium loading ramp; slides under the cargo floor before the door closes.
  const RUN = 2.4, rampLen = Math.hypot(RUN, FY - G);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, rampLen), new THREE.MeshStandardMaterial({ color: "#c3c8cb", metalness: 0.55, roughness: 0.4 }));
  ramp.castShadow = ramp.receiveShadow = true; scene.add(ramp);
  const rampOut = { p: V(0, (FY + G) / 2, REAR - RUN / 2), q: qAxis(XAXIS, -Math.atan2(FY - G, RUN)) };
  const rampMid = { p: V(0, FY - 0.08, REAR - rampLen / 2 + 0.05), q: new THREE.Quaternion() };
  const rampIn = { p: V(0, FY - 0.08, REAR + rampLen / 2 + 0.1), q: new THREE.Quaternion() };
  const foot = toW(V(0, G, REAR - RUN)), rear = toW(V(0, FY, REAR));

  // ---------- Actors ----------
  const workers = ["Worker A", "Worker B", "Worker C"].map((n) => { const w = new Worker(assets, n); scene.add(w.root); return w; });
  const [A, B, C] = workers; // A+B carry furniture, C runs the hand truck
  const trolley = assets.trolley.clone(); scene.add(trolley);
  const trolleyWheels = ["trolley-wheel-left", "trolley-wheel-right"].map((n) => trolley.getObjectByName(n)).filter(Boolean);
  trolley.updateMatrixWorld(true);
  const wheelR = trolleyWheels.length ? new THREE.Box3().setFromObject(trolleyWheels[0]).getSize(new THREE.Vector3()).y / 2 : 0.12;
  // Poly Haven hand truck: nose plate towards local +z, wheels and handles at the back.
  const NOSE = V(0, 0.03, 0.15), NOSE_FWD = 0.15, AXLE = V(0, 0.085, -0.22);
  const GRIP_L = V(0.18, 1.19, -0.2), GRIP_R = V(-0.18, 1.19, -0.2);
  const dC = (tilt) => 0.6 + 1.1 * Math.sin(tilt); // worker to hand truck: further back the more it leans
  const stackOnNose = qYaw(Math.PI / 2);           // stacks ride with their long side across the nose plate

  // Items: a holder whose origin is the item's bounding-box centre.
  const items = {};
  const addItem = (key, name, src, home, yaw, opts = {}) => {
    const o = new THREE.Group(); o.name = name;
    const size = src.userData.size.clone();
    const inner = src.clone(); inner.position.y = -size.y / 2; o.add(inner);
    scene.add(o);
    items[key] = { key, name, o, size, home, yaw, ...opts };
  };
  const BOX = assets.box.userData.size;
  const addStack = (key, name, home, n = 3) => {
    const o = new THREE.Group(); o.name = name;
    const h = n * BOX.y;
    for (let i = 0; i < n; i++) { const b = assets.box.clone(); b.position.y = i * BOX.y - h / 2; b.rotation.y = (i % 2) * 0.1 - 0.05; o.add(b); }
    scene.add(o);
    items[key] = { key, name, o, size: V(BOX.x, h, BOX.z), home, yaw: 0, stack: true };
  };
  addItem("sofa", "Sofa", assets.sofa, V(-4.3, F0, -4.25), 0, { gripY: (e) => -e + 0.15, lane: 0.28 });
  addItem("chair", "Armchair", assets.chair, V(-3.3, F0, -1.9), 0, { gripY: (e) => -e + 0.32, lane: 0.24 });
  addItem("wardA", "Cabinet A", assets.wardrobe, V(-4.9, F1, -4.4), 0, { tip: true, startAhead: 1.45, sideB: 0.62, gripY: () => 0, lane: 0.3 });
  addItem("wardB", "Cabinet B", assets.wardrobe, V(-3.0, F1, -4.4), 0, { tip: true, startAhead: 1.45, sideB: -0.62, gripY: () => -0.2, lane: 0.3 });
  addStack("boxA", "Boxes A", V(-4.0, F0, -0.6));
  addStack("boxB", "Boxes B", V(-5.4, F0, -2.0));
  addStack("boxU", "Boxes upstairs", V(-4.0, F1, -1.2));
  const homePose = (it) => ({ pos: it.home.clone().add(V(0, it.size.y / 2, 0)), quat: qYaw(it.yaw) });

  // ---------- Cargo layout (van-local metres) ----------
  const hS = 3 * BOX.y, rowZ = FRONT - BOX.x / 2 - 0.02;
  const slots = {
    boxA: { p: V(-0.57, FY + hS / 2, rowZ), q: qYaw(Math.PI / 2) },
    boxB: { p: V(0.57, FY + hS / 2, rowZ), q: qYaw(Math.PI / 2) },
    boxU: { p: V(0, FY + hS / 2, rowZ), q: qYaw(Math.PI / 2) },
  };
  const behindBoxes = FRONT - BOX.x - 0.06;
  const qEntry = qYaw(-Math.PI / 2); // carry frame → van, when carried in front carrier first

  // ---------- Routes (world, feet height; 4th value = time weight) ----------
  const hallDown = [[-6.5, F0, 0.2], [-7.1, F0, 0.2, 0.25]];
  const stairsDown = [[-6.5, F1, 0.2], [-7.4, F1, 0.2, 0.25], [-8.35, F1, -0.4, 0.25], [-8.35, F0, -3.6, 0.2], [-7.6, F0, -3.6, 0.25], [-7.1, F0, 0.2, 0.25]];
  const toFoot = [[-7.1, F0, 0.85, 0.6], [-7.1, 0.16, 1.4], [-7.1, G, 2.2], [-7.5, G, 2.5], [-10.2, G, 2.5], [-11.1, G, 2.15], P3(foot)];
  const inVan = (x, z) => [P3(rear), P3(toW(V(x, FY, z)))];
  const stackIn = (slot) => [P3(rear), P3(toW(V(slot.p.x, FY, slot.p.z - 0.9))), P3(toW(V(slot.p.x, FY, slot.p.z - NOSE_FWD)))];
  const routes = {
    sofa: new Path([[-2.6, F0, -4.25], [-5.5, F0, -4.25], [-5.95, F0, -3.5], [-5.95, F0, -0.4], ...hallDown, ...toFoot, ...inVan(0, behindBoxes - 0.3)]),
    chair: new Path([[-3.3, F0, -1.9], [-5.95, F0, -0.5], ...hallDown, ...toFoot, ...inVan(0, -1.7)]),
    wardA: new Path([[-4.9, F1, -4.9], [-4.9, F1, -1.2], [-5.6, F1, -0.4], ...stairsDown, ...toFoot, ...inVan(0, behindBoxes - 0.3)]),
    wardB: new Path([[-3.0, F1, -4.9], [-3.0, F1, -2.6], [-5.4, F1, -0.6], ...stairsDown, ...toFoot, ...inVan(0, behindBoxes - 0.3)]),
    boxA: new Path([[-4.0, F0, -0.6], [-5.9, F0, 0.0], ...hallDown, ...toFoot, ...stackIn(slots.boxA)]),
    boxB: new Path([[-5.4, F0, -2.0], [-5.95, F0, -1.0], ...hallDown, ...toFoot, ...stackIn(slots.boxB)]),
    boxU: new Path([[-4.0, F1, -1.2], [-5.95, F1, -0.3], ...stairsDown, ...toFoot, ...stackIn(slots.boxU)]),
  };
  // Back from the van into the house (lane-shifted per walker) and on to either floor.
  const yardIn = [[-11.1, G, 2.15], [-10.2, G, 2.5], [-7.5, G, 2.5], [-7.1, G, 2.2], [-7.1, 0.16, 1.4], [-7.1, F0, 0.85], [-7.1, F0, 0.2, 0.6]];
  const room0 = [[-6.5, F0, 0.2, 0.25]];
  const room1 = [[-7.6, F0, -3.6, 0.25], [-8.35, F0, -3.6, 0.25], [-8.35, F1, -0.4, 0.2], [-7.4, F1, 0.2, 0.25], [-6.5, F1, 0.2, 0.25]];
  const local = (p) => p.clone().sub(parked.pos).applyAxisAngle(UP, -parked.yaw);
  // Out of the cargo area and down the ramp, from wherever someone stands.
  const outOfVan = (p) => {
    const l = local(p), pts = [P3(p)];
    if (l.z > REAR + 0.05 && Math.abs(l.x) < 1.3) pts.push(P3(toW(V(0, FY, l.z))), P3(toW(V(0, FY, REAR - 0.05))));
    if (l.z > REAR - RUN && Math.abs(l.x) < 1.3) pts.push(P3(foot));
    return pts;
  };

  // ---------- Schedule ----------
  const segs = [], phases = []; // phases: start times per trip, for tests
  const seg = (t0, dur, run) => { segs.push({ t0, t1: t0 + dur, run }); return t0 + dur; };
  const walkTime = (p) => p.tlength / SPEED;
  const dirAt = (route, s) => route.ext(s + 0.3).sub(route.ext(s - 0.3)).setY(0).normalize();

  // Carry frame: item orientation relative to a frame with +x towards the front carrier.
  const carrySetup = (it, dir0) => {
    let q = qYaw(it.yaw);
    if (it.tip) q = qAxis(V().crossVectors(UP, dir0).normalize(), Math.PI / 2).multiply(q); // tipped over towards the front carrier
    const carryQ = qYaw(-frameYaw(dir0)).multiply(q);
    const m = new THREE.Matrix4().makeRotationFromQuaternion(carryQ).elements;
    const h = it.size.clone().multiplyScalar(0.5);
    const ext = (r) => Math.abs(m[r]) * h.x + Math.abs(m[r + 4]) * h.y + Math.abs(m[r + 8]) * h.z;
    return { carryQ, extX: ext(0), extY: ext(1), extZ: ext(2) };
  };
  // Hand positions [left, right] for the front or back carrier, from the item's current pose.
  const gripsAt = (pose, it, cs, front) => {
    const sx = front ? 1 : -1;
    const frame = pose.quat.clone().multiply(cs.carryQ.clone().invert());
    const p = (z) => V(sx * (cs.extX - 0.03), it.gripY(cs.extY), z).applyQuaternion(frame).add(pose.pos);
    return [p(sx * it.lane), p(-sx * it.lane)];
  };
  const carryPose = (route, s, half, it, cs) => {
    const fp = route.chord(s, half, +1), bp = route.chord(s, half, -1);
    const d = fp.clone().sub(bp);
    const frame = qYaw(frameYaw(d)).multiply(qAxis(ZAXIS, Math.atan2(d.y, Math.hypot(d.x, d.z))));
    const pos = fp.clone().add(bp).multiplyScalar(0.5); pos.y += HAND - it.gripY(cs.extY);
    return { fp, bp, pose: { pos, quat: frame.multiply(cs.carryQ) } };
  };
  const prevOf = (st, w) => st[w.root.name] ?? {};

  // Two carriers: walk in, lift (tipping cabinets over), carry, set into the van.
  const pairTrip = (t, key, fromA, fromB, viaA, viaB, upstairs) => {
    const it = items[key], route = routes[key];
    const sHome = route.nearest(it.home);
    const dir0 = dirAt(route, sHome);
    if (!it.tip) it.yaw = frameYaw(dir0) + Math.PI; // stands square to the way out
    const cs = carrySetup(it, dir0);
    const half = cs.extX + REACH;
    const s0 = sHome + (it.startAhead ?? 0);
    const start = carryPose(route, s0, half, it, cs);
    const hp = homePose(it);
    const perp = V(dir0.z, 0, -dir0.x);
    const standB = it.tip ? it.home.clone().addScaledVector(dir0, 0.35).addScaledVector(perp, it.sideB) : start.bp;
    const room = upstairs ? room1 : room0;
    const pA = new Path([...fromA, ...lane(yardIn, 0.22), ...room, ...viaA, P3(start.fp)]);
    const pB = new Path([...fromB, ...lane(yardIn, -0.22), ...room, ...viaB, P3(standB)]);
    const dA = walkTime(pA), dB = walkTime(pB), d0 = Math.max(dA, dB) + 0.3;
    const ph = { key, approach: t }; phases.push(ph);
    t = seg(t, d0, (u, st) => {
      for (const [w, p, d, face] of [[A, pA, dA, start.pose.pos], [B, pB, dB, hp.pos]]) {
        const prev = prevOf(st, w);
        const k = clamp01((u * d0) / d), s = p.sAtTime(ease(k)), pos = p.at(s);
        const yw = s < p.length - 0.31 ? yawTo(pos, p.at(Math.min(p.length, s + 0.3))) : yawTo(pos, face);
        st[w.root.name] = { pos, yaw: prev.yaw == null ? yw : lerpAngle(prev.yaw, yw, clamp01(u * 10)), dist: (prev.dist ?? 0) + s, moving: k < 0.98 ? 1 : 0 };
      }
    });
    // Lift: the item moves from where it stands into the carry pose.
    ph.lift = t;
    t = seg(t, 1.5, (u, st) => {
      const e = ease(u), pa = prevOf(st, A), pb = prevOf(st, B);
      const pose = { pos: hp.pos.clone().lerp(start.pose.pos, e), quat: hp.quat.clone().slerp(start.pose.quat, e) };
      st[it.name] = pose;
      const kB = ease(clamp01((u - 0.15) / 0.85)), bpos = standB.clone().lerp(start.bp, kB);
      const ik = ease(clamp01(u * 2.5));
      st[A.root.name] = { pos: start.fp, yaw: yawTo(start.fp, start.bp), dist: pa.dist, moving: 0, ik, grips: gripsAt(pose, it, cs, true) };
      st[B.root.name] = { pos: bpos, yaw: yawTo(bpos, pose.pos), dist: pb.dist + kB * standB.distanceTo(start.bp), moving: it.tip ? Math.sin(Math.PI * kB) : 0, ik, grips: gripsAt(pose, it, cs, false) };
    });
    // Carry: centre follows the route; the carriers stay rigidly at both ends.
    const sEnd = route.length - half - 0.02;
    const T0 = route.timeAt(s0), TE = route.timeAt(sEnd);
    ph.carry = t;
    t = seg(t, (TE - T0) / SPEED + 0.4, (u, st) => {
      const pa = prevOf(st, A), pb = prevOf(st, B);
      const s = route.sAtT(lerp(T0, TE, ease(u)));
      const c = carryPose(route, s, half, it, cs);
      st[it.name] = c.pose;
      st[A.root.name] = { pos: c.fp, yaw: yawTo(c.fp, c.bp), dist: pa.dist - (s - s0), moving: 1, ik: 1, grips: gripsAt(c.pose, it, cs, true) };
      st[B.root.name] = { pos: c.bp, yaw: yawTo(c.bp, c.fp), dist: pb.dist + (s - s0), moving: 1, ik: 1, grips: gripsAt(c.pose, it, cs, false) };
    });
    // Place: set it into its slot; the carriers let go.
    const slot = { p: it.slotAt(cs), q: qEntry.clone().multiply(cs.carryQ) };
    const end = carryPose(route, sEnd, half, it, cs);
    const slotPose = { pos: toW(slot.p), quat: qW(slot.q) };
    ph.place = t;
    t = seg(t, 1.8, (u, st) => {
      const pa = prevOf(st, A), pb = prevOf(st, B);
      const e = ease(clamp01(u / 0.8));
      const pos = end.pose.pos.clone().lerp(slotPose.pos, e); pos.y += Math.sin(Math.PI * e) * 0.05;
      const pose = { pos, quat: end.pose.quat.clone().slerp(slotPose.quat, e) };
      st[it.name] = pose;
      const ik = 1 - ease(clamp01((u - 0.55) / 0.35));
      st[A.root.name] = { pos: end.fp, yaw: yawTo(end.fp, end.bp), dist: pa.dist, moving: 0, ik, grips: gripsAt(pose, it, cs, true) };
      st[B.root.name] = { pos: end.bp, yaw: yawTo(end.bp, end.fp), dist: pb.dist, moving: 0, ik, grips: gripsAt(pose, it, cs, false) };
    });
    segs.push({ t0: t, t1: t, run: (u, st) => { st[it.name] = { van: true, p: slot.p, q: slot.q }; } });
    return { t, a: outOfVan(end.fp), b: outOfVan(end.bp) };
  };

  // Hand truck: walk in, slide the nose under the stack, tilt, roll it into the van, drop it.
  const trolleyTrip = (t, key, fromC, loop) => {
    const it = items[key], route = routes[key], slot = slots[key];
    const sHome = route.nearest(it.home);
    const dir0 = dirAt(route, sHome), tyaw0 = Math.atan2(dir0.x, dir0.z);
    it.yaw = tyaw0 + Math.PI / 2; // square to the nose plate, so the pick-up needs no turn
    const tAt = it.home.clone().addScaledVector(dir0, -NOSE_FWD); // nose under the stack
    const pApp = new Path([...fromC, ...loop, P3(tAt.clone().addScaledVector(dir0, -0.2 - dC(0.12)))]);
    const dApp = walkTime(pApp) + 0.3;
    const ph = { key, approach: t }; phases.push(ph);
    t = seg(t, dApp, (u, st) => {
      const prev = prevOf(st, C), pt = st.trolley;
      const s = pApp.sAtTime(ease(u)), pos = pApp.at(s);
      const yw = s < pApp.length - 0.31 ? yawTo(pos, pApp.at(Math.min(pApp.length, s + 0.3))) : tyaw0;
      const yaw = lerpAngle(prev.yaw, yw, clamp01(u * 12));
      st.trolley = { pos: pos.clone().addScaledVector(fwd(yaw), dC(0.12)), yaw, tilt: 0.12, roll: pt.roll + s };
      st[C.root.name] = { pos, yaw, dist: prev.dist + s, moving: u < 0.98 ? 1 : 0, ik: 1, grips: "trolley" };
    });
    t = seg(t, 1.2, (u, st) => {
      const prev = prevOf(st, C), pt = st.trolley;
      const slide = ease(clamp01(u / 0.4)), lift = ease(clamp01((u - 0.4) / 0.6));
      const tilt = lift > 0 ? 0.42 * lift : 0.12 * (1 - slide);
      const tpos = tAt.clone().addScaledVector(dir0, -0.2 * (1 - slide)), cpos = tpos.clone().addScaledVector(dir0, -dC(tilt));
      st.trolley = { pos: tpos, yaw: tyaw0, tilt, roll: pt.roll + 0.2 * slide };
      st[it.name] = lift > 0 ? { onTrolley: true, from: homePose(it), k: clamp01(lift * 3) } : homePose(it);
      st[C.root.name] = { pos: cpos, yaw: tyaw0, dist: prev.dist + 0.2 * slide, moving: u < 0.4 ? 0.6 : 0, ik: 1, grips: "trolley" };
    });
    const sStart = sHome - NOSE_FWD, sEnd = route.length;
    const T0 = route.timeAt(sStart), TE = route.timeAt(sEnd), dRoll = (TE - T0) / SPEED + 0.3;
    const tRoll = t; ph.pick = tRoll - 1.2; ph.roll = tRoll;
    t = seg(t, dRoll, (u, st) => {
      const prev = prevOf(st, C), pt = st.trolley;
      const s = route.sAtT(lerp(T0, TE, ease(u)));
      const front = route.at(s), back = route.chord(s, dC(0.42), -1), yaw = yawTo(back, front);
      st.trolley = { pos: front, yaw, tilt: 0.42, pitch: slope(back, front), roll: pt.roll + (s - sStart) };
      st[it.name] = { onTrolley: true };
      st[C.root.name] = { pos: back, yaw, dist: prev.dist + (s - sStart), moving: 1, ik: 1, grips: "trolley" };
    });
    // When the hand truck reaches the ramp (the way back to the house is clear from then on).
    const atFoot = tRoll + dRoll * invEase((route.timeAt(route.nearest(foot)) - T0) / (TE - T0));
    const endF = route.at(sEnd), endB = route.chord(sEnd, dC(0.42), -1), yawE = yawTo(endB, endF), dirE = fwd(yawE);
    ph.drop = t; ph.atFoot = atFoot;
    t = seg(t, 1.4, (u, st) => {
      const prev = prevOf(st, C), pt = st.trolley;
      const e1 = ease(clamp01(u / 0.45)), e2 = ease(clamp01((u - 0.45) / 0.55));
      const tilt = lerp(0.42, 0, e1) + 0.12 * e2, tpos = endF.clone().addScaledVector(dirE, -0.3 * e2);
      st.trolley = { pos: tpos, yaw: yawE, tilt, roll: pt.roll - 0.3 * e2 };
      st[it.name] = { onTrolley: true, toSlot: e2, slot };
      st[C.root.name] = { pos: tpos.clone().addScaledVector(dirE, -dC(tilt)), yaw: yawE, dist: prev.dist - 0.3 * e2, moving: u > 0.45 && u < 0.95 ? 0.5 : 0, ik: 1, grips: "trolley" };
    });
    segs.push({ t0: t, t1: t, run: (u, st) => { st[it.name] = { van: true, p: slot.p, q: slot.q }; } });
    return { t, atFoot, route, sEnd: sEnd - 0.3 };
  };
  // Pull the empty hand truck back down the ramp, then turn round with it.
  const backOut = (t, trip) => {
    const { route } = trip, s1 = route.nearest(foot) - 1.6, s0 = trip.sEnd;
    const T0 = route.timeAt(s0), T1 = route.timeAt(s1);
    t = seg(t, (T0 - T1) / SPEED + 0.3, (u, st) => {
      const prev = prevOf(st, C), pt = st.trolley;
      const s = route.sAtT(lerp(T0, T1, ease(u)));
      const front = route.at(s), back = route.chord(s, dC(0.12), -1);
      st.trolley = { pos: front, yaw: yawTo(back, front), tilt: 0.12, pitch: slope(back, front), roll: pt.roll - (s0 - s) };
      st[C.root.name] = { pos: back, yaw: yawTo(back, front), dist: prev.dist - (s0 - s), moving: 1, ik: 1, grips: "trolley" };
    });
    const cpos = route.chord(s1, dC(0.12), -1), yaw0 = yawTo(cpos, route.at(s1));
    t = seg(t, 0.8, (u, st) => {
      const prev = prevOf(st, C), pt = st.trolley;
      const yaw = yaw0 + Math.PI * ease(u);
      st.trolley = { pos: cpos.clone().addScaledVector(fwd(yaw), dC(0.12)), yaw, tilt: 0.12, roll: pt.roll };
      st[C.root.name] = { pos: cpos, yaw, dist: prev.dist, moving: Math.sin(Math.PI * u) * 0.5, ik: 1, grips: "trolley" };
    });
    return { t, from: [P3(cpos)] };
  };

  // Cargo positions for the furniture, from each item's carried extents.
  items.wardA.slotAt = (cs) => V(0.46, FY + cs.extY, behindBoxes - cs.extX);
  items.sofa.slotAt = (cs) => V(-0.46, FY + cs.extY, behindBoxes - cs.extX);
  items.wardB.slotAt = (cs) => V(0.46, FY + 3 * cs.extY + 0.005, behindBoxes - cs.extX);
  items.chair.slotAt = (cs) => V(-0.46, FY + cs.extY, behindBoxes - 1.92 - cs.extX);

  // Stage 2: boxes on the hand truck.
  const START = {
    A: { pos: V(-13.1, G, 2.9), yaw: Math.PI / 2 }, B: { pos: V(-13.5, G, 2.2), yaw: Math.PI / 2 + 0.25 },
    C: { pos: V(-12.4, G, 3.3), yaw: Math.PI / 2 },
  };
  const T_START = 1.6;
  let trip = trolleyTrip(T_START, "boxA", [P3(START.C.pos), [-10.2, G, 2.6], ...yardIn.slice(2), ...room0], [[-5.0, F0, 0.6], [-3.3, F0, 0.45], [-2.75, F0, -0.25], [-2.8, F0, -0.95]]);
  let back = backOut(trip.t, trip);
  trip = trolleyTrip(back.t, "boxB", [...back.from, ...yardIn.slice(1), ...room0], [[-4.7, F0, -0.7], [-4.3, F0, -2.2], [-4.55, F0, -3.1]]);
  back = backOut(trip.t, trip);
  trip = trolleyTrip(back.t, "boxU", [...back.from, ...yardIn.slice(1), ...room1], [[-4.8, F1, 0.55], [-3.0, F1, 0.1], [-2.85, F1, -0.9], [-2.95, F1, -1.6]]);
  // The last time round, the hand truck stays in the van, parked behind the cabinets.
  const parkL = V(0.46, FY, REAR + 0.4);
  const parkW = toW(parkL);
  const dropF = trip.route.at(trip.sEnd), dropYaw = yawTo(trip.route.chord(trip.sEnd, dC(0.12), -1), dropF);
  let tC = seg(trip.t, 2.2, (u, st) => {
    const prev = prevOf(st, C), pt = st.trolley;
    const e = ease(u), pos = dropF.clone().lerp(parkW, e), tilt = 0.12 * (1 - e);
    st.trolley = { pos, yaw: dropYaw, tilt, roll: pt.roll - dropF.distanceTo(parkW) * e };
    const cpos = pos.clone().addScaledVector(fwd(dropYaw), -dC(tilt));
    st[C.root.name] = { pos: cpos, yaw: dropYaw, dist: prev.dist - dropF.distanceTo(parkW) * e, moving: Math.sin(Math.PI * u), ik: 1, grips: "trolley" };
  });
  segs.push({ t0: tC, t1: tC, run: (u, st) => { st.trolley = { van: true, p: parkL, yaw: dropYaw - parked.yaw, tilt: 0, roll: st.trolley.roll }; } });
  const cWait = V(-9.3, G, 3.4);
  const pCwait = new Path([...outOfVan(parkW.clone().addScaledVector(fwd(dropYaw), -dC(0))), [-11.0, G, 2.6], P3(cWait)]);
  tC = seg(tC, walkTime(pCwait) + 0.3, (u, st) => {
    const prev = prevOf(st, C);
    const s = pCwait.sAtTime(ease(u)), pos = pCwait.at(s);
    const yw = s < pCwait.length - 0.31 ? yawTo(pos, pCwait.at(Math.min(pCwait.length, s + 0.3))) : yawTo(pos, V(-11.5, 0, 0.5));
    st[C.root.name] = { pos, yaw: lerpAngle(prev.yaw, yw, clamp01(u * 8)), dist: prev.dist + s, moving: u < 0.98 ? 1 : 0 };
  });

  // Stage 3: the large furniture, two carriers. They set off once the last stack is on the ramp.
  let ends = { t: trip.atFoot, a: [P3(START.A.pos)], b: [P3(START.B.pos)] };
  const plan = [
    ["wardA", [[-5.6, F1, -0.4]], [[-4.0, F1, -0.6], [-4.2, F1, -3.4]], true],
    ["sofa", [[-6.0, F0, -0.6], [-6.0, F0, -3.6]], [[-4.6, F0, -1.0], [-2.95, F0, -3.3]], false],
    ["wardB", [[-5.2, F1, -0.5]], [[-4.6, F1, -0.6], [-3.9, F1, -2.4]], true],
    ["chair", [[-5.4, F0, -0.6]], [[-4.4, F0, -0.4], [-2.7, F0, -1.0]], false],
  ];
  for (const [key, viaA, viaB, up] of plan) ends = pairTrip(ends.t, key, ends.a, ends.b, viaA, viaB, up);
  // Out of the van to wait by the drive.
  const waitA = V(-10.0, G, 1.0), waitB = V(-9.75, G, 1.7);
  const pAw = new Path([...ends.a, [-10.6, G, 1.8], P3(waitA)]), pBw = new Path([...ends.b, P3(waitB)]);
  const dW = Math.max(walkTime(pAw), walkTime(pBw)) + 0.3;
  const tLoaded = seg(ends.t, dW, (u, st) => {
    for (const [w, p] of [[A, pAw], [B, pBw]]) {
      const prev = prevOf(st, w);
      const s = p.sAtTime(ease(u)), pos = p.at(s);
      const yw = s < p.length - 0.31 ? yawTo(pos, p.at(Math.min(p.length, s + 0.3))) : yawTo(pos, V(-7, 0, 1));
      st[w.root.name] = { pos, yaw: lerpAngle(prev.yaw, yw, clamp01(u * 10)), dist: prev.dist + s, moving: u < 0.98 ? 1 : 0 };
    }
  }) - dW + 0.8; // "loaded" once the last piece is in; they're still stepping away
  const tLastItem = ends.t;

  // Stages 4–6: cleared, ramp in and door down, crew to the cab, van leaves.
  const T4 = Math.max(tLastItem + 0.6, tC), T5 = T4 + 3.2, TD0 = T5 + 1.2, TDOOR = TD0 + 2.0, TCAB = TDOOR + 1.6, T6 = TCAB + 0.3;
  const REV_T = 4.5, FWD_T0 = REV_T + 0.4, FWD_T = 5.0, TEND = T6 + FWD_T0 + FWD_T;
  const stateAt = (t) => {
    const st = {};
    for (const it of Object.values(items)) st[it.name] = homePose(it);
    st[A.root.name] = { pos: START.A.pos.clone(), yaw: START.A.yaw, moving: 0, dist: 0 };
    st[B.root.name] = { pos: START.B.pos.clone(), yaw: START.B.yaw, moving: 0, dist: 0 };
    st[C.root.name] = { pos: START.C.pos.clone(), yaw: START.C.yaw, moving: 0, dist: 0, ik: 1, grips: "trolley" };
    st.trolley = { pos: START.C.pos.clone().addScaledVector(fwd(START.C.yaw), dC(0.12)), yaw: START.C.yaw, tilt: 0.12, roll: 0 };
    for (const s of segs) if (t >= s.t0) s.run(s.t1 > s.t0 ? clamp01((t - s.t0) / (s.t1 - s.t0)) : 1, st);
    return st;
  };
  // Along the far side of the van to the cab (hidden from the camera there).
  const atT5 = stateAt(T5);
  [A, B, C].forEach((w, i) => {
    const p0 = atT5[w.root.name].pos.clone();
    const p = new Path([P3(p0), [-9.85, G, 0.2 - i * 0.2], [-9.85, G, -5.4 + i * 0.6]]);
    const tw = T5 + 0.4 + i * 0.5;
    seg(tw, TCAB - tw, (u, st) => {
      const prev = prevOf(st, w);
      const s = p.sAtTime(ease(u)), pos = p.at(s);
      st[w.root.name] = { pos, yaw: lerpAngle(prev.yaw, yawTo(pos, p.at(Math.min(p.length, s + 0.3))), clamp01(u * 10)), dist: prev.dist + s, moving: u < 0.98 ? 1 : 0, show: u < 0.995 };
    });
  });

  // Departure: reverse out of the drive in a quarter turn, then drive off along the street.
  const R_TURN = 4.2, ZR = 5.0, revStraight = ZR - parked.pos.z, revArc = (Math.PI / 2) * R_TURN, REV = revStraight + revArc;
  const P2 = V(parked.pos.x + R_TURN, 0, ZR + R_TURN), FWD = 46;
  const vanPoseAt = (t) => {
    const rev = ease(clamp01((t - T6) / REV_T)) * REV;
    const uf = clamp01((t - T6 - FWD_T0) / FWD_T), ahead = FWD * uf * uf;
    if (ahead > 0) return { pos: V(P2.x - ahead, 0, P2.z), yaw: -Math.PI / 2, dist: ahead - REV, steer: 0 };
    if (rev <= revStraight) return { pos: V(parked.pos.x, 0, parked.pos.z + rev), yaw: Math.PI, dist: -rev, steer: 0 };
    const a = (rev - revStraight) / R_TURN;
    return { pos: V(parked.pos.x + R_TURN - R_TURN * Math.cos(a), 0, ZR + R_TURN * Math.sin(a)), yaw: Math.PI + a, dist: -rev, steer: -0.45 * Math.sin(2 * a) };
  };

  const totalT = TEND;
  // Camera: one continuous path. Desktop and portrait framings share timing.
  const camKeys = {
    wide: [
      { t: 0, pos: V(-9.9, 5.6, 19.0), look: V(-7.0, 3.0, -1.4) },
      { t: tLastItem * 0.5, pos: V(-9.7, 5.5, 18.6), look: V(-7.0, 2.95, -1.4) },
      { t: tLastItem, pos: V(-9.7, 5.5, 18.6), look: V(-7.0, 2.95, -1.4) },
      { t: T4 + 1.8, pos: V(-6.6, 4.6, 11.5), look: V(-4.6, 2.5, -2.2) },
      { t: T5 + 0.6, pos: V(-14.5, 4.0, 9.5), look: V(-11.2, 1.6, -1.2) },
      { t: T6 + 1.5, pos: V(-9.0, 9.5, 25.0), look: V(-7.6, 1.6, 2.0) },
      { t: TEND, pos: V(-9.6, 5.8, 19.5), look: V(-6.8, 3.0, -1.2) },
    ],
    tall: [
      { t: 0, pos: V(-9.2, 7.0, 28.5), look: V(-7.6, 2.4, -1.4) },
      { t: tLastItem, pos: V(-9.1, 6.8, 28.0), look: V(-7.6, 2.4, -1.4) },
      { t: T4 + 1.8, pos: V(-5.8, 5.0, 15.5), look: V(-4.4, 2.6, -2.0) },
      { t: T5 + 0.6, pos: V(-14.0, 4.6, 13.0), look: V(-11.3, 1.6, -1.2) },
      { t: T6 + 1.5, pos: V(-9.0, 11.5, 31.0), look: V(-7.6, 1.6, 2.0) },
      { t: TEND, pos: V(-7.5, 6.6, 26.5), look: V(-5.8, 2.6, -1.2) },
    ],
  };

  const stackPose = (h) => {
    const m = trolley.matrixWorld.clone().multiply(new THREE.Matrix4().compose(NOSE, stackOnNose, V(1, 1, 1))).multiply(new THREE.Matrix4().makeTranslation(0, h / 2, 0));
    const pos = V(), quat = new THREE.Quaternion(); m.decompose(pos, quat, V());
    return { pos, quat };
  };

  // ---------- Evaluate ----------
  function evaluate(t, camera, framing) {
    const st = stateAt(t);

    // Van: departure, wheels, door, ramp
    const vp = vanPoseAt(t);
    van.position.copy(vp.pos); van.rotation.set(0, vp.yaw, 0);
    for (const w of vanWheels) { w.rotation.x = vp.dist / WHEEL_R; w.rotation.y = w.name.includes("front") ? vp.steer : 0; }
    door.rotation.x = lerp(-1.45, 0, ease(clamp01((t - TD0) / (TDOOR - TD0))));
    van.updateMatrixWorld(true);
    const ru = clamp01((t - T5) / 1.4), r1 = ease(clamp01(ru / 0.4)), r2 = ease(clamp01((ru - 0.4) / 0.6));
    const rp = r2 > 0 ? rampMid.p.clone().lerp(rampIn.p, r2) : rampOut.p.clone().lerp(rampMid.p, r1);
    const rq = r2 > 0 ? rampMid.q.clone().slerp(rampIn.q, r2) : rampOut.q.clone().slerp(rampMid.q, r1);
    ramp.position.copy(toW(rp, vp)); ramp.quaternion.copy(qW(rq, vp)); ramp.visible = r2 < 1;

    // Hand truck
    const tr = st.trolley;
    const tPos = tr.van ? toW(tr.p, vp) : tr.pos, tYaw = tr.van ? vp.yaw + tr.yaw : tr.yaw;
    // Lean back (and follow the ramp) about the wheel axle.
    const qy = qYaw(tYaw), qt = qy.clone().multiply(qAxis(XAXIS, -((tr.tilt ?? 0) + (tr.pitch ?? 0))));
    trolley.quaternion.copy(qt);
    trolley.position.copy(tPos).add(AXLE.clone().applyQuaternion(qy)).sub(AXLE.clone().applyQuaternion(qt));
    for (const w of trolleyWheels) w.rotation.x = (tr.roll ?? 0) / wheelR;
    trolley.updateMatrixWorld(true);

    // Items
    for (const it of Object.values(items)) {
      const s = st[it.name];
      let pos, quat;
      if (s.van) { pos = toW(s.p, vp); quat = qW(s.q, vp); }
      else if (s.onTrolley) {
        ({ pos, quat } = stackPose(it.size.y));
        if (s.from) { pos = s.from.pos.clone().lerp(pos, s.k); quat = s.from.quat.clone().slerp(quat, s.k); }
        if (s.toSlot) { pos.lerp(toW(s.slot.p, vp), s.toSlot); quat.slerp(qW(s.slot.q, vp), s.toSlot); }
      } else { pos = s.pos; quat = s.quat; }
      it.o.position.copy(pos); it.o.quaternion.copy(quat);
    }

    // Workers
    for (const w of workers) {
      const s = st[w.root.name];
      if (s.grips === "trolley") s.grips = [trolley.localToWorld(GRIP_L.clone()), trolley.localToWorld(GRIP_R.clone())];
      w.apply(s);
    }

    // Camera
    const keys = camKeys[framing];
    let i = 1; while (i < keys.length - 1 && keys[i].t < t) i++;
    const k0 = keys[i - 1], k1 = keys[i];
    const u = ease(clamp01((t - k0.t) / Math.max(0.001, k1.t - k0.t)));
    camera.position.lerpVectors(k0.pos, k1.pos, u);
    camera.lookAt(new THREE.Vector3().lerpVectors(k0.look, k1.look, u));
    return { stage: t < T_START ? 1 : t < trip.atFoot ? 2 : t < T4 ? 3 : t < T5 ? 4 : t < T6 ? 5 : 6, cleared: t >= T4 };
  }

  return { evaluate, totalT, marks: { tLoaded, T4, T5, T6, TEND }, phases };
}
