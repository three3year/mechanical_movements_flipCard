// 第 279 種:曲柄與開槽十字頭,曲柄銷上套著 Clayton 的滑動軸承盒。十字頭兩端接活塞桿,
// 中間開一道直槽;軸承盒套在曲柄銷上,在槽裡上下滑動。曲柄轉動時,軸承盒把十字頭左右推動(往復直線運動)。
// 軸承盒由兩塊錐形襯裡與兩根錐形鑲條組成,上方兩根螺絲調整鑲條:收緊在腕銷上,並隨磨損把盒子往外撐開、貼緊十字頭的溝槽。
// 主動件是曲柄。
// 軸承盒的構造照 507movements.com 動畫的幾何(長度乘 S):每一側一根鑲條貼著槽壁,內緣是斜邊(上窄下寬),頂上有一道
// 往內伸的凸緣;一塊襯裡的外緣是同一條斜邊(上寬下窄),內側挖半圓孔包住曲柄銷;螺絲穿過鑲條的凸緣、下端頂在襯裡頂上,
// 鎖緊時把襯裡往下壓進楔形裡:襯裡往內收緊在銷上,鑲條往外撐開貼緊槽壁。左右兩半之間留縫(兩塊襯裡各自夾著銷)。
// 原圖的虛線 J 形是藏在十字頭後面的曲柄臂,斜線圓是曲柄銷的剖面。
// 推斷:螺絲不轉動(只畫鎖好的樣子);曲柄軸的軸承座、活塞桿的導套(原圖沒畫)。
import { crankPin } from "./linkage.js";
import { shape, rect, circle, arcPoints } from "./shapes.js";
import { pedestal, pedestalX } from "./supports.js";

const CRANK = { center: [0, -0.45, -0.35], r: 0.78 };
const S = 0.3; // 507 動畫的長度單位 → 模型(動畫的曲柄銷半徑 0.8、槽半寬 2)
const PIN_R = 0.8 * S;
const FIT = 0.003; // 襯裡的孔、槽壁留的間隙(貼著,不穿入)
const HALF = 2 * S; // 軸承盒半寬(鑲條外側)
const BOX_TOP = 2.75 * S; // 螺絲頭頂(從銷中心量)
const BOX_BOTTOM = -2 * S;

// 一側(左側,x < 0)的外形;右側鏡射
const mirror = (loop) => loop.map(([x, y]) => [-x, y]).reverse();
const scaled = (pts) => pts.map(([x, y]) => [x * S, y * S]);
// 鑲條:外側貼槽壁,內緣由 (−1, −2) 斜到 (−1.5, 1.5),頂上的凸緣往內伸到 x = −0.2
const GIB = scaled([[-2, 2], [-2, -2], [-1, -2], [-1.5, 1.5], [-0.2, 1.5], [-0.2, 2]]);
// 襯裡:外緣在鑲條的斜邊上(y 1.125 與 −1.5 兩處),內側 x = −0.2 處的半圓孔包住曲柄銷
const taperX = (y) => (-1 - (0.5 * (y / S + 2)) / 3.5) * S;
const LINING = (() => {
  const r = PIN_R + FIT;
  const inner = -0.2 * S;
  const a = Math.acos(inner / r); // 孔與內側邊的交點
  return [
    [taperX(1.125 * S), 1.125 * S],
    [inner, 1.125 * S],
    ...arcPoints(r, a, 2 * Math.PI - a),
    [inner, -1.5 * S],
    [taperX(-1.5 * S), -1.5 * S],
  ].reverse(); // 逆時針
})();
/** 軸承盒的外形(局部座標,原點在曲柄銷中心):左右兩塊襯裡與兩根鑲條 */
export const journalBox = {
  linings: [{ outline: LINING }, { outline: mirror(LINING) }],
  gibs: [GIB, mirror(GIB)],
};

/** 曲柄轉 theta:曲柄銷與十字頭的水平位移 */
export function crosshead(theta) {
  const pin = crankPin(CRANK.center, CRANK.r, theta + Math.PI / 2);
  return { pin, x: pin[0] };
}

// 十字頭:左右尖的六角形板,中間的直槽(寬度貼著鑲條,高度讓軸承盒連同螺絲頭走滿曲柄的行程)
const SLOT = { w: 2 * (HALF + FIT), y0: CRANK.center[1] - CRANK.r + BOX_BOTTOM - 0.04, y1: CRANK.center[1] + CRANK.r + BOX_TOP + 0.04 };
const head = shape(
  [[-1.85, 0.2], [-1.25, 1.7], [1.25, 1.7], [1.85, 0.2], [1.85, -0.6], [1.25, -2.25], [-1.25, -2.25], [-1.85, -0.6]],
  [rect(SLOT.w, SLOT.y1 - SLOT.y0, 0, (SLOT.y0 + SLOT.y1) / 2).reverse()],
);

// 調整螺絲(一側):螺桿從襯裡頂上穿過鑲條的凸緣,凸緣上一個螺帽,頂上是螺絲頭
const screw = (sx) => {
  const x = sx * 0.775 * S;
  const y0 = 1.125 * S;
  const y1 = 2.375 * S;
  return [
    { kind: "cylinder", axis: [0, 1, 0], radius: 0.375 * S * 0.9, length: y1 - y0, at: [x, (y0 + y1) / 2, 0] },
    { kind: "box", size: [0.75 * S, 0.375 * S, 0.24], at: [x, 2.1875 * S, 0] },
    { kind: "box", size: [0.375 * S, 0.375 * S, 0.16], at: [x, 2.5625 * S, 0] },
  ];
};

export default {
  figure: 279,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: CRANK.center, z: -0.9, bore: 0.28, floor: -2.8 }),
        // 活塞桿的導套
        ...pedestalX({ x: -3.25, y: -0.2, z: 0, bore: 0.24, floor: -2.8 }),
        ...pedestalX({ x: 3.25, y: -0.2, z: 0, bore: 0.24, floor: -2.8 }),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.2,
      pieces: [
        { kind: "plate", shape: shape([[-0.3, -0.25], [0.3, -0.25], [0.26, CRANK.r], [-0.26, CRANK.r]], [circle(0.12).reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.28, length: 1.0, at: [0, 0, -0.55] }, // 曲柄軸,往後穿過軸承座
        // 曲柄銷:後端壓進曲柄臂,往前穿過軸承盒
        { kind: "cylinder", radius: PIN_R, length: 0.6, at: [0, CRANK.r, 0.2], accent: true },
      ],
    },
    {
      id: "crosshead",
      kind: "plate",
      shape: head,
      thickness: 0.3,
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.24, length: 2.6, at: [-3.1, -0.2, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.24, length: 2.6, at: [3.1, -0.2, 0] },
      ],
    },
    {
      id: "box",
      kind: "group",
      pieces: [
        ...journalBox.gibs.map((g) => ({ kind: "plate", shape: shape(g), thickness: 0.3 })),
        ...journalBox.linings.map((l) => ({ kind: "plate", shape: shape(l.outline), thickness: 0.22 })), // 襯裡比鑲條薄一點,斜邊看得出來
        ...screw(-1),
        ...screw(1),
      ],
    },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "crosshead", // 往復的十字頭
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    const { pin, x } = crosshead(theta);
    return {
      parts: {
        crank: { angle: theta },
        crosshead: { position: [x, 0, 0] },
        box: { position: [pin[0], pin[1], 0] },
      },
      readouts: [],
    };
  },
};
