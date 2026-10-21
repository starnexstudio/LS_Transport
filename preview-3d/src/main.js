// Bootstraps the 3D hero preview: renderer, sky and light, the street, the truck
// and the clearance timeline, which native vertical scroll drives from 0 to 1.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { hdri } from "./assets.js";
import { buildWorld } from "./world.js";
import { buildTruck } from "./truck.js";
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

// Sky dome: blue gradient, a soft sun and drifting cumulus (value-noise fbm).
function skyDome(sunDir, exposure) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { zenith: { value: new THREE.Color("#2f6db8") }, horizon: { value: new THREE.Color("#7ea8d6") }, haze: { value: new THREE.Color("#c4d7e4") }, sun: { value: sunDir }, gain: { value: 1 / exposure } },
    vertexShader: `varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 zenith, horizon, haze, sun; uniform float gain; varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
      void main() {
        vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55));
        c = mix(haze, c, smoothstep(-0.01, 0.08, h));
        if (h > 0.0) {
          vec2 uv = d.xz / (h + 0.12) * 1.3;
          float n = fbm(uv + vec2(4.0, 9.0));
          float cl = smoothstep(0.52, 0.78, n) * smoothstep(0.02, 0.22, h);
          float shade = 0.82 + 0.25 * smoothstep(0.5, 0.9, fbm(uv * 1.7 + 3.0));
          c = mix(c, vec3(1.0, 0.99, 0.97) * shade, cl * 0.9);
        }
        float s = max(dot(d, normalize(sun)), 0.0);
        c += vec3(1.0, 0.94, 0.82) * (pow(s, 900.0) * 6.0 + pow(s, 14.0) * 0.12);
        gl_FragColor = vec4(c * gain, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
  dome.frustumCulled = false; dome.renderOrder = -1;
  return dome;
}

async function start() {
  if (!webglAvailable()) { root.classList.add("no-webgl"); document.title = "ready"; return; }
  const mobile = matchMedia("(max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: reduced, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 1500);

  // Afternoon sun from the front left: lights the open rooms and the truck's rear.
  const sunDir = new THREE.Vector3(-0.62, 0.6, 0.5).normalize();
  scene.add(skyDome(sunDir, renderer.toneMappingExposure));
  scene.fog = new THREE.Fog("#cfdde6", 90, 320);

  // HDRI for ambient light and reflections, turned so its sun lines up with ours.
  const env = await hdri("kloofendal_48d_partly_cloudy_puresky");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(env.tex).texture;
  env.tex.dispose(); pmrem.dispose();
  scene.environmentIntensity = 1.5;
  const azimuth = (v) => Math.atan2(v.x, v.z);
  scene.environmentRotation.y = azimuth(sunDir) - azimuth(env.sun);

  const sun = new THREE.DirectionalLight("#fff3e2", 5.2);
  const focus = new THREE.Vector3(-7, 0, 1);
  sun.position.copy(focus).addScaledVector(sunDir, 60); sun.target.position.copy(focus);
  sun.castShadow = true; sun.shadow.mapSize.setScalar(mobile ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 18, bottom: -18, near: 20, far: 110 });
  sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);

  const [, truck] = await Promise.all([buildWorld(scene, { lowDetail: mobile }), buildTruck()]);
  const seq = await buildSequence({ scene, truck, mobile });

  let framing = "wide", dirty = true;
  // Quality follows the device: time a mid-sequence frame and pick ambient occlusion,
  // shadow resolution and pixel ratio to suit (strong GPUs get everything).
  let composer = null;
  const gl = renderer.getContext(), px = new Uint8Array(4);
  const timeFrame = () => { const a = performance.now(); renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; };
  function chooseQuality() {
    resize(); seq.evaluate(0.3, camera, framing);
    timeFrame(); // compiles shaders
    const ms = [timeFrame(), timeFrame(), timeFrame()].sort((a, b) => a - b)[1];
    const forced = new URLSearchParams(location.search).get("quality"); // ?quality=high|medium|low for tests and posters
    const level = forced ?? (!mobile && ms < 14 ? "high" : ms < 30 ? "medium" : "low");
    if (level === "high") {
      composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
      composer.addPass(new RenderPass(scene, camera));
      const gtao = new GTAOPass(scene, camera, 1, 1);
      gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      gtao.blendIntensity = 0.85;
      composer.addPass(gtao);
      composer.addPass(new OutputPass());
    } else {
      sun.shadow.mapSize.setScalar(level === "low" ? 1024 : 2048);
      sun.shadow.map?.dispose(); sun.shadow.map = null;
      renderer.setPixelRatio(Math.min(devicePixelRatio, level === "low" ? 1 : 1.25));
    }
    resize();
    return { level, ms: Math.round(ms) };
  }
  function resize() {
    const w = sceneEl.clientWidth || innerWidth, h = sceneEl.clientHeight || innerHeight * 0.6;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    framing = camera.aspect < 0.95 ? "tall" : "wide";
    camera.fov = framing === "tall" ? 44 : 32;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  // Scroll → target progress; the drawn progress eases towards it (no independent motion).
  const progress = () => {
    const r = hero.getBoundingClientRect();
    const range = r.height - innerHeight;
    return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
  };
  let target = 0, current = 0, last = performance.now(), result = null;
  const render = (t) => {
    result = seq.evaluate(t, camera, framing);
    const cam = window.__preview?.camOverride; // test hook: inspect details from another angle
    if (cam) { camera.position.set(...cam.pos); camera.lookAt(...cam.look); }
    if (composer) composer.render(); else renderer.render(scene, camera);
    label.classList.toggle("on", result.cleared);
  };

  if (reduced) {
    // Static before / after, rendered once from the same scene.
    sceneEl.style.display = "block"; sceneEl.style.height = "420px"; resize();
    render(0); document.querySelector("#still-before").src = renderer.domElement.toDataURL("image/jpeg", 0.86);
    render(1); document.querySelector("#still-after").src = renderer.domElement.toDataURL("image/jpeg", 0.86);
    sceneEl.style.display = ""; sceneEl.style.height = "";
    document.title = "ready";
    return;
  }

  const quality = chooseQuality();

  const onScroll = () => {
    target = progress();
    root.classList.toggle("scrolled", target > 0.004);
    if (bar) bar.classList.toggle("away", hero.getBoundingClientRect().bottom < innerHeight * 0.6);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", resize);
  resize(); onScroll(); current = target;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const before = current;
    current += (target - current) * (1 - Math.exp(-dt / 0.12));
    if (Math.abs(target - current) < 0.0002) current = target;
    if (dirty || current !== before) { render(current); dirty = false; }
    requestAnimationFrame(frame);
  }
  render(current);
  root.classList.add("ready");
  document.title = "ready";
  requestAnimationFrame(frame);

  // Test hooks for the local preview.
  window.__preview = { seq, scene, camera, renderer, quality, setTime: (t) => { target = current = t; render(t); }, get time() { return current; } };
}

start().catch((e) => { console.error(e); root.classList.add("no-webgl"); document.title = "ready"; });
