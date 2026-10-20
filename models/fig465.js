// 第 465 種:平衡泵。一對泵由一個人交替踩(按)槓桿或樑的兩端來回操作。
// 主動件是樑(繞中間的支點擺動;原圖有人站在樑上)。
// 推斷:兩個泵各接在樑的一邊,一邊的活塞上升時另一邊下降;兩端的球是平衡重;泵是提升泵,上行時水從出水管流出;
// 人不畫出。照原圖(2026-10-20):泵立在兩岸之間的坑底水裡,架子的腳站在岸上;兩個泵筒頂上各伸出一根彎管,
// 合成 Y 形總管往上——原圖的總管從平台後面往上、去處沒畫,模型(推斷)讓它從平台下方往左伸出、在平台旁往上開口送出。
// 活塞桿頂是叉頭,以銷鉸在樑的孔上(桿隨樑的孔微微傾斜,活塞仍在泵筒軸線上);樑架在中柱頂的叉頭上。
import { Y, Z, deg, quatFromZ, quatAxisAngle, quatMul, rot2 } from "./kit.js";
import { stroke, valveOpening, barrel, flap, water } from "./pump.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

export const PIVOT = [0, 1.7, 0];
const HALF = 2.1; // 樑半長
export const ATTACH = 0.75; // 活塞桿接在樑上離支點
export const ROD = 3.0; // 樑的銷到活塞中心
export const SWING = [deg(-12), deg(12)];
export const BANK_TOP = -1.25; // 兩岸的頂面(架子的腳站在上面)
export const PIT_FLOOR = -2.45; // 坑底
export const WATER_TOP = -1.9; // 坑裡的水面
export const BARREL = { r: 0.25, y0: PIT_FLOOR, y1: -0.95 }; // 泵筒立在坑底,下段浸在水裡
const SPOUT_Y = BARREL.y1 - 0.2; // 泵筒頂附近:水被活塞提到這裡就從出水管走
const OPEN = deg(55);
const PIPE_R = 0.06; // 出水管
const PIPE_Z = -0.15; // 出水管從泵筒頂的後半升起(活塞桿在軸線上)
const JOIN = [0, BARREL.y1 + 0.8, PIPE_Z]; // 兩根出水管合成總管處
/** 兩根出水管(左、右泵)從泵筒頂到合流處 */
export const DELIVERY = [-1, 1].map((s) => [
  [s * ATTACH, BARREL.y1 - 0.05, PIPE_Z],
  [s * ATTACH, BARREL.y1 + 0.2, PIPE_Z],
  [s * ATTACH * 0.55, BARREL.y1 + 0.55, PIPE_Z],
  JOIN,
]);
/** 總管:從合流處往上到平台下方,往左伸出平台,再往上開口(推斷) */
export const MAIN = [JOIN, [0, 0.35, PIPE_Z], [-0.3, 0.6, PIPE_Z], [-2.1, 0.6, PIPE_Z], [-2.35, 0.75, PIPE_Z], [-2.35, 0.95, PIPE_Z], [-2.55, 1.05, PIPE_Z]];

/** 樑轉 a → 兩個活塞的高度(左、右) */
export function pistons(a) {
  return rods(a).map(({ C }) => C[1]);
}

/** 樑轉 a → 兩根活塞桿:樑上的銷 Q(樑的孔)、活塞中心 C(在泵筒軸線上,離 Q 桿長)、桿離鉛直的傾角 */
export function rods(a) {
  return [-1, 1].map((s) => {
    const x = s * ATTACH;
    const [qx, qy] = rot2([x, 0], a);
    const Q = [PIVOT[0] + qx, PIVOT[1] + qy];
    const C = [x, Q[1] - Math.sqrt(ROD * ROD - (Q[0] - x) ** 2)];
    return { Q, C, tilt: Math.atan2(Q[0] - C[0], Q[1] - C[1]) };
  });
}

const CHEEK_Z = 0.09; // 叉頭兩頰的中心離樑的中面(樑厚 0.12,頰厚 0.04)
const BODY = ROD - 0.16; // 桿身兩端各留 0.08 給叉頭與活塞

