// The hero's 3D scene: a transparent renderer over the stage's teal, the packed room
// and the L&S van lit by sun and HDRI, and the clearance timeline, which native
// vertical scroll drives from 0 to 1 like scrubbing a video. Ported from the
// prototype in preview-3d (see its README for the scene and the sequence).
//
// mountHeroScene({ stage, base }) adds the canvas to the hero's pinned stage and
// returns a function that removes it again. The stage holds `.hero-scene` (the band
// the camera frames, with the poster in it) and, for reduced motion, `.hero-still`
// images. The hero gets `is-scene-ready` once the first frame is drawn, or
// `no-webgl` if there is no WebGL; `data-scene` says the same for tests.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Pass } from "three/addons/postprocessing/Pass.js";
import { hdri, setAssetBase } from "./assets.js";
import { buildWorld } from "./world.js";
import { buildTruck } from "./truck.js";
import { buildSequence } from "./sequence.js";

function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
}

export function mountHeroScene({ stage, base = "" }) {
  const hero = stage.closest(".hero");
  const sceneEl = stage.querySelector(".hero-scene");
  let alive = true, raf = 0;
  const cleanups = [];
  const destroy = () => {
    alive = false;
    cancelAnimationFrame(raf);
    cleanups.splice(0).reverse().forEach((f) => f());
  };
  const fallback = () => { hero.classList.add("no-webgl"); hero.dataset.scene = "fallback"; };
  if (!webglAvailable()) { fallback(); return destroy; }

  setAssetBase(base);
  const canvas = document.createElement("canvas");
  canvas.className = "hero-canvas"; canvas.setAttribute("aria-hidden", "true");
  sceneEl.after(canvas);
  cleanups.push(() => canvas.remove());
  start().catch((e) => { if (!alive) return; console.error(e); fallback(); destroy(); });
  return destroy;

  async function start() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = matchMedia("(max-width: 760px)").matches;
    // Transparent: only the objects and their shadows are drawn, the teal page shows through.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: reduced, powerPreference: "high-performance" });
    const scene = new THREE.Scene();
    cleanups.push(() => {
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [o.material ?? []].flat()) { for (const v of Object.values(m)) if (v?.isTexture) v.dispose(); m.dispose(); }
      });
      scene.environment?.dispose(); renderer.dispose(); renderer.forceContextLoss();
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
    // PCF with a wide kernel: soft edges at about half the cost of PCFSoftShadowMap.
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    let baseRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(baseRatio);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

    // High sun from the front right: it reaches into the open room past its walls and
    // throws short shadows back and to the left onto the teal.
    const sunDir = new THREE.Vector3(0.35, 0.75, 0.56).normalize();

    // HDRI for ambient light and reflections, turned so its sun lines up with ours.
    const env = await hdri("kloofendal_48d_partly_cloudy_puresky");
    if (!alive) return;
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
    if (!alive) return;
    const seq = await buildSequence({ scene, truck, mobile });
    if (!alive) return;

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
    cleanups.push(() => { composer.dispose(); ao.dispose(); blurRT.dispose(); blur.dispose(); });
    const draw = () => (useAO ? composer.render() : renderer.render(scene, camera));

    // The canvas covers the whole stage; the camera is set up for the band between the
    // copy and the actions (.hero-scene, less the room the actions take below it, at
    // the room width; --lift, --room and --room-max in hero.css) and the view extends
    // past it, so nothing is clipped.
    let dirty = true;
    const lens = (aspect) => { camera.aspect = aspect; camera.fov = aspect < 1.3 ? 38 : 30; };
    function resize() {
      const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setSize(w, h, false);
      composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
      const css = getComputedStyle(sceneEl), band = sceneEl.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      const lift = parseFloat(css.getPropertyValue("--lift")) || 0, room = parseFloat(css.getPropertyValue("--room")) || 1;
      const roomMax = parseFloat(css.getPropertyValue("--room-max")) || Infinity;
      const gap = 20; // clear of the copy above
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
    const timeFrame = () => { const a = performance.now(); renderer.shadowMap.needsUpdate = true; draw(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; };
    // The shadow map is drawn by hand (the AO pass renders the scene a second time):
    // every frame on the top level; below it every other frame while things move (a
    // 16 ms lag nobody sees) and always once the motion settles.
    renderer.shadowMap.autoUpdate = false;
    let level = "high";
    function chooseQuality() {
      aoScale = 0.5; resize(); seq.evaluate(0.3, camera);
      timeFrame(); // compiles shaders
      const ms = [timeFrame(), timeFrame(), timeFrame()].sort((a, b) => a - b)[1];
      const forced = new URLSearchParams(location.search).get("quality"); // ?quality=high|medium|low for tests
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

    // Scroll → target progress through the pinned section.
    const progress = () => {
      const r = hero.getBoundingClientRect();
      const range = r.height - innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    };
    let target = 0, current = 0, velocity = 0, last = performance.now(), frameNo = 0;
    const render = (t, settled = true) => {
      renderer.shadowMap.needsUpdate = level === "high" || settled || frameNo++ % 2 === 0;
      seq.evaluate(t, camera);
      draw();
    };
    // A still of the moment t at w × h, with a transparent background (WebP keeps the
    // alpha), so it sits on the stage's teal like the live canvas.
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
      const [before, after] = stage.querySelectorAll(".hero-still img");
      if (before) before.src = shoot(0, 1600, 1000);
      if (after) after.src = shoot(1, 1600, 1000);
      hero.dataset.scene = "still";
      destroy();
      return;
    }

    const quality = chooseQuality();

    const onScroll = () => {
      if (window.__heroScene?.frozen) return; // test hook: time set by setTime only
      target = progress();
    };
    addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => removeEventListener("scroll", onScroll));
    // The band moves when the window or the copy above it changes size (fonts loading).
    const ro = new ResizeObserver(() => resize());
    ro.observe(sceneEl);
    cleanups.push(() => ro.disconnect());
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
      if (!alive) return;
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
      raf = requestAnimationFrame(frame);
    }
    render(current);
    hero.classList.add("is-scene-ready");
    hero.dataset.scene = "ready";
    raf = requestAnimationFrame(frame);
    cleanups.push(() => { hero.classList.remove("is-scene-ready"); delete hero.dataset.scene; });

    // Test hooks (used by the capture scripts).
    window.__heroScene = {
      seq, quality, frozen: false,
      shoot: (t, w, h) => { const url = shoot(t, w, h); renderer.setPixelRatio(baseRatio * scale); resize(); render(current); return url; },
      get time() { return current; },
      setTime: (t) => { target = current = t; velocity = 0; render(t); },
    };
    cleanups.push(() => { delete window.__heroScene; });
  }
}
