// Master timeline. Everything is a pure function of time t (seconds), so any
// scroll position maps to one exact state and scrolling up replays it backwards.
import * as THREE from "three";
import { Worker } from "./rig.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (u) => u * u * (3 - 2 * u);
const clamp01 = (u) => Math.min(1, Math.max(0, u));
const lerp = THREE.MathUtils.lerp;
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

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
  const REACH = Worker.reach;

  // ---------- Actors ----------
  const workers = ["Worker A", "Worker B", "Worker C"].map((n) => { const w = new Worker(assets, n); scene.add(w.root); return w; });
  const [A, B, C] = workers;                        // A+B carry furniture, C runs the trolley
  const trolley = assets.trolley.clone(); scene.add(trolley);
  const trolleyWheels = ["trolley-wheel-left", "trolley-wheel-right"].map((n) => trolley.getObjectByName(n)).filter(Boolean);
  trolley.updateMatrixWorld(true);
  const wheelR = trolleyWheels.length ? new THREE.Box3().setFromObject(trolleyWheels[0]).getSize(new THREE.Vector3()).y / 2 : 0.12;

  const item = (name, src, home, yaw, extra) => {
    const o = src.clone(); o.name = name; scene.add(o);
    return { name, o, home: home.clone(), yaw, size: src.userData.size, ...extra };
  };
  const box3 = (name, home, yaw, n = 3) => {
    const g = new THREE.Group(); g.name = name;
    for (let i = 0; i < n; i++) { const b = assets.box.clone(); b.position.y = i * 0.355; b.rotation.y = (i % 2) * 0.12 - 0.06; g.add(b); }
    g.userData.size = V(0.39, n * 0.355, 0.52);
    scene.add(g); return { name, o: g, home: home.clone(), yaw, size: g.userData.size };
  };
  const items = {
    sofa: item("Sofa", assets.sofa, V(-4.3, F0, -4.25), 0, { lift: 0.32, grip: 0.5, laneW: 0.25 }),
    chair: item("Armchair", assets.chair, V(-2.95, F0, -1.9), -Math.PI / 2, { lift: 0.28, grip: 0.55, laneW: 0.25 }),
    wardA: item("Wardrobe section A", assets.wardrobe, V(-5.95, F1, -4.55), 0, { lift: 0.08, grip: 1.0, laneW: 0.18 }),
    wardB: item("Wardrobe section B", assets.wardrobe, V(-5.15, F1, -4.55), 0, { lift: 0.08, grip: 1.0, laneW: 0.18 }),
    boxA: box3("Boxes A", V(-2.75, F0, 0.15), 0.2),
    boxB: box3("Boxes B", V(-5.75, F0, -2.5), -0.1),
    boxU: box3("Boxes upstairs", V(-3.05, F1, -0.9), 0.3),
  };

  // ---------- Van (local coordinates: +z forward, rear at negative z) ----------
  const VAN_POS = V(4.95, 0, 4.0), VAN_YAW = Math.PI / 2;
  van.scale.setScalar(1.6);
  van.position.copy(VAN_POS); van.rotation.y = VAN_YAW; scene.add(van); van.updateMatrixWorld(true);
  const door = van.getObjectByName("door");
  const vanWheels = ["wheel-front-left", "wheel-front-right", "wheel-back-left", "wheel-back-right"].map((n) => van.getObjectByName(n));
  const vScale = van.scale.x;
  // Cargo floor height found by casting down inside the box.
  const ray = new THREE.Raycaster(van.localToWorld(V(0, 1.3 / vScale, -0.9 / vScale)), V(0, -1, 0), 0, 3);
  const hit = ray.intersectObject(van, true).find((h) => h.object.name !== "door");
  const CARGO_Y = hit ? hit.point.y : 0.95;
  const rearWorldX = van.localToWorld(V(0, 0, -1.62)).x;
  // Cargo slots (van-local metres converted to the van's unscaled space).
  const L = (x, y, z) => V(x / vScale, (y - van.position.y) / vScale, z / vScale);
  const slots = {
    wardA: { p: L(0.55, CARGO_Y, -0.3), r: new THREE.Euler(0, 0, Math.PI / 2) },
    wardB: { p: L(0.55, CARGO_Y + 0.44, -0.3), r: new THREE.Euler(0, 0, Math.PI / 2) },
    sofa: { p: L(-0.55, CARGO_Y, -0.2), r: new THREE.Euler(0, Math.PI / 2, 0) },
    chair: { p: L(-0.45, CARGO_Y, -1.75), r: new THREE.Euler(0, Math.PI, 0) },
    boxA: { p: L(0.6, CARGO_Y, -1.85), r: new THREE.Euler(0, 0.1, 0) },
    boxB: { p: L(0.05, CARGO_Y, -1.95), r: new THREE.Euler(0, -0.1, 0) },
    boxU: { p: L(0.6, CARGO_Y, -2.35), r: new THREE.Euler(0, 0, 0) },
  };

  // ---------- Routes (world, feet height) ----------
  const out = (x0) => [[-7.1, F0, 0.2, 0.25], [-7.1, F0, 0.85, 0.6], [-7.1, 0.16, 1.4], [-7.1, G, 2.2], [-6.6, G, 3.35], [-2, G, 3.4], [x0, G, 4.0]];
  const vanRear = rearWorldX - 0.35;
  const ground = (start) => [...start, [-5.95, F0, -0.3], [-6.5, F0, 0.2]];
  const upstairs = (start) => [...start, [-5.95, F1, -0.3], [-6.5, F1, 0.2], [-7.4, F1, 0.2, 0.25], [-8.35, F1, -0.4, 0.25], [-8.35, F0, -3.6, 0.2], [-7.6, F0, -3.6, 0.25]];
  const routes = {
    sofa: new Path([...ground([[-2.3, F0, -4.25], [-5.5, F0, -4.25], [-5.95, F0, -3.5]]), ...out(vanRear)]),
    chair: new Path([...ground([[-2.95, F0, -0.9], [-2.95, F0, -2.9], [-3.4, F0, -3.2], [-5.95, F0, -2.9]]), ...out(vanRear)]),
    wardA: new Path([...upstairs([[-5.95, F1, -5.1], [-5.95, F1, -3.4]]), ...out(vanRear)]),
    wardB: new Path([...upstairs([[-5.15, F1, -5.1], [-5.15, F1, -3.6], [-5.85, F1, -2.9]]), ...out(vanRear)]),
    boxA: new Path([...ground([[-2.75, F0, 0.15], [-4.5, F0, 0.1]]), ...out(vanRear - 0.15)]),
    boxB: new Path([...ground([[-5.75, F0, -2.5], [-5.95, F0, -1.2]]), ...out(vanRear - 0.15)]),
    boxU: new Path([...upstairs([[-3.05, F1, -0.9], [-5.0, F1, -0.4]]), ...out(vanRear - 0.15)]),
  };
  // Where each item sits on its route at the start.
  const startS = (route, home) => { let best = 0, bd = Infinity; for (let s = 0; s <= route.length; s += 0.02) { const d = route.at(s).distanceTo(V(home.x, route.at(s).y, home.z)); if (d < bd) { bd = d; best = s; } } return best; };

  // ---------- Schedule ----------
  const segs = []; let tPair = 4.0, tTrolley = 1.6;
  const SPEED = 1.45; // m/s for visible walking
  const seg = (t0, dur, run) => { segs.push({ t0, t1: t0 + dur, run }); return t0 + dur; };
  const walkTime = (path) => path.tlength / SPEED;
  const state = {};

  // Pair trip: approach → lift → carry along the route → step into the van and place.
  const pairTrip = (key, prevEnd) => {
    const it = items[key], route = routes[key], s0 = startS(route, it.home);
    const half = (key === "sofa" ? it.size.x : it.size.x) / 2 + REACH;
    const carryY = it.lift;
    // Stances at the item ends, along the first route direction.
    const fStance = route.chord(s0, half, +1), bStance = route.chord(s0, half, -1);
    const approachA = new Path([...prevEnd.a, [fStance.x, fStance.y, fStance.z]].map((p) => Array.isArray(p) ? p : [p.x, p.y, p.z]));
    const approachB = new Path([...prevEnd.b, [bStance.x, bStance.y, bStance.z]].map((p) => Array.isArray(p) ? p : [p.x, p.y, p.z]));
    const tA = tPair;
    const dur0 = Math.max(walkTime(approachA), walkTime(approachB)) * 0.9 + 0.2;
    tPair = seg(tPair, dur0, (u, st) => {
      for (const [w, p, other] of [[A, approachA, fStance], [B, approachB, bStance]]) {
        const s = p.sAtTime(ease(u)); const pos = p.at(s); const ahead = p.at(Math.min(p.length, s + 0.3));
        st[w.root.name] = { pos, yaw: s < p.length - 0.31 ? yawTo(pos, ahead) : yawTo(other, it.home), dist: (st[w.root.name]?.dist0 ?? 0) + s, moving: u < 0.98 ? 1 : 0 };
      }
    });
    const grips = (center, yawI, front) => {
      const axis = V(Math.sin(yawI + Math.PI / 2), 0, Math.cos(yawI + Math.PI / 2)); // item local +x
      const side = V(Math.sin(yawI), 0, Math.cos(yawI));
      const end = center.clone().addScaledVector(axis, (front ? 1 : -1) * (it.size.x / 2 - 0.04));
      end.y = center.y + it.grip;
      return [end.clone().addScaledVector(side, it.laneW), end.clone().addScaledVector(side, -it.laneW)];
    };
    // Lift: item rises and turns to the carry axis.
    const carryYaw0 = Math.atan2(fStance.x - bStance.x, fStance.z - bStance.z) - Math.PI / 2;
    tPair = seg(tPair, 1.3, (u, st) => {
      const e = ease(u);
      const yawI = lerp(it.yaw, carryYaw0, e);
      const c = it.home.clone(); c.y += carryY * e;
      st[it.name] = { parent: "world", pos: c, yaw: yawI };
      st[A.root.name] = { ...st[A.root.name], pos: fStance, yaw: yawTo(fStance, bStance), moving: 0, ik: ease(clamp01(u * 2)), grips: grips(c, yawI, true) };
      st[B.root.name] = { ...st[B.root.name], pos: bStance, yaw: yawTo(bStance, fStance), moving: 0, ik: ease(clamp01(u * 2)), grips: grips(c, yawI, false) };
    });
    // Carry: item centre follows the route; carriers stay rigidly at both ends.
    const sEnd = route.length - half - 0.05;
    const tS0 = route.timeAt(s0), tSE = route.timeAt(sEnd);
    tPair = seg(tPair, (tSE - tS0) / SPEED, (u, st) => {
      const s = route.sAtT(lerp(tS0, tSE, ease(u)));
      const fp = route.chord(s, half, +1), bp = route.chord(s, half, -1);
      const c = fp.clone().add(bp).multiplyScalar(0.5); c.y = Math.max(fp.y, bp.y) * 0.5 + Math.min(fp.y, bp.y) * 0.5 + carryY;
      const yawI = Math.atan2(fp.x - bp.x, fp.z - bp.z) - Math.PI / 2;
      st[it.name] = { parent: "world", pos: c, yaw: yawI };
      st[A.root.name] = { pos: fp, yaw: yawTo(fp, bp), dist: -(s - s0), moving: 1, ik: 1, grips: grips(c, yawI, true) };
      st[B.root.name] = { pos: bp, yaw: yawTo(bp, fp), dist: s - s0, moving: 1, ik: 1, grips: grips(c, yawI, false) };
    });
    // Place: A steps up into the cargo area walking backwards, B pushes; item set into its slot.
    const slot = slots[key];
    const fIn = V(rearWorldX + 0.9, CARGO_Y, VAN_POS.z), bOut = V(rearWorldX - 0.55, G, VAN_POS.z + 0.3);
    tPair = seg(tPair, 2.2, (u, st) => {
      const e = ease(u);
      const fp0 = route.chord(sEnd, half, +1), bp0 = route.chord(sEnd, half, -1);
      const startC = fp0.clone().add(bp0).multiplyScalar(0.5); startC.y += carryY;
      const startYaw = Math.atan2(fp0.x - bp0.x, fp0.z - bp0.z) - Math.PI / 2;
      const target = van.localToWorld(slot.p.clone());
      const mid = startC.clone().lerp(target, 0.6); mid.y = CARGO_Y + carryY;
      const c = e < 0.6 ? startC.clone().lerp(mid, e / 0.6) : mid.clone().lerp(target, (e - 0.6) / 0.4);
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, startYaw, 0));
      const q1 = new THREE.Quaternion().setFromEuler(slot.r).premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, VAN_YAW, 0)));
      st[it.name] = { parent: "world", pos: c, quat: q0.slerp(q1, clamp01((e - 0.35) / 0.65)) };
      const fpos = fp0.clone().lerp(fIn, clamp01(e / 0.7)); if (fpos.x > rearWorldX) fpos.y = CARGO_Y;
      const bpos = bp0.clone().lerp(bOut, e);
      const hold = 1 - clamp01((e - 0.65) / 0.3);
      const gr = (front) => { const yawI = startYaw; return grips(c, yawI, front); };
      st[A.root.name] = { pos: fpos, yaw: yawTo(fpos, c) , dist: -(sEnd - s0) - e * 1.5, moving: e < 0.75 ? 1 : 0, ik: hold, grips: gr(true) };
      st[B.root.name] = { pos: bpos, yaw: yawTo(bpos, c), dist: sEnd - s0 + e, moving: e < 0.9 ? 1 : 0, ik: hold, grips: gr(false) };
    });
    // Placed: parented to the van from here on.
    segs.push({ t0: tPair, t1: tPair, run: (u, st) => { st[it.name] = { parent: "van", localPos: slot.p.clone(), localRot: slot.r }; } });
    // A climbs back down next to B.
    const exitA = new Path([[fIn.x, fIn.y, fIn.z], [rearWorldX + 0.1, CARGO_Y, fIn.z], [rearWorldX - 0.4, G, fIn.z - 0.6]]);
    tPair = seg(tPair, 1.1, (u, st) => {
      const s = exitA.sAtTime(ease(u)), pos = exitA.at(s);
      st[A.root.name] = { pos, yaw: yawTo(pos, exitA.at(Math.min(exitA.length, s + 0.3))), dist: s, moving: u < 0.98 ? 1 : 0 };
    });
    void tA;
    return { a: [[rearWorldX - 0.4, G, VAN_POS.z - 0.6], [-2, G, 3.3]], b: [[bOut.x, bOut.y, bOut.z], [-2, G, 3.6]] };
  };

  // Trolley trip: approach → slide the nose under the stack and tilt → roll → unload box by box.
  const trolleyTrip = (key, prevEnd) => {
    const it = items[key], route = routes[key], s0 = startS(route, it.home);
    const NOSE = 0.42; // worker to stack distance along the route
    const pickW = route.chord(s0, NOSE, -1);
    const approach = new Path([...prevEnd, [pickW.x, pickW.y, pickW.z]]);
    tTrolley = seg(tTrolley, walkTime(approach) * 0.9 + 0.3, (u, st) => {
      const s = approach.sAtTime(ease(u)), pos = approach.at(s), ahead = approach.at(Math.min(approach.length, s + 0.3));
      const yaw = s < approach.length - 0.31 ? yawTo(pos, ahead) : yawTo(pickW, it.home);
      st.trolley = { pos: pos.clone().add(V(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(NOSE - 0.12)), yaw, tilt: 0.12, roll: s };
      st[C.root.name] = { pos, yaw, dist: s, moving: u < 0.98 ? 1 : 0, ik: 1, grips: "trolley" };
    });
    tTrolley = seg(tTrolley, 1.0, (u, st) => {
      const yaw = yawTo(pickW, it.home), e = ease(u);
      st.trolley = { pos: it.home.clone().add(V(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(-0.12)), yaw, tilt: lerp(0.0, 0.42, e), roll: 0 };
      st[it.name] = { parent: "trolley", tiltWith: true };
      st[C.root.name] = { pos: pickW, yaw, moving: 0, ik: 1, grips: "trolley" };
    });
    const sEnd = route.length - 0.1;
    const tT0 = route.timeAt(s0), tTE = route.timeAt(sEnd);
    tTrolley = seg(tTrolley, (tTE - tT0) / SPEED, (u, st) => {
      const s = route.sAtT(lerp(tT0, tTE, ease(u)));
      const front = route.at(s), back = route.chord(s, NOSE + 0.12, -1);
      const yaw = yawTo(back, front);
      st.trolley = { pos: front, yaw, tilt: 0.42, roll: s - s0 };
      st[it.name] = { parent: "trolley", tiltWith: true };
      st[C.root.name] = { pos: back, yaw, dist: s - s0, moving: 1, ik: 1, grips: "trolley" };
    });
    // Unload: the boxes go into the van one by one.
    const slot = slots[key];
    tTrolley = seg(tTrolley, 2.4, (u, st) => {
      const front = route.at(sEnd), back = route.chord(sEnd, NOSE + 0.12, -1), yaw = yawTo(back, front);
      st.trolley = { pos: front, yaw, tilt: lerp(0.42, 0.05, clamp01(u * 4)), roll: sEnd - s0 };
      st[it.name] = { parent: "trolley", tiltWith: true, unload: u, slot };
      st[C.root.name] = { pos: back, yaw, moving: 0, ik: 1, grips: "box", unload: u };
    });
    segs.push({ t0: tTrolley, t1: tTrolley, run: (u, st) => { st[it.name] = { parent: "van", localPos: slot.p.clone(), localRot: slot.r }; } });
    const endPos = route.chord(sEnd, NOSE + 0.12, -1);
    return [[endPos.x, endPos.y, endPos.z], [-2, G, 3.25]];
  };

  // Order: boxes first (stage 2), then large furniture (stage 3).
  let tEnd = trolleyTrip("boxA", [[-5.9, G, 3.25], [-6.9, G, 2.6], [-7.1, 0.16, 1.4], [-7.1, F0, 0.6, 0.6]]);
  let lastTrolley = trolleyTrip("boxB", tEnd);
  lastTrolley = trolleyTrip("boxU", lastTrolley);
  const startPair = { a: [[-4.2, G, 3.5], [-6.6, G, 3.0], [-7.1, 0.16, 1.4], [-7.1, F0, 0.6, 0.6], [-6.5, F0, 0.2]], b: [[-3.4, G, 3.7], [-6.6, G, 3.2], [-7.1, 0.16, 1.4], [-7.1, F0, 0.6, 0.6], [-6.5, F0, 0.2]] };
  tPair = 5.5;
  let ends = pairTrip("sofa", startPair);
  for (const k of ["wardA", "chair", "wardB"]) {
    const back = (pts) => [...pts, [-6.6, G, 3.2], [-7.1, 0.16, 1.4], [-7.1, F0, 0.6, 0.6], [-6.5, F0, 0.2]];
    const isUp = k.startsWith("ward");
    const up = (pts) => isUp ? [...pts, [-7.6, F0, -3.6, 0.25], [-8.35, F0, -3.6, 0.25], [-8.35, F1, -0.4, 0.2], [-7.4, F1, 0.2, 0.25], [-6.5, F1, 0.2]] : pts;
    ends = pairTrip(k, { a: up(back(ends.a)), b: up(back(ends.b)) });
  }
  const tLoaded = Math.max(tPair, tTrolley);

  // Stage 4–6: cleared, doors close, crew to the cab, van leaves.
  const T4 = tLoaded + 0.6, T5 = T4 + 3.0, TDOOR = T5 + 2.2, TCAB = TDOOR + 3.2, T6 = TCAB + 0.5, TEND = T6 + 5.5;
  const cabSide = V(VAN_POS.x + 1.6, G, VAN_POS.z - 1.85);
  const toCab = (w, from, i) => new Path([[from.x, from.y, from.z], [rearWorldX - 0.9, G, VAN_POS.z - 1.3 - i * 0.2], [VAN_POS.x - 0.4, G, VAN_POS.z - 1.9 - i * 0.15], [cabSide.x - i * 0.5, G, cabSide.z]]);
  const cabPaths = {};
  segs.push({ t0: T4, t1: T4, run: (u, st) => {
    for (const [i, w] of [A, B, C].entries()) {
      const s = st[w.root.name]; if (!cabPaths[w.root.name]) cabPaths[w.root.name] = toCab(w, s.pos.clone(), i);
    }
  } });
  seg(T5 - 0.4, TCAB - T5 + 0.4, (u, st) => {
    for (const w of [A, B, C]) {
      const p = cabPaths[w.root.name]; if (!p) continue;
      const s = p.sAtTime(ease(u)), pos = p.at(s);
      st[w.root.name] = { pos, yaw: yawTo(pos, p.at(Math.min(p.length, s + 0.3))), dist: s, moving: u < 0.98 ? 1 : 0, show: u < 0.995 };
    }
    st.trolleyHide = u > 0.15;
  });

  const totalT = TEND;
  // Camera: one continuous path. Desktop and portrait framings share timing.
  const camKeys = {
    wide: [
      { t: 0, pos: V(10.5, 6.6, 16.5), look: V(-2.0, 2.0, 0.4) },
      { t: tLoaded * 0.5, pos: V(10.0, 6.4, 16.0), look: V(-2.2, 2.0, 0.3) },
      { t: T4, pos: V(10.0, 6.4, 16.0), look: V(-2.2, 2.0, 0.3) },
      { t: T4 + 1.8, pos: V(5.5, 7.2, 11.5), look: V(-4.2, 2.6, -1.6) },
      { t: T5 + 0.6, pos: V(9.5, 8.8, 15.5), look: V(-0.5, 1.4, 1.2) },
      { t: T6 + 2.5, pos: V(12.5, 9.8, 18.5), look: V(1.2, 1.2, 1.8) },
      { t: TEND, pos: V(10.5, 6.6, 16.5), look: V(-2.0, 2.0, 0.4) },
    ],
    tall: [
      { t: 0, pos: V(9.5, 11, 18.5), look: V(-2.2, 1.6, 1.5) },
      { t: 2.0, pos: V(6.5, 7.6, 12.5), look: V(-3.0, 1.4, 1.6) },
      { t: tLoaded - 1, pos: V(6.5, 7.6, 12.5), look: V(-2.6, 1.4, 1.8) },
      { t: T4 + 1.6, pos: V(4.2, 7.4, 11.5), look: V(-4.6, 2.6, -1.5) },
      { t: T5 + 0.8, pos: V(9.5, 8.2, 14.5), look: V(1.0, 1.2, 2.5) },
      { t: T6 + 2.5, pos: V(10.5, 11, 19), look: V(0.5, 1.2, 2.0) },
      { t: TEND, pos: V(9.5, 11, 18.5), look: V(-2.2, 1.6, 1.5) },
    ],
  };

  const tmpM = new THREE.Matrix4();
  // ---------- Evaluate ----------
  function evaluate(t, camera, framing) {
    const st = {};
    // Defaults: everything at home, workers waiting by the path.
    for (const it of Object.values(items)) st[it.name] = { parent: "world", pos: it.home.clone(), yaw: it.yaw };
    st[A.root.name] = { pos: V(-4.2, G, 3.5), yaw: -Math.PI / 2 + 0.3, moving: 0 };
    st[B.root.name] = { pos: V(-3.4, G, 3.7), yaw: -Math.PI / 2 + 0.2, moving: 0 };
    st[C.root.name] = { pos: V(-5.9, G, 3.25), yaw: -Math.PI / 2, moving: 0, ik: 1, grips: "trolley" };
    st.trolley = { pos: V(-6.45, G, 3.25), yaw: -Math.PI / 2, tilt: 0.12, roll: 0 };
    for (const s of segs) if (t >= s.t0) s.run(s.t1 > s.t0 ? clamp01((t - s.t0) / (s.t1 - s.t0)) : 1, st);

    // Van: door, departure, wheels
    const doorU = clamp01((t - T5) / (TDOOR - T5));
    door.rotation.x = lerp(-1.45, 0, ease(doorU));
    const drive = ease(clamp01((t - T6) / (TEND - T6)));
    const dx = drive * 26;
    van.position.set(VAN_POS.x + dx, 0, VAN_POS.z);
    for (const w of vanWheels) w.rotation.x = dx / (0.3 * vScale);
    van.updateMatrixWorld(true);

    // Trolley
    const tr = st.trolley;
    trolley.visible = !st.trolleyHide;
    trolley.position.copy(tr.pos); trolley.rotation.set(0, 0, 0); trolley.rotateY(tr.yaw + Math.PI); trolley.rotateX(-tr.tilt);
    for (const w of trolleyWheels) w.rotation.x = -tr.roll / wheelR;
    trolley.updateMatrixWorld(true);
    const nose = new THREE.Object3D(); trolley.add(nose); nose.position.set(0, 0.06, -0.12); nose.updateMatrixWorld(true);

    // Items
    for (const it of Object.values(items)) {
      const s = st[it.name], o = it.o;
      if (s.parent === "van") {
        if (o.parent !== van) van.add(o);
        o.position.copy(s.localPos); o.rotation.copy(s.localRot); o.scale.setScalar(1 / vScale);
      } else {
        if (o.parent !== scene) scene.add(o);
        o.scale.setScalar(1);
        if (s.parent === "trolley") {
          o.matrix.copy(nose.matrixWorld); o.matrix.decompose(o.position, o.quaternion, o.scale);
          o.updateMatrixWorld(true);
          if (s.unload != null && o.children.length) {
            // Boxes leave the stack top first, each along a short arc into its slot.
            const n = o.children.length;
            o.children.forEach((b, i) => {
              const k = n - 1 - i, u = clamp01((s.unload - k / n) * n);
              const start = new THREE.Vector3(0, i * 0.355, 0);
              const slotW = van.localToWorld(s.slot.p.clone().add(new THREE.Vector3(0, (i * 0.355) / vScale, 0)));
              const slotL = o.worldToLocal(slotW.clone());
              const p = start.clone().lerp(slotL, ease(u)); p.y += Math.sin(Math.PI * u) * 0.35;
              b.position.copy(p);
            });
          }
        } else {
          o.position.copy(s.pos);
          if (s.quat) o.quaternion.copy(s.quat); else o.rotation.set(0, s.yaw, 0);
          o.children.forEach((b, i) => { if (b.isGroup || b.isMesh) b.position.set(0, i * 0.355, 0); });
        }
      }
      if (s.parent !== "trolley" && o.children.length && it.name.startsWith("Boxes")) o.children.forEach((b, i) => b.position.set(0, i * 0.355, 0));
    }
    trolley.remove(nose);

    // Workers
    for (const w of workers) {
      const s = st[w.root.name];
      if (s.grips === "trolley" || s.grips === "box") {
        // Hands on the trolley handles (top of the frame).
        const hL = trolley.localToWorld(V(0.2, 1.18, 0.05)), hR = trolley.localToWorld(V(-0.2, 1.18, 0.05));
        s.grips = [hL, hR];
        if (s.unload != null) { const lift = Math.sin(Math.PI * clamp01(s.unload * 3 % 1)); s.grips = [hL.clone().lerp(V(rearWorldX, CARGO_Y + 0.4, VAN_POS.z + 0.3), lift * 0.8), hR.clone().lerp(V(rearWorldX, CARGO_Y + 0.4, VAN_POS.z - 0.3), lift * 0.8)]; }
        s.ik = trolley.visible ? (s.ik ?? 1) : 0;
      }
      w.apply(s);
    }

    // Camera
    const keys = camKeys[framing];
    let i = 1; while (i < keys.length - 1 && keys[i].t < t) i++;
    const k0 = keys[i - 1], k1 = keys[i];
    const u = ease(clamp01((t - k0.t) / Math.max(0.001, k1.t - k0.t)));
    camera.position.lerpVectors(k0.pos, k1.pos, u);
    camera.lookAt(new THREE.Vector3().lerpVectors(k0.look, k1.look, u));
    void tmpM;
    return { stage: t < 1.6 ? 1 : t < 5.5 ? 2 : t < tLoaded ? 3 : t < T5 ? 4 : t < T6 ? 5 : 6, cleared: t >= T4 };
  }

  return { evaluate, totalT, marks: { tLoaded, T4, T5, T6, TEND } };
}
