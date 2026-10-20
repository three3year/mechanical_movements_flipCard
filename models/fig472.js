// 第 472 種:Grimshaw 的壓縮空氣錘。錘頭接在活塞 A 上,活塞在汽缸 B 裡;空氣像蒸汽進蒸汽機一樣,經頂上的滑閥輪流引進
// 活塞的上方與下方。空氣來自機架裡的儲氣槽 C,由空氣泵 D 供應;空氣泵由旋轉驅動軸 E 上的曲柄帶動。
// 主動件是驅動軸 E。
// 推斷:滑閥由驅動軸 E 上的偏心輪經一根偏心桿推動(像蒸汽機的滑閥;原圖從 E 有一根桿伸到汽缸頂),
// 軸轉一圈滑閥來回一次:前半圈把空氣送到活塞下方、錘升起,後半圈送到上方、錘加速落下打在砧上;
// 空氣泵每轉一圈打一次氣進儲氣槽;剖面圖。
// 推斷(2026-10-21):驅動軸 E 往後伸進機架頂左邊伸出的托架(軸承環);滑閥包在閥座上的閥箱裡(剖開前面),閥桿穿過閥箱
// 左壁的導套;泵筒 D 坐在底座上、底封住,打出的空氣從筒底進機架裡的儲氣槽 C;汽缸與錘桿的長度讓活塞全程留在兩個蓋之間。
import { TAU, Y, X, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle, rect, spanBox } from "./shapes.js";

const E = [-1.0, 2.05, 0]; // 驅動軸
const PUMP = { x: -1.55, r: 0.28, y0: -1.75, y1: 0.45 }; // 泵筒:坐在底座頂面上
const CRANK_R = 0.55;
const PUMP_ROD = 2.6;
export const CYL = { x: 1.3, r: 0.32, y0: 1.2, y1: 2.45, cap: 0.08 };
export const ANVIL_TOP = -0.9;
const HAMMER_ROD = 1.95; // 活塞中心到錘頭頂
const LIFT = 0.75;
const PISTON_T = 0.14;

// 滑閥:偏心輪的中心在軸心 E 偏 ECC,經偏心桿推閥桿;閥坐在汽缸頂的閥座上左右滑
const ECC = 0.09;
export const VALVE_Y = CYL.y1 + 0.23; // 閥(與閥桿)的高度:閥底貼著閥座頂
const VALVE_ROD = 0.55; // 閥桿端(偏心桿的銷)到閥中心
const VALVE_SIZE = [0.2, 0.1, 0.3];
const CHEST = { x0: CYL.x - 0.36, x1: CYL.x + 0.36, wall: 0.06, y0: CYL.y1 + 0.18, y1: VALVE_Y + 0.16, z0: -0.26, z1: 0.2 }; // 閥箱(推斷):閥座上的箱,前面剖開
const ROD_Z = 0; // 閥桿那一層(在閥的中面);閥桿端的銷往前伸到偏心桿那一層
const ECC_Z = 0.13; // 偏心桿那一層
const GUIDE_X = CHEST.x0 + CHEST.wall / 2; // 閥桿穿過左壁的導套
const BRACKET = { x0: -1.3, x1: -0.45, y0: 1.75, y1: 2.35, z0: -0.75, z1: -0.5 }; // 驅動軸 E 的托架(推斷):機架頂往左伸、在飛輪後面
const ECC_ROD = Math.hypot(CYL.x - VALVE_ROD - E[0], VALVE_Y - E[1]); // 偏心桿長:滑閥在中間時剛好
/** 驅動軸轉 theta → 偏心輪中心、閥桿端、滑閥中心偏離中間多少(正:往右,空氣送到活塞下方) */
export function valve(theta) {
  const c = [E[0] + ECC * Math.sin(theta), E[1] - ECC * Math.cos(theta)];
  const end = [c[0] + Math.sqrt(ECC_ROD ** 2 - (VALVE_Y - c[1]) ** 2), VALVE_Y];
  return { c, end, shift: end[0] + VALVE_ROD - CYL.x };
}

