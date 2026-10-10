// 第 186 種:把偏心桿與閥動機構脫鉤的裝置。偏心桿(左邊伸來的長桿)末端的鉤口搭在搖臂(上方軸往下的臂)的銷上。
// 桿端上以銷裝著一支彈簧手柄:往上拉下方的環形手柄,手柄上端的指頭往下頂在搖臂的凸柱上,桿端因此被抬起,
// 拉到手柄卡進凹槽 a 時,銷已從鉤口中脫出。主動件是手柄。
// 由接觸算:手柄拉多少、桿端抬多高,由指頭的外形與凸柱相碰算(gab.js 的 contactLift)。
// 立體化(維護者 2026-10-08 決定):凸柱在偏心桿前面一層、和手柄指頭同一層,由銷的前端伸出的小臂托著;
// 偏心桿那一層沒有凸柱,桿抬起時從凸柱後面過去。
// 凹槽 a(照 507movements 的清晰原圖):桿端往右上彎出一支托架,末端的耳座夾著一片往下垂的彈簧片,彈簧片下端的台階
// 就是凹槽 a,在手柄那一層。手柄環的右上角伸出一個卡榫,往上拉到快到頭時卡榫頂開凹槽的下緣(彈簧片被推開),
// 越過之後彈簧片彈回、卡榫落進凹槽、頂到凹槽的頂壁——拉到頭的位置由卡榫碰到頂壁決定(gab.js 的 springCatch),
// 往回放時凹槽的下緣擋住卡榫,手柄就卡在這裡。
// 推斷:指頭末端往下勾的爪頂在搖臂上一個平頂凸柱的頂上(原圖被手柄遮住),手柄轉動時爪尖沿著平頂往左滑;
// 凸柱前後怎麼錯開(原圖是平面圖);卡榫(原圖是環的右上角和凹槽 a 的下緣接在一起);彈簧片的彎曲以繞耳座的
// 小轉角近似;托架、耳座的銷與手柄樞軸的銷(原圖樞軸畫著銷頭)。
// 動力重演不適用:手柄是主動件,引擎照模型的姿勢(連桿端被抬起後的位置)直接擺放它;手柄裝在被抬起的桿上,
// 它的位置本身就是要驗的結果,引擎沒辦法只給「相對桿的轉角」、讓桿的高度由指頭頂凸柱決定。試過宣告桿自由(靠自重
// 搭在銷上):拿掉凸柱照樣通過,桿是被照模型擺放的手柄帶上去的,所以不宣告。
import { deg, rot2 } from "./kit.js";
import { gab, rodAngle, onRod, contactLift, studUnder, handleAt, springCatch, ECC } from "./gab.js";
import { shape, thickLine, offsetLoop, rect, arcPoints, circle } from "./shapes.js";

const G = gab();
const PIVOT = [0.9, 0.2]; // 手柄在桿上的樞軸(以銷為原點的桿座標)
const FINGER = thickLine([[0, 0], [-0.1, 0.45], [-0.35, 0.82], [-0.62, 0.92], [-0.72, 0.8]], 0.22); // 指頭(相對樞軸):末端往下勾的爪
const STEM = thickLine([[0, 0], [0.3, -0.45], [0.42, -0.95]], 0.2); // 往下接環形手柄的柄
const SHAFT = [-0.1, 2.45, 0];
// 凸柱:平頂的方柱,在爪尖下面,原圖位置剛好頂著爪尖;手柄轉動時爪尖沿著平頂往左滑
const STUD_W = 0.62;
const STUD = studUnder([FINGER, STEM], PIVOT, 0.0, ([x, y]) => rect(STUD_W, 0.14, x, y));
const STUD_Z = [0.15, 0.45]; // 凸柱前後的範圍:偏心桿(−0.125–0.125)前面,手柄指頭那一層(0.175–0.325)
const ARM_Z = 0.4; // 托著凸柱的小臂(在手柄前面)
const HANDLE_Z = 0.25; // 手柄各板的中心(0.175–0.325);樞軸的環 0.13–0.37,背面貼著桿面(0.125)

// 環形手柄:略往右斜的長橢圓
const LOOP = Array.from({ length: 48 }, (_, i) => {
  const t = (i / 48) * 2 * Math.PI;
  return rot2([0.36 * Math.cos(t), 1.05 * Math.sin(t)], deg(12)).map((v, k) => v + [0.62, -1.95][k]);
});
const LOOP_OUT = offsetLoop(LOOP, 0.1);
// 卡榫:從環的右上角往右伸出(相對樞軸)
const TOOTH = [[0.68, -1.07], [0.98, -1.07], [1.01, -1.03], [0.98, -0.99], [0.68, -0.99]];

