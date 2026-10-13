// 第 264 種:兩個直徑相等、只差一齒的蝸輪,並排套在同一根軸上,與同一根蝸桿咬合。
// 蝸桿每轉一圈,兩輪各轉過一齒,所以齒少的輪比齒多的輪稍快;蝸桿轉 N1 × N2 圈時,齒少的輪比另一個多轉一圈。
// 原文的例子是 100 齒與 101 齒(蝸桿要轉 10,100 圈才差一圈);模型照同一個原理,齒數改成 20 與 21,
// 蝸桿轉 420 圈就差一圈,幾秒內就看得出兩根針錯開(偏離原文的數字,為了讓差異看得出;讀數仍附上原文的例子)。
// 原圖在輪的右側畫了兩根並排的長針(伸出輪緣之外),兩根針從同一個角度出發、慢慢錯開,蝸桿轉滿 420 圈時重新對齊。
// 推斷:原文沒提到指針,為顯示兩輪的相差而加(照原圖畫的兩根長針)。
// 主動件是蝸桿;讀數顯示蝸桿與兩輪各轉了幾圈、兩輪相差幾圈。
// 初始視角:原圖是沿蝸桿軸看的側視圖(兩輪成兩條直立的窄帶、蝸桿是頂上一個圓);模型照這個方向看時
// 兩輪邊緣相疊、蝸桿端面蓋在輪頂上,糊成一團。改成從輪軸那一側(+X,針所在的那側)、蝸桿 −Z 那一頭的斜上方看(3/4 視角):
// 兩輪各是一個橢圓、錯開看得出是兩片,蝸桿橫在兩輪頂上、看得到它同時咬著兩輪,兩根針也都在這一側看得到。
// 從 −Z 那一頭看(而不是 +Z),蝸桿與兩根針落在畫面中線偏右,不被左上角的讀數框蓋住。
// 推斷:蝸桿軸、輪軸的軸承與支柱(原圖沒畫)。
// 齒距:兩輪直徑相等、齒數不同,節圓上的齒距差 5%;蝸桿的螺距取兩者的平均,螺紋每轉一圈換進下一個齒槽,
// 差距不會累積(一圈之內最多錯開齒距的 1.2%)。
import { TAU } from "./kit.js";

export const TEETH = [20, 21];
const R = 1.75; // 兩輪節圓半徑相同
const M = (2 * R) / TEETH[0]; // 20 齒輪的模數(齒頂高),兩輪中較大的齒
// 蝸桿:芯半徑 0.30、螺紋(圓管)半徑 0.13;芯離輪的齒頂留 0.02,螺紋伸進齒槽
const WORM = { radius: 0.43, thread: 0.13, length: 1.6 };
const WORM_Y = R + M + 0.02 + (WORM.radius - WORM.thread);
export const PITCH = (TAU * R * (1 / TEETH[0] + 1 / TEETH[1])) / 2;
const GAP = 0.12; // 兩輪中心到蝸桿軸平面的距離(輪寬 0.18,兩輪之間空 0.06)
const WIDTH = 0.18;

/** 蝸桿轉 theta(單線):兩輪的轉角(各轉過 theta/2π 齒) */
export const wheels = (theta) => TEETH.map((n) => -theta / n);

// 相位:蝸桿在 θ = 0 時,有一圈螺紋正好在頂上(z = 0)往下咬;兩輪在 θ = 0 時,頂上(z = 0)正好是齒槽。
// 螺紋的局部角 α = (z + L/2)/螺距 · 2π,咬合處在蝸桿正下方(−Y,角 −π/2)。
const WORM_PHASE = -Math.PI / 2 - (Math.PI * WORM.length) / PITCH;
// 輪的第 i 齒在局部角 i·2π/n(局部 +Y 朝上);頂上(π/2)是齒槽要轉 π/2 − π/n,取一齒之內的餘數
const wheelPhase = (n) => (((Math.PI / 2 - Math.PI / n) % (TAU / n)) + TAU / n) % (TAU / n);
export const PHASE = TEETH.map(wheelPhase);

// 指針(照原圖):兩根長針都在輪的右側(+X)、伸出輪緣之外,離蝸桿夠遠(蝸桿只罩住 |x| ≤ 0.43),轉到頂上也不會碰到。
// 20 齒輪固定在軸上,針裝在軸的末端;21 齒輪鬆套在軸上,針裝在自己的轂上——兩針並排,θ = 0 時都朝正上方。
// 針轉回輪的相位(angle −相位),輪轉到相位時針朝上。
const NEEDLE = { from: -0.2, to: R + 0.4 };
function needle(z, phase) {
  const mid = (NEEDLE.from + NEEDLE.to) / 2;
  return {
    kind: "box",
    size: [0.09, NEEDLE.to - NEEDLE.from, 0.07],
    at: [mid * Math.sin(phase), mid * Math.cos(phase), z],
    angle: -phase,
    accent: true,
  };
}

