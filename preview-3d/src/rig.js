// A worker driven entirely by the timeline: position, facing, walk-cycle
// phase (from distance travelled) and two-bone arm IK onto grip points.
import * as THREE from "three";
import { makeWorker } from "./assets.js";

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();
const STRIDE = 1.35; // metres per walk cycle (two steps)

export class Worker {
  constructor(assets, name) {
    const w = makeWorker(assets);
    this.root = w.root; this.root.name = name;
    this.mixer = w.mixer;
    this.walk = this.mixer.clipAction(w.clips.walk);
    this.idle = this.mixer.clipAction(w.clips.idle);
    for (const a of [this.walk, this.idle]) { a.play(); a.paused = true; a.enabled = true; }
    const bone = (n) => this.root.getObjectByName(n);
    this.arms = ["L", "R"].map((s) => ({ upper: bone("UpperArm" + s), lower: bone("LowerArm" + s), wrist: bone("Wrist" + s), side: s === "L" ? 1 : -1 }));
    this.visible = true;
  }

  // state: { pos: Vector3, yaw, dist (metres walked, signed), moving: 0..1,
  //          grips: [Vector3|null, Vector3|null] (world), ik: 0..1, show }
  apply(state) {
    const r = this.root;
    r.visible = state.show !== false;
    if (!r.visible) return;
    r.position.copy(state.pos);
    r.rotation.set(0, state.yaw, 0);
    const walkW = THREE.MathUtils.clamp(state.moving ?? 0, 0, 1);
    this.walk.setEffectiveWeight(walkW); this.idle.setEffectiveWeight(1 - walkW);
    const d = this.walk.getClip().duration;
    this.walk.time = (((state.dist ?? 0) / STRIDE) % 1 + 1) % 1 * d;
    this.idle.time = 0.2;
    this.mixer.update(0);
    r.updateMatrixWorld(true);
    if (state.ik > 0 && state.grips) this.arms.forEach((arm, i) => state.grips[i] && this.solveArm(arm, state.grips[i], state.ik));
  }

  // Two-bone IK: place the elbow on the circle defined by both bone lengths,
  // bent down and outwards, then aim each bone at its next joint.
  solveArm(arm, target, weight) {
    const S = arm.upper.getWorldPosition(new THREE.Vector3());
    const E0 = arm.lower.getWorldPosition(new THREE.Vector3());
    const W0 = arm.wrist.getWorldPosition(new THREE.Vector3());
    const a = S.distanceTo(E0), b = E0.distanceTo(W0);
    const toT = v1.subVectors(target, S); const dist = Math.min(toT.length(), a + b - 1e-3);
    const dir = toT.normalize();
    const x = (a * a - b * b + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, a * a - x * x));
    // Pole: down, outwards from the body, slightly back.
    const right = v2.set(1, 0, 0).applyQuaternion(this.root.quaternion).multiplyScalar(arm.side);
    const pole = v3.set(0, -1, 0).addScaledVector(right, 0.6).addScaledVector(new THREE.Vector3(0, 0, -0.3).applyQuaternion(this.root.quaternion), 1);
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const E = S.clone().addScaledVector(dir, x).addScaledVector(pole, h);
    const T = S.clone().addScaledVector(dir, dist);
    this.aim(arm.upper, E0, E, weight);
    arm.upper.updateMatrixWorld(true);
    const E1 = arm.lower.getWorldPosition(new THREE.Vector3()), W1 = arm.wrist.getWorldPosition(new THREE.Vector3());
    this.aim(arm.lower, W1, T, weight, E1);
    arm.lower.updateMatrixWorld(true);
  }

  aim(bone, childNow, childWanted, weight, origin) {
    const o = origin || bone.getWorldPosition(new THREE.Vector3());
    const from = new THREE.Vector3().subVectors(childNow, o).normalize();
    const to = new THREE.Vector3().subVectors(childWanted, o).normalize();
    q1.setFromUnitVectors(from, to);                 // world-space correction
    bone.getWorldQuaternion(q2);
    q3.copy(q1).multiply(q2);                        // new world rotation
    bone.parent.getWorldQuaternion(q1).invert();
    const local = q1.multiply(q3);
    bone.quaternion.slerp(local, weight);
  }

  // Hand height and reach in front of the body, for placing grip points.
  static get reach() { return 0.42; }
  static get handHeight() { return 0.92; }
}
