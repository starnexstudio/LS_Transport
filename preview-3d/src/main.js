// Bootstraps the 3D preview and maps native vertical scroll to the timeline.
import * as THREE from "three";
import { loadAll } from "./assets.js";
import { buildWorld, H } from "./house.js";
import { buildSequence } from "./sequence.js";

const root = document.documentElement;
const hero = document.querySelector(".hero");
const sceneEl = document.querySelector(".scene");
const canvas = document.querySelector("#scene-canvas");
const label = document.querySelector(".label");
const bar = document.querySelector(".bar");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
}

async function start() {
  if (!webglAvailable()) { root.classList.add("no-webgl"); document.title = "ready"; return; }
  const mobile = matchMedia("(max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: reduced });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dfe6e7");
  scene.fog = new THREE.Fog("#dfe6e7", 38, 80);
  scene.add(new THREE.HemisphereLight("#f4f7ff", "#9aa58a", 1.7));
  const sun = new THREE.DirectionalLight("#fff6e8", 2.6);
  sun.position.set(-9, 16, 12); sun.target.position.set(-1, 0, 1);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 50 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

  const [assets] = await Promise.all([loadAll(), buildWorld(scene)]);
  const seq = buildSequence({ scene, assets, van: assets.van, H });

  let framing = "wide";
  function resize() {
    const w = sceneEl.clientWidth || innerWidth, h = sceneEl.clientHeight || innerHeight * 0.6;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    framing = camera.aspect < 0.95 ? "tall" : "wide";
    camera.fov = framing === "tall" ? 44 : 32;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  // Scroll → target time; the drawn time eases towards it (no independent motion).
  const progress = () => {
    const r = hero.getBoundingClientRect();
    const range = r.height - innerHeight;
    return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
  };
  let target = 0, current = 0, last = performance.now(), dirty = true, result = null;
  const render = (t) => {
    result = seq.evaluate(t, camera, framing);
    renderer.render(scene, camera);
    label.classList.toggle("on", result.cleared);
  };

  if (reduced) {
    // Static before / after, rendered once from the same scene.
    sceneEl.style.display = "block"; sceneEl.style.height = "420px"; resize();
    render(0); document.querySelector("#still-before").src = renderer.domElement.toDataURL("image/jpeg", 0.85);
    render(seq.marks.T4 + 2); document.querySelector("#still-after").src = renderer.domElement.toDataURL("image/jpeg", 0.85);
    sceneEl.style.display = ""; sceneEl.style.height = "";
    document.title = "ready";
    return;
  }

  const onScroll = () => {
    target = progress() * seq.totalT;
    root.classList.toggle("scrolled", target > 0.5);
    if (bar) bar.classList.toggle("away", hero.getBoundingClientRect().bottom < innerHeight * 0.6);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", resize);
  resize(); onScroll(); current = target;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const before = current;
    current += (target - current) * (1 - Math.exp(-dt / 0.12));
    if (Math.abs(target - current) < 0.002) current = target;
    if (dirty || current !== before) { render(current); dirty = false; }
    requestAnimationFrame(frame);
  }
  render(current);
  root.classList.add("ready");
  document.title = "ready";
  requestAnimationFrame(frame);

  // Test hooks for the local preview.
  window.__preview = { seq, setTime: (t) => { target = current = t; render(t); }, get time() { return current; } };
}

start().catch((e) => { console.error(e); root.classList.add("no-webgl"); document.title = "ready"; });
