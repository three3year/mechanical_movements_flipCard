// 第 439 種:從連續的落水中得到往復運動。水桶底部有一個閥門,撞到地面時打開、把水桶排空,
// 水桶再被掛在滑輪另一邊的配重拉上去。
// 主動件是虛擬的「進程」:一個循環是 裝水 → 下降 → 觸地排空 → 被配重拉回。
// 推斷:水桶在頂端接水裝滿後比配重重,開始下降;各階段所佔的進程。
// 2026-10-07 複查:閥門原本照時序瞬間翻開(演出的動作)。改成:閥瓣下面有一根閥桿,水桶落到底時閥桿先頂到地上的墊塊,
// 水桶再往下落一點坐到墊塊上,閥瓣就被頂離閥座(由接觸算);水桶被拉起時閥瓣靠自重落回閥座。
// 水桶裝滿後比配重重,加速落下、撞到墊塊停住;排空後配重比水桶重,把水桶加速拉上去、撞到頂上的擋停住(推斷)。
import { clamp } from "./kit.js";
import { falling } from "./jumps.js";
import { stream } from "./flow.js";
import { shape, circle } from "./shapes.js";

const PULLEY = { center: [0, 2.2, 0], radius: 0.45 };
const GROUND = -2.05;
const PAD = GROUND + 0.15; // 地上墊塊的頂面(水桶撞到這裡停住)
export const TOP = 1.0; // 水桶在頂端時的中心高度
export const BOTTOM = PAD + 0.38; // 水桶坐在墊塊上時(桶底在桶中心下方 0.38)
const L = PULLEY.radius;
const SUM = TOP + (BOTTOM + 0.2); // 水桶與配重的高度和(繩長不變)
const SEAT = -0.325; // 閥瓣坐在閥座(桶底上面)時,離桶中心的高度
export const STEM = 0.175; // 閥桿長:閥瓣坐著時,閥桿下端比桶底低 0.12(穿過桶底中間的孔)

/** 進程 u → 水桶高度、存量、階段 */
export function cycle(v) {
  const u = v - Math.floor(v);
  if (u < 0.3) return { y: TOP, level: u / 0.3, phase: "接水" };
  if (u < 0.5) return { y: TOP + (BOTTOM - TOP) * falling((u - 0.3) / 0.2), level: 1, phase: "裝滿,比配重重而加速下降" };
  if (u < 0.68) return { y: BOTTOM, level: clamp(1 - (u - 0.52) / 0.12, 0, 1), phase: "撞到地面,閥門被頂開排水" };
  return { y: BOTTOM + (TOP - BOTTOM) * falling((u - 0.68) / 0.27), level: 0, phase: "空桶被配重拉上去" };
}
/** 水桶在 y 時閥瓣的高度:坐在閥座上,或閥桿被墊塊頂住(取較高的) */
export const valveY = (y) => Math.max(y + SEAT, PAD + STEM);
/** 閥門打開了多少(閥瓣離閥座的高度) */
export const opening = (y) => valveY(y) - (y + SEAT);
export const weightY = (y) => SUM - y;

// 繩:從配重往上、繞過滑輪頂、往下到水桶
const ropePath = (yb, yw) => {
  const [cx, cy] = PULLEY.center;
  const arc = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI - (Math.PI * i) / 12;
    return [cx + L * Math.cos(a), cy + L * Math.sin(a), 0];
  });
  return [[cx - L, yw + 0.25, 0], ...arc, [cx + L, yb + 0.42, 0]];
};
const SPOUT = [[2.6, 1.95, 0], [0.75, 1.6, 0], [0.5, 1.2, 0]];

export default {
  figure: 439,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.0, 0.2, 1.2], at: [0.5, GROUND - 0.1, 0] },
        { kind: "box", size: [0.5, 0.15, 0.3], at: [0.45, GROUND + 0.075, 0] }, // 墊塊
        { kind: "box", size: [0.3, 0.06, 0.3], at: [-L, SUM - TOP - 0.28, 0] }, // 擋:水桶被拉到頂時,配重落到這裡停住
        { kind: "box", size: [2.2, 0.1, 0.3], at: [1.7, 1.86, 0], angle: -0.2 },
      ],
    },
    { id: "pulley", kind: "pulley", style: "spoked", center: PULLEY.center, radius: L, width: 0.16 },
    { id: "rope", kind: "rope", radius: 0.02 },
    { id: "weight", kind: "box", size: [0.4, 0.5, 0.4] },
    { id: "bucket", kind: "lathe", axis: [0, 1, 0], profile: [[0.28, -0.38], [0.36, 0.38], [0.32, 0.38], [0.24, -0.34], [0.05, -0.34], [0.05, -0.38]], pieces: [{ kind: "box", size: [0.72, 0.03, 0.03], at: [0, 0.42, 0] }] },
    // 閥瓣與往下伸出桶底的閥桿
    { id: "valve", kind: "group", arrow: false, pieces: [{ kind: "cylinder", axis: [0, 1, 0], radius: 0.12, length: 0.03 }, { kind: "cylinder", axis: [0, 1, 0], radius: 0.025, length: STEM, at: [0, -STEM / 2, 0] }] },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", size: [0.55, 0.66, 0], level: 0 },
  ],
  // 動力重演:水桶與配重照模型走(由水的重量帶動,流體只是示意);閥瓣沿閥桿的方向在桶裡滑,只受重力與墊塊、閥座的支撐
  replay: {
    from: 0.3,
    to: 0.98,
    seconds: 12,
    // 閥瓣掛在水桶上(與桶不算碰撞),滑軌的下限就是閥座
    free: { valve: { slide: [0, 1, 0], on: "bucket", limits: [0, 0.3] } },
    expect: [
      { at: 0.55, part: "valve", label: "水桶撞到地面,閥桿被墊塊頂住,閥門打開", quote: "該閥門在撞擊地面時打開" },
      { at: 0.95, part: "valve", label: "水桶被拉起,閥瓣靠自重落回閥座" },
    ],
  },
  powered: ["bucket", "weight"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.15 },
  target: "bucket",
  view: { direction: [0.06, 0.08, 1] },
  pose(v) {
    const c = cycle(v);
    const yw = weightY(c.y);
    const travel = v * 4;
    const flows = [];
    if (c.phase === "接水") flows.push({ fluid: "water", points: stream(SPOUT, travel, { spacing: 0.16 }) });
    if (opening(c.y) > 0.02 && c.level > 0) flows.push({ fluid: "water", points: stream([[0.45, c.y - 0.4, 0.2], [0.75, GROUND + 0.05, 0.2], [2.2, GROUND + 0.05, 0.2]], travel, { spacing: 0.15 }) });
    return {
      parts: {
        pulley: { angle: (c.y - TOP) / L },
        weight: { position: [-L, yw, 0] },
        bucket: { position: [L, c.y, 0] },
        valve: { position: [L, valveY(c.y), 0] },
        water: { position: [L, c.y, 0], level: c.level },
      },
      paths: { rope: { points: ropePath(c.y, yw), closed: false, phase: 0 } }, // 路徑從繩端(配重)起算
      flows,
      readouts: [{ label: "階段", value: c.phase }],
    };
  },
};

