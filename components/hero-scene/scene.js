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
import { hdri, prefetchModels, setAssetBase } from "./assets.js";
import { buildWorld } from "./world.js";
import { buildTruck } from "./truck.js";
import { buildSequence, modelIds } from "./sequence.js";

// Only WebGL that runs on the graphics card. Where the browser can only render it in
// software (hardware acceleration off, a blocked driver) every frame would block the
// page and scrolling would stall, so the poster stays instead. ?software lets tests
// run on a software renderer anyway.
const strict = typeof location === "undefined" || !new URLSearchParams(location.search).has("software");
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
  if (!webglUsable()) { fallback(); return destroy; }

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
    // No multisampling on the canvas: every frame goes through the composer, whose
    // target is multisampled, and its last pass is a full-screen quad.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: reduced, powerPreference: "high-performance", failIfMajorPerformanceCaveat: strict });
    const scene = new THREE.Scene();
    cleanups.push(() => {
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [o.material ?? []].flat()) { for (const v of Object.values(m)) if (v?.isTexture) v.dispose(); m.dispose(); }
      });
      scene.environment?.dispose(); renderer.dispose(); renderer.forceContextLoss();
    });
    renderer.setClearColor(0x000000, 0);
    renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production"; // costly per program
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
    // PCF with a wide kernel: soft edges at about half the cost of PCFSoftShadowMap.
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    const dpr = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
    let baseRatio = dpr; // the quality level's pixel ratio, which dynamic resolution scales
    renderer.setPixelRatio(baseRatio);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

    // High sun from the front right: it reaches into the open room past its walls and
    // throws short shadows back and to the left onto the teal.
    const sunDir = new THREE.Vector3(0.35, 0.75, 0.56).normalize();

    // Everything downloads at once: the HDRI, the room's and the van's textures, and
    // the models the sequence parses once the room and the van stand.
    prefetchModels(modelIds());
    const [env, [, truck]] = await Promise.all([hdri("kloofendal_48d_partly_cloudy_puresky"), Promise.all([buildWorld(scene), buildTruck()])]);
    if (!alive) return;

    // HDRI for ambient light and reflections, turned so its sun lines up with ours.
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
    const aoPass = new SoftAOPass();
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(aoPass);
    // The target holds premultiplied colour (the canvas is transparent): undo that
    // before tone mapping and sRGB, redo it after, or see-through pixels (the glass,
    // shadows on the teal) come out too bright.
    const output = new OutputPass();
    output.material.fragmentShader = output.material.fragmentShader
      .replace("gl_FragColor = texture2D( tDiffuse, vUv );", "gl_FragColor = texture2D( tDiffuse, vUv ); float alpha = gl_FragColor.a; gl_FragColor.rgb /= max( alpha, 1e-4 );")
      .replace(/}\s*$/, "gl_FragColor.rgb *= alpha; }");
    composer.addPass(output);
    cleanups.push(() => { composer.dispose(); ao.dispose(); blurRT.dispose(); blur.dispose(); });
    // Always through the composer (the AO pass switched on or off), so the scene's
    // shaders are the same on every quality level and can be compiled up front.
    const draw = () => { aoPass.enabled = useAO; composer.render(); };
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    // The canvas covers the whole stage; the camera is set up for the band between the
    // copy and the actions (.hero-scene, less the room the actions take below it, at
    // the room width; --lift, --room and --room-max in hero.css) and the view extends
    // past it, so nothing is clipped.
    let dirty = true;
    const lens = (aspect) => { camera.aspect = aspect; camera.fov = seq.lens(aspect); };
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
    // resolution, ambient occlusion, multisampling and pixel ratio; dynamic resolution
    // handles the rest while scrolling.
    const gl = renderer.getContext(), px = new Uint8Array(4);
    // Average over a few frames with one sync at the end: reading a pixel back stalls
    // the whole pipeline, and per frame that stall would dwarf the frame itself.
    const timeFrames = (n) => {
      const a = performance.now();
      for (let i = 0; i < n; i++) { renderer.shadowMap.needsUpdate = i === 0; draw(); }
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return (performance.now() - a) / n;
    };
    // The shadow map is drawn by hand (see render): less often while things move, a
    // lag of a frame or two nobody sees.
    renderer.shadowMap.autoUpdate = false;
    const LEVELS = {
      high: { shadow: mobile ? 2048 : 4096, ao: 1, samples: 4, ratio: dpr },
      medium: { shadow: 2048, ao: 0.5, samples: 4, ratio: Math.min(dpr, 1.5) },
      // 2× multisampling instead of 4×: half the memory traffic.
      low: { shadow: 1024, ao: 0, samples: 2, ratio: Math.min(dpr, 1) },
    };
    let level = "high";
    function setLevel(name, ratio = LEVELS[name].ratio) {
      const l = LEVELS[name];
      level = name;
      if (sun.shadow.mapSize.x !== l.shadow) { sun.shadow.mapSize.setScalar(l.shadow); sun.shadow.map?.dispose(); sun.shadow.map = null; }
      for (const target of [composer.renderTarget1, composer.renderTarget2]) if (target.samples !== l.samples) { target.dispose(); target.samples = l.samples; }
      useAO = l.ao > 0; aoScale = l.ao || 0.5;
      baseRatio = ratio; renderer.setPixelRatio(ratio);
      resize();
    }
    async function chooseQuality() {
      // The test frames use the cheapest look at the full pixel ratio, so the test is
      // short even on a slow device. A frame with shadows at full size and ambient
      // occlusion costs about twice as much (Intel Iris Xe graphics, phone and laptop
      // widths): high wants it under 10 ms, medium under about 34 ms.
      setLevel("low", dpr); seq.evaluate(0.3, camera);
      // A warm-up frame (the shadow map, the last shaders), then three short timings,
      // each in a frame of its own so none blocks the page for long.
      timeFrames(1);
      const samples = [];
      for (let i = 0; i < 3; i++) { await nextFrame(); if (!alive) return null; samples.push(timeFrames(2)); }
      const ms = samples.sort((a, b) => a - b)[1];
      const forced = new URLSearchParams(location.search).get("quality"); // ?quality=high|medium|low for tests
      setLevel(forced ?? (!mobile && ms < 5 ? "high" : ms < 17 ? "medium" : "low"));
      return { level, ms: Math.round(ms * 10) / 10, ao: useAO ? aoScale : 0 };
    }

    // Scroll → target progress through the pinned section.
    const progress = () => {
      const r = hero.getBoundingClientRect();
      const range = r.height - innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    };
    let target = 0, current = 0, velocity = 0, last = performance.now(), frameNo = 0;
    // Safety net: if drawing keeps blocking the page while it scrolls (over 60 ms a
    // frame, eight frames running, at the lowest resolution), the 3D stops and the
    // poster takes over, so the page always scrolls freely.
    let slowFrames = 0, lowest = false;
    const render = (t, settled = true) => {
      const start = performance.now();
      // Shadows: redrawn every frame on the top level; while moving, every second frame
      // on medium and every third on low; always once the motion settles.
      renderer.shadowMap.needsUpdate = level === "high" || settled || frameNo++ % (level === "low" ? 3 : 2) === 0;
      seq.evaluate(t, camera);
      draw();
      if (settled || !strict) return;
      slowFrames = lowest && performance.now() - start > 60 ? slowFrames + 1 : 0;
      if (slowFrames >= 8) { console.warn("Hero scene too slow on this device; showing the poster."); fallback(); destroy(); }
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

    // Before the first frame, everything that used to stall it, done without blocking
    // the page: shaders compile in parallel (KHR_parallel_shader_compile; compiling them
    // on first use froze Chrome on Windows for seconds), textures upload a few per frame.
    // The scene compiles for the composer's target (linear, no tone mapping), the
    // passes' own materials on stand-in quads; the last one draws to the canvas. All of
    // them start at once and are awaited together.
    resize(); seq.evaluate(0.3, camera);
    const quad = new THREE.PlaneGeometry(1, 1);
    // Drawn with the scene's lights: the AO pass's normals and the shadow-map depth
    // materials, one per variant three.js will make from the scene's materials (side
    // flipped, their map, alpha map and alpha test). Kept alive until the end, or
    // disposing them would drop the compiled programs.
    const lit = new THREE.Scene();
    const flip = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };
    const depths = new Map();
    scene.traverse((o) => {
      for (const m of o.isMesh && o.castShadow ? [o.material].flat() : []) {
        const side = m.shadowSide ?? flip[m.side];
        const key = [side, !!m.map, !!m.alphaMap, m.alphaTest > 0].join();
        if (!depths.has(key)) depths.set(key, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side, map: m.map, alphaMap: m.alphaMap, alphaTest: m.alphaTest }));
      }
    });
    cleanups.push(() => depths.forEach((d) => d.dispose()));
    // Each also as an instanced mesh, for the batch of closed boxes.
    for (const m of [ao.normalMaterial, ...depths.values()]) lit.add(new THREE.Mesh(quad, m), new THREE.InstancedMesh(quad, m, 1));
    // The passes' full-screen quads, drawn on their own (no lights).
    const passes = new THREE.Scene();
    for (const m of [ao.gtaoMaterial, ao.pdMaterial, ao.copyMaterial, ao.blendMaterial, blur]) passes.add(new THREE.Mesh(quad, m));
    // OutputPass sets its tone-mapping defines on its first render; set them now.
    output.material.defines = { SRGB_TRANSFER: "", ACES_FILMIC_TONE_MAPPING: "" };
    output._outputColorSpace = renderer.outputColorSpace; output._toneMapping = renderer.toneMapping;
    output.material.needsUpdate = true;
    const onCanvas = new THREE.Scene();
    onCanvas.add(new THREE.Mesh(quad, output.material));
    renderer.setRenderTarget(composer.renderTarget1);
    const compiling = [renderer.compileAsync(scene, camera), renderer.compileAsync(lit, camera, scene), renderer.compileAsync(passes, camera)];
    renderer.setRenderTarget(null);
    compiling.push(renderer.compileAsync(onCanvas, camera));
    await Promise.all(compiling);
    quad.dispose();
    if (!alive) return;
    const textures = new Set();
    scene.traverse((o) => { for (const m of [o.material ?? []].flat()) for (const v of Object.values(m)) if (v?.isTexture) textures.add(v); });
    let slice = performance.now();
    for (const texture of textures) {
      renderer.initTexture(texture);
      if (performance.now() - slice > 12) { await nextFrame(); if (!alive) return; slice = performance.now(); }
    }

    const quality = await chooseQuality();
    if (!alive || !quality) return;

    const onScroll = () => {
      if (window.__heroScene?.frozen) return; // test hook: time set by setTime only
      target = progress();
    };
    addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => removeEventListener("scroll", onScroll));
    // Nothing to draw once the hero has scrolled out of view: the loop stops, and
    // starts again when it comes back.
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && alive && !raf) { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); }
    });
    io.observe(hero);
    cleanups.push(() => io.disconnect());
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
      scale = s; lastScaleChange = now; lowest = s <= 0.56;
      renderer.setPixelRatio(baseRatio * scale);
      resize();
    };
    const fixedScale = Number(new URLSearchParams(location.search).get("res")) || 0; // ?res=0.75 for tests
    function adapt(now, interval, moving) {
      if (fixedScale) { setScale(fixedScale, now); return; }
      if (!moving) { intervals = []; setScale(1, now); return; }
      intervals.push(interval); if (intervals.length > 6) intervals.shift();
      if (intervals.length < 6 || now - lastScaleChange < 200) return;
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avg > 19) setScale(Math.max(0.55, scale - (avg > 30 ? 0.2 : 0.1)), now);
      else if (avg < 14 && scale < 1) setScale(Math.min(1, scale + 0.05), now);
    }

    // The drawn progress follows the scroll on a critically damped spring: each wheel
    // step or swipe becomes one smooth glide, with no jumps in speed, about a tenth of
    // a second behind the scroll (2 / OMEGA; the copy in hero-stage.tsx keeps pace).
    const OMEGA = 22;
    function frame(now) {
      raf = 0;
      if (!alive || !onScreen) return;
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
      raf = requestAnimationFrame(frame);
    }
    render(current);
    hero.classList.add("is-scene-ready");
    hero.dataset.scene = "ready";
    raf = requestAnimationFrame(frame);
    cleanups.push(() => { hero.classList.remove("is-scene-ready"); delete hero.dataset.scene; });

    // Test hooks (used by the capture scripts).
    window.__heroScene = {
      seq, scene, renderer, camera, quality, frozen: false,
      shoot: (t, w, h) => { const url = shoot(t, w, h); renderer.setPixelRatio(baseRatio * scale); resize(); render(current); return url; },
      get time() { return current; },
      setTime: (t) => { target = current = t; velocity = 0; render(t); },
    };
    cleanups.push(() => { delete window.__heroScene; });
  }
}
