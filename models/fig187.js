// 第 187 種(條目 187–188 的第一張圖):第 186 種的變形。偏心桿末端的鉤口搭在搖臂(上方軸往下的臂)的銷上;
// 桿端上以銷裝著一支直的手柄,手柄往右伸到桿尾的上方(兩者並排,像一把鉗子)。
// 推斷:原文只說是第 186 種的變形。這裡取與第 186 種相同的作法——把手柄往上扳,手柄左端的趾頭往下頂在
// 搖臂的凸柱上,桿端因此被抬起,銷從鉤口中脫出。主動件是手柄。
// 由接觸算:扳多少、桿端抬多高,由手柄左端(趾頭)的外形與凸柱相碰算(gab.js 的 contactLift)。
// 立體化(維護者 2026-10-08 決定):凸柱在偏心桿前面一層、和手柄同一層,由銷的前端伸出的小臂托著;
// 偏心桿那一層沒有凸柱,桿抬起時從凸柱後面過去。凸柱做成平頂的方柱,手柄轉動時趾頭沿著平頂往右滑。
// 動力重演不適用,原因同第 186 種(手柄是主動件,引擎照模型的姿勢連桿端抬起後的位置一起擺放它;試過宣告,拿掉凸柱照樣通過)。
import { deg } from "./kit.js";
import { gab, rodAngle, onRod, contactLift, studUnder, handleAt, ECC } from "./gab.js";
import { shape, circle, thickLine, rect } from "./shapes.js";

const G = gab();
const PIVOT = [0.1, 0.52]; // 手柄在桿上的樞軸(以銷為原點)
const MAX = deg(55);
const SHAFT = [0, 1.57, 0];

const HANDLE = shape(
  [[-0.68, -0.12], [0.55, -0.12], [0.9, -0.2], [1.25, -0.1], [2.25, -0.1], [2.38, 0.02], [2.25, 0.15], [1.25, 0.15], [0.9, 0.22], [0.55, 0.28], [-0.55, 0.28], [-0.68, 0.15]],
  [circle(0.07).reverse()],
);
// 凸柱:平頂的方柱,在趾頭下面,原圖位置剛好頂著趾頭
const STUD = studUnder([HANDLE.outline], PIVOT, -0.4, ([x, y]) => rect(0.5, 0.12, x, y));
const STUD_Z = [0.15, 0.45]; // 凸柱前後的範圍:偏心桿(−0.125–0.125)前面,手柄那一層(0.175–0.325)
const ARM_Z = 0.4; // 托著凸柱的小臂(在手柄前面)

/** 手柄往上扳 phi(逆時針):桿端抬起的量(趾頭與凸柱相碰算) */
export function unhook(phi) {
  const lift = contactLift([HANDLE.outline], PIVOT, STUD.outline, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;
/** 檢查用:手柄扳 phi 時,手柄與凸柱的外形(世界座標 2D) */
export const contact = (phi) => ({ handle: handleAt([HANDLE.outline], PIVOT, unhook(phi).lift, phi), stud: STUD.outline });

export default {
  figure: 187,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.25, SHAFT[1]], [-0.22, 0.0], [0.22, 0.0], [0.25, SHAFT[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.45, inner: 0.3, length: 0.3, at: [SHAFT[0], SHAFT[1], -0.35] },
        { kind: "cylinder", radius: 0.3, length: 0.5, at: [SHAFT[0], SHAFT[1], -0.35], accent: true },
        { kind: "cylinder", radius: G.pin, length: 0.8, at: [0, 0, 0.05] }, // 銷,前端伸到偏心桿與手柄前面
        { kind: "plate", shape: shape(thickLine([[0, 0], STUD.center], 0.14)), thickness: 0.1, at: [0, 0, ARM_Z] }, // 銷前端托著凸柱的小臂
        { kind: "plate", shape: shape(STUD.outline), thickness: STUD_Z[1] - STUD_Z[0], at: [0, 0, (STUD_Z[0] + STUD_Z[1]) / 2] }, // 凸柱
      ],
    },
    { id: "rod", kind: "group", center: ECC, arrow: false, pieces: [{ kind: "plate", shape: G.rod({ left: -3.65, right: 2.4 }), thickness: 0.25, at: [-ECC[0], 0, 0] }] },
    { id: "handle", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: HANDLE, thickness: 0.15 }, { kind: "cylinder", radius: 0.07, length: 0.3 }] },
  ],
  driver: { part: "handle", type: "rotation", range: [0, MAX] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { lift, released } = unhook(phi);
    const a = rodAngle(lift);
    return {
      parts: { rod: { angle: a }, handle: { position: onRod(PIVOT, lift, 0.25), angle: a + phi } },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
