// 第 350 種:橫移(往復)運動。一根槓桿上下各開一道長孔:上長孔裡的銷是靜止的(固定在機架上),
// 下長孔裡的銷沿水平虛線來回移動;槓桿中段的轂鉸在桿的直立部分上,槓桿繞著轂擺、兩道長孔各沿自己的銷滑,
// 轂因此只能水平走,把橫移運動傳給桿,桿在兩個導件 a、a 內左右往復。主動件是下長孔裡的銷(沿水平虛線往復)。
// 照原圖與 507movements 的動畫:轂在兩道長孔之間、離上銷約上下距的三分之一,兩個銷都在孔裡滑;
// 下銷的行程左右對稱、共約 3.6(原圖左 2.13、右 1.51,槓桿擺角左 46°、右 36°;動畫 ±45°),這裡擺角各 41°。
// 桿是 T 形:水平的桿身穿過兩個導件,中間立起一塊直立部分,頂上的樞銷穿過槓桿的轂。
// 偏離插圖:原圖桿的直立部分高過固定銷(507movements 註記說照原圖會撞到固定銷),這裡直立部分只到轂的上方。
// 推斷:機架在桿的後面——底樑上立著托固定銷的立柱與托導件的兩根短柱;上銷從立柱往前伸、穿過上長孔;
// 下銷立在沿水平導軌滑的滑塊上,導軌裝在底樑前面,導件 a、a 的腳座往後接到短柱(原圖只畫出銷與導件)。
import { clamp } from "./kit.js";
import { shape, rect, stadium, circle, arcPoints, zCylinder } from "./shapes.js";

const TOP = [0, 1.2]; // 固定銷
const HUB_Y = 0.5; // 轂所在的高度(桿的樞銷)
const LOW_Y = -0.85; // 下銷所在的水平線
const ROD_Y = -0.3; // 桿身的高度
export const RANGE = [-1.8, 1.8]; // 下銷的 x
const PIN = 0.09; // 兩個銷的半徑(長孔寬 0.2)
const GUIDE_X = 2.3; // 導件 a、a
const ROD_LEN = 6.4;

// 深度:機架 −0.9..−0.7,滑塊與導軌 −0.7..−0.35,桿 −0.1..0.1,槓桿 0.11..0.21,銷頭 0.21..0.25
const LEVER_Z = 0.16;
const LEVER_T = 0.1;
const FRONT = LEVER_Z + LEVER_T / 2; // 槓桿正面:銷頭貼在這裡
const HEAD = [FRONT, FRONT + 0.04];

/** 下銷在 x → 槓桿方向(從下銷指向上銷)、轂(桿)的 x */
export function traverse(x0) {
  const x = clamp(x0, ...RANGE);
  const dx = TOP[0] - x;
  const dy = TOP[1] - LOW_Y;
  const angle = Math.atan2(dy, dx);
  const t = (HUB_Y - LOW_Y) / dy;
  return { x, angle, rod: x + dx * t };
}

// 槓桿(局部 +x 從轂沿槓桿往上銷):兩端圓頭的長條,中段鼓出一個轂;上長孔套固定銷、下長孔套動銷,
// 長孔的範圍照兩個銷離轂的距離(上 0.7–0.93、下 1.35–1.80)再各留一點
const BODY = 0.21; // 半寬
const HUB = 0.27; // 轂的半徑
const ENDS = [-2.05, 1.2];
const leverOutline = (() => {
  const a = Math.asin(BODY / HUB);
  const k = Math.sqrt(HUB * HUB - BODY * BODY);
  return [
    ...arcPoints(BODY, Math.PI / 2, (3 * Math.PI) / 2, ENDS[0], 0), // 左端圓頭
    [-k, -BODY],
    ...arcPoints(HUB, -Math.PI + a, -a).slice(1, -1), // 轂的下緣
    [k, -BODY],
    ...arcPoints(BODY, -Math.PI / 2, Math.PI / 2, ENDS[1], 0), // 右端圓頭
    [k, BODY],
    ...arcPoints(HUB, a, Math.PI - a).slice(1, -1), // 轂的上緣
    [-k, BODY],
  ];
})();
const slot = (from, to) => stadium(to - from, 2 * (PIN + 0.01)).outline.map(([x, y]) => [x + from, y]).reverse();
const lever = shape(leverOutline, [slot(0.62, 1.0), slot(-1.88, -1.27), circle(0.07).reverse()]);

