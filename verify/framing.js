// 取景掃描的核心(維護工具 tools/framing.mjs 用,不屬於實體驗證的成敗):照檢視器的擺放規則量外框,
// 比較舊的取樣(有範圍時兩端與中間、其餘一個週期中的五處)、均勻取樣(viewer/framing.js)與段數加倍的均勻取樣。
// 外框是可見零件(view.fit 有列時只算列出的)在各取樣姿勢下的實體外框聯集;實體沿用 verify/scene.js 的凸塊,
// 和檢視器逐頂點的外框差在轉動記號與存量填色、作圖軌跡(不算實體),取景的比較用不到這點差別。
import { Scene } from "./scene.js";
import { initialValue } from "./sampling.js";
import { framingValues, framingSpan, FRAMING_SEGMENTS } from "../viewer/framing.js";

/** 改成均勻取樣以前檢視器的取樣:有範圍時取兩端與中間加上目前值,其餘從目前值起一個週期中的五處 */
export function legacyValues(driver, value) {
  const progress = driver.type === "virtual" && driver.mode === "progress";
  if (driver.range && !progress) {
    const [min, max] = driver.range;
    return [min, (min + max) / 2, max, value];
  }
  const span = progress ? driver.range[1] - driver.range[0] : driver.cycle ? Math.abs(driver.cycle[1] - driver.cycle[0]) : Math.PI * 2;
  return [0, 0.25, 0.5, 0.75, 1].map((f) => value + f * span);
}

const emptyBox = () => [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
function grow(box, other) {
  for (let k = 0; k < 3; k++) {
    box[k] = Math.min(box[k], other[k]);
    box[k + 3] = Math.max(box[k + 3], other[k + 3]);
  }
  return box;
}

/**
 * 一組主動量下(初始狀態)的取景外框:{ box: [minX, minY, minZ, maxX, maxY, maxZ], parts: Map(零件 → 它自己的外框),
 * reach: 外框的每一面是在哪個主動量走到的 }
 */
export function framingBox(def, values, scene = new Scene(def)) {
  const state = def.states?.initial;
  const only = def.view?.fit ? new Set(def.view.fit) : null;
  const box = emptyBox();
  const reach = new Array(6).fill(null);
  const parts = new Map();
  for (const v of values) {
    scene.apply(def.pose(v, state));
    for (const entry of scene.entries) {
      if (!entry.visible || !entry.pieces.length || (only && !only.has(entry.id))) continue;
      for (let k = 0; k < 6; k++) if (k < 3 ? entry.box[k] < box[k] : entry.box[k] > box[k]) reach[k] = v;
      grow(box, entry.box);
      if (!parts.has(entry.id)) parts.set(entry.id, emptyBox());
      grow(parts.get(entry.id), entry.box);
    }
  }
  return { box, parts, reach };
}

// wider 比 ref 往外多出多少:最遠的一面多出的距離、佔 ref 最長邊的比例,走到那一面最外的零件與當時的主動量
function growth(ref, wider) {
  const side = Math.max(...[0, 1, 2].map((k) => ref.box[k + 3] - ref.box[k]));
  let best = { excess: 0, growth: 0, part: null, axis: null, at: null };
  for (let k = 0; k < 6; k++) {
    const excess = k < 3 ? ref.box[k] - wider.box[k] : wider.box[k] - ref.box[k];
    if (excess <= best.excess + 1e-9) continue;
    let part = null;
    for (const [id, b] of wider.parts) if (b[k] === wider.box[k]) part ??= id;
    best = { excess, growth: side > 0 ? excess / side : 0, part, axis: `${k < 3 ? "−" : "+"}${"xyz"[k % 3]}`, at: wider.reach[k] };
  }
  return best;
}

/**
 * 一張圖的取景掃描:uniform 是均勻取樣(segments 段)比舊取樣多出的,doubled 是段數加倍比 segments 段多出的。
 * 各自是 { excess, growth(佔最長邊的比例), part, axis, at(走到最遠時的主動量) };span 是取樣涵蓋的主動量區間。
 */
export function scanFraming(def, segments = FRAMING_SEGMENTS) {
  const value = initialValue(def.driver);
  const scene = new Scene(def);
  const legacy = framingBox(def, legacyValues(def.driver, value), scene);
  const uniform = framingBox(def, framingValues(def.driver, value, segments), scene);
  const doubled = framingBox(def, framingValues(def.driver, value, segments * 2), scene);
  return { span: framingSpan(def.driver, value), uniform: growth(legacy, uniform), doubled: growth(uniform, doubled) };
}
