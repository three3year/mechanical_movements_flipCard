// 第 278 種:C. R. Otis 的吊升平台安全擋止。A 是兩根靜止的立柱,內側固定著棘齒;平台(上部為 B)在兩柱之間升降。
// 吊繩 a 經銷 b 連在平台上,銷 b 又連著兩根肘節槓桿,槓桿外端是棘爪 d;彈簧 c 把 b 往下壓。
// 吊升或降下時,平台的重量與繩的張力把 b 往上拉,棘爪縮在內側、不碰棘齒;繩索斷裂時,彈簧 c 把 b 往下壓,
// 肘節撐開,棘爪 d 被推進棘齒,擋住平台不再下降。
// 主動件是吊繩(平台的高度);狀態按鈕切換繩索完好 / 斷裂。斷裂時平台落到下方最近的一個棘齒上停住。
// 推斷:肘節與棘爪的尺寸、棘齒的齒距。
import { clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

const POST = { x: 2.0, face: 1.75, width: 0.5 };
const TOOTH = { pitch: 0.42, depth: 0.14, from: -3.2, count: 13 };
const LINK = 1.6; // 肘節連桿長
const PAWL_Y = -1.0; // 棘爪所在的高度(相對平台頂)
const B_UP = -0.3; // 繩子拉著時銷 b 的高度
const B_DOWN = -0.75; // 斷繩後彈簧把 b 壓下的高度
const PAWL_TIP = 0.15; // 棘爪尖超出肘節接點的長度
export const RANGE = [0, 2.2];
const BASE = -1.6; // 主動量 0 時平台頂的高度

/** 銷 b 的高度 → 棘爪尖離中線的距離(肘節撐開) */
export const pawlReach = (b) => Math.sqrt(LINK * LINK - (b - PAWL_Y) ** 2) + PAWL_TIP;
export const geometry = { face: POST.face, toothTip: POST.face - TOOTH.depth, B_UP, B_DOWN, pitch: TOOTH.pitch };

/** 主動量 v(吊繩拉起的量)、繩是否斷 → 平台頂的高度、銷 b 的相對高度 */
export function platform(v, broken) {
  const top = BASE + clamp(v, ...RANGE);
  if (!broken) return { top, b: B_UP };
  // 斷繩:平台下落,棘爪落在下方最近的棘齒平面上
  const pawl = top + PAWL_Y;
  const rest = TOOTH.from + TOOTH.pitch * Math.floor((pawl - TOOTH.from) / TOOTH.pitch);
  return { top: rest - PAWL_Y, b: B_DOWN };
}

// 立柱:內側一排棘齒,齒的上面是平的(擋住往下的棘爪)、下面是斜的
const post = (s) => {
  const pts = [[s * (POST.face + POST.width), TOOTH.from - 0.3]];
  pts.push([s * POST.face, TOOTH.from - 0.3]);
  for (let i = 0; i < TOOTH.count; i++) {
    const y = TOOTH.from + i * TOOTH.pitch;
    pts.push([s * POST.face, y], [s * (POST.face - TOOTH.depth), y + TOOTH.pitch * 0.85], [s * POST.face, y + TOOTH.pitch * 0.85]);
  }
  const yTop = TOOTH.from + TOOTH.count * TOOTH.pitch + 0.3;
  pts.push([s * POST.face, yTop], [s * (POST.face + POST.width), yTop]);
  return s > 0 ? pts : pts.reverse();
};

const pawl = shape([[0, -0.07], [PAWL_TIP + 0.02, -0.07], [PAWL_TIP + 0.02, 0.05], [0, 0.07]]);

export default {
  figure: 278,
  parts: [
    { id: "postL", kind: "plate", shape: shape(post(-1)), thickness: 0.5, label: "A", labelOffset: [-2.2, 1.0, 0.4] },
    { id: "postR", kind: "plate", shape: shape(post(1)), thickness: 0.5, label: "A", labelOffset: [2.2, 1.0, 0.4] },
    {
      id: "platform",
      kind: "group",
      label: "B",
      labelOffset: [-0.9, -0.08, 0.4],
      pieces: [
        { kind: "plate", shape: shape(rect(3.2, 0.16, 0, 0)), thickness: 0.4 },
        { kind: "plate", shape: shape(rect(0.16, 2.4, -1.45, -1.2)), thickness: 0.4 },
        { kind: "plate", shape: shape(rect(0.16, 2.4, 1.45, -1.2)), thickness: 0.4 },
        { kind: "plate", shape: shape(rect(3.06, 0.12, 0, PAWL_Y - 0.13)), thickness: 0.3 },
        { kind: "plate", shape: shape(rect(0.14, 0.5, 0, -0.35)), thickness: 0.12, at: [0, 0, -0.12] },
        { kind: "box", size: [3.2, 0.2, 1.2], at: [0, -2.45, 0] },
      ],
    },
    { id: "pinB", kind: "cylinder", radius: 0.09, length: 0.4, label: "b", labelOffset: [0.25, 0.15, 0.3] },
    { id: "springC", kind: "spring", coils: 5, radius: 0.1, wire: 0.022, label: "c", labelOffset: [0.3, 0.1, 0.3] },
    { id: "linkL", kind: "link", width: 0.12, thickness: 0.07 },
    { id: "linkR", kind: "link", width: 0.12, thickness: 0.07 },
    { id: "pawlL", kind: "plate", shape: pawl, thickness: 0.25, arrow: false, label: "d", labelOffset: [0.05, -0.35, 0.3] },
    { id: "pawlR", kind: "plate", shape: pawl, thickness: 0.25, arrow: false, label: "d", labelOffset: [-0.05, -0.35, 0.3] },
    { id: "ropeA", kind: "rope", label: "a", center: [0, 2.2, 0.25], labelOffset: [0.3, 0, 0] },
    { id: "ropeEnd", kind: "rope" },
  ],
  driver: { part: "platform", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 1.4 },
  targets: ["pawlL", "pawlR"], // 繩斷時撐進棘齒的棘爪
  states: {
    initial: "intact",
    options: [
      { id: "intact", label: "繩索完好" },
      { id: "broken", label: "繩索斷裂" },
    ],
  },
  view: { direction: [0.05, 0.05, 1] },
  pose(v, state) {
    const broken = state === "broken";
    const { top, b } = platform(v, broken);
    const by = top + b;
    const reach = pawlReach(b) - PAWL_TIP;
    const py = top + PAWL_Y;
    const ropeTop = 2.5;
    const cut = by + 1.3; // 斷口
    return {
      parts: {
        platform: { position: [0, top, 0] },
        pinB: { position: [0, by, 0.25] },
        springC: { from: [0, top - 0.02, 0.25], to: [0, by + 0.08, 0.25] },
        linkL: { from: [0, by, 0.22], to: [-reach, py, 0.22] },
        linkR: { from: [0, by, 0.22], to: [reach, py, 0.22] },
        pawlL: { position: [-reach, py, 0.22], angle: Math.PI },
        pawlR: { position: [reach, py, 0.22], angle: 0 },
      },
      paths: {
        ropeA: { points: [[0, ropeTop, 0.25], [0, broken ? cut + 0.5 : by, 0.25]], closed: false, phase: -top },
        ropeEnd: { points: [[0, by, 0.25], [0, broken ? cut : by + 0.01, 0.25]], closed: false, phase: -top, visible: broken },
      },
      readouts: [],
    };
  },
};
