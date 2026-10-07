// 第 186 種:把偏心桿與閥門齒輪脫鉤的裝置。偏心桿(左邊伸來的長桿)末端的鉤口搭在搖臂(上方軸往下的臂)的銷上。
// 桿端上以銷裝著一支彈簧手柄:往上拉下方的環形手柄,手柄上端的指頭往下頂在搖臂的凸柱上,桿端因此被抬起,
// 拉到手柄卡進凹槽 a 時,銷已從鉤口中脫出。主動件是手柄。
// 由接觸算:手柄拉多少、桿端抬多高,由指頭的外形與凸柱相碰算(gab.js 的 contactLift)。
// 立體化(維護者 2026-10-08 決定):凸柱在偏心桿前面一層、和手柄指頭同一層,由銷的前端伸出的小臂托著;
// 偏心桿那一層沒有凸柱,桿抬起時從凸柱後面過去。
// 推斷:指頭末端往下勾的爪頂在搖臂上一個平頂凸柱的頂上(原圖被手柄遮住),手柄轉動時爪尖沿著平頂往左滑;
// 凸柱前後怎麼錯開(原圖是平面圖);彈簧與凹槽 a 的形狀。
// 動力重演不適用:手柄是主動件,引擎照模型的姿勢(連桿端被抬起後的位置)直接擺放它;手柄裝在被抬起的桿上,
// 它的位置本身就是要驗的結果,引擎沒辦法只給「相對桿的轉角」、讓桿的高度由指頭頂凸柱決定。試過宣告桿自由(靠自重
// 搭在銷上):拿掉凸柱照樣通過,桿是被照模型擺放的手柄帶上去的,所以不宣告。
import { deg, add, rot2 } from "./kit.js";
import { gab, rodAngle, onRod, contactLift, studUnder, handleAt, ECC } from "./gab.js";
import { shape, thickLine, offsetLoop, rect } from "./shapes.js";

const G = gab();
const PIVOT = [0.9, 0.2]; // 手柄在桿上的樞軸(以銷為原點的桿座標)
const FINGER = thickLine([[0, 0], [-0.1, 0.45], [-0.35, 0.82], [-0.62, 0.92], [-0.72, 0.8]], 0.22); // 指頭(相對樞軸):末端往下勾的爪
const STEM = thickLine([[0, 0], [0.3, -0.45], [0.42, -0.95]], 0.2); // 往下接環形手柄的柄
const MAX = deg(42); // 手柄卡進凹槽 a 時的轉角
const SHAFT = [-0.1, 2.45, 0];
// 凸柱:平頂的方柱,在爪尖下面,原圖位置剛好頂著爪尖;手柄轉動時爪尖沿著平頂往左滑
const STUD_W = 0.62;
const STUD = studUnder([FINGER, STEM], PIVOT, 0.0, ([x, y]) => rect(STUD_W, 0.14, x, y));
const STUD_Z = [0.15, 0.45]; // 凸柱前後的範圍:偏心桿(−0.125–0.125)前面,手柄指頭那一層(0.175–0.325)
const ARM_Z = 0.4; // 托著凸柱的小臂(在手柄前面)

/** 手柄轉 phi(往上拉為正,逆時針):桿端抬起的量(指頭與凸柱相碰算) */
export function unhook(phi) {
  const lift = contactLift([FINGER, STEM], PIVOT, STUD.outline, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;
/** 檢查用:手柄轉 phi 時,手柄(指頭、柄)與凸柱的外形(世界座標 2D) */
export const contact = (phi) => ({ handle: handleAt([FINGER, STEM], PIVOT, unhook(phi).lift, phi), stud: STUD.outline });

// 環形手柄:略往右斜的長橢圓
const LOOP = Array.from({ length: 48 }, (_, i) => {
  const t = (i / 48) * 2 * Math.PI;
  return rot2([0.36 * Math.cos(t), 1.05 * Math.sin(t)], deg(12)).map((v, k) => v + [0.62, -1.95][k]);
});
const NOTCH = add([...PIVOT, 0], [...rot2([1.15, -2.4], MAX), 0]); // 手柄卡住時環的外緣
const SPRING = [[0.9, 0.15], [1.05, 0.33], [1.8, 0.55], [2.6, 0.85], [3.05, 1.0], [3.35, 0.4], [NOTCH[0] + 0.12, NOTCH[1] + 0.45], [NOTCH[0] + 0.12, NOTCH[1]], [NOTCH[0] - 0.1, NOTCH[1] - 0.35]];

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
      pieces: [{ kind: "plate", shape: G.rod(), thickness: 0.25, at: [-ECC[0], 0, 0] }],
    },
    {
      id: "spring",
      kind: "plate",
      center: ECC,
      shape: shape(thickLine(SPRING.map(([x, y]) => [x - ECC[0], y]), 0.12)),
      thickness: 0.12,
      arrow: false,
      label: "a",
      labelOffset: [NOTCH[0] - ECC[0] + 0.45, NOTCH[1], 0],
    },
    {
      id: "handle",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(FINGER), thickness: 0.15 },
        { kind: "plate", shape: shape(STEM), thickness: 0.15 },
        { kind: "plate", shape: shape(offsetLoop(LOOP, 0.1), [offsetLoop(LOOP, -0.1).reverse()]), thickness: 0.15 },
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.3 },
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
        spring: { angle: a },
        handle: { position: onRod(PIVOT, lift, 0.25), angle: a + phi },
      },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
