// 維護用:掃全書的模型,找「長度會變的剛性桿」——姿勢以 from / to 擺放的零件(連桿、偏心環與桿……),
// 兩端距離在播放中變了,畫面上就是桿在伸縮。彈簧本來就會伸縮,不算。
// 用法:node tools/rigid-links.mjs [圖號…]
import { sources, loadModel } from "../models/registry.js";

const SECONDS = 20;
const FPS = 30;
const TOLERANCE = 0.01; // 兩端距離的變化超過這個量才報
const STRETCHY = new Set(["spring"]);

function defaultSpeed(d) {
  if (d.speed) return d.speed;
  if (d.cycle) return Math.abs(d.cycle[1] - d.cycle[0]) / 1.2;
  if (d.type === "virtual" && d.mode === "progress") return (d.range[1] - d.range[0]) / 6;
  if (!d.range) return 0.8;
  return (d.range[1] - d.range[0]) / (d.type === "rotation" ? 2.5 : 4);
}

// 與 tools/scan-models.mjs 相同的自動播放:有範圍的往復,沒範圍的一直加
function* play(d) {
  const bounds = d.type === "virtual" && d.mode === "progress" ? null : (d.range ?? null);
  let value = d.initial ?? (bounds ? (bounds[0] <= 0 && bounds[1] >= 0 ? 0 : bounds[0]) : 0);
  let dir = 1;
  const step = defaultSpeed(d) / FPS;
  for (let i = 0; i < SECONDS * FPS; i++) {
    yield value;
    if (!bounds) value += step;
    else {
      value += dir * step;
      if (value >= bounds[1]) [value, dir] = [bounds[1], -1];
      else if (value <= bounds[0]) [value, dir] = [bounds[0], 1];
    }
  }
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] ?? 0) - (b[2] ?? 0));
const only = process.argv.slice(2).map(Number);
const figures = (only.length ? only : Object.keys(sources).map(Number)).sort((a, b) => a - b);
let count = 0;
for (const figure of figures) {
  const def = await loadModel(figure);
  const kinds = new Map(def.parts.map((p) => [p.id, p.kind]));
  const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
  const ranges = {};
  for (const state of states) {
    for (const v of play(def.driver)) {
      const pose = def.pose(v, state);
      for (const [id, p] of Object.entries(pose.parts)) {
        if (!p.from || !p.to || STRETCHY.has(kinds.get(id)) || p.visible === false) continue;
        const len = dist(p.from, p.to);
        const r = (ranges[id] ??= { min: len, max: len });
        r.min = Math.min(r.min, len);
        r.max = Math.max(r.max, len);
      }
    }
  }
  const bad = Object.entries(ranges).filter(([, r]) => r.max - r.min > TOLERANCE);
  if (bad.length) {
    count++;
    console.log(`圖 ${figure}:` + bad.map(([id, r]) => `${id}(${kinds.get(id)} ${r.min.toFixed(2)}–${r.max.toFixed(2)})`).join("、"));
  }
}
console.log(`\n長度會變的桿:${count} 張`);
