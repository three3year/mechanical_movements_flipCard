// 第 80 種:槓桿 C 振動時,兩根交叉的鉤形棘爪交替鉤住槽形齒條桿 A 兩側的齒,把 A 一步一步往上提。
// 槓桿左端上升時,左端掛的棘爪(交叉到右側)鉤住右側的齒把 A 提起;右端上升時換另一根。
// 主動量是槓桿的累計擺動量;A 每一程都被提起,幾乎連續地上升。
import { deg, swing as swingAt } from "./kit.js";
import { bodyPoint } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { shape, circle, stadium } from "./shapes.js";

const PIVOT = [0, 1.55, 0.3];
const PINS = { left: [-0.95, 0], right: [0.95, 0] };
const SWING = deg(18);
const BAR = { width: 0.95, length: 11.0, slot: 0.16, tooth: 0.16, pitch: 0.19 };
// 桿很長,兩端在畫面外;齒是等距的,桿的位置以 10 個齒距為一輪循環顯示,看起來就是一直往上
const LOOP = BAR.pitch * 10;
const HOOK = 1.55; // 棘爪從銷往下的長度(鉤在對側的齒上)

const pinY = (which) => (psi) => bodyPoint(PIVOT, psi, PINS[which])[1];

/** 主動量 v:齒條桿 A 的高度(往上為正)。ψ 減少(左端上升)時左爪提、增加時右爪提 */
export const barHeight = (v) => doubleAction(v, SWING / 2, -SWING / 2, pinY("left"), pinY("right"));
export const swing = SWING;

const teeth = (side) =>
  Array.from({ length: Math.floor(BAR.length / BAR.pitch) - 2 }, (_, i) => ({
    kind: "plate",
    shape: shape([[0, -0.07], [side * BAR.tooth, 0.0], [0, 0.07]]),
    thickness: 0.12,
    at: [(side * BAR.width) / 2, -BAR.length / 2 + 0.3 + i * BAR.pitch, 0],
  }));

export default {
  figure: 80,
  parts: [
    {
      id: "bar",
      kind: "group",
      center: [0, -0.8, 0],
      pieces: [
        { kind: "plate", shape: shape(stadium(BAR.length, BAR.width).outline.map(([x, y]) => [y, x - BAR.length / 2]), [stadium(BAR.length * 0.9, BAR.slot * 2).outline.map(([x, y]) => [y, x - BAR.length * 0.45]).reverse()]), thickness: 0.12 },
        ...teeth(1),
        ...teeth(-1),
      ],
    },
    {
      id: "guide",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.55, 1.15], [0.55, 1.15], [0.68, 1.8], [-0.68, 1.8]], [[[-0.2, 1.3], [0.2, 1.3], [0.2, 1.65], [-0.2, 1.65]].reverse()]), thickness: 0.1, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: 0.06, length: 0.4, at: [0, 1.5, 0.15] },
      ],
      label: "A",
      labelOffset: [0.15, -0.6, 0.3],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.6, 0.2).outline.map(([x, y]) => [x - 1.8, y]), [circle(0.06).reverse()]), thickness: 0.08 },
        { kind: "sphere", radius: 0.32, at: [-1.95, 0, 0] },
        { kind: "sphere", radius: 0.32, at: [1.95, 0, 0] },
        { kind: "cylinder", radius: 0.1, length: 0.2 },
      ],
      label: "C",
      labelOffset: [1.2, 0.45, 0],
    },
    { id: "pawlLeft", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "pawlRight", kind: "link", width: 0.08, thickness: 0.05 },
  ],
  driver: { part: "lever", type: "rotation", cycle: [SWING / 2, -SWING / 2] },
  view: { direction: [0.06, 0.05, 1], fit: ["lever", "guide", "pawlLeft", "pawlRight"] },
  pose(v) {
    const psi = swingAt(v, SWING / 2, -SWING / 2);
    const h = barHeight(v);
    const z = PIVOT[2] + 0.1;
    const pin = (w) => [...bodyPoint(PIVOT, psi, PINS[w]).slice(0, 2), z];
    // 爪尖鉤在對側的齒邊:左爪的尖端在右側、右爪的在左側,高度隨各自的銷
    const tip = (w, side) => {
      const p = pin(w);
      const x = side * (BAR.width / 2 + 0.12);
      return [x, p[1] - Math.sqrt(HOOK * HOOK - (x - p[0]) ** 2), z];
    };
    return {
      parts: {
        bar: { position: [0, -0.8 + (((h % LOOP) + LOOP) % LOOP) - LOOP / 2, 0] },
        lever: { angle: psi },
        pawlLeft: { from: pin("left"), to: tip("left", 1) },
        pawlRight: { from: pin("right"), to: tip("right", -1) },
      },
      readouts: [],
    };
  },
};