// 滑閥換向的軸角:往右越過中間(空氣改進活塞下方)與往左越過中間(改進上方)
const crossing = (up) => {
  const N = 720;
  for (let i = 0; i < N; i++) {
    const [a, b] = [valve((TAU * i) / N).shift, valve((TAU * (i + 1)) / N).shift];
    if (up ? a <= 0 && b > 0 : a >= 0 && b < 0) return (TAU * (i + 0.5)) / N;
  }
  return 0;
};
const TO_BELOW = crossing(true);
const TO_ABOVE = crossing(false);
const BELOW_SPAN = (((TO_ABOVE - TO_BELOW) % TAU) + TAU) % TAU;
const FALL = 0.2 * TAU; // 錘被壓下、加速打到砧上所佔的軸角

/** 驅動軸轉 theta → 活塞的底與頂 */
export function piston(theta) {
  const c = hammer(theta).y + 0.35 + HAMMER_ROD;
  return { center: c, bottom: c - PISTON_T / 2, top: c + PISTON_T / 2 };
}

/** 驅動軸轉 theta → 錘頭底的高度、空氣在活塞哪一側:錘的升落跟著滑閥換向的時刻 */
export function hammer(theta) {
  const since = (at) => (((theta - at) % TAU) + TAU) % TAU;
  const below = valve(theta).shift > 0; // 滑閥偏右:空氣進活塞下方
  // 空氣進下方時錘被頂起(由慢到快再慢,升到頂);換到上方後錘被壓下、加速打在砧上,停在砧上直到滑閥再換向
  const y = below
    ? ANVIL_TOP + LIFT * smooth(Math.min(1, since(TO_BELOW) / (0.9 * BELOW_SPAN)))
    : ANVIL_TOP + LIFT * Math.max(0, 1 - (since(TO_ABOVE) / FALL) ** 2);
  return { y, below };
}

const frame = shape([[-2.1, -2.0], [2.2, -2.0], [2.2, -1.75], [1.85, -1.6], [1.75, -0.8], [0.75, -0.8], [0.6, 0.4], [0.9, 1.0], [1.75, 1.0], [1.75, CHEST.y1], [-0.5, CHEST.y1], [-0.5, 1.75], [-0.15, 1.6], [-0.3, -0.6], [-1.1, PUMP.y0], [-2.1, PUMP.y0]]);
const chestBox = (x0, x1, y0, y1, z0, z1) => spanBox(x0, x1, y0, y1, z0, z1, { role: "chest" });

