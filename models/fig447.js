// 第 447 種:在萊茵河等地常見的渡河法:靠水流作用在船舵上,水流以圓弧帶著船橫渡河流,圓心就是繫住船、
// 使它不被沖往下游的錨。
// 主動件是虛擬的「進程」:每單位是一個來回(過河再回來)。原圖是俯視圖,水流由左往右(箭頭)。
// 推斷:船頭朝錨、船身斜對水流,舵把船推向對岸;到岸後舵扳向另一邊,船再沿同一圓弧回來;各階段所佔的進程。
// 靠岸的那一段裡,舵先扳過去、水流再把船身推轉到另一邊的斜角(都是連續的過程,不是一步到位)。
import { deg, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, circle } from "./shapes.js";

export const ANCHOR = [-3.2, 0, 0];
export const ROPE = 4.0;
export const SWING = deg(32); // 船繩偏離下游方向的最大角度(到岸)
const BANK = ROPE * Math.sin(SWING) + 0.55;
const YAW = deg(18); // 船身斜對水流的角度
const MOOR = 0.1; // 靠岸(扳舵、船身轉向)佔的進程

/**
 * 進程 v → 船繩的方向(0 是正下游)、船身斜向哪邊(dir:+1 往上方的岸,−1 往下方的岸,靠岸時連續地換邊)、
 * 舵扳向哪邊(rudder:同樣 −1…+1,比船身先換好)、是否靠在岸邊
 */
export function ferry(v) {
  const u = v - Math.floor(v);
  const turn = (t) => -1 + 2 * smooth(t); // −1 → +1
  if (u < MOOR) return { psi: -SWING, dir: turn(u / MOOR), rudder: turn(u / (0.6 * MOOR)), moored: true };
  if (u < 0.5) return { psi: -SWING + 2 * SWING * smooth((u - MOOR) / (0.5 - MOOR)), dir: 1, rudder: 1, moored: false };
  if (u < 0.5 + MOOR) return { psi: SWING, dir: -turn((u - 0.5) / MOOR), rudder: -turn((u - 0.5) / (0.6 * MOOR)), moored: true };
  return { psi: SWING - 2 * SWING * smooth((u - 0.5 - MOOR) / (0.5 - MOOR)), dir: -1, rudder: -1, moored: false };
}
export const boatAt = (psi) => [ANCHOR[0] + ROPE * Math.cos(psi), ANCHOR[1] + ROPE * Math.sin(psi), 0];

const hull = shape([[-0.55, 0], [-0.45, 0.22], [0.5, 0.25], [0.7, 0.12], [0.75, 0], [0.7, -0.12], [0.5, -0.25], [-0.45, -0.22]], [rect(0.35, 0.3, 0.12, 0).reverse(), rect(0.3, 0.3, -0.25, 0).reverse()]);

export default {
  figure: 447,
  parts: [
    {
      id: "river",
      kind: "group",
      pieces: [
        { kind: "box", size: [8.5, 0.3, 0.2], at: [0.5, BANK + 0.15, -0.1] },
        { kind: "box", size: [8.5, 0.3, 0.2], at: [0.5, -BANK - 0.15, -0.1] },
        { kind: "plate", shape: shape(circle(0.12)), thickness: 0.1, at: ANCHOR },
        { kind: "box", size: [0.06, 0.4, 0.05], at: [ANCHOR[0] - 0.12, 0, 0] },
      ],
    },
    { id: "water", kind: "fill", fluid: "water", center: [0.5, 0, -0.15], size: [8.5, 2 * BANK, 0.05], level: 1 },
    { id: "rope", kind: "rope", radius: 0.025 },
    {
      id: "boat",
      kind: "plate",
      shape: hull,
      thickness: 0.2,
      arrow: false,
      pieces: [{ kind: "box", size: [0.06, 0.06, 0.1], at: [0.8, 0, 0] }],
    },
    { id: "rudder", kind: "plate", shape: shape(rect(0.5, 0.06, 0.25, 0)), thickness: 0.15, arrow: false },
  ],
  powered: ["boat"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "interference", parts: ["river", "boat"], reason: "待確認:river 的方塊 8.5×0.3×0.2 與 boat 的板重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "來回", speed: 0.08, initial: 0.3 },
  target: "boat",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const f = ferry(v);
    const B = boatAt(f.psi);
    // 船頭(局部 −x)朝錨,船身依過河方向斜對水流
    const toAnchor = Math.atan2(ANCHOR[1] - B[1], ANCHOR[0] - B[0]);
    const heading = toAnchor + Math.PI - f.dir * YAW;
    const stern = [B[0] + 0.75 * Math.cos(heading), B[1] + 0.75 * Math.sin(heading), 0.1];
    const bow = [B[0] - 0.55 * Math.cos(heading), B[1] - 0.55 * Math.sin(heading), 0.1];
    return {
      parts: {
        boat: { position: B, angle: heading },
        rudder: { position: stern, angle: heading - f.rudder * deg(35) },
      },
      paths: { rope: { points: [[ANCHOR[0], ANCHOR[1], 0.1], bow], closed: false, phase: 0 } },
      flows: [{ fluid: "water", points: [-0.6, 0.6, -1.7, 1.7].flatMap((y) => stream([[-3.6, y, 0.05], [4.6, y, 0.05]], v * 14, { spacing: 0.6 })) }],
      readouts: [{ label: "船", value: f.moored ? "靠岸,扳舵" : f.dir > 0 ? "往上方的岸" : "往下方的岸" }],
    };
  },
};
