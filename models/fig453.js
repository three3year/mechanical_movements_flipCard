// 第 453 種:雙燈籠式風箱泵。槓桿把一個風箱撐開時,裡面的空氣變稀薄,水沿吸水管上升填補空間;同時另一個風箱被壓縮,
// 把裡面的水經排水管排出;閥門的作動方式與普通壓力泵相同。
// 主動件是頂上的槓桿(來回擺動)。
// 推斷(照原圖 2026-10-20 重排):兩個風箱立在底座的水室上,頂板在風箱底下開口;吸水管從底下接進弧形的吸水道,
// 吸水道兩端各經一個吸水閥(躺在底座底的開口上)往上開進底座的左右兩格;排水管從底座中央往上,管腳兩側各一個出水閥
// 從左右兩格開進管腳;槓桿的支柱從上方垂下(原圖頂端畫成斷口,掛在沒畫出來的結構上)。風箱以之字形的褶表示,
// 褶的每一段長度固定,拉長時折角變開。剖面圖:底座、管子、閥室都真的開口。
import { deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, valveOpening, flap, pipeWalls } from "./pump.js";
import { shape, thickLine, circle, spanBox } from "./shapes.js";

const PIVOT = [0, 2.3, 0];
const BEAM = 1.15; // 支點到兩端
const LINK = 1.0;
export const BELLOWS_X = [-1.15, 1.15];
export const BASE_TOP = -0.2;
const R = 0.5;
export const SWING = [deg(-12), deg(12)];
const OPEN = deg(50);
const OPEN_D = deg(40); // 出水閥往管腳裡開的角度(兩片對開,開足時尖端仍不相碰)
const FOLDS = 5;
const FOLD_SEG = Math.hypot(1.74 / (2 * FOLDS), 0.07); // 褶每一段的長度:風箱拉到最長(1.74)時振幅還有 0.07
const DEPTH = 0.8; // 底座的深度

// 底座:水室 y −0.62..−0.30,底 −0.70..−0.62,頂板 −0.30..−0.20;左右兩格各在一個風箱底下
const FLOOR = [-0.70, -0.62];
const TOP = [-0.30, BASE_TOP];
const END_X = 1.8;
const ARC_R = 0.9; // 吸水道的弧:圓心在底座底的高度,兩端從 x ±0.9 接進底座的底
const ARC_C = [0, FLOOR[0]];
const ARC_W = 0.26; // 吸水道:壁中心線相距 0.26、壁厚 0.06 → 通道 0.2、外寬 0.32
const PORT = ARC_W / 2 - 0.03; // 底座底開口的半寬(= 吸水道的通道半寬)
const INLET_W = 0.3;
const DEL_W = 0.22; // 排水管:通道 0.16、壁在 ±(0.08..0.14)
const DEL_OUT = DEL_W / 2 + 0.03;
const FOOT_Y = -0.42; // 排水管腳的壁在底座裡的下端;出水閥鉸在這裡
const FLAP_D = 0.19; // 出水閥長:垂下來剛好到底座的底

/** 槓桿轉 theta → 兩個風箱頂板的高度 */
export function tops(theta) {
  return BELLOWS_X.map((x, k) => {
    const s = k === 0 ? -1 : 1;
    const end = [PIVOT[0] + s * BEAM * Math.cos(theta), PIVOT[1] + s * BEAM * Math.sin(theta)];
    return { end, y: end[1] - Math.sqrt(LINK * LINK - (end[0] - x) ** 2) };
  });
}

// 風箱的側面:褶(之字形),每段長 FOLD_SEG;高度決定每段的垂直分量,剩下的是振幅
const folds = (x, top, s) => {
  const h = (top - BASE_TOP) / (2 * FOLDS);
  const a = Math.sqrt(Math.max(0, FOLD_SEG * FOLD_SEG - h * h));
  const pts = [];
  for (let i = 0; i <= 2 * FOLDS; i++) pts.push([x + s * (R + (i % 2 ? a : 0)), BASE_TOP + h * i, 0.1]);
  return pts;
};

