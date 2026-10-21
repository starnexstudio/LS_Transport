// Bootstraps the 3D hero preview: a transparent renderer over the page's teal, the
// house and the truck lit by sun and HDRI, and the clearance timeline, which native
// vertical scroll drives from 0 to 1 like scrubbing a video. The copy follows the same
// timeline: the sentence lights up, "Neues." is underlined, the rail fills.
import * as THREE from "three";
import { hdri } from "./assets.js";
import { buildWorld } from "./world.js";
import { buildTruck } from "./truck.js";
import { buildSequence } from "./sequence.js";

const root = document.documentElement;
const hero = document.querySelector(".hero");
const stage = document.querySelector(".stage");
const sceneEl = document.querySelector(".scene");
const canvas = document.querySelector("#scene-canvas");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
}

async function start() {
  if (!webglAvailable()) { root.classList.add("no-webgl"); document.title = "ready"; return; }
  const mobile = matchMedia("(max-width: 760px)").matches;
  // Transparent: only the objects and their shadows are drawn, the teal page shows through.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: reduced, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
  // PCF with a wide kernel: soft edges at about half the cost of PCFSoftShadowMap.
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  let baseRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
  renderer.setPixelRatio(baseRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

  // Afternoon sun from the front left: lights the open rooms and the truck's rear,
  // and throws the shadows back and to the right onto the teal.
  const sunDir = new THREE.Vector3(-0.62, 0.6, 0.5).normalize();

  // HDRI for ambient light and reflections, turned so its sun lines up with ours.
  const env = await hdri("kloofendal_48d_partly_cloudy_puresky");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(env.tex).texture;
  env.tex.dispose(); pmrem.dispose();
  scene.environmentIntensity = 1.5;
  const azimuth = (v) => Math.atan2(v.x, v.z);
  scene.environmentRotation.y = azimuth(sunDir) - azimuth(env.sun);

  const sun = new THREE.DirectionalLight("#fff3e2", 5.2);
  const focus = new THREE.Vector3(-7, 0, 0);
  sun.position.copy(focus).addScaledVector(sunDir, 50); sun.target.position.copy(focus);
  sun.castShadow = true; sun.shadow.mapSize.setScalar(mobile ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 13, bottom: -13, near: 20, far: 90 });
  sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  const [, truck] = await Promise.all([buildWorld(scene), buildTruck()]);
  const seq = await buildSequence({ scene, truck, mobile });

  // The canvas covers the whole stage; the camera is set up for the band between the
  // copy and the actions (the .scene element, less the room the actions take below it,
  // at the site's room width) and the view extends past it, so nothing is clipped.
  let dirty = true;
  const lens = (aspect) => { camera.aspect = aspect; camera.fov = aspect < 1.3 ? 38 : 30; };
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    const css = getComputedStyle(sceneEl), band = sceneEl.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    const lift = parseFloat(css.getPropertyValue("--lift")) || 0, room = parseFloat(css.getPropertyValue("--room")) || 1;
    const gap = 20; // clear of the sentence above
    const bw = Math.max(1, band.width * room), bh = Math.max(120, band.height - gap - lift);
    const left = band.left - c.left + (band.width - bw) / 2, top = band.top - c.top + gap;
    lens(bw / bh);
    camera.setViewOffset(bw, bh, -left, -top, w, h);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  // Quality follows the device: time a mid-sequence frame and pick the shadow
  // resolution and pixel ratio; dynamic resolution handles the rest while scrolling.
  const gl = renderer.getContext(), px = new Uint8Array(4);
  const timeFrame = () => { const a = performance.now(); renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; };
  function chooseQuality() {
    resize(); seq.evaluate(0.3, camera);
    timeFrame(); // compiles shaders
    const ms = [timeFrame(), timeFrame(), timeFrame()].sort((a, b) => a - b)[1];
    const forced = new URLSearchParams(location.search).get("quality"); // ?quality=high|medium|low for tests and posters
    const level = forced ?? (!mobile && ms < 9 ? "high" : ms < 40 ? "medium" : "low");
    if (level !== "high") {
      sun.shadow.mapSize.setScalar(level === "low" ? 1024 : 2048);
      sun.shadow.map?.dispose(); sun.shadow.map = null;
      baseRatio = Math.min(devicePixelRatio, level === "low" ? 1 : 1.5);
      renderer.setPixelRatio(baseRatio);
    }
    // Below the top level the shadow map is redrawn every other frame while things
    // move (a 16 ms lag nobody sees) and always once the motion settles.
    renderer.shadowMap.autoUpdate = level === "high";
    resize();
    return { level, ms: Math.round(ms) };
  }

  // Scroll → target progress.
  const progress = () => {
    const r = hero.getBoundingClientRect();
    const range = r.height - innerHeight;
    return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
  };
  let target = 0, current = 0, velocity = 0, last = performance.now(), frameNo = 0, copyT = "";
  // The copy on the same timeline: --t lights the sentence and fills the rail, --a
  // draws the underline under "Neues." once the house is empty.
  const copy = (t) => {
    const v = t.toFixed(4);
    if (v === copyT) return;
    copyT = v;
    const u = Math.min(1, Math.max(0, (t - 0.72) / 0.08));
    stage.style.setProperty("--t", v);
    stage.style.setProperty("--a", (1 - (1 - u) ** 3).toFixed(4));
  };
  const render = (t, settled = true) => {
    if (!renderer.shadowMap.autoUpdate) renderer.shadowMap.needsUpdate = settled || frameNo++ % 2 === 0;
    seq.evaluate(t, camera);
    const cam = window.__preview?.camOverride; // test hook: inspect details from another angle
    if (cam) { camera.position.set(...cam.pos); camera.lookAt(...cam.look); }
    renderer.render(scene, camera);
    copy(t);
  };
  // A still of the moment t at w × h, with a transparent background (WebP keeps the
  // alpha), so it sits on the stage's teal like the live canvas. Used for the
  // reduced-motion pair and the loading / no-WebGL posters.
  const shoot = (t, w, h) => {
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    camera.clearViewOffset(); lens(w / h); camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
    seq.evaluate(t, camera); renderer.render(scene, camera);
    return canvas.toDataURL("image/webp", 0.9);
  };

  if (reduced) {
    // Static before / after, rendered once from the same scene.
    document.querySelector("#still-before").src = shoot(0, 1600, 1000);
    document.querySelector("#still-after").src = shoot(1, 1600, 1000);
    document.title = "ready";
    return;
  }

  const quality = chooseQuality();

  const onScroll = () => {
    if (window.__preview?.frozen) return; // test hook: time set by setTime only
    target = progress();
  };
  addEventListener("scroll", onScroll, { passive: true });
  // The band moves when the window or the copy above it changes size (fonts loading).
  new ResizeObserver(() => resize()).observe(sceneEl);
  resize(); onScroll(); current = target;

  // Dynamic resolution: while the scene moves, the render scale follows the frame
  // interval (aiming for 60 fps); once it settles, a full-resolution frame is drawn.
  let scale = 1, intervals = [], lastScaleChange = 0;
  const setScale = (s, now) => {
    if (Math.abs(s - scale) < 0.01) return;
    scale = s; lastScaleChange = now;
    renderer.setPixelRatio(baseRatio * scale);
    resize();
  };
  function adapt(now, interval, moving) {
    if (!moving) { intervals = []; setScale(1, now); return; }
    intervals.push(interval); if (intervals.length > 8) intervals.shift();
    if (intervals.length < 8 || now - lastScaleChange < 350) return;
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avg > 19) setScale(Math.max(0.55, scale - 0.1), now);
    else if (avg < 14 && scale < 1) setScale(Math.min(1, scale + 0.05), now);
  }

  // The drawn progress follows the scroll on a critically damped spring: each wheel
  // step or swipe becomes one smooth glide, with no jumps in speed.
  const OMEGA = 7.5;
  function frame(now) {
    const interval = now - last;
    let dt = Math.min(0.1, interval / 1000); last = now;
    const before = current;
    for (; dt > 0; dt -= 1 / 120) {
      const h = Math.min(dt, 1 / 120);
      velocity += (OMEGA * OMEGA * (target - current) - 2 * OMEGA * velocity) * h;
      current += velocity * h;
    }
    const settled = Math.abs(target - current) < 0.0003 && Math.abs(velocity) < 0.002;
    if (settled) { current = target; velocity = 0; }
    if (dirty || current !== before) { adapt(now, interval, !settled); render(current, settled); dirty = false; }
    requestAnimationFrame(frame);
  }
  render(current);
  root.classList.add("ready");
  document.title = "ready";
  requestAnimationFrame(frame);

  // Test hooks for the local preview.
  window.__preview = {
    seq, scene, camera, renderer, quality, frozen: false,
    shoot: (t, w, h) => { const url = shoot(t, w, h); renderer.setPixelRatio(baseRatio * scale); resize(); render(current); return url; },
    get scale() { return scale; }, get time() { return current; },
    setTime: (t) => { target = current = t; velocity = 0; render(t); },
  };
}

start().catch((e) => { console.error(e); root.classList.add("no-webgl"); document.title = "ready"; });
