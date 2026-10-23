// A 12 t removal truck in L&S livery, built from primitives so every part can
// move: cab, box body with roller shutter and tail lift, steered front wheels,
// dual rear wheels. Local frame: +z forward, +y up, origin on the ground under
// the middle of the rear axle (the truck turns about it).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { texture, surface, loadImage } from "./assets.js";
import { mergeStatic } from "./merge.js";

export const T = {
  rear: -3.1, boxFront: 4.1, frontAxle: 5.25, cabZ: 1.35, // the cab is modelled in its own frame, moved forward by cabZ
  cabBack: 2.85, front: 4.98,                              // (cab frame)
  halfW: 1.24, floor: 1.12, roof: 3.76, wheelR: 0.46,
  // Cargo space (inside walls, floor to ceiling, rear opening to front wall): 7.1 × 2.3 × 2.5 m
  cargo: { x: 1.17, y0: 1.12, y1: 3.64, z0: -3.06, z1: 4.02 },
  door: { y0: 1.12, y1: 3.56 },
};

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent?.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
const rbox = (w, h, d, r, mat, x, y, z, parent) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, parent);

// Flat shape drawn in the truck's side view (z, y), given thickness across x.
function sideShape(points, depth, x, mat, parent) {
  const s = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.rotateY(-Math.PI / 2); // shape x → truck z, extrusion → −x
  return mesh(g, mat, x + depth / 2, 0, 0, parent);
}