// 吸水道的弧:從左端(x −0.9)經底下到右端;順著走時 +1 側是內壁(朝圓心)、-1 側是外壁
const ARC = [
  [-ARC_R, FLOOR[0] + 0.02], // 兩端伸進底座的底 0.02,和底連成一件
  ...Array.from({ length: 25 }, (_, i) => {
    const a = Math.PI + (Math.PI * i) / 24;
    return [ARC_C[0] + ARC_R * Math.cos(a), ARC_C[1] + ARC_R * Math.sin(a)];
  }),
  [ARC_R, FLOOR[0] + 0.02],
];
const ARC_BOTTOM = ARC_C[1] - ARC_R; // 弧中心線的最低點
const INLET = [[0, -2.2], [0, ARC_BOTTOM - ARC_W / 2 + 0.03]]; // 吸水管:接到吸水道外壁的內面
const DELIVERY = [[0, FOOT_Y], [0, 1.35], [0.15, 1.5], [0.3, 1.35]]; // 出水口收在兩個風箱之間,頂板升到最高時碰不到
const arcPoint = (a) => [ARC_C[0] + ARC_R * Math.cos(a), ARC_C[1] + ARC_R * Math.sin(a), 0.2];

export default {
  figure: 453,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        // 底座:底(兩端開吸水的口)、兩端的壁、頂板(風箱底下與排水管處開口);口都是圓的,剖面後面的底與頂板留著,
        // 各畫成後面的一條,把被口切開的幾段連成一件
        spanBox(-END_X, END_X, ...FLOOR, -DEPTH / 2, -DEPTH / 2 + 0.1),
        spanBox(-END_X, END_X, ...TOP, -DEPTH / 2, -DEPTH / 2 + 0.1),
        spanBox(-END_X, -ARC_R - PORT, ...FLOOR, -DEPTH / 2, DEPTH / 2),
        spanBox(-ARC_R + PORT, ARC_R - PORT, ...FLOOR, -DEPTH / 2, DEPTH / 2),
        spanBox(ARC_R + PORT, END_X, ...FLOOR, -DEPTH / 2, DEPTH / 2),
        spanBox(-END_X, -END_X + 0.08, FLOOR[0], BASE_TOP, -DEPTH / 2, DEPTH / 2),
        spanBox(END_X - 0.08, END_X, FLOOR[0], BASE_TOP, -DEPTH / 2, DEPTH / 2),
        spanBox(-END_X, BELLOWS_X[0] - R + 0.1, ...TOP, -DEPTH / 2, DEPTH / 2),
        spanBox(BELLOWS_X[0] + R - 0.1, -DEL_OUT, ...TOP, -DEPTH / 2, DEPTH / 2),
        spanBox(DEL_OUT, BELLOWS_X[1] - R + 0.1, ...TOP, -DEPTH / 2, DEPTH / 2),
        spanBox(BELLOWS_X[1] + R - 0.1, END_X, ...TOP, -DEPTH / 2, DEPTH / 2),
        // 出水閥的閥座(擋住閥瓣往外翻的凸緣)
        spanBox(DEL_OUT + 0.03, DEL_OUT + 0.1, FLOOR[1], FLOOR[1] + 0.12, -0.3, 0.3),
        spanBox(-DEL_OUT - 0.1, -DEL_OUT - 0.03, FLOOR[1], FLOOR[1] + 0.12, -0.3, 0.3),
        // 吸水道(弧,外壁在底下接吸水管處斷開,留著剖開的背面)、吸水管、排水管
        ...pipeWalls(ARC, ARC_W, 0.06, 0.5, { breaks: [{ at: [0, ARC_BOTTOM - ARC_W / 2], width: INLET_W + 0.06, side: -1 }], back: true }),
        ...pipeWalls(INLET, INLET_W),
        ...pipeWalls(DELIVERY, DEL_W),
      ],
    },
    {
      id: "post",
      kind: "group",
      pieces: [
        // 槓桿的支柱(推斷:從上方垂下,頂端是斷口)與搖樑的樞軸銷
        { kind: "plate", shape: shape(thickLine([[0, PIVOT[1] - 0.15], [0, PIVOT[1] + 1.0]], 0.14), [circle(0.05, 0, PIVOT[1]).reverse()]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.045, length: 0.6, at: [0, PIVOT[1], -0.15] },
      ],
    },
    { id: "beam", kind: "plate", shape: shape(thickLine([[-BEAM - 0.1, 0], [BEAM + 0.5, 0]], 0.14), [circle(0.05).reverse()]), thickness: 0.1, center: PIVOT, arrow: false },
    ...[0, 1].map((k) => ({ id: `link${k}`, kind: "link", width: 0.08, thickness: 0.05 })),
    ...[0, 1].map((k) => ({ id: `top${k}`, kind: "box", size: [2 * R + 0.3, 0.1, 0.8] })),
    ...[0, 1].flatMap((k) => [-1, 1].map((s) => ({ id: `fold${k}${s > 0 ? "R" : "L"}`, kind: "rod", radius: 0.025 }))),
    ...[0, 1].map((k) => ({ id: `water${k}`, kind: "fill", fluid: "water", size: [2 * R, 1.6, 0.6], level: 0.5 })),
    { id: "baseWater", kind: "fill", fluid: "water", center: [0, (FLOOR[1] + TOP[0]) / 2, 0], size: [2 * END_X - 0.2, TOP[0] - FLOOR[1], 0.6], level: 1 },
    ...[0, 1].map((k) => flap(`suction${k}`, 0.26)),
    ...[0, 1].map((k) => flap(`delivery${k}`, FLAP_D)),
  ],
  powered: ["suction0", "suction1", "delivery0", "delivery1"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  driver: { part: "beam", type: "rotation", cycle: SWING },
  targets: ["top0", "top1"], // 兩個風箱的頂板
  view: { direction: [0.05, 0.08, 1] },
  pose(v) {
    const phase = stroke(v, ...SWING);
    const { at, forward } = phase;
    const t = tops(at);
    // 槓桿往逆時針轉(forward)時右邊的風箱被撐開、左邊的被壓縮
    const expanding = [!forward, forward];
    const parts = { beam: { angle: at } };
    const paths = {};
    const travel = v * 6;
    const flows = [];
    t.forEach(({ end, y }, k) => {
      const x = BELLOWS_X[k];
      const s = k === 0 ? -1 : 1;
      parts[`link${k}`] = { from: [end[0], end[1], 0.1], to: [x, y, 0.1] };
      parts[`top${k}`] = { position: [x, y, 0] };
      paths[`fold${k}L`] = { points: folds(x, y, -1), closed: false };
      paths[`fold${k}R`] = { points: folds(x, y, 1), closed: false };
      parts[`water${k}`] = { position: [x, BASE_TOP + 0.8, 0], level: (y - BASE_TOP - 0.05) / 1.6 };
      // 閥瓣被水頂開、回程加速落回閥座(pump.js 的 valveOpening)。
      // 吸水閥躺在底座底的開口上、鉸在外側,撐開時被水往上頂開;出水閥鉸在排水管腳的壁下、往管腳裡開
      parts[`suction${k}`] = { position: [s * (ARC_R + PORT + 0.02), FLOOR[1] + 0.03, 0.1], angle: (s < 0 ? 0 : Math.PI) - s * OPEN * valveOpening(expanding[k], phase) };
      parts[`delivery${k}`] = { position: [s * DEL_OUT, FOOT_Y, 0.1], angle: -Math.PI / 2 - s * OPEN_D * valveOpening(!expanding[k], phase) };
      if (expanding[k]) {
        // 吸水:吸水管 → 吸水道的弧 → 底座的外格 → 風箱
        const arc = Array.from({ length: 7 }, (_, i) => arcPoint(1.5 * Math.PI + (s * Math.PI * i) / 12));
        flows.push({ fluid: "water", points: stream([[0, -2.15, 0.2], [0, ARC_BOTTOM, 0.2], ...arc, [s * ARC_R, FLOOR[1] + 0.1, 0.2], [x, -0.45, 0.2], [x, y - 0.2, 0.2]], travel, { spacing: 0.18 }) });
      } else {
        // 排水:風箱 → 底座的外格 → 出水閥 → 排水管腳 → 頂上的出口
        flows.push({ fluid: "water", points: stream([[x, y - 0.2, 0.2], [x, -0.47, 0.2], [s * 0.35, -0.47, 0.2], [0, -0.5, 0.2], ...DELIVERY.slice(1).map(([a, b]) => [a, b, 0.2]), [0.55, 0.6, 0.2]], travel, { spacing: 0.18 }) });
      }
    });
    return { parts, paths, flows, readouts: [{ label: "風箱", value: forward ? "右邊撐開吸水、左邊壓縮排水" : "左邊撐開吸水、右邊壓縮排水" }] };
  },
};
