// 維護用:找「看不到相連處」的可疑模型——會動的零件,其包圍球在整段播放中離最近的別的零件
// (包含路徑零件的點)都還有一段距離。只是啟發式(包圍球偏大),列出來給人看圖判斷。
// 用法:node tools/scan-isolated.mjs [取樣數=30] [圖號…]
import { sources, loadModel } from "../models/registry.js";
import { PATH_KINDS } from "../models/kinds.js";
import { gearSize } from "../models/shapes.js";

const samples = Number(process.argv[2] ?? 30);
const only = process.argv.slice(3).map(Number);
const GAP = 0.2; // 包圍球之間的最小距離超過這麼多才列出

function defaultSpeed(d) {
  if (d.speed) return d.speed;
  if (d.cycle) return Math.abs(d.cycle[1] - d.cycle[0]) / 1.2;
  if (d.type === "virtual" && d.mode === "progress") return (d.range[1] - d.range[0]) / 6;
  if (!d.range) return 0.8;
  return (d.range[1] - d.range[0]) / (d.type === "rotation" ? 2.5 : 4);
}
function values(d) {
  const bounds = d.type === "virtual" && d.mode === "progress" ? null : (d.range ?? null);
  const start = d.initial ?? (bounds ? (bounds[0] <= 0 && bounds[1] >= 0 ? 0 : bounds[0]) : 0);
  if (bounds) return Array.from({ length: samples }, (_, i) => bounds[0] + ((bounds[1] - bounds[0]) * i) / (samples - 1));
  const span = defaultSpeed(d) * 60;
  return Array.from({ length: samples }, (_, i) => start + (span * i) / samples);
}

// 零件(含 pieces)在自己座標裡的粗略半徑
function radiusOf(p) {
  let r = 0;
  const own = (q) => {
    switch (q.kind) {
      case "gear": return q.radius + gearSize(q.radius, q.teeth).addendum;
      case "pulley": case "drum": case "cone": case "bevel": case "cylinder": case "sphere": case "lathe": case "stepped": case "sectorLever": case "weight":
        return Math.max(q.radius ?? 0, (q.length ?? q.width ?? 0) / 2, ...(q.steps ?? []).map((s) => s.radius));
      case "box": return Math.hypot(...(q.size ?? [0, 0, 0])) / 2;
      case "plate": return Math.max(0, ...(q.shape?.outline ?? []).map(([x, y]) => Math.hypot(x, y)));
      case "rack": return ((q.teeth ?? 1) * (q.pitch ?? 0.2)) / 2 + 0.3;
      case "worm": return Math.max(q.radius ?? 0, (q.length ?? 0) / 2);
      case "tube": return Math.max(0, ...(q.points ?? []).map((pt) => Math.hypot(...pt)));
      default: return q.radius ?? 0.3;
    }
  };
  r = Math.max(r, own(p));
  for (const q of p.pieces ?? []) r = Math.max(r, Math.hypot(...(q.at ?? [0, 0, 0])) + own(q));
  return r;
}
const centerOf = (part, pose) => pose.position ?? (pose.from && pose.to ? pose.from.map((x, i) => (x + pose.to[i]) / 2) : part.center ?? [0, 0, 0]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] ?? 0) - (b[2] ?? 0));

const figures = (only.length ? only : Object.keys(sources).map(Number)).sort((a, b) => a - b);
let total = 0;
for (const figure of figures) {
  const def = await loadModel(figure);
  const solids = def.parts.filter((p) => !PATH_KINDS.has(p.kind));
  if (solids.length < 2 && !def.parts.some((p) => PATH_KINDS.has(p.kind))) continue;
  const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
  const nearest = new Map(solids.map((p) => [p.id, Infinity]));
  const moved = new Map(solids.map((p) => [p.id, false]));
  const first = {};
  for (const state of states) {
    for (const v of values(def.driver)) {
      const pose = def.pose(v, state);
      const placed = solids.map((p) => {
        const q = pose.parts[p.id] ?? {};
        return { p, c: centerOf(p, q), r: q.from && q.to ? dist(q.from, q.to) / 2 + 0.1 : radiusOf(p), hidden: q.visible === false };
      });
      const pathPts = Object.values(pose.paths ?? {}).flatMap((path) => path.points ?? []);
      for (const a of placed) {
        if (a.hidden) continue;
        const key = `${state}:${a.p.id}`;
        if (first[key]) { if (dist(first[key].c, a.c) > 1e-6) moved.set(a.p.id, true); }
        else first[key] = { c: a.c };
        if (pose.parts[a.p.id]?.angle != null && Math.abs(pose.parts[a.p.id].angle) > 1e-6) moved.set(a.p.id, true);
        let gap = nearest.get(a.p.id);
        for (const b of placed) if (b !== a && !b.hidden) gap = Math.min(gap, dist(a.c, b.c) - a.r - b.r);
        for (const pt of pathPts) gap = Math.min(gap, dist(a.c, pt) - a.r);
        nearest.set(a.p.id, gap);
      }
    }
  }
  const lonely = solids.filter((p) => moved.get(p.id) && nearest.get(p.id) > GAP).map((p) => `${p.id}(${nearest.get(p.id).toFixed(2)})`);
  if (lonely.length) {
    total++;
    console.log(`圖 ${figure}:${lonely.join("、")}`);
  }
}
console.log(`\n有會動但碰不到別的零件的模型:${total} 張`);