// Box side with the company livery: white panel, orange pinstripe, teal band with the logo.
function liveryCanvas(logo, w, h, { phone = true } = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#f4f4f1"; g.fillRect(0, 0, w, h);
  const band = h * 0.47;
  g.fillStyle = "#ff581c"; g.fillRect(0, band - h * 0.035, w, h * 0.022);
  g.fillStyle = "#007782"; g.fillRect(0, band, w, h - band);
  const lh = (h - band) * 0.84, lw = (lh * logo.width) / logo.height;
  g.drawImage(logo, w * 0.05, band + (h - band - lh) / 2, lw, lh);
  g.fillStyle = "#0b4f56"; g.textBaseline = "alphabetic";
  g.font = `700 ${Math.round(h * 0.1)}px Manrope, Arial, sans-serif`;
  g.fillText("Entrümpelung · Haushaltsauflösung", w * 0.05, h * 0.21);
  g.fillStyle = "#4b5b5d"; g.font = `600 ${Math.round(h * 0.058)}px Manrope, Arial, sans-serif`;
  g.fillText("Schnell · Zuverlässig · Besenrein übergeben", w * 0.05, h * 0.33);
  if (phone) {
    g.textAlign = "right"; g.fillStyle = "#ffffff";
    g.font = `800 ${Math.round(h * 0.13)}px Manrope, Arial, sans-serif`;
    g.fillText("+49 170 2919567", w * 0.95, band + (h - band) * 0.58);
    g.font = `600 ${Math.round(h * 0.055)}px Manrope, Arial, sans-serif`;
    g.fillText("Kostenlose Besichtigung vor Ort", w * 0.95, band + (h - band) * 0.83);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// Outer skin of one rear door: livery plus red reflective contour marking along
// the top, bottom and outer edge (as on real trucks), none on the meeting edge.
function doorCanvas(logo, side) {
  const w = 512, h = 1040, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#f4f4f1"; g.fillRect(0, 0, w, h);
  const outerX = side > 0 ? 14 : w - 30;
  g.fillStyle = "#c8161d";
  for (let x = side > 0 ? 14 : 0; x < (side > 0 ? w : w - 14); x += 64) { g.fillRect(x, 14, 52, 16); g.fillRect(x, h - 30, 52, 16); }
  for (let y = 14; y < h - 14; y += 64) g.fillRect(outerX, y, 16, 52);
  g.textAlign = "center";
  if (side > 0) {
    g.fillStyle = "#007782";
    const bx = 56, by = 210, bw = w - 112, bh = 300, r = 22;
    g.beginPath(); g.moveTo(bx + r, by); g.arcTo(bx + bw, by, bx + bw, by + bh, r); g.arcTo(bx + bw, by + bh, bx, by + bh, r); g.arcTo(bx, by + bh, bx, by, r); g.arcTo(bx, by, bx + bw, by, r); g.fill();
    const lw = bw - 40, lh = (lw * logo.height) / logo.width;
    g.drawImage(logo, bx + 20, by + (bh - lh) / 2, lw, lh);
    g.fillStyle = "#0b4f56"; g.font = "700 46px Manrope, Arial, sans-serif"; g.fillText("Entrümpelung", w / 2, 600);
    g.fillStyle = "#4b5b5d"; g.font = "600 30px Manrope, Arial, sans-serif"; g.fillText("Haushaltsauflösung", w / 2, 648);
  } else {
    g.fillStyle = "#4b5b5d"; g.font = "600 34px Manrope, Arial, sans-serif"; g.fillText("Jetzt anrufen", w / 2, 300);
    g.fillStyle = "#ff581c"; g.fillRect(w / 2 - 60, 326, 120, 6);
    g.fillStyle = "#0b4f56"; g.font = "800 74px Manrope, Arial, sans-serif"; g.fillText("+49 170", w / 2, 430); g.fillText("2919567", w / 2, 516);
    g.fillStyle = "#4b5b5d"; g.font = "600 30px Manrope, Arial, sans-serif"; g.fillText("Kostenlose Besichtigung", w / 2, 590);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function plateCanvas(text) {
  const c = document.createElement("canvas");
  c.width = 520; c.height = 112;
  const g = c.getContext("2d");
  g.fillStyle = "#f7f7f2"; g.fillRect(0, 0, 520, 112);
  g.strokeStyle = "#111"; g.lineWidth = 6; g.strokeRect(3, 3, 514, 106);
  g.fillStyle = "#1f4fb4"; g.fillRect(6, 6, 56, 100);
  g.fillStyle = "#fff"; g.font = "700 34px Arial"; g.textAlign = "center"; g.fillText("D", 34, 92);
  g.fillStyle = "#111"; g.font = "700 76px Arial"; g.fillText(text, 290, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tyre and rim turned on a lathe around the axle (x).
function wheelGeometries(R, width) {
  const r0 = R * 0.6, w2 = width / 2, rr = 0.07, tyre = [];
  tyre.push(new THREE.Vector2(r0, -w2 * 0.92));
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2); tyre.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, -w2 + rr + Math.sin(a) * rr)); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); tyre.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, w2 - rr + Math.sin(a) * rr)); }
  tyre.push(new THREE.Vector2(r0, w2 * 0.92));
  const rim = [new THREE.Vector2(0.001, w2 * 0.35), new THREE.Vector2(r0 * 0.34, w2 * 0.35), new THREE.Vector2(r0 * 0.42, w2 * 0.15),
    new THREE.Vector2(r0 * 0.86, w2 * 0.1), new THREE.Vector2(r0 * 0.95, w2 * 0.8), new THREE.Vector2(r0 * 1.02, w2 * 0.9), new THREE.Vector2(r0 * 1.02, -w2 * 0.9)];
  const g = [new THREE.LatheGeometry(tyre, 40), new THREE.LatheGeometry(rim, 40)];
  for (const x of g) x.rotateZ(-Math.PI / 2); // lathe axis y → x
  return g;
}
function wheel(M, R, width, side, dual) {
  const [tyreG, rimG] = wheelGeometries(R, width);
  const w = new THREE.Group();
  const faces = (g, x) => { // outer face of each tyre points away from the truck
    const t = mesh(tyreG, M.rubber, x, 0, 0, g); const r = mesh(rimG, M.rim, x, 0, 0, g);
    if (side < 0) { t.rotation.y = Math.PI; r.rotation.y = Math.PI; }
  };
  faces(w, 0);
  if (dual) faces(w, -side * (width + 0.03));
  // Wheel nuts and hub cap on the outer face
  const nutG = new THREE.CylinderGeometry(0.022, 0.022, 0.04, 6); nutG.rotateZ(Math.PI / 2);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; mesh(nutG, M.chrome, side * width * 0.2, Math.cos(a) * R * 0.21, Math.sin(a) * R * 0.21, w); }
  const cap = new THREE.CylinderGeometry(R * 0.12, R * 0.14, 0.06, 20); cap.rotateZ(Math.PI / 2);
  mesh(cap, M.dark, side * width * 0.2, 0, 0, w);
  return w;
}