export default {
  figure: 465,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 平台(活塞桿穿過的地方開孔;板件轉成水平:局部 y 是世界的 z)與桌形的架子、中柱(柱頂是夾著樑的叉頭,樞軸銷穿過)
        { kind: "plate", shape: shape(rect(3.6, 1.2), [circle(0.07, -ATTACH, 0).reverse(), circle(0.07, ATTACH, 0).reverse()]), thickness: 0.12, at: [0, 0.75, 0], rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
        ...[-1.6, 1.6].map((x) => ({ kind: "box", size: [0.12, 0.75 - BANK_TOP, 0.12], at: [x, (0.75 + BANK_TOP) / 2, 0.5] })),
        { kind: "box", size: [0.16, 0.8, 0.16], at: [0, 1.15, 0] },
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.16, 0.3, 0.05], at: [0, PIVOT[1], s * CHEEK_Z] })),
        { kind: "cylinder", radius: 0.035, length: 0.3, at: PIVOT }, // 樑的樞軸銷
        // 兩岸(剖開的土坡)與坑底;泵立在坑裡
        ...[-1, 1].map((s) => ({ kind: "box", size: [1.8, BANK_TOP - (PIT_FLOOR - 0.1), 1.6], at: [s * 2.1, (BANK_TOP + PIT_FLOOR - 0.1) / 2, 0] })),
        { kind: "box", size: [2.4, 0.1, 1.6], at: [0, PIT_FLOOR - 0.05, 0] },
        // 出水管:兩根彎管合成 Y 形,總管往上、往左伸出平台(推斷)
        ...DELIVERY.map((points) => ({ kind: "tube", points, radius: PIPE_R })),
        { kind: "tube", points: MAIN, radius: PIPE_R },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, (PIT_FLOOR + WATER_TOP) / 2, 0], size: [2.4, WATER_TOP - PIT_FLOOR, 1.4], level: 1 },
    {
      id: "beam",
      kind: "plate",
      center: PIVOT,
      shape: shape(thickLine([[-HALF, 0], [HALF, 0]], 0.12), [circle(0.04).reverse(), circle(0.04, -ATTACH, 0).reverse(), circle(0.04, ATTACH, 0).reverse()]),
      thickness: 0.12,
      arrow: false,
      pieces: [
        { kind: "sphere", radius: 0.22, at: [-HALF - 0.1, 0.1, 0] },
        { kind: "sphere", radius: 0.22, at: [HALF + 0.1, 0.1, 0] },
        // 扶手框,立柱接到樑上
        { kind: "plate", shape: shape(thickLine([[-0.9, 0.0], [-0.9, 0.9]], 0.08)), thickness: 0.06 },
        { kind: "plate", shape: shape(thickLine([[0.9, 0.0], [0.9, 0.9]], 0.08)), thickness: 0.06 },
        { kind: "plate", shape: shape(thickLine([[-0.9, 0.9], [0.9, 0.9]], 0.08)), thickness: 0.06 },
      ],
    },
    ...[0, 1].flatMap((k) => {
      const x = (k === 0 ? -1 : 1) * ATTACH;
      return [
        barrel(`barrel${k}`, { x, ...BARREL }),
        {
          id: `rod${k}`,
          kind: "cylinder",
          axis: Y,
          radius: 0.035,
          length: BODY,
          arrow: false,
          pieces: [
            { kind: "cylinder", radius: BARREL.r - 0.01, length: 0.18, at: [0, 0, -ROD / 2] }, // 活塞
            // 桿頂的叉頭:桿身頂上的橫塊接著兩頰,兩頰夾著樑,銷(沿世界 z)穿過樑的孔
            { kind: "box", size: [0.12, 2 * CHEEK_Z + 0.04, 0.1], at: [0, 0, BODY / 2 - 0.05] },
            ...[-1, 1].map((s) => ({ kind: "box", size: [0.12, 0.04, 0.3], at: [0, -s * CHEEK_Z, ROD / 2 - 0.05] })),
            { kind: "cylinder", radius: 0.03, length: 0.3, axis: [0, 1, 0], at: [0, 0, ROD / 2] },
          ],
        },
        { id: `water${k}`, kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
        flap(`valve${k}`, 0.36),
      ];
    }),
  ],
  powered: ["valve0", "valve1"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  driver: { part: "beam", type: "rotation", cycle: SWING },
  targets: ["rod0", "rod1"],
  view: { direction: [0.12, 0.1, 1] },
  pose(v) {
    const phase = stroke(v, ...SWING);
    const { at, forward } = phase;
    const parts = { beam: { angle: at } };
    const flows = [];
    const base = quatFromZ(Y);
    rods(at).forEach(({ Q, C, tilt }, k) => {
      const x = (k === 0 ? -1 : 1) * ATTACH;
      const y = C[1];
      const up = k === 0 ? !forward : forward; // 樑逆時針轉時右邊的活塞上升
      // 桿身從活塞到樑的銷,隨樑的孔微微傾斜(繞 z 轉 -tilt,局部 z 才指向銷)
      parts[`rod${k}`] = { position: [(Q[0] + C[0]) / 2, (Q[1] + C[1]) / 2, 0], rotation: quatMul(quatAxisAngle(Z, -tilt), base) };
      parts[`water${k}`] = water(x, BARREL.y0, Math.min(y + 0.1, SPOUT_Y + 0.05), BARREL.y1 - BARREL.y0);
      parts[`valve${k}`] = { position: [x - 0.18, BARREL.y0 + 0.03, 0.05], angle: OPEN * valveOpening(up, phase) }; // 被水頂開、回程加速落回
      // 上行的泵:水從坑裡經閥進泵筒、被活塞提到筒頂,走出水管、總管送到出口
      if (up) flows.push({ fluid: "water", points: stream([[x, WATER_TOP - 0.3, 0.1], [x, y - 0.2, 0.1], [x, SPOUT_Y, 0.1], ...DELIVERY[k], ...MAIN.slice(1), [-2.7, 0.9, PIPE_Z], [-2.75, 0.3, PIPE_Z]], v * 6, { spacing: 0.16 }) });
    });
    return { parts, flows, readouts: [{ label: "出水", value: forward ? "右邊的泵" : "左邊的泵" }] };
  },
};
