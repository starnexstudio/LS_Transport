// Bootstraps the 3D hero preview: a transparent renderer over the page's teal, the
// packed room and the van lit by sun and HDRI, and the clearance timeline, which native
// vertical scroll drives from 0 to 1 like scrubbing a video. The copy follows the same
// timeline: the sentence lights up, "Neues." is underlined, the rail fills.
import * as THREE from "three";
import { hdri } from "./assets.js";
import { buildWorld } from "./world.js";
import { buildTruck } from "./truck.js";
import { buildSequence } from "./sequence.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Pass } from "three/addons/postprocessing/Pass.js";

const root = document.documentElement;
const hero = document.querySelector(".hero");
const stage = document.querySelector(".stage");
const sceneEl = document.querySelector(".scene");
const canvas = document.querySelector("#scene-canvas");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Only WebGL that runs on the graphics card. Where the browser can only render it in
// software (hardware acceleration off, a blocked driver) every frame would block the
// page and scrolling would stall, so the poster stays instead. ?software lets the
// capture scripts run on a software renderer anyway.
const strict = !new URLSearchParams(location.search).has("software");
function webglUsable() {
  try {
    const c = document.createElement("canvas"), opts = { failIfMajorPerformanceCaveat: strict };
    const gl = c.getContext("webgl2", opts) || c.getContext("webgl", opts);
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !(strict && /swiftshader|llvmpipe|software|basic render/i.test(name));
  } catch { return false; }
}

