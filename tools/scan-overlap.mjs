// 維護用:掃全書的模型,找同一平面上的板件 / 齒輪互相穿透(貼合不對、齒咬進實體)。
// 只看 axis 為 Z(預設)且 z 範圍重疊的 gear / plate 零件兩兩之間,在自動播放的取樣姿勢下,
// 一個的外形是否伸進另一個的實體(在孔裡的不算)。
// 齒輪齒廓本身的齒頂圓角差(約 0.01)不算:只報穿入深度超過 DEPTH 的。
// 用法:node tools/scan-overlap.mjs [取樣數=40] [圖號…]
import { sources, loadModel } from "../models/registry.js";
import { gearShape } from "../models/shapes.js";
import { penetrationDepth } from "../models/contact.js";

const samples = Number(process.argv[2] ?? 40);
const DEPTH = 0.03;
const only = process.argv.slice(3).map(Number);

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
  const span = defaultSpeed(d) * 60; // 一分鐘的播放
  return Array.from({ length: samples }, (_, i) => start + (span * i) / samples);
}

const isZ = (p) => !p.axis || (Math.abs(p.axis[0]) < 1e-9 && Math.abs(p.axis[1]) < 1e-9);
function outlineOf(p) {
  if (p.kind === "gear") {
    const mask = p.mask ?? (p.toothed ? (i) => p.toothed.includes(i) : undefined);
    const g = gearShape({ ...p, mask }); // 內齒輪的實體是外圈,齒廓是孔(與繪圖層同一份形狀)
    return { outline: g.outline, holes: g.holes };
  }
  if (p.kind === "plate" && p.shape?.outline) return { outline: p.shape.outline, holes: p.shape.holes ?? [] };
  return null;
}
const thick = (p) => (p.kind === "gear" ? (p.width ?? 0.25) : (p.thickness ?? 0.2));

function place(shape, pose, part) {
  const c = pose.position ?? part.center ?? [0, 0, 0];
  const a = pose.angle ?? 0;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const put = (pts) => pts.map(([x, y]) => [c[0] + x * cos - y * sin, c[1] + x * sin + y * cos]);
  return { outline: put(shape.outline), holes: shape.holes.map(put), z: c[2] ?? 0 };
}

const figures = (only.length ? only : Object.keys(sources).map(Number)).sort((a, b) => a - b);
let total = 0;
for (const figure of figures) {
  const def = await loadModel(figure);
  const flat = def.parts.filter((p) => isZ(p) && outlineOf(p));
  if (flat.length < 2) continue;
  const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
  const found = new Map();
  for (const state of states) {
    for (const v of values(def.driver)) {
      const pose = def.pose(v, state).parts;
      const placed = flat.map((p) => ({ p, s: place(outlineOf(p), pose[p.id] ?? {}, p), t: thick(p) }));
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const A = placed[i], B = placed[j];
          if (pose[A.p.id]?.visible === false || pose[B.p.id]?.visible === false) continue;
          if (Math.abs(A.s.z - B.s.z) >= (A.t + B.t) / 2 - 1e-6) continue; // z 不重疊
          const key = `${A.p.id}×${B.p.id}`;
          const depth = penetrationDepth(A.s, B.s);
          if (depth <= DEPTH) continue;
          const f = found.get(key);
          if (f) { f.n++; if (depth > f.depth) Object.assign(f, { depth, at: v, state }); }
          else found.set(key, { n: 1, depth, at: v, state });
        }
      }
    }
  }
  if (found.size) {
    total++;
    console.log(`圖 ${figure}:` + [...found].map(([k, f]) => `${k}(${f.n}/${samples * states.length} 次,最深 ${f.depth.toFixed(2)} @${f.at.toFixed(2)}${f.state ? " " + f.state : ""})`).join("、"));
  }
}
console.log(`\n有穿透的模型:${total} 張`);