export default {
  figure: 472,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: frame, thickness: 0.5, at: [0, 0, -0.57], role: "frame" }, // 板的正面在活塞(r 0.3)後面
        { kind: "box", size: [0.7, 0.3, 0.62], at: [CYL.x, ANVIL_TOP - 0.15, -0.01] }, // 砧:從板的正面伸出
        { kind: "lathe", axis: Y, profile: [[0.07, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0 - CYL.cap], [CYL.r, CYL.y1 - CYL.y0 - CYL.cap], [CYL.r, CYL.cap], [0.07, CYL.cap]], at: [CYL.x, CYL.y0, 0], ...backHalf(Y) },
        { kind: "box", size: [0.5, 0.18, 0.4], at: [CYL.x, CYL.y1 + 0.09, 0] }, // 閥座(進氣道在裡面)
        // 閥箱(推斷):背壁、右壁、頂、左壁(閥桿處留口,口上套一圈導套)
        chestBox(CHEST.x0, CHEST.x1, CHEST.y0, CHEST.y1, CHEST.z0, CHEST.z0 + CHEST.wall),
        chestBox(CHEST.x1 - CHEST.wall, CHEST.x1, CHEST.y0, CHEST.y1, CHEST.z0, CHEST.z1),
        chestBox(CHEST.x0, CHEST.x1, CHEST.y1 - CHEST.wall, CHEST.y1, CHEST.z0, CHEST.z1),
        chestBox(CHEST.x0, CHEST.x0 + CHEST.wall, CHEST.y0, VALVE_Y - 0.1, CHEST.z0, CHEST.z1),
        chestBox(CHEST.x0, CHEST.x0 + CHEST.wall, VALVE_Y + 0.1, CHEST.y1, CHEST.z0, CHEST.z1),
        chestBox(CHEST.x0, CHEST.x0 + CHEST.wall, VALVE_Y - 0.1, VALVE_Y + 0.1, CHEST.z0, ROD_Z - 0.1),
        chestBox(CHEST.x0, CHEST.x0 + CHEST.wall, VALVE_Y - 0.1, VALVE_Y + 0.1, ROD_Z + 0.1, CHEST.z1),
        { kind: "cylinder", axis: X, radius: 0.1, inner: 0.03, length: 0.12, at: [GUIDE_X, VALVE_Y, ROD_Z] }, // 閥桿的導套
        // 泵筒 D:坐在底座上,底封住(推斷:原圖泵坐在底座左端的殼裡)
        { kind: "lathe", axis: Y, profile: [[0, 0], [PUMP.r + 0.06, 0], [PUMP.r + 0.06, PUMP.y1 - PUMP.y0], [PUMP.r, PUMP.y1 - PUMP.y0], [PUMP.r, 0.06], [0, 0.06]], at: [PUMP.x, PUMP.y0, 0], ...backHalf(Y), role: "barrel" },
        // 驅動軸 E 的托架(推斷):機架頂往左伸出的板,開軸孔,孔上一圈軸承環
        { kind: "plate", shape: shape(rect(BRACKET.x1 - BRACKET.x0, BRACKET.y1 - BRACKET.y0, (BRACKET.x0 + BRACKET.x1) / 2, (BRACKET.y0 + BRACKET.y1) / 2), [circle(0.085, E[0], E[1]).reverse()]), thickness: BRACKET.z1 - BRACKET.z0, at: [0, 0, (BRACKET.z0 + BRACKET.z1) / 2] },
        { kind: "cylinder", radius: 0.17, inner: 0.085, length: BRACKET.z1 - BRACKET.z0, at: [E[0], E[1], (BRACKET.z0 + BRACKET.z1) / 2] },
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
        { kind: "cylinder", radius: 0.08, length: 0.1 - BRACKET.z0 + 0.1, at: [0, 0, (0.1 + BRACKET.z0 - 0.1) / 2], role: "shaft" }, // 軸:從托架的軸承穿過飛輪到偏心輪的前面(泵桿從曲柄前面掃過軸心,所以只往後伸)
        { kind: "plate", shape: shape([[0, -0.1], [-CRANK_R, -0.1], [-CRANK_R, 0.1], [0, 0.1]]), thickness: 0.06, at: [0, 0, 0.3] },
        { kind: "pulley", style: "spoked", radius: 0.42, width: 0.08, at: [0, 0, -0.3] },
        // 偏心輪(中心偏 ECC,在曲柄臂後面一層)
        { kind: "plate", shape: shape(circle(0.16, 0, -ECC)), thickness: 0.08, at: [0, 0, 0.14] },
        { kind: "cylinder", radius: 0.07, length: 0.12, at: [0, 0, 0.24] }, // 偏心輪與曲柄臂之間的軸頸
      ],
    },
    { id: "eccRod", kind: "link", width: 0.06, thickness: 0.04 },
    // 滑閥與閥桿:閥坐在閥座上、在閥箱裡滑,閥桿往左穿過閥箱左壁的導套
    {
      id: "valve",
      kind: "box",
      size: VALVE_SIZE,
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.025, length: VALVE_ROD - 0.06, at: [-(VALVE_ROD + 0.1) / 2, 0, ROD_Z], role: "rod" },
        { kind: "cylinder", radius: 0.02, length: 0.2, at: [-VALVE_ROD, 0, ROD_Z + 0.07] }, // 閥桿端的銷:往前伸到偏心桿那一層
      ],
    },
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
        eccRod: { from: [v.c[0], v.c[1], ECC_Z], to: [v.end[0], v.end[1], ECC_Z] },
        valve: { position: [CYL.x + v.shift, VALVE_Y, 0] },
        pumpRod: { from: [crank[0], crank[1], 0.35], to: [PUMP.x, pumpY, 0.35] },
        pumpPiston: { position: [PUMP.x, pumpY - 0.08, 0] },
        piston: { position: [CYL.x, piston, 0] },
      },
      flows: [
        // 泵打出的空氣從筒底進機架裡的儲氣槽 C,再經滑閥到汽缸
        { fluid: "air", points: [...stream([[PUMP.x, PUMP.y0 + 0.2, 0.3], [-0.9, PUMP.y0 + 0.2, 0.3], [-0.4, -0.7, 0.3], [0.2, 0.0, 0.3]], travel, { spacing: 0.25 }), ...stream(toCyl, travel, { spacing: 0.2 })] },
      ],
      readouts: [{ label: "滑閥送空氣到", value: h.below ? "活塞下方(抬錘)" : "活塞上方(打擊)" }],
    };
  },
};