export async function buildTruck() {
  const [logo, ash, plate] = await Promise.all([loadImage("static/ls-logo.webp"), texture("ash_veneer"), texture("metal_plate")]);
  try { await document.fonts.load("800 40px Manrope"); await document.fonts.load("600 40px Manrope"); } catch { /* falls back to Arial */ }

  const M = {
    paint: new THREE.MeshPhysicalMaterial({ color: "#f2f3f0", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    panel: new THREE.MeshStandardMaterial({ color: "#f3f3f0", roughness: 0.42 }),
    alu: new THREE.MeshStandardMaterial({ color: "#c7ccd0", metalness: 0.85, roughness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: "#26292b", roughness: 0.55 }),
    black: new THREE.MeshStandardMaterial({ color: "#111213", roughness: 0.7 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#161717", roughness: 0.95 }),
    rim: new THREE.MeshStandardMaterial({ color: "#d8d9d6", metalness: 0.45, roughness: 0.35 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#e9ebed", metalness: 1, roughness: 0.14 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#14232a", roughness: 0.04, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 }),
    lamp: new THREE.MeshPhysicalMaterial({ color: "#e9eef0", roughness: 0.06, metalness: 0.5, clearcoat: 1, emissive: "#fff3dc", emissiveIntensity: 0.12 }),
    tail: new THREE.MeshStandardMaterial({ color: "#a3121a", roughness: 0.3, emissive: "#5a0408", emissiveIntensity: 0.5 }),
    amber: new THREE.MeshStandardMaterial({ color: "#f09a22", roughness: 0.3, emissive: "#6b3a00", emissiveIntensity: 0.2 }),
    teal: new THREE.MeshStandardMaterial({ color: "#007782", roughness: 0.45 }),
    ply: surface(ash, { tile: 1.6, color: "#efe2c9", roughness: 0.8 }),
    floor: surface(ash, { tile: 1.2, color: "#5a4632", roughness: 0.75 }),
    tread: surface(plate, { tile: 0.8, color: "#d4d8da", metalness: 0.8, roughness: 0.45 }),
  };
  const root = new THREE.Group(); root.name = "Removal truck";
  const body = new THREE.Group(); root.add(body);
  const { rear, boxFront, cabBack, front, halfW, floor, roof, cargo } = T;
  const L = boxFront - rear, midZ = (boxFront + rear) / 2, wallH = roof - floor + 0.06;

  // ---------- Chassis ----------
  for (const x of [-0.42, 0.42]) box(0.09, 0.28, 9.0, M.dark, x, 0.78, 1.55, body);
  const axle = new THREE.CylinderGeometry(0.07, 0.07, 1.9, 12); axle.rotateZ(Math.PI / 2);
  mesh(axle, M.dark, 0, T.wheelR, 0, body); mesh(axle, M.dark, 0, T.wheelR, T.frontAxle, body);
  mesh(new THREE.SphereGeometry(0.2, 16, 12), M.dark, 0, T.wheelR, 0, body); // differential
  const tank = new THREE.CylinderGeometry(0.26, 0.26, 1.0, 24); tank.rotateX(Math.PI / 2);
  mesh(tank, M.alu, -0.86, 0.72, 2.7, body);
  box(0.5, 0.45, 0.6, M.black, 0.84, 0.72, 2.6, body); // battery box
  for (const s of [-1, 1]) for (const y of [0.52, 0.74]) box(0.05, 0.08, 3.7, M.alu, s * 1.18, y, 2.6, body); // side guards
  box(2.2, 0.14, 0.12, M.dark, 0, 0.52, rear + 0.08, body); // rear under-run bar
  for (const s of [-1, 1]) {
    box(0.02, 0.5, 0.42, M.black, s * 0.95, 0.42, -0.62, body); // mud flaps
    box(0.7, 0.03, 1.15, M.black, s * 0.88, 1.0, 0, body);      // rear wheel guards
  }

  // ---------- Box body ----------
  const sideTex = liveryCanvas(logo, 2048, Math.round((2048 * wallH) / L)); // canvas matches the panel's proportions
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.42 });
  box(2.42, 0.12, L, M.floor, 0, floor - 0.06, midZ, body);
  box(2.48, 0.1, L, M.alu, 0, floor - 0.13, midZ, body);
  for (const s of [-1, 1]) {
    const mats = s > 0 ? [sideMat, M.ply, M.alu, M.alu, M.alu, M.alu] : [M.ply, sideMat, M.alu, M.alu, M.alu, M.alu];
    box(0.05, wallH, L, mats, s * (halfW - 0.025), floor + wallH / 2 - 0.03, midZ, body);
    for (const y of [1.75, 2.65]) box(0.03, 0.06, L - 0.1, M.alu, s * (cargo.x - 0.005), y, midZ, body); // lashing rails
    box(0.07, 0.07, L + 0.02, M.alu, s * (halfW - 0.01), roof - 0.02, midZ, body);                  // roof edge profile
    box(0.06, 0.12, L + 0.02, M.alu, s * (halfW - 0.005), floor - 0.04, midZ, body);                // bottom profile
  }
  box(2.48, 0.06, L, [M.panel, M.panel, M.panel, M.ply, M.panel, M.panel], 0, roof - 0.03, midZ, body);
  box(2.48, wallH, 0.06, [M.alu, M.alu, M.alu, M.alu, M.panel, M.ply], 0, floor + wallH / 2 - 0.03, boxFront - 0.03, body);
  // Rear portal: posts, header with lights, sill
  for (const s of [-1, 1]) {
    box(0.1, wallH + 0.02, 0.12, M.alu, s * (halfW - 0.05), floor + wallH / 2 - 0.03, rear + 0.04, body);
    rbox(0.16, 0.24, 0.05, 0.02, M.tail, s * 0.95, floor - 0.22, rear + 0.02, body);
    rbox(0.1, 0.1, 0.05, 0.02, M.amber, s * 0.72, floor - 0.22, rear + 0.02, body);
  }
  box(2.48, 0.16, 0.12, M.alu, 0, roof - 0.08, rear + 0.04, body);
  for (const x of [-0.5, 0, 0.5]) rbox(0.12, 0.05, 0.04, 0.015, M.amber, x, roof - 0.03, rear - 0.01, body);
  const plateMat = new THREE.MeshStandardMaterial({ map: plateCanvas("LS 2919"), roughness: 0.4 });
  box(0.52, 0.11, 0.02, [M.dark, M.dark, M.dark, M.dark, M.dark, plateMat], 0, 0.7, rear + 0.02, body);

  // Interior light so the cargo reads through the open rear
  const lamp = new THREE.PointLight("#fff1dc", 6, 7, 1.6);
  lamp.position.set(0, roof - 0.25, midZ - 0.6); body.add(lamp);
  box(0.6, 0.03, 0.12, M.lamp, 0, roof - 0.07, midZ - 0.6, body);

  // ---------- Rear doors: two swing doors, folded back 270° along the sides when open ----------
  // Each turns about a hinge line at the box's rear corner; locking bars, cams,
  // handles and hinges sit on the outer skin, the plywood lining faces the cargo.
  const dY0 = floor - 0.03, dH = T.door.y1 + 0.04 - dY0, dW = 1.24, hingeX = halfW + 0.03, hingeZ = rear - 0.05;
  const barG = new THREE.CylinderGeometry(0.014, 0.014, dH - 0.12, 10);
  const doors = [1, -1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * hingeX, 0, hingeZ); g.userData.dynamic = true; body.add(g);
    const skin = new THREE.MeshStandardMaterial({ map: doorCanvas(logo, s), roughness: 0.4 });
    mesh(new RoundedBoxGeometry(dW, dH, 0.045, 2, 0.012), [M.panel, M.panel, M.panel, M.panel, M.ply, skin], -s * (dW / 2 + 0.012), dY0 + dH / 2, 0, g);
    for (const f of [0.3, 0.8]) {
      const x = -s * (0.012 + dW * f);
      mesh(barG, M.chrome, x, dY0 + dH / 2, -0.05, g);
      for (const y of [0.35, 1.25, 2.05]) box(0.07, 0.04, 0.035, M.chrome, x, dY0 + y, -0.04, g);   // bar brackets
      for (const y of [0.03, dH - 0.03]) box(0.08, 0.06, 0.06, M.dark, x, dY0 + y, -0.045, g);       // cams
      box(0.04, 0.36, 0.03, M.dark, x + s * 0.045, dY0 + 0.95, -0.07, g);                            // handle
      box(0.06, 0.05, 0.04, M.chrome, x + s * 0.045, dY0 + 0.74, -0.06, g);                          // handle keeper
    }
    for (const y of [0.3, 0.95, 1.65, 2.3]) box(0.1, 0.12, 0.05, M.dark, -s * 0.03, dY0 + y, -0.03, g); // hinges
    box(0.025, dH - 0.02, 0.05, M.black, -s * (dW + 0.006), dY0 + dH / 2, 0, g);                    // rubber seal
    return g;
  });
  const smooth = (u) => u * u * (3 - 2 * u);
  function setDoor(p) { // 0 open (folded back), 1 closed; the right door shuts first
    doors.forEach((g, i) => {
      const s = i === 0 ? 1 : -1, u = i === 0 ? Math.min(1, Math.max(0, (p - 0.4) / 0.6)) : Math.min(1, p / 0.6);
      g.rotation.y = -s * 1.5 * Math.PI * (1 - smooth(u));
    });
  }

  // ---------- Tail lift: on the ground, up to floor height, folded against the rear ----------
  const lift = new THREE.Group(); lift.userData.dynamic = true; body.add(lift);
  const platform = box(2.3, 0.07, 1.7, M.tread, 0, -0.035, -0.85, lift);
  platform.material = [M.alu, M.alu, M.tread, M.alu, M.alu, M.alu];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) box(0.08, 0.075, 0.12, i % 2 ? new THREE.MeshStandardMaterial({ color: "#f2f2f2" }) : M.tail, s * 1.1, 0.005, -1.64 + i * 0.12, lift);
  }
  const arms = [-1, 1].map((s) => Object.assign(box(0.08, 1, 0.1, M.dark, s * 0.85, 0, rear + 0.25, body), { userData: { dynamic: true } }));
  function setLift(p) { // 0 lowered, 0.5 at floor level, 1 folded up
    const rise = Math.min(1, p * 2), fold = Math.max(0, p * 2 - 1);
    const y = THREE.MathUtils.lerp(0.075, floor - 0.005, THREE.MathUtils.smootherstep(rise, 0, 1));
    lift.position.set(0, y, rear - 0.02);
    lift.rotation.x = (Math.PI / 2) * THREE.MathUtils.smootherstep(fold, 0, 1);
    for (const a of arms) { const h = floor - 0.1 - y + 0.4; a.scale.y = Math.max(0.05, h); a.position.y = y + h / 2 - 0.35; }
  }

  // ---------- Cab (own frame, moved forward to the front of the box) ----------
  const cab = new THREE.Group(); cab.position.z = T.cabZ; body.add(cab);
  const AX = T.frontAxle - T.cabZ;
  const arch = (z0, z1) => { const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI - (i / 12) * Math.PI; pts.push([AX + Math.cos(a) * 0.58, T.wheelR + Math.sin(a) * 0.58]); } return pts.filter(([z, y]) => z >= z0 && z <= z1 && y >= 0.6); };
  const profile = [[cabBack, 0.62], [3.3, 0.62], ...arch(3.3, 4.5), [4.5, 0.62], [4.92, 0.62], [front, 0.78], [front + 0.01, 1.55], [4.88, 1.78], [4.62, 2.7], [4.44, 2.92], [3.0, 2.96], [cabBack, 2.9]];
  const cabShape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(z, y)));
  const cabW = 2.3, bev = 0.07;
  const cabG = new THREE.ExtrudeGeometry(cabShape, { depth: cabW - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 12 });
  cabG.rotateY(-Math.PI / 2); cabG.translate(cabW / 2 - bev, 0, 0);
  mesh(cabG, M.paint, 0, 0, 0, cab);
  // Roof fairing up to the box
  sideShape([[cabBack + 0.02, 2.94], [4.15, 2.94], [3.05, 3.72], [cabBack + 0.02, 3.74]], 2.2, 0, M.paint, cab);
  // Windscreen and side windows (thin glass shapes laid on the body)
  const ws = new THREE.Shape(); const wsW = 2.06, wsH = 0.96, r = 0.08;
  ws.moveTo(-wsW / 2 + r, -wsH / 2); ws.lineTo(wsW / 2 - r, -wsH / 2); ws.quadraticCurveTo(wsW / 2, -wsH / 2, wsW / 2, -wsH / 2 + r);
  ws.lineTo(wsW / 2, wsH / 2 - r); ws.quadraticCurveTo(wsW / 2, wsH / 2, wsW / 2 - r, wsH / 2); ws.lineTo(-wsW / 2 + r, wsH / 2);
  ws.quadraticCurveTo(-wsW / 2, wsH / 2, -wsW / 2, wsH / 2 - r); ws.lineTo(-wsW / 2, -wsH / 2 + r); ws.quadraticCurveTo(-wsW / 2, -wsH / 2, -wsW / 2 + r, -wsH / 2);
  // The bevel pushes the cab surface out by `bev`; glass and trim sit just outside it.
  const FS = front + bev;
  const wsm = mesh(new THREE.ShapeGeometry(ws), M.glass, 0, 2.24 + 0.024, 4.75 + 0.084, cab);
  wsm.rotation.x = -Math.atan2(0.26, 0.9);
  for (const s of [-1, 1]) {
    sideShape([[3.48, 1.82], [4.7, 1.82], [4.5, 2.62], [3.48, 2.62]], 0.012, s * (cabW / 2 + 0.006), M.glass, cab);
    // Door: shut lines round the door, black rubber round the window, flush handle
    const seam = (pts) => sideShape(pts, 0.006, s * (cabW / 2 + 0.004), M.dark, cab);
    seam([[3.3, 0.7], [3.325, 0.7], [3.325, 2.8], [3.3, 2.8]]);
    seam([[4.52, 0.7], [4.545, 0.7], [4.545, 1.8], [4.52, 1.8]]);
    seam([[3.3, 0.7], [4.545, 0.7], [4.545, 0.722], [3.3, 0.722]]);
    sideShape([[3.44, 1.78], [4.75, 1.78], [4.54, 2.66], [3.44, 2.66]], 0.008, s * (cabW / 2 + 0.002), M.black, cab);
    box(0.02, 0.05, 0.2, M.black, s * (cabW / 2 + 0.008), 1.6, 3.52, cab);
    box(0.025, 0.025, 0.16, M.chrome, s * (cabW / 2 + 0.018), 1.6, 3.52, cab);
    box(0.42, 0.06, 0.62, M.black, s * 1.05, 0.48, 3.75, cab);                                                  // step
    // Teal door plate with the logo
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.6), new THREE.MeshStandardMaterial({ map: (() => { const t = new THREE.CanvasTexture(logo); t.colorSpace = THREE.SRGBColorSpace; return t; })(), transparent: true, roughness: 0.4 }));
    const back = rbox(1.05, 0.68, 0.01, 0.06, M.teal, 0, 0, 0, cab);
    back.rotation.y = lp.rotation.y = s * Math.PI / 2;
    back.position.set(s * (cabW / 2 + 0.008), 1.16, 4.0); lp.position.set(s * (cabW / 2 + 0.016), 1.16, 4.0); cab.add(lp);
    // Mirror arm and heads
    const armG = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8); armG.rotateZ(Math.PI / 2);
    mesh(armG, M.black, s * (cabW / 2 + 0.2), 2.25, 4.45, cab);
    rbox(0.07, 0.46, 0.22, 0.03, M.black, s * (cabW / 2 + 0.42), 2.1, 4.42, cab);
    rbox(0.06, 0.2, 0.18, 0.03, M.black, s * (cabW / 2 + 0.4), 1.75, 4.45, cab);
  }
  // Grille, lights, bumper, wipers
  rbox(1.7, 0.6, 0.06, 0.04, M.dark, 0, 1.25, FS, cab);
  for (let i = 0; i < 4; i++) box(1.56, 0.03, 0.03, M.chrome, 0, 1.06 + i * 0.13, FS + 0.035, cab);
  rbox(0.3, 0.12, 0.04, 0.02, M.teal, 0, 1.62, FS + 0.025, cab);
  for (const s of [-1, 1]) {
    rbox(0.42, 0.2, 0.06, 0.05, M.lamp, s * 0.87, 1.0, FS + 0.005, cab);
    rbox(0.14, 0.08, 0.05, 0.02, M.amber, s * 1.02, 0.86, FS + 0.005, cab);
    const wiper = box(0.62, 0.025, 0.03, M.black, s * 0.42, 1.87, 4.93, cab); wiper.rotation.x = -0.28;
  }
  rbox(2.36, 0.34, 0.26, 0.06, M.dark, 0, 0.66, FS - 0.04, cab);
  box(0.52, 0.11, 0.02, [M.dark, M.dark, M.dark, M.dark, plateMat, M.dark], 0, 0.66, FS + 0.1, cab);

  // ---------- Wheels ----------
  const wheels = [];
  for (const s of [-1, 1]) {
    const steer = new THREE.Group(); steer.position.set(s * 0.97, T.wheelR, T.frontAxle); steer.userData.dynamic = true; body.add(steer);
    const fw = wheel(M, T.wheelR, 0.3, s, false); steer.add(fw);
    wheels.push({ w: fw, steer });
    const rw = wheel(M, T.wheelR, 0.28, s, true); rw.position.set(s * 0.97, T.wheelR, 0); rw.userData.dynamic = true; body.add(rw);
    wheels.push({ w: rw });
  }
  function setWheels(dist, steer) {
    for (const { w, steer: st } of wheels) { w.rotation.x = dist / T.wheelR; if (st) st.rotation.y = steer; }
  }

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mergeStatic(body, (o) => o.userData.dynamic);
  // The moving parts are merged within themselves: each door, the lift, each wheel.
  for (const part of [...doors, lift, ...wheels.map(({ w }) => w)]) mergeStatic(part);
  setDoor(0); setLift(0); setWheels(0, 0);
  return { root, setDoor, setLift, setWheels, lamp };
}