const wheel = (id, n, x, pieces, extra = {}) => ({
  id,
  kind: "gear",
  axis: [1, 0, 0], // 局部 Z = 世界 X;局部 +Y 朝上
  center: [x, 0, 0],
  teeth: n,
  radius: R,
  width: WIDTH,
  bore: 0.1,
  pieces,
  ...extra,
});

export default {
  figure: 264,
  parts: [
    { id: "worm", kind: "worm", axis: [0, 0, 1], center: [0, WORM_Y, 0], radius: WORM.radius, length: WORM.length, pitch: PITCH, thread: WORM.thread, pieces: [{ kind: "cylinder", radius: 0.1, length: 2.7 }] }, // 軸兩端穿過軸承環(z ±1.19…1.31)
    // 20 齒輪帶著軸轉(軸穿過 21 齒輪的孔);針的轂在軸末端 x ≈ 0.74–0.86
    wheel(
      "wheel20",
      TEETH[0],
      -GAP,
      [
        { kind: "cylinder", radius: 0.09, length: 2.6, at: [0, 0, 0.4 + GAP] },
        { kind: "cylinder", radius: 0.14, length: 0.12, at: [0, 0, 0.92] },
        needle(0.92, PHASE[0]),
      ],
      { label: "20 齒", labelOffset: [1.3, -0.15, 0] },
    ),
    // 21 齒輪鬆套在軸上,針的轂貼在輪面上(x ≈ 0.21–0.57)。和 20 齒輪並排同向轉,只留一個轉向箭頭
    wheel("wheel21", TEETH[1], GAP, [{ kind: "cylinder", radius: 0.14, length: 0.36, at: [0, 0, 0.27] }, needle(0.42, PHASE[1])], {
      arrow: false,
      label: "21 齒",
      labelOffset: [0.2, -0.75, 0],
    }),
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 蝸桿軸兩端的軸承:由輪的另一側(−X,沒有針的那側)立起的柱子伸出的橫臂托著
        ...[-1.25, 1.25].flatMap((z) => [
          { kind: "cylinder", radius: 0.18, inner: 0.1, length: 0.12, at: [0, WORM_Y, z] },
          { kind: "box", size: [0.52, 0.12, 0.12], at: [-0.4, WORM_Y, z] }, // 橫臂接到環的外緣,不伸進孔裡
          { kind: "box", size: [0.14, WORM_Y + 2.2, 0.14], at: [-0.68, (WORM_Y - 2.2) / 2 - 0.01, z] },
        ]),
        // 輪軸兩端的軸承座
        ...[-0.85, 1.6].flatMap((x) => [
          { kind: "cylinder", axis: [1, 0, 0], radius: 0.2, inner: 0.09, length: 0.12, at: [x, 0, 0] },
          { kind: "box", size: [0.12, 2.0, 0.24], at: [x, -1.1, 0] },
        ]),
        { kind: "box", size: [3.2, 0.12, 3.2], at: [0.3, -2.16, 0] },
      ],
    },
  ],
  // 蝸桿轉得快(每秒約 3 圈):兩針幾秒內就看得出錯開,約 2 分鐘轉滿 420 圈、重新對齊
  driver: { part: "worm", type: "rotation", speed: 20 },
  targets: ["wheel20", "wheel21"], // 慢慢錯開的兩個蝸輪
  view: { direction: [0.9, 0.5, -1] },
  pose(theta) {
    const [a, b] = wheels(theta);
    const turns = theta / TAU;
    const [n1, n2] = TEETH;
    const diff = turns / n1 - turns / n2; // 20 齒輪比 21 齒輪多轉的圈數
    const apart = (((diff % 1) + 1) % 1) * 360; // 兩針的夾角
    return {
      parts: { worm: { angle: theta + WORM_PHASE }, wheel20: { angle: a + PHASE[0] }, wheel21: { angle: b + PHASE[1] } },
      readouts: [
        { label: `蝸桿(${n1 * n2} 圈差一圈)`, value: `${turns.toFixed(1)} 圈` },
        { label: `${n1} 齒 / ${n2} 齒`, value: `${(turns / n1).toFixed(2)} / ${(turns / n2).toFixed(2)} 圈` },
        { label: "相差", value: `${diff.toFixed(3)} 圈(${Math.min(apart, 360 - apart).toFixed(0)}°)` },
        { label: "原文 100/101 齒要", value: "10,100 圈" },
      ],
    };
  },
  waivers: [],
};
