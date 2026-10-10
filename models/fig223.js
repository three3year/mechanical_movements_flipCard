// 第 223 種:得到變速圓周運動的一種配置。照原圖每根軸各裝四個扇形齒輪段,相鄰的扇形分在前後兩個平面輪流:
// 上軸四個 90° 扇形(右上大、左上與右下中、左下小),下軸四個 30°、60°、210°、60°(朝上的窄楔形、左、下方大半圈、右)。
// 上軸等速轉一圈時,兩軸連線上依序是 小帶楔形(下軸慢,1/3)、中帶中(2/3)、大帶下方小扇形(快,7/3)、中帶中(2/3);
// 相對速度依各扇形段的直徑而變。兩軸各轉一圈回到原處。主動件是上軸,從原圖的姿勢(兩對剛好在換對處)起轉。
// 推斷:半徑照 507movements 動畫的速度比(上軸節圓 2.8、1.6、1.0、1.6 比中心距 4);每對齒數合計 80,齒距相同。
// 換對處:507movements 註記說實物要改幾個齒才嚙合得上(動畫裡不改就撞齒卡死)。這裡讓下軸各扇形的齒從邊緣讓開半個齒距、
// 上軸各扇形的邊緣不放齒,接手那對的第一齒剛好對著對方的齒槽;換對前後兩對的轉速比不同,靠近邊緣的幾個齒會在
// 對方齒間滑過而相撞,所以把這些齒的齒頂削低(推斷:削多少由逐姿勢量穿入、削到不穿入為止定出,見 TIPS)。
import { TAU, deg } from "./kit.js";
import { pedestal } from "./supports.js";
import { sectorShape, circle } from "./shapes.js";

const C = 3.2;
const S = C / 4; // 動畫的比例尺(中心距 4)換到這裡
const UPPER = [0, C / 2, 0];
const LOWER = [0, -C / 2, 0];
const Z = { front: 0.14, back: -0.14 };

/**
 * 扇形段:span 是局部角(原圖姿勢時就是世界角);齒數 = 半徑 / 模數 × 2,模數 0.1 × S。
 * tips:削低齒頂的齒 { 從 span[0] 起第幾齒: 剩下的齒冠高(模數為 1)};shift 是齒從邊緣讓開的角度
 */
const sector = (radius, span, z, { offset = false, tips = {} } = {}) => {
  const teeth = Math.round((2 * radius) / 0.1);
  const r = radius * S;
  const h = offset ? Math.PI / teeth : 0; // 齒從邊緣讓開半個齒距
  const shape = sectorShape({ teeth, radius: r, span: [deg(span[0]) - h, deg(span[1]) - h], tips });
  const turn = (p) => [p[0] * Math.cos(h) - p[1] * Math.sin(h), p[0] * Math.sin(h) + p[1] * Math.cos(h)];
  return { teeth, radius: r, span: [deg(span[0]), deg(span[1])], shift: h, z, shape: { outline: shape.outline.map(turn), holes: [] } };
};

/**
 * 換對處削低的齒頂:{ up | lo: { 扇形: { 從 span[0] 起第幾齒: 剩下的齒冠高 } } }。每個表的兩端分別是換對時最後離開與
 * 最先接手的齒。由 `node tools/fig223-tips.mjs` 逐姿勢量穿入、削到不穿入為止算出;扇形的半徑、角度、平面或齒形改了
 * 就重跑它,把印出的表貼回這裡。
 */
export const TIPS = {
  up: { big: { 0: 0.66, 12: 0.66 }, left: { 0: 0.19, 6: 0.63 }, small: { 0: 0.36, 3: 0.36 }, right: { 0: 0.63, 6: 0.19 } },
  lo: { right: { 0: 0.21, 6: 0.65 }, wedge: { 0: 0.33, 4: 0.33 }, left: { 1: 0.65, 7: 0.21 }, small: { 1: 0.62, 12: 0.62 } },
};

/** 照 tips(預設 TIPS)做出兩軸的扇形,依角度順序排;前後平面輪流 */
export function buildSectors(tips = TIPS) {
  const up = (name, radius, span, z) => sector(radius, span, z, { tips: tips.up?.[name] ?? {} });
  const lo = (name, radius, span, z) => sector(radius, span, z, { offset: true, tips: tips.lo?.[name] ?? {} });
  return {
    UP: { big: up("big", 2.8, [0, 90], Z.front), left: up("left", 1.6, [90, 180], Z.back), small: up("small", 1.0, [180, 270], Z.front), right: up("right", 1.6, [270, 360], Z.back) },
    LO: { right: lo("right", 2.4, [30, 90], Z.back), wedge: lo("wedge", 3.0, [90, 120], Z.front), left: lo("left", 2.4, [120, 180], Z.back), small: lo("small", 1.2, [180, 390], Z.front) },
  };
}
const { UP, LO } = buildSectors();
export const SECTORS = { upper: Object.values(UP), lower: Object.values(LO), UPPER, LOWER };

// 上軸逆時針轉:兩軸連線上的上扇形依序是 小、左中、大、右中,各 90°
const STAGES = [
  [UP.small, LO.wedge],
  [UP.left, LO.left],
  [UP.big, LO.small],
  [UP.right, LO.right],
];
const QUARTER = TAU / 4;
const ratioText = (u, l) => ({ 1: "1/3", 2: "2/3", 7: "7/3" })[Math.round((u.radius / l.radius) * 3)];

/** 上軸轉 t(逆時針;t = 0 是原圖的姿勢):下軸的轉角(順時針為負)與目前咬合的一對 */
export function sectors(t) {
  const k = Math.floor(t / TAU);
  let f = t - k * TAU;
  let lower = -k * TAU;
  for (const [u, l] of STAGES) {
    const a = Math.min(f, QUARTER);
    lower -= (a * u.radius) / l.radius;
    f -= a;
    if (f <= 0) return { lower, stage: [u, l] };
  }
  return { lower, stage: STAGES[3] };
}

const pieces = (list) => list.map(({ shape, z }) => ({ kind: "plate", shape, thickness: 0.12, at: [0, 0, z] }));

const shaft = (id, center, list, spin) => ({
  id,
  kind: "group",
  center,
  spin,
  spinOffset: 0.3, // 箭頭放在前面一層扇形的前方,不被對面軸的大扇形擋住
  pieces: [...pieces(list), { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.5, mark: true }, { kind: "plate", shape: { outline: circle(0.15), holes: [] }, thickness: 0.6 }],
});

const FLOOR = -C / 2 - 3.0 * S - 0.35; // 下軸的窄楔形朝下時掃到 −4.08,底座再往下

export default {
  figure: 223,
  parts: [
    shaft("upper", UPPER, SECTORS.upper, 2.8 * S + 0.25),
    shaft("lower", LOWER, SECTORS.lower, 1.2 * S + 0.25),
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [UPPER, LOWER].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.7, at: [x, y, -0.25] },
        ...pedestal({ at: [x, y], z: -0.6, bore: 0.1, floor: FLOOR, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "upper", type: "rotation", initial: 0 },
  target: "lower",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { lower, stage } = sectors(theta);
    return {
      parts: { upper: { angle: theta }, lower: { angle: lower } },
      readouts: [{ label: "下軸轉速", value: `上軸的 ${ratioText(...stage)} 倍` }],
    };
  },
};
