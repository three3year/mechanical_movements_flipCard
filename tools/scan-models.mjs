// 維護用:掃全書的模型,找「瞬移」與「沒有目標件」。
// 瞬移:模擬自動播放(每秒 30 格)一段時間,零件在一格之內轉過或移過太遠,而且遠比它平常一格的量大
// (落下、彈回沒有演出過程);一直快轉的零件(螺桿)與轉角繞回 2π 不算。
// 用法:node tools/scan-models.mjs [秒數=120] [圖號…]
import { sources, loadModel } from "../models/registry.js";
import { PATH_KINDS } from "../models/kinds.js";

const seconds = Number(process.argv[2] ?? 120);
const only = process.argv.slice(3).map(Number);
const FPS = 30;
const ANGLE_JUMP = 0.3; // 一格超過 17° 視為瞬移
const POS_JUMP = 0.12;

function defaultSpeed(d) {
  if (d.speed) return d.speed;
  if (d.cycle) return Math.abs(d.cycle[1] - d.cycle[0]) / 1.2;
  if (d.type === "virtual" && d.mode === "progress") return (d.range[1] - d.range[0]) / 6;
  if (!d.range) return 0.8;
  return (d.range[1] - d.range[0]) / (d.type === "rotation" ? 2.5 : 4);
}

function* play(d) {
  const bounds = d.type === "virtual" && d.mode === "progress" ? null : (d.range ?? null);
  let value = d.initial ?? (bounds ? (bounds[0] <= 0 && bounds[1] >= 0 ? 0 : bounds[0]) : 0);
  let dir = 1;
  const step = defaultSpeed(d) / FPS;
  for (let i = 0; i < seconds * FPS; i++) {
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
const TAU = Math.PI * 2;
const wrapped = (d) => Math.abs(((d + Math.PI) % TAU + TAU) % TAU - Math.PI);
const SUDDEN = 6; // 比該零件平常一格的量大這麼多倍才算
const median = (xs) => {
  const s = xs.filter((x) => x > 1e-9).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

const figures = (only.length ? only : Object.keys(sources).map(Number)).sort((a, b) => a - b);
let noTarget = [];
for (const figure of figures) {
  const def = await loadModel(figure);
  if (!(def.target || def.targets)) noTarget.push(figure);
  const parts = def.parts.filter((p) => !PATH_KINDS.has(p.kind));
  const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
  const worst = {};
  for (const state of states) {
    const steps = {}; // 每個零件每一格的轉角差與位移
    let prev = null;
    let failed = false;
    for (const v of play(def.driver)) {
      let pose;
      try {
        pose = def.pose(v, state);
      } catch (e) {
        console.log(`圖 ${figure}:pose(${v}) 失敗:${e.message}`);
        failed = true;
        break;
      }
      if (prev) {
        for (const part of parts) {
          const a = pose.parts[part.id] ?? {};
          const b = prev.parts[part.id] ?? {};
          const s = (steps[part.id] ??= { da: [], dp: [], at: [] });
          const hidden = a.visible === false || b.visible === false;
          const da = !hidden && a.angle != null && b.angle != null ? wrapped(a.angle - b.angle) : 0;
          const pa = a.position ?? a.from;
          const pb = b.position ?? b.from;
          const dp = !hidden && pa && pb ? dist(pa, pb) : 0;
          s.da.push(da);
          s.dp.push(dp);
          s.at.push(v);
        }
      }
      prev = pose;
    }
    if (failed) continue;
    for (const [id, s] of Object.entries(steps)) {
      const ma = median(s.da);
      const mp = median(s.dp);
      for (let i = 0; i < s.at.length; i++) {
        const sudden = (s.da[i] > ANGLE_JUMP && s.da[i] > SUDDEN * ma) || (s.dp[i] > POS_JUMP && s.dp[i] > SUDDEN * mp);
        if (!sudden) continue;
        const w = (worst[id] ??= { da: 0, dp: 0, at: s.at[i], state });
        if (s.da[i] > w.da || s.dp[i] > w.dp) Object.assign(w, { da: Math.max(w.da, s.da[i]), dp: Math.max(w.dp, s.dp[i]), at: s.at[i], state });
      }
    }
  }
  const ids = Object.keys(worst);
  if (ids.length) {
    console.log(
      `圖 ${figure}:` +
        ids.map((id) => `${id}(${worst[id].da ? "轉 " + ((worst[id].da * 180) / Math.PI).toFixed(0) + "°" : ""}${worst[id].dp ? " 移 " + worst[id].dp.toFixed(2) : ""} @${worst[id].at.toFixed(2)}${worst[id].state ? " " + worst[id].state : ""})`).join("、"),
    );
  }
}
console.log(`\n沒有目標件:${noTarget.length} 張`);
