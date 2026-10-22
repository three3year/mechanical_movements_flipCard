// 維護用:掃全書的模型,找「長度會變的剛性桿」——姿勢以 from / to 擺放的零件(連桿、偏心環與桿……),
// 與 kind 為 rod 的路徑零件(姿勢回傳折線的桿),兩端距離(折線則是任一段的長度)在播放中變了,
// 畫面上就是桿在伸縮。彈簧本來就會伸縮,繩、皮帶、鏈會收放,都不算。
// 真的會伸縮的零件(畫成桿的彈簧、熱脹的條)在零件定義上宣告 stretch: "原因";有宣告的略過、另外列出,
// 宣告卻沒寫原因的(stretch: true、空字串)照樣報出。
// 用法:node tools/rigid-links.mjs [圖號或範圍(7 或 186-250)…]
import { pathToFileURL } from "node:url";
import { loadModel } from "../models/registry.js";
import { defaultSpeed, boundsOf, initialValue } from "../verify/sampling.js";
import { figuresFrom } from "./figure-args.mjs";

const SECONDS = 20;
const FPS = 30;
const TOLERANCE = 0.01; // 兩端距離的變化超過這個量才報
const STRETCHY = new Set(["spring"]); // from / to 擺的零件裡本來就會伸縮的
const RIGID_PATHS = new Set(["rod"]); // 路徑零件裡該是剛性的

// 與 tools/scan-models.mjs 相同的自動播放:有範圍的往復,沒範圍的一直加(速度與起點照 verify/sampling.js)
function* play(d) {
  const bounds = boundsOf(d);
  let value = initialValue(d);
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

const reasonOf = (part) => (typeof part.stretch === "string" ? part.stretch.trim() : "");

/** 零件定義上宣告會伸縮、寫了原因的零件:[{ id, kind, reason }…]。 */
export function stretchDeclarations(def) {
  return def.parts.filter((p) => reasonOf(p)).map((p) => ({ id: p.id, kind: p.kind, reason: reasonOf(p) }));
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] ?? 0) - (b[2] ?? 0));

/**
 * 掃一個模型定義:播放每個狀態,量 from / to 擺的零件兩端的距離,與 rod 路徑零件每一段的長度;
 * 回傳長度會變的每一根 { id, kind, min, max }(min、max 是總長的範圍;折線任一段變了就算);
 * 宣告了原因的略過,宣告卻沒寫原因的不論長度變不變都回傳,帶 missingReason: true。
 */
export function stretchedLinks(def) {
  const kinds = new Map(def.parts.map((p) => [p.id, p.kind]));
  const declared = new Set(stretchDeclarations(def).map((d) => d.id));
  const missingReason = def.parts.filter((p) => p.stretch != null && p.stretch !== false && !declared.has(p.id)); // 宣告了卻沒寫原因
  const missingIds = new Set(missingReason.map((p) => p.id));
  const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
  const ranges = {}; // id → { min, max, segments: [{ min, max }…] }
  const measure = (id, lengths) => {
    const total = lengths.reduce((s, l) => s + l, 0);
    const r = (ranges[id] ??= { min: total, max: total, segments: lengths.map((l) => ({ min: l, max: l })) });
    r.min = Math.min(r.min, total);
    r.max = Math.max(r.max, total);
    if (r.segments.length !== lengths.length) r.segments = [{ min: -Infinity, max: Infinity }]; // 折線的點數變了,當成會變
    else lengths.forEach((l, i) => {
      r.segments[i].min = Math.min(r.segments[i].min, l);
      r.segments[i].max = Math.max(r.segments[i].max, l);
    });
  };
  for (const state of states) {
    for (const v of play(def.driver)) {
      const pose = def.pose(v, state);
      for (const [id, p] of Object.entries(pose.parts ?? {})) {
        if (!p.from || !p.to || STRETCHY.has(kinds.get(id)) || declared.has(id) || p.visible === false) continue;
        measure(id, [dist(p.from, p.to)]);
      }
      for (const [id, path] of Object.entries(pose.paths ?? {})) {
        const points = path?.points;
        if (!RIGID_PATHS.has(kinds.get(id)) || declared.has(id) || !points || points.length < 2) continue;
        measure(id, points.slice(1).map((pt, i) => dist(points[i], pt)));
      }
    }
  }
  const stretched = Object.entries(ranges)
    .filter(([id, r]) => r.segments.some((s) => s.max - s.min > TOLERANCE) && !missingIds.has(id))
    .map(([id, r]) => ({ id, kind: kinds.get(id), min: r.min, max: r.max }));
  return [
    ...missingReason.map((p) => ({ id: p.id, kind: p.kind, min: ranges[p.id]?.min ?? NaN, max: ranges[p.id]?.max ?? NaN, missingReason: true })),
    ...stretched,
  ];
}

const describe = (f) =>
  f.missingReason
    ? `${f.id}(${f.kind} 宣告會伸縮卻沒寫原因${Number.isFinite(f.min) ? ` ${f.min.toFixed(2)}–${f.max.toFixed(2)}` : ""})`
    : `${f.id}(${f.kind} ${f.min.toFixed(2)}–${f.max.toFixed(2)})`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const figures = figuresFrom(process.argv.slice(2));
  let count = 0;
  const declarations = [];
  for (const figure of figures) {
    const def = await loadModel(figure);
    const bad = stretchedLinks(def);
    if (bad.length) {
      count++;
      console.log(`圖 ${figure}:` + bad.map(describe).join("、"));
    }
    for (const d of stretchDeclarations(def)) declarations.push(`圖 ${figure}:${d.id}(${d.kind})${d.reason}`);
  }
  console.log(`\n長度會變的桿:${count} 張`);
  if (declarations.length) console.log(`\n宣告會伸縮的零件(${declarations.length} 個):\n` + declarations.join("\n"));
}