async function start() {
  if (!webglUsable()) { root.classList.add("no-webgl"); document.title = "ready"; return; }
  const mobile = matchMedia("(max-width: 760px)").matches;
  // Transparent: only the objects and their shadows are drawn, the teal page shows through.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: reduced, powerPreference: "high-performance", failIfMajorPerformanceCaveat: strict });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
  // PCF with a wide kernel: soft edges at about half the cost of PCFSoftShadowMap.
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  let baseRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
  renderer.setPixelRatio(baseRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

  // High sun from the front right: it reaches into the open room past its walls and
  // throws short shadows back and to the left onto the teal.
  const sunDir = new THREE.Vector3(0.35, 0.75, 0.56).normalize();

  // HDRI for ambient light and reflections, turned so its sun lines up with ours.
  const env = await hdri("kloofendal_48d_partly_cloudy_puresky");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(env.tex).texture;
  env.tex.dispose(); pmrem.dispose();
  scene.environmentIntensity = 1.5;
  const azimuth = (v) => Math.atan2(v.x, v.z);
  scene.environmentRotation.y = azimuth(sunDir) - azimuth(env.sun);

  const sun = new THREE.DirectionalLight("#fff3e2", 5.2);
  const focus = new THREE.Vector3(2, 0, -2);
  sun.position.copy(focus).addScaledVector(sunDir, 50); sun.target.position.copy(focus);
  sun.castShadow = true; sun.shadow.mapSize.setScalar(mobile ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 10, bottom: -10, near: 30, far: 80 });
  sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  const [, truck] = await Promise.all([buildWorld(scene), buildTruck()]);
  const seq = await buildSequence({ scene, truck, mobile });

  // Ambient occlusion (GTAO): the soft shading where things meet, in the corners,
  // under and behind the furniture, round the window and door, that sun and sky
  // light alone leave flat. The scene renders into a multisampled target, the AO is
  // multiplied in, and the output pass tone-maps it onto the transparent canvas.
  // Full resolution on the top quality level, half below it, none on the lowest.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  const ao = new GTAOPass(scene, camera, 1, 1);
  let aoScale = 1, useAO = true;
  const aoSetSize = ao.setSize.bind(ao);
  ao.setSize = (w, h) => aoSetSize(Math.max(1, Math.round(w * aoScale)), Math.max(1, Math.round(h * aoScale)));
  ao.updateGtaoMaterial({ radius: 1.3, distanceExponent: 1, thickness: 2.5, scale: 1.8, samples: 24 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 8, samples: 16 });
  // GTAO's own denoiser leaves a fine hatch on the flat walls; two depth-aware
  // Gaussian passes (across, then down) smooth it before the AO is multiplied in.
  const blurRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const blur = new THREE.ShaderMaterial({
    uniforms: { tAO: { value: null }, tDepth: { value: ao.depthTexture }, dir: { value: new THREE.Vector2() }, resolution: { value: new THREE.Vector2(1, 1) }, cameraNear: { value: 0.1 }, cameraFar: { value: 400 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      #include <packing>
      uniform sampler2D tAO, tDepth; uniform vec2 dir, resolution; uniform float cameraNear, cameraFar; varying vec2 vUv;
      float viewZ(vec2 uv) { return perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
      void main() {
        float z0 = viewZ(vUv), sum = 0.0, wsum = 0.0;
        for (int i = -6; i <= 6; i++) {
          vec2 uv = vUv + dir * float(i) / resolution;
          float w = exp(-float(i * i) / 18.0) * max(0.0, 1.0 - abs(viewZ(uv) - z0) / (0.04 * abs(z0)));
          sum += texture2D(tAO, uv).r * w; wsum += w;
        }
        gl_FragColor = vec4(vec3(sum / max(wsum, 1e-4)), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  class SoftAOPass extends Pass {
    render(renderer, writeBuffer, readBuffer) {
      ao.output = GTAOPass.OUTPUT.Off; ao.render(renderer, writeBuffer, readBuffer); // normals, AO, denoise
      const u = blur.uniforms; u.cameraNear.value = camera.near; u.cameraFar.value = camera.far;
      u.tAO.value = ao.pdRenderTarget.texture; u.dir.value.set(1, 0); ao.renderPass(renderer, blur, blurRT, 0xffffff, 1);
      u.tAO.value = blurRT.texture; u.dir.value.set(0, 1); ao.renderPass(renderer, blur, ao.gtaoRenderTarget, 0xffffff, 1);
      const out = this.renderToScreen ? null : writeBuffer;
      ao.copyMaterial.uniforms.tDiffuse.value = readBuffer.texture; ao.copyMaterial.blending = THREE.NoBlending;
      ao.renderPass(renderer, ao.copyMaterial, out);
      ao.blendMaterial.uniforms.intensity.value = ao.blendIntensity; ao.blendMaterial.uniforms.tDiffuse.value = ao.gtaoRenderTarget.texture;
      ao.renderPass(renderer, ao.blendMaterial, out);
    }
    setSize(w, h) { ao.setSize(w, h); blurRT.setSize(ao.width, ao.height); blur.uniforms.resolution.value.set(ao.width, ao.height); }
  }
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new SoftAOPass());
  // The target holds premultiplied colour (the canvas is transparent): undo that
  // before tone mapping and sRGB, redo it after, or see-through pixels (the glass,
  // shadows on the teal) come out too bright.
  const output = new OutputPass();
  output.material.fragmentShader = output.material.fragmentShader
    .replace("gl_FragColor = texture2D( tDiffuse, vUv );", "gl_FragColor = texture2D( tDiffuse, vUv ); float alpha = gl_FragColor.a; gl_FragColor.rgb /= max( alpha, 1e-4 );")
    .replace(/}\s*$/, "gl_FragColor.rgb *= alpha; }");
  composer.addPass(output);
  const draw = () => (useAO ? composer.render() : renderer.render(scene, camera));

  // The canvas covers the whole stage; the camera is set up for the band between the
  // copy and the actions (the .scene element, less the room the actions take below it,
  // at the site's room width) and the view extends past it, so nothing is clipped.
  let dirty = true;
  const lens = (aspect) => { camera.aspect = aspect; camera.fov = aspect < 1.3 ? 38 : 30; };
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
    const css = getComputedStyle(sceneEl), band = sceneEl.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    const lift = parseFloat(css.getPropertyValue("--lift")) || 0, room = parseFloat(css.getPropertyValue("--room")) || 1;
    const roomMax = parseFloat(css.getPropertyValue("--room-max")) || Infinity;
    const gap = 20; // clear of the sentence above
    const bw = Math.max(1, Math.min(band.width * room, roomMax)), bh = Math.max(120, band.height - gap - lift);
    const left = band.left - c.left + (band.width - bw) / 2, top = band.top - c.top + gap;
    lens(bw / bh);
    camera.setViewOffset(bw, bh, -left, -top, w, h);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  // Quality follows the device: time a mid-sequence frame and pick the shadow
  // resolution and pixel ratio; dynamic resolution handles the rest while scrolling.
  const gl = renderer.getContext(), px = new Uint8Array(4);
  // Average over a few frames with one sync at the end: reading a pixel back stalls
  // the whole pipeline, and per frame that stall would dwarf the frame itself.
  const timeFrames = (n) => {
    const a = performance.now();
    for (let i = 0; i < n; i++) { renderer.shadowMap.needsUpdate = i === 0; draw(); }
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return (performance.now() - a) / n;
  };
  // The shadow map is drawn by hand (the AO pass renders the scene a second time):
  // every frame on the top level; below it every other frame while things move (a
  // 16 ms lag nobody sees) and always once the motion settles.
  renderer.shadowMap.autoUpdate = false;
  let level = "high";
  function chooseQuality() {
    aoScale = 0.5; resize(); seq.evaluate(0.3, camera);
    // The first frames compile shaders and upload textures and the shadow map;
    // time only once that is done, or a capable device looks slow.
    timeFrames(4);
    const ms = [timeFrames(4), timeFrames(4), timeFrames(4)].sort((a, b) => a - b)[1];
    const forced = new URLSearchParams(location.search).get("quality"); // ?quality=high|medium|low for tests and posters
    level = forced ?? (!mobile && ms < 11 ? "high" : ms < 40 ? "medium" : "low");
    if (level !== "high") {
      sun.shadow.mapSize.setScalar(level === "low" ? 1024 : 2048);
      sun.shadow.map?.dispose(); sun.shadow.map = null;
      baseRatio = Math.min(devicePixelRatio, level === "low" ? 1 : 1.5);
      renderer.setPixelRatio(baseRatio);
    }
    aoScale = level === "high" ? 1 : 0.5; useAO = level !== "low";
    resize();
    return { level, ms: Math.round(ms), ao: useAO ? aoScale : 0 };
  }

  // Scroll → target progress.
  const progress = () => {
    const r = hero.getBoundingClientRect();
    const range = r.height - innerHeight;
    return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
  };
  let target = 0, current = 0, velocity = 0, last = performance.now(), frameNo = 0, copyT = "";
  // The copy on the same timeline: --t lights the sentence and fills the rail, --a
  // draws the underline under "Neues." once the room is empty.
  const copy = (t) => {
    const v = t.toFixed(4);
    if (v === copyT) return;
    copyT = v;
    const u = Math.min(1, Math.max(0, (t - 0.72) / 0.08));
    stage.style.setProperty("--t", v);
    stage.style.setProperty("--a", (1 - (1 - u) ** 3).toFixed(4));
  };
  const render = (t, settled = true) => {
    renderer.shadowMap.needsUpdate = level === "high" || settled || frameNo++ % 2 === 0;
    seq.evaluate(t, camera);
    const cam = window.__preview?.camOverride; // test hook: inspect details from another angle
    if (cam) { camera.position.set(...cam.pos); camera.lookAt(...cam.look); }
    draw();
    copy(t);
  };
  // A still of the moment t at w × h, with a transparent background (WebP keeps the
  // alpha), so it sits on the stage's teal like the live canvas. Used for the
  // reduced-motion pair and the loading / no-WebGL posters.
  const shoot = (t, w, h) => {
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    composer.setPixelRatio(1); composer.setSize(w, h);
    camera.clearViewOffset(); lens(w / h); camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
    seq.evaluate(t, camera); draw();
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
    // No cap on the step: when frames come slowly (a throttled or unfocused tab, a weak
    // GPU) the scene still keeps up with the scroll in real time, in bigger steps.
    // Back from a long pause (another tab), it jumps straight to the scroll position.
    let dt = interval / 1000; last = now;
    const before = current;
    if (dt > 1) { current = target; velocity = 0; dt = 0; }
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
    seq, scene, camera, renderer, quality, frozen: false, ao, composer,
    shoot: (t, w, h) => { const url = shoot(t, w, h); renderer.setPixelRatio(baseRatio * scale); resize(); render(current); return url; },
    get scale() { return scale; }, get time() { return current; },
    setTime: (t) => { target = current = t; velocity = 0; render(t); },
  };
}

start().catch((e) => { console.error(e); root.classList.add("no-webgl"); document.title = "ready"; });
