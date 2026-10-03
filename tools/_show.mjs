// 暫用:精簡印出零件定義(輪廓只給點數與外框)與某個主動量下的姿勢。用法:_show.mjs 圖號[@主動量[@狀態]] id…
import { loadModel } from "../models/registry.js";
const [figArg, ...ids] = process.argv.slice(2);
const [fig, v, state] = figArg.split("@");
const def = await loadModel(Number(fig));
const n = (x) => (typeof x === "number" ? Number(x.toFixed(3)) : x);
const brief = (p) => {
  const o = {};
  for (const [k, val] of Object.entries(p)) {
    if (k === "pieces") o.pieces = val.map(brief);
    else if (k === "shape") {
      const xs = val.outline.map((q) => q[0]), ys = val.outline.map((q) => q[1]);
      o.shape = `outline ${val.outline.length}pts x[${n(Math.min(...xs))},${n(Math.max(...xs))}] y[${n(Math.min(...ys))},${n(Math.max(...ys))}] holes ${val.holes?.length ?? 0}`;
    } else if (k === "profile" || k === "points" || k === "engrave" || k === "mask") o[k] = `(${val.length})`;
    else if (Array.isArray(val)) o[k] = val.map(n);
    else if (typeof val !== "function") o[k] = n(val);
  }
  return o;
};
for (const part of def.parts) if (!ids.length || ids.includes(part.id)) console.log(JSON.stringify(brief(part)));
if (v != null) {
  const pose = def.pose(Number(v), state || def.states?.initial);
  for (const id of ids) console.log("pose", id, JSON.stringify(pose.parts[id] ?? pose.paths?.[id] ?? {}, (k, x) => (typeof x === "number" ? n(x) : x)).slice(0, 300));
}
