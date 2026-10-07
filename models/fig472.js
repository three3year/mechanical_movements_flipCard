// 第 472 種:Grimshaw 的壓縮空氣錘。錘頭接在活塞 A 上,活塞在汽缸 B 裡;空氣像蒸汽進蒸汽機一樣,經頂上的滑閥輪流引進
// 活塞的上方與下方。空氣來自機架裡的儲氣槽 C,由空氣泵 D 供應;空氣泵由旋轉驅動軸 E 上的曲柄帶動。
// 主動件是驅動軸 E。
// 推斷:滑閥由驅動軸 E 上的偏心輪經一根偏心桿推動(像蒸汽機的滑閥;原圖從 E 有一根桿伸到汽缸頂),
// 軸轉一圈滑閥來回一次:前半圈把空氣送到活塞下方、錘升起,後半圈送到上方、錘加速落下打在砧上;
// 空氣泵每轉一圈打一次氣進儲氣槽;剖面圖。
import { TAU, Y, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle } from "./shapes.js";

const E = [-1.0, 2.05, 0]; // 驅動軸
const PUMP = { x: -1.55, r: 0.28, y0: -1.4, y1: 0.45 };
const CRANK_R = 0.55;
const PUMP_ROD = 2.6;
const CYL = { x: 1.3, r: 0.32, y0: 1.2, y1: 2.3 };
export const ANVIL_TOP = -0.9;
const HAMMER_ROD = 1.55;
const LIFT = 0.75;

// 滑閥:偏心輪的中心在軸心 E 偏 ECC,經偏心桿推閥桿;閥坐在汽缸頂的閥座上左右滑
const ECC = 0.09;
const VALVE_Y = CYL.y1 + 0.22; // 閥(與閥桿)的高度
const VALVE_ROD = 0.35; // 閥桿端到閥中心
const ECC_ROD = Math.hypot(CYL.x - VALVE_ROD - E[0], VALVE_Y - E[1]); // 偏心桿長:滑閥在中間時剛好
/** 驅動軸轉 theta → 偏心輪中心、閥桿端、滑閥中心偏離中間多少(正:往右,空氣送到活塞下方) */
export function valve(theta) {
  const c = [E[0] + ECC * Math.sin(theta), E[1] - ECC * Math.cos(theta)];
  const end = [c[0] + Math.sqrt(ECC_ROD ** 2 - (VALVE_Y - c[1]) ** 2), VALVE_Y];
  return { c, end, shift: end[0] + VALVE_ROD - CYL.x };
}

/** 驅動軸轉 theta → 錘頭底的高度、空氣在活塞哪一側(由滑閥的位置決定) */
export function hammer(theta) {
  const u = (((theta / TAU) % 1) + 1) % 1;
  const below = valve(theta).shift > 0; // 滑閥偏右:空氣進活塞下方
  // 前半圈空氣在下方、錘被頂起;後半圈換到上方,錘被壓下、加速打在砧上,停在砧上直到滑閥再換向
  const y = below ? ANVIL_TOP + LIFT * smooth(Math.min(1, u / 0.45)) : u < 0.7 ? ANVIL_TOP + LIFT * (1 - ((u - 0.5) / 0.2) ** 2) : ANVIL_TOP;
  return { y: Math.max(ANVIL_TOP, y), below, u };
}

const frame = shape([[-2.1, -2.0], [2.2, -2.0], [2.2, -1.75], [1.85, -1.6], [1.75, -0.8], [0.75, -0.8], [0.6, 0.4], [0.9, 1.0], [1.75, 1.0], [1.75, 2.5], [-0.5, 2.5], [-0.5, 1.75], [-0.15, 1.6], [-0.3, -0.6], [-1.1, -1.75], [-2.1, -1.75]]);