// 彈簧片(桿座標,不受力的形狀):以手柄在 LATCH_AT 時卡榫尖的位置 T 定出凹槽 a——下緣(唇)在卡榫下面、
// 頂壁在卡榫上面;彈簧片從上方的耳座 EAR 垂下來
const LATCH_AT = deg(41);
const T = rot2(TOOTH[2], LATCH_AT).map((v, k) => v + PIVOT[k]);
const EAR = [T[0] + 0.12, T[1] + 0.85];
const NOTCH_TOP = T[1] + 0.07; // 凹槽的頂壁
const LIP = T[1] - 0.1; // 凹槽下緣(唇)的頂面
const LEAF_W = 0.07; // 彈簧片寬度的一半
const LEAF = [
  [EAR[0] + LEAF_W, EAR[1]],
  [EAR[0] + LEAF_W, LIP - 0.03], // 外緣往下
  [T[0] + 0.02, LIP - 0.05], // 唇的斜底面:卡榫從下面頂上來時把彈簧片往外推
  [T[0] - 0.06, LIP - 0.015],
  [T[0] - 0.06, LIP], // 唇尖
  [T[0] + 0.09, LIP], // 唇的頂面:往回放時擋住卡榫
  [T[0] + 0.09, NOTCH_TOP], // 凹槽底
  [T[0] - 0.22, NOTCH_TOP], // 頂壁:卡榫頂到這裡就是拉到頭
  [T[0] - 0.22, NOTCH_TOP + 0.1],
  [EAR[0] - LEAF_W, NOTCH_TOP + 0.3],
  [EAR[0] - LEAF_W, EAR[1]],
  ...arcPoints(LEAF_W, Math.PI, 0, EAR[0], EAR[1]).slice(1, -1).reverse(),
].map(([x, y]) => [x - EAR[0], y - EAR[1]]); // 相對耳座
const SPRING_Z = 0.25; // 彈簧片在手柄那一層(0.19–0.31)
// 托架(推斷):從桿端往右上彎到耳座,在偏心桿那一層
const BRACKET = thickLine([[0.8, 0.12], [1.5, 0.42], [2.05, 0.75], [EAR[0], EAR[1]]], 0.2);

export const latch = springCatch({ handle: [FINGER, STEM, LOOP_OUT, TOOTH], pivot: PIVOT, spring: LEAF, root: EAR, out: 1, limit: 0.15, dir: 1 });
const MAX = latch.max; // 卡榫頂到凹槽頂壁時的轉角(由接觸算)

/** 手柄轉 phi(往上拉為正,逆時針):桿端抬起的量(指頭與凸柱相碰算) */
export function unhook(phi) {
  const lift = contactLift([FINGER, STEM], PIVOT, STUD.outline, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;
/** 檢查用:手柄轉 phi 時,手柄(指頭、柄)與凸柱的外形(世界座標 2D) */
export const contact = (phi) => ({ handle: handleAt([FINGER, STEM], PIVOT, unhook(phi).lift, phi), stud: STUD.outline });

const onRodPiece = ([x, y], z) => [x - ECC[0], y, z]; // 桿座標的點 → 偏心桿(中心在 ECC)上的附件位置

export default {
  figure: 186,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.48, SHAFT[1]], [-0.4, 0.05], [0.4, 0.05], [0.5, SHAFT[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.6, inner: 0.38, length: 0.3, at: [SHAFT[0], SHAFT[1], -0.35] },
        { kind: "cylinder", radius: 0.38, length: 0.5, at: [SHAFT[0], SHAFT[1], -0.35], accent: true },
        { kind: "cylinder", radius: G.pin, length: 0.8, at: [0, 0, 0.05] }, // 銷,前端伸到偏心桿與手柄前面
        { kind: "plate", shape: shape(thickLine([[0, 0], STUD.center], 0.16)), thickness: 0.1, at: [0, 0, ARM_Z] }, // 銷前端托著凸柱的小臂
        { kind: "plate", shape: shape(STUD.outline), thickness: STUD_Z[1] - STUD_Z[0], at: [0, 0, (STUD_Z[0] + STUD_Z[1]) / 2] }, // 凸柱
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: ECC,
      arrow: false,
      pieces: [
        { kind: "plate", shape: G.rod(), thickness: 0.25, at: [-ECC[0], 0, 0] },
        { kind: "plate", shape: shape(BRACKET), thickness: 0.2, at: [-ECC[0], 0, 0] }, // 托架
        { kind: "cylinder", radius: 0.13, length: 0.2, at: onRodPiece(EAR, 0) }, // 耳座
        { kind: "cylinder", radius: 0.04, length: 0.42, at: onRodPiece(EAR, 0.15) }, // 耳座的銷,穿過彈簧片
        { kind: "cylinder", radius: 0.07, length: 0.04, at: onRodPiece(EAR, 0.38) }, // 銷頭
        { kind: "cylinder", radius: 0.045, length: 0.495, at: onRodPiece(PIVOT, 0.1225) }, // 手柄樞軸的銷,從桿背面穿到手柄前面
        { kind: "cylinder", radius: 0.08, length: 0.04, at: onRodPiece(PIVOT, 0.39) }, // 銷頭
      ],
    },
    {
      id: "spring",
      kind: "plate",
      shape: shape(LEAF, [circle(0.045).reverse()]),
      thickness: 0.12,
      arrow: false,
      label: "a",
      labelOffset: [T[0] - EAR[0] + 0.32, NOTCH_TOP - EAR[1] - 0.05, 0],
    },
    {
      id: "handle",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(FINGER), thickness: 0.15 },
        { kind: "plate", shape: shape(STEM), thickness: 0.15 },
        { kind: "plate", shape: shape(LOOP_OUT, [offsetLoop(LOOP, -0.1).reverse()]), thickness: 0.15 },
        { kind: "plate", shape: shape(TOOTH), thickness: 0.15 }, // 卡榫
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.24 }, // 套在樞軸銷上的環
      ],
    },
  ],
  driver: { part: "handle", type: "rotation", range: [0, MAX] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { lift, released } = unhook(phi);
    const a = rodAngle(lift);
    return {
      parts: {
        rod: { angle: a },
        spring: { position: onRod(EAR, lift, SPRING_Z), angle: a + latch.bend(phi) },
        handle: { position: onRod(PIVOT, lift, HANDLE_Z), angle: a + phi },
      },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
