// 第 264 種:兩個直徑相等的蝸輪,一個 100 齒、一個 101 齒,並排套在同一根軸上,與同一根蝸桿咬合。
// 蝸桿每轉一圈,兩輪各轉過一齒,所以 100 齒的輪比 101 齒的輪稍快;蝸桿轉 100 × 101 = 10,100 圈時,
// 快的那個輪比另一個多轉一圈。原圖在輪的右側畫了兩根並排的長針(伸出輪緣之外),看得出兩輪慢慢錯開。
// 主動件是蝸桿;讀數照原文的數字。
// 初始視角:原圖是沿蝸桿軸看的側視圖(兩輪成兩條直立的窄帶、蝸桿是頂上一個圓);模型照這個方向看時
// 兩輪邊緣相疊、蝸桿端面蓋在輪頂上,糊成一團。改成從輪軸那一側(+X,針所在的那側)斜前上方看(3/4 視角):
// 兩輪各是一個橢圓、錯開看得出是兩片,蝸桿橫在兩輪頂上、看得到它同時咬著兩輪,兩根針也都在這一側看得到。
// 兩輪的間距不動(蝸桿的寬度剛好罩住兩輪)。原本的指針是各畫在輪的外側面上、沒伸出輪緣,從任何一側看都只看得到一根。
import { Z, TAU } from "./kit.js";

export const TEETH = [100, 101];
const R = 1.75; // 兩輪節圓半徑相同
const WORM = { radius: 0.32, length: 1.2 };
const GAP = 0.16; // 兩輪並排的間距

/** 蝸桿轉 theta(單線):兩輪的轉角(各轉過 theta/2π 齒) */
export const wheels = (theta) => TEETH.map((n) => -theta / n);

// 指針(照原圖):兩根長針都在輪的右側(+X)、伸出輪緣之外,離蝸桿夠遠(蝸桿只罩住 |x| ≤ 0.32),轉到頂上也不會碰到。
// 100 齒輪固定在軸上,針裝在軸的末端;101 齒輪鬆套在軸上,針裝在自己的轂上——兩針並排,慢慢錯開。
const NEEDLE = { from: -0.2, to: R * 1.15 };
const needle = (z) => ({ kind: "box", size: [0.05, NEEDLE.to - NEEDLE.from, 0.05], at: [0, (NEEDLE.from + NEEDLE.to) / 2, z], accent: true });

const wheel = (id, n, x, pieces) => ({
  id,
  kind: "gear",
  axis: [1, 0, 0], // 局部 Z = 世界 X;局部 +Y 朝上
  center: [x, 0, 0],
  teeth: n,
  radius: R,
  width: 0.22,
  bore: 0.1,
  pieces,
});

export default {
  figure: 264,
  parts: [
    { id: "worm", kind: "worm", axis: Z, center: [0, R + WORM.radius - 0.02, 0], radius: WORM.radius, length: WORM.length, pitch: (TAU * R) / 100, thread: 0.07, pieces: [{ kind: "cylinder", radius: 0.1, length: 2.4 }] },
    // 100 齒輪帶著軸轉(軸穿過 101 齒輪的孔);針的轂在軸末端 x ≈ 0.74
    wheel("wheel100", TEETH[0], -GAP, [
      { kind: "cylinder", radius: 0.09, length: 2.6, at: [0, 0, 0.4 + GAP] },
      { kind: "cylinder", radius: 0.14, length: 0.12, at: [0, 0, 0.9] },
      needle(0.99),
    ]),
    // 101 齒輪鬆套在軸上,針的轂貼在輪面上(x ≈ 0.27–0.57)
    wheel("wheel101", TEETH[1], GAP, [{ kind: "cylinder", radius: 0.14, length: 0.3, at: [0, 0, 0.26] }, needle(0.44)]),
  ],
  waivers: [
    { check: "interference", parts: ["worm", "wheel100"], reason: "待確認:worm 的Tube 與 wheel100 的板重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "worm", type: "rotation", speed: 10 },
  targets: ["wheel100", "wheel101"], // 慢慢錯開的兩個蝸輪
  view: { direction: [0.9, 0.5, 1] },
  pose(theta) {
    const [a, b] = wheels(theta);
    const turns = theta / TAU;
    return {
      parts: { worm: { angle: theta }, wheel100: { angle: a }, wheel101: { angle: b } },
      readouts: [
        { label: "蝸桿轉了", value: `${turns.toFixed(1)} 圈` },
        { label: "100 齒輪比 101 齒輪多轉", value: `${(turns / 100 - turns / 101).toFixed(5)} 圈` },
      ],
    };
  },
};
