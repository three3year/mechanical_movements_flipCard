// 第 432 種:胸射式水車,介於上射式與下射式之間。它像下射式一樣有浮板,但輪子在一道與輪的圓周、寬度相配的水道
// (胸牆)裡轉,浮板之間的空隙因而變成水斗;水幾乎在與輪軸同高的位置流進來。
// 原圖箭頭:輪頂往右(順時針)。主動件是虛擬的「進程」:水已帶著水車轉了幾圈。
// 推斷:右邊的閘門下緣放水,水越過與軸同高的檻流進浮板之間,被胸牆擋著隨輪往下,到底部才流進左下的尾水渠。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream, ramp } from "./flow.js";
import { shape, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";
import { sluice } from "./sluice.js";

const R = { rim: 1.42, float: 2.05 };
const FLOATS = 16;
const DEPTH = 0.6;
const SPEED = TAU * 1.9;
export const ENTRY = deg(-4); // 水流進輪子的地方(與軸同高)
export const RELEASE = deg(-100); // 胸牆的下端,水在這裡離開
export const BANK_TOP = -0.2; // 上游渠底的頂面(閘門的立柱打進這裡)
const TAIL_BED_TOP = -2.495; // 尾水渠底的頂面
// 右邊的閘門與升降它的螺桿(立柱、橫樑、螺桿、螺帽是推斷,見 sluice.js):原圖只畫螺桿伸到畫面頂,沒有手柄
export const SLUICE = sluice({ x: 2.4, bottom: 0.05, height: 1.9, depth: DEPTH * 1.2, bed: BANK_TOP - 0.3, top: 2.4, reach: 1.0, handle: false });

// 胸牆:緊貼輪的外緣,從軸的高度到輪底
const breast = shape([...arcPoints(R.float + 0.06, deg(2), deg(-104)), ...arcPoints(R.float + 0.5, deg(-104), deg(2))]);

export const INFLOW = [
  [3.8, -0.1, 0.1],
  [2.3, -0.05, 0.1],
  [1.95, -0.12, 0.1],
];
const DOWN = arcPoints(1.75, ENTRY, RELEASE).map(([x, y]) => [x, y, 0.1]);
const TAIL = [polar(1.8, RELEASE, 0.1), [-1.0, -2.35, 0.1], [-4.0, -2.4, 0.1]];

/** 水斗(浮板間的空隙)離開進水口後轉過的角度(度)→ 存量:被胸牆擋著時滿,離開胸牆就倒空 */
export const pocketFill = (travelled) => ramp(travelled, 0, 12, 92, 112);

export default {
  figure: 432,
  parts: [
    {
      id: "axle",
      kind: "cylinder",
      center: [0, 0, 0],
      radius: 0.08,
      length: 1.6, // 水車的固定軸(推斷;兩端架在渠底的軸承座上)
    },
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      spokes: 8,
      center: [0, 0, 0],
      radius: R.rim,
      width: DEPTH,
      pieces: Array.from({ length: FLOATS }, (_, i) => {
        const a = (i * TAU) / FLOATS;
        return { kind: "box", size: [R.float - R.rim + 0.1, 0.07, DEPTH * 0.9], at: polar((R.rim + R.float) / 2 - 0.05, a), angle: a };
      }),
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "plate", shape: breast, thickness: DEPTH * 1.3 },
        // 上游的檻與渠(頂面是 BANK_TOP)、閘門與立柱、橫樑、螺桿
        { kind: "box", size: [2.0, BANK_TOP + 2.6, DEPTH * 1.3], at: [3.1, (BANK_TOP - 2.6) / 2, 0] },
        ...SLUICE.pieces,
        // 尾水渠底(往右伸到輪下、寬到放得下兩座軸承座)
        { kind: "box", size: [5.4, 0.25, 2.2], at: [-1.5, TAIL_BED_TOP - 0.125, 0] },
        // 固定軸兩端的軸承座(推斷;原圖沒畫),立在尾水渠底上
        ...pedestal({ at: [0, 0], z: 0.75, bore: 0.08, floor: TAIL_BED_TOP + 0.18 }),
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.08, floor: TAIL_BED_TOP + 0.18 }),
      ],
    },
    { id: "head", kind: "fill", fluid: "water", center: [3.2, 0.1, 0], size: [1.6, 0.6, DEPTH * 1.1], level: 0.5 },
    { id: "tail", kind: "fill", fluid: "water", center: [-2.2, -2.35, 0], size: [3.8, 0.3, DEPTH * 1.1], level: 1 },
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", size: [0.36, 0.3, DEPTH * 0.8] })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.06, 0.04, 1] },
  pose(progress) {
    const wheel = -TAU * progress; // 順時針
    const parts = { wheel: { angle: wheel } };
    for (let i = 0; i < FLOATS; i++) {
      const a = wheel + (i + 0.5) * (TAU / FLOATS);
      const travelled = (wrap(ENTRY - a) * 180) / Math.PI;
      const at = polar(1.75, a);
      parts[`water${i}`] = { position: [at[0], at[1] - 0.05, 0], level: pocketFill(travelled) };
    }
    const travel = progress * SPEED;
    return {
      parts,
      flows: [{ fluid: "water", points: [...stream(INFLOW, travel, { spacing: 0.2 }), ...stream(DOWN, travel, { spacing: 0.25 }), ...stream(TAIL, travel, { spacing: 0.2 })] }],
      readouts: [],
    };
  },
};
