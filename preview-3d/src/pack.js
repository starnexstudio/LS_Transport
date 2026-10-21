// Load planning, as movers do it: large pieces first, lengthwise along the walls
// from the front of the cargo space; boxes and small things stacked on flat tops.
// The order things fly in follows from the plan: the front of the cargo fills
// first, and anything standing on furniture in the house leaves before it.

// Free-rectangle packer. Coordinates: u across the cargo, v back from the front wall.
class MaxRects {
  constructor(w, l, u = 0, v = 0) { this.free = [{ u, v, w, l }]; }
  // Nearest the front first, then leftmost. `slack` lets a piece overhang a tabletop;
  // `lengthwise` keeps long pieces running along the truck.
  find(w, l, slack = 0, lengthwise = false) {
    let best = null;
    for (const r of this.free) for (const [rw, rl, rot] of [[w, l, 0], [l, w, 1]]) {
      if (lengthwise && rw > rl) continue;
      if (rw > r.w + slack + 1e-6 || rl > r.l + slack + 1e-6) continue;
      const far = r.v + rl;
      if (!best || far < best.far - 1e-6 || (Math.abs(far - best.far) < 1e-6 && r.u < best.u)) {
        best = { u: r.u, v: r.v, w: Math.min(rw, r.w), l: Math.min(rl, r.l), rot, far };
      }
    }
    return best;
  }
  place(n) {
    const out = [];
    for (const r of this.free) {
      if (n.u >= r.u + r.w || n.u + n.w <= r.u || n.v >= r.v + r.l || n.v + n.l <= r.v) { out.push(r); continue; }
      if (n.u > r.u) out.push({ u: r.u, v: r.v, w: n.u - r.u, l: r.l });
      if (n.u + n.w < r.u + r.w) out.push({ u: n.u + n.w, v: r.v, w: r.u + r.w - n.u - n.w, l: r.l });
      if (n.v > r.v) out.push({ u: r.u, v: r.v, w: r.w, l: n.v - r.v });
      if (n.v + n.l < r.v + r.l) out.push({ u: r.u, v: n.v + n.l, w: r.w, l: r.v + r.l - n.v - n.l });
    }
    const inside = (a, b) => b.u <= a.u + 1e-6 && b.v <= a.v + 1e-6 && b.u + b.w >= a.u + a.w - 1e-6 && b.v + b.l >= a.v + a.l - 1e-6;
    this.free = out.filter((a, i) => a.w > 0.02 && a.l > 0.02 && !out.some((b, j) => j !== i && inside(a, b) && (!inside(b, a) || j < i)));
  }
}

// items: [{ key, w (across), d (along), h, stack, support, below }]; `below` is the
// piece it stands on in the house. space: { w, l, h }.
// Returns slots { key: { x, z, y, rot, on } } (x across from the centre line, z = centre's
// distance from the front wall, y = height it stands on, rot = quarter turn) and the
// loading order (keys).
export function planLoad(items, space, gap = 0.03) {
  // Precedence graph: a → b means a has to be loaded before b.
  const next = new Map(items.map((i) => [i.key, new Set()]));
  for (const i of items) if (i.below) next.get(i.key).add(i.below); // it stands on `below` at home
  const reaches = (a, b, seen = new Set()) => a === b || [...next.get(a)].some((c) => !seen.has(c) && (seen.add(c), reaches(c, b, seen)));
  const area = (i) => i.w * i.d;
  const sequence = [
    ...items.filter((i) => !i.stack).sort((a, b) => area(b) - area(a) || b.h - a.h),
    // Pieces that stood on furniture choose first: what they stood on has to wait for them.
    ...items.filter((i) => i.stack).sort((a, b) => !!b.below - !!a.below || !!b.support - !!a.support || area(b) - area(a)),
  ];
  const floor = new MaxRects(space.w, space.l), tops = [], slots = {}, misses = [];
  for (const it of sequence) {
    const w = it.w + gap, d = it.d + gap, long = Math.max(w, d) > 1.2;
    let r = null, top = null;
    if (it.stack) {
      for (const s of tops) {
        // Sitting on s means loading after s; skip supports that have to wait for this piece.
        if (reaches(it.key, s.key) || s.base + it.h > space.h - 0.03) continue;
        r = s.rects.find(w, d, 0.08, long) ?? s.rects.find(w, d, 0.08);
        if (r) { top = s; break; }
      }
    }
    if (r) { top.rects.place(r); next.get(top.key).add(it.key); }
    else { r = floor.find(w, d, 0, long) ?? floor.find(w, d); if (r) floor.place(r); }
    if (!r) { misses.push(it.key); continue; }
    const fw = r.rot ? d : w, fl = r.rot ? w : d, base = top ? top.base : 0;
    slots[it.key] = { x: r.u + fw / 2 - space.w / 2, z: r.v + fl / 2, y: base, rot: r.rot, on: top?.key ?? null };
    if (it.support) tops.push({ key: it.key, base: base + it.h, rects: new MaxRects(fw, fl, r.u, r.v) });
  }
  if (misses.length) console.warn("Cargo full, not packed:", misses.join(", "));

  // Loading order: front of the cargo first, lower before higher, but a piece only
  // after its support in the truck and after whatever stood on it at home.
  const after = new Map(items.map((i) => [i.key, new Set()]));
  for (const [a, bs] of next) for (const b of bs) after.get(b).add(a);
  const order = [], done = new Set();
  // A piece that others wait for inherits their urgency (the TV goes before the sideboard it stood on).
  const own = (k) => { const s = slots[k]; return s ? s.z * 10 + s.y : 1e9; }, memo = new Map();
  const rank = (k) => { if (!memo.has(k)) { memo.set(k, own(k)); memo.set(k, Math.min(own(k), ...[...next.get(k)].map(rank))); } return memo.get(k); };
  while (order.length < items.length) {
    const ready = items.filter((i) => !done.has(i.key) && [...after.get(i.key)].every((k) => done.has(k)));
    if (!ready.length) { console.warn("Loading order has a cycle"); break; }
    ready.sort((a, b) => rank(a.key) - rank(b.key));
    order.push(ready[0].key); done.add(ready[0].key);
  }
  return { slots, order, misses };
}