// 桿的直立部分(桿的局部座標,原點在轂):從桿身往上到轂,頂端圓
const upright = shape([[-0.2, ROD_Y - HUB_Y - 0.1], [0.2, ROD_Y - HUB_Y - 0.1], ...arcPoints(0.2, 0, Math.PI)]);

export default {
  figure: 350,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 背後的機架:底樑、托固定銷的立柱、托導件的兩根短柱(都在 −0.9..−0.7)
        { kind: "box", size: [5.2, 0.4, 0.2], at: [0, -1.3, -0.8] },
        { kind: "plate", shape: shape(rect(0.6, 2.95, 0, -0.025)), thickness: 0.2, at: [0, 0, -0.8] },
        ...[-GUIDE_X, GUIDE_X].map((x) => ({ kind: "box", size: [0.3, 1.0, 0.2], at: [x, -0.6, -0.8] })),
        zCylinder(-0.7, FRONT, PIN, TOP), // 固定銷,從立柱往前穿過上長孔
        zCylinder(...HEAD, 0.15, TOP), // 銷頭
        // 導件 a、a,腳座往後接到短柱
        ...[-GUIDE_X, GUIDE_X].flatMap((x) => [
          { kind: "box", size: [0.2, 0.45, 0.4], at: [x, ROD_Y, 0] },
          { kind: "box", size: [0.2, 0.3, 0.5], at: [x, ROD_Y, -0.45] },
        ]),
        // 下銷滑塊的水平導軌,裝在底樑前面
        { kind: "box", size: [4.4, 0.2, 0.35], at: [0, -1.3, -0.525] },
      ],
    },
    { id: "labelA1", kind: "group", center: [-GUIDE_X, ROD_Y, 0], label: "a", labelOffset: [0, 0.45, 0.3] },
    { id: "labelA2", kind: "group", center: [GUIDE_X, ROD_Y, 0], label: "a", labelOffset: [0, 0.45, 0.3] },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: ROD_LEN, at: [0, ROD_Y - HUB_Y, 0] },
        { kind: "plate", shape: upright, thickness: 0.2 },
        zCylinder(-0.1, FRONT, 0.07), // 樞銷:從直立部分往前穿過槓桿的轂
        zCylinder(...HEAD, 0.13), // 銷頭
      ],
    },
    { id: "lever", kind: "plate", shape: lever, thickness: LEVER_T, arrow: false },
    {
      id: "pinLow",
      kind: "cylinder",
      radius: PIN,
      length: FRONT + 0.35,
      pieces: [
        zCylinder(...HEAD, 0.15, [0, 0], (FRONT - 0.35) / 2), // 銷頭
        { kind: "box", size: [0.36, 0.4, 0.33], at: [0, -0.15, -0.515 - (FRONT - 0.35) / 2] }, // 滑塊:坐在導軌上
      ],
    },
  ],
  driver: { part: "pinLow", grips: ["lever"], type: "translation", direction: [1, 0, 0], range: RANGE, initial: 0 },
  target: "rod", // 左右往復的桿
  view: { direction: [0.03, 0.05, 1] },
  pose(x0) {
    const t = traverse(x0);
    return {
      parts: {
        lever: { position: [t.rod, HUB_Y, LEVER_Z], angle: t.angle },
        pinLow: { position: [t.x, LOW_Y, (FRONT - 0.35) / 2] },
        rod: { position: [t.rod, HUB_Y, 0] },
      },
      readouts: [],
    };
  },
};