export default {
  figure: 472,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: frame, thickness: 0.5, at: [0, 0, -0.5] },
        { kind: "box", size: [0.7, 0.3, 0.6], at: [CYL.x, ANVIL_TOP - 0.15, 0] },
        { kind: "lathe", axis: Y, profile: [[0.07, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0 - 0.08], [CYL.r, CYL.y1 - CYL.y0 - 0.08], [CYL.r, 0.08], [0.07, 0.08]], at: [CYL.x, CYL.y0, 0], ...backHalf(Y) },
        { kind: "box", size: [0.5, 0.18, 0.4], at: [CYL.x, CYL.y1 + 0.09, 0] }, // 閥座(進氣道在裡面)
        { kind: "lathe", axis: Y, profile: [[PUMP.r, 0], [PUMP.r + 0.06, 0], [PUMP.r + 0.06, PUMP.y1 - PUMP.y0], [PUMP.r, PUMP.y1 - PUMP.y0]], at: [PUMP.x, PUMP.y0, 0], ...backHalf(Y) },
      ],
    },
    { id: "labels", kind: "group", pieces: [], label: "B", labelOffset: [CYL.x + 0.55, CYL.y1 - 0.2, 0.4] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0.2, 0.2, 0.4] },
    { id: "labelD", kind: "group", pieces: [], label: "D", labelOffset: [PUMP.x - 0.5, PUMP.y0 + 0.5, 0.4] },
    {
      id: "shaftE",
      kind: "group",
      center: E,
      label: "E",
      labelOffset: [-0.35, -0.3, 0.4],
      spin: 0.45,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [0, 0, -0.15] }, // 軸只到偏心輪的背面(泵桿從曲柄前面掃過軸心)
        { kind: "plate", shape: shape([[0, -0.1], [-CRANK_R, -0.1], [-CRANK_R, 0.1], [0, 0.1]]), thickness: 0.06, at: [0, 0, 0.3] },
        { kind: "pulley", style: "spoked", radius: 0.42, width: 0.08, at: [0, 0, -0.3] },
        // 偏心輪(中心偏 ECC,在曲柄臂後面一層)
        { kind: "plate", shape: shape(circle(0.16, 0, -ECC)), thickness: 0.08, at: [0, 0, 0.14] },
        { kind: "cylinder", radius: 0.07, length: 0.12, at: [0, 0, 0.24] }, // 偏心輪與曲柄臂之間的軸頸
      ],
    },
    { id: "eccRod", kind: "link", width: 0.06, thickness: 0.04 },
    // 滑閥與閥桿:閥坐在閥座上,閥桿往左伸過導座
    { id: "valve", kind: "box", size: [0.2, 0.1, 0.3], arrow: false, pieces: [{ kind: "box", size: [VALVE_ROD + 0.02, 0.04, 0.04], at: [-VALVE_ROD / 2 - 0.09, 0, 0.13] }] },
    { id: "pumpRod", kind: "link", width: 0.07, thickness: 0.05 },
    // 泵的活塞與活塞銷:銷往前伸到泵桿那一層
    { id: "pumpPiston", kind: "group", arrow: false, pieces: [{ kind: "cylinder", axis: Y, radius: PUMP.r - 0.02, length: 0.16 }, { kind: "cylinder", radius: 0.03, length: 0.44, at: [0, 0.08, 0.2] }] },
    {
      id: "piston",
      kind: "cylinder",
      axis: Y,
      radius: CYL.r - 0.02,
      length: 0.14,
      arrow: false,
      label: "A",
      labelOffset: [0.5, 0, 0.4],
      pieces: [
        { kind: "cylinder", radius: 0.06, length: HAMMER_ROD, at: [0, 0, -HAMMER_ROD / 2] },
        { kind: "box", size: [0.55, 0.55, 0.35], at: [0, 0, -HAMMER_ROD - 0.17] },
      ],
    },
  ],
  powered: ["piston"], // 外力來源:錘的活塞是被泵壓進來的空氣推動的,沒有實體相連
  driver: { part: "shaftE", type: "rotation" },
  target: "piston",
  view: { direction: [0.08, 0.08, 1] },
  pose(theta) {
    const h = hammer(theta);
    const v = valve(theta);
    const piston = h.y + 0.35 + HAMMER_ROD;
    const crank = [E[0] + CRANK_R * Math.cos(theta + Math.PI), E[1] + CRANK_R * Math.sin(theta + Math.PI), 0.35];
    const pumpY = crank[1] - Math.sqrt(PUMP_ROD ** 2 - (crank[0] - PUMP.x) ** 2); // 空氣泵活塞
    const travel = theta * 0.8;
    const toCyl = h.below ? [[0.3, 0.2, 0.3], [CYL.x - 0.7, 0.2, 0.3], [CYL.x - 0.7, CYL.y0 + 0.2, 0.3], [CYL.x - 0.2, CYL.y0 + 0.2, 0.3]] : [[0.3, 0.2, 0.3], [CYL.x - 0.7, 0.2, 0.3], [CYL.x - 0.7, CYL.y1 + 0.09, 0.3], [CYL.x, CYL.y1 - 0.1, 0.3]];
    return {
      parts: {
        shaftE: { angle: theta },
        eccRod: { from: [v.c[0], v.c[1], 0.13], to: [v.end[0], v.end[1], 0.13] },
        valve: { position: [CYL.x + v.shift, VALVE_Y, 0] },
        pumpRod: { from: [crank[0], crank[1], 0.35], to: [PUMP.x, pumpY, 0.35] },
        pumpPiston: { position: [PUMP.x, pumpY - 0.08, 0] },
        piston: { position: [CYL.x, piston, 0] },
      },
      flows: [
        { fluid: "air", points: [...stream([[PUMP.x, PUMP.y1, 0.3], [PUMP.x, PUMP.y1 + 0.3, 0.3], [0.0, PUMP.y1 + 0.3, 0.3], [0.2, 0.0, 0.3]], travel, { spacing: 0.25 }), ...stream(toCyl, travel, { spacing: 0.2 })] },
      ],
      readouts: [{ label: "滑閥送空氣到", value: h.below ? "活塞下方(抬錘)" : "活塞上方(打擊)" }],
    };
  },
};
