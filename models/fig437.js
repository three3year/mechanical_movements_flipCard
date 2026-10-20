// 第 437 種:渦殼式水輪,有放射狀葉片 a,水衝擊葉片帶動輪轉。渦形(蝸殼)外殼 b 以特定方式約束水流,
// 使水作用在輪周的所有葉片上。在底部加裝傾斜的水斗 c、c,水從這些水斗的開口逸出時,又以額外的力推輪。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。原圖是俯視圖(視線方向 +z 是上方),箭頭:順時針。
// 2026-10-20 整張重讀:
// - 蝸殼壁是一條粗線:進水道的上壁接著螺線順時針繞一圈,在舌(進水道下壁與螺線內端相接處)收尾;進水道的下壁另畫一塊(舌),
//   和螺線的內端相疊——原本一條折線在舌那裡折回 180°,粗線的輪廓自交,三角化後多出一塊蓋到輪上。
// - 葉片 a 照原圖只在外圈:從內環(輪半徑的六成)到輪緣,八片,頂端那一片直立。內環畫成輪盤上的一道矮唇,水翻過它流到中央。
// - 斜水斗 c 在底部:輪盤在中央開四個扇形的開口,每個開口下面掛一塊斜板,上緣在開口順時針那一側、往逆時針方向斜下去;
//   水從開口落到斜板上,沿斜面往逆時針方向逸出,反作用力推輪順時針。原圖的剖面線就是這些斜面。
// - 推斷:底板中央開出水口(水從水斗往下逸出),出水口下面一座橋(兩根橫桿與四根短腳)托著軸的下軸承;輪轂上四根輻條(原圖的細線)。
import { TAU, Z, deg, polar, quatAxisAngle, quatMul } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine, arcPoints } from "./shapes.js";

export const WHEEL = 1.5; // 葉片外緣(輪盤的半徑)
const RING = 0.9; // 內環:葉片的內端
const HUB = 0.2;
const VANES = 8;
const DISC = { z: -0.27, thick: 0.06 }; // 輪盤(底在 z −0.30)
const FLOOR = { z: -0.33, thick: 0.04, outlet: RING - 0.02 }; // 底板(頂在 z −0.31,貼著壁底)與中央出水口的半徑
const BUCKET = { r0: 0.28, r1: 0.8, span: deg(50), slope: 0.46, tilt: deg(60) }; // 開口的內外半徑、張角;斜板的長、偏離鉛直的角
const BRIDGE_Z = -0.7;
const SPEED = TAU * 1.4;
/** 蝸殼壁的半徑:從頂端(進水處)順時針轉 t 後 */
export const volute = (t) => 2.35 - 0.7 * (t / TAU);

const START = Math.PI / 2;
const END = TAU - 0.12; // 螺線在舌的位置收尾(角度 105°、半徑 1.66)
const spiral = Array.from({ length: 73 }, (_, i) => {
  const t = (END * i) / 72;
  return polar(volute(t), START - t).slice(0, 2);
});
const wallLine = [[-2.7, 2.35], ...spiral]; // 進水道的上壁接著螺線;螺線的第一點就是 [0, 2.35]
const tongueLine = [[-2.7, 1.65], spiral[spiral.length - 1]]; // 進水道的下壁,末端疊在螺線的內端上(舌)
// 水:沿蝸殼順時針流,逐漸流進葉片之間
const SPIRAL = [[-2.6, 2.0, 0.15], ...Array.from({ length: 49 }, (_, i) => {
  const t = (TAU * 0.92 * i) / 48;
  return polar((WHEEL + volute(t)) / 2 - 0.18 * (i / 48), START - t, 0.15);
})];
// 開口(與斜水斗)的中心角:葉片之間
const OPENINGS = [0, 1, 2, 3].map((k) => deg(45) + (k * TAU) / 4);
// 水:從葉片之間往內、翻過內環、落進開口,沿斜水斗往逆時針方向逸出到底板下面
const INWARD = OPENINGS.map((a) => [
  polar(WHEEL + 0.25, a + 1.18, 0.15),
  polar(1.2, a + 1.0, 0.15),
  polar(0.8, a + 0.5, 0.1),
  polar(0.55, a + 0.1, -0.1),
  polar(0.5, a - 0.1, -0.35),
  polar(0.55, a + 0.15, -0.6),
  polar(0.6, a + 0.4, -0.95),
]);

/** 輪盤上一個扇形開口的輪廓(逆時針) */
const opening = (a) => [...arcPoints(BUCKET.r0, a - BUCKET.span / 2, a + BUCKET.span / 2), ...arcPoints(BUCKET.r1, a + BUCKET.span / 2, a - BUCKET.span / 2)];

export default {
  figure: 437,
  parts: [
    {
      id: "casing",
      kind: "group",
      label: "b",
      labelOffset: [2.15, -0.2, 0.3],
      pieces: [
        { kind: "plate", role: "wall", shape: shape(thickLine(wallLine, 0.16)), thickness: 0.62 },
        { kind: "plate", role: "tongue", shape: shape(thickLine(tongueLine, 0.16)), thickness: 0.62 },
        { kind: "plate", role: "floor", shape: shape(rect(5.6, 5.2, 0, 0), [circle(FLOOR.outlet).reverse()]), thickness: FLOOR.thick, at: [0, 0, FLOOR.z] },
        // 出水口下面的橋(推斷):四根短腳從底板底下伸下去,托著兩根十字交叉的橫桿與軸承
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", role: "leg", size: [0.12, 0.12, FLOOR.z - FLOOR.thick / 2 - (BRIDGE_Z - 0.05)], at: [...polar(FLOOR.outlet + 0.1, (k * TAU) / 4).slice(0, 2), (FLOOR.z - FLOOR.thick / 2 + BRIDGE_Z - 0.05) / 2] })),
        ...[0, 1].map((k) => ({ kind: "box", role: "bar", size: [2 * (FLOOR.outlet + 0.16), 0.1, 0.1], at: [0, 0, BRIDGE_Z], angle: (k * Math.PI) / 2 })),
        { kind: "cylinder", role: "bearing", radius: 0.22, inner: 0.15, length: 0.1, at: [0, 0, BRIDGE_Z] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: 1.0,
      pieces: [
        // 輪盤:中央開四個扇形的開口(斜水斗的開口)
        { kind: "plate", role: "disc", shape: shape(circle(WHEEL), OPENINGS.map((a) => opening(a).reverse())), thickness: DISC.thick, at: [0, 0, DISC.z] },
        // 葉片 a:外圈八片,從內環到輪緣,立在輪盤上
        ...Array.from({ length: VANES }, (_, i) => ({ kind: "box", role: "vane", size: [WHEEL - RING, 0.08, 0.5], at: polar((WHEEL + RING) / 2, (i * TAU) / VANES), angle: (i * TAU) / VANES })),
        // 內環:輪盤上的一道矮唇(原圖葉片內端的那個圓),水翻過它流到中央
        { kind: "plate", role: "ring", shape: shape(circle(RING + 0.03), [circle(RING - 0.03).reverse()]), thickness: 0.12, at: [0, 0, DISC.z + DISC.thick / 2 + 0.05] },
        // 輪轂、輻條(原圖中央的細線)與軸;軸往下穿過出水口到橋上的軸承
        { kind: "cylinder", role: "hub", radius: HUB, length: 0.5 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", role: "spoke", size: [RING - HUB + 0.06, 0.06, 0.12], at: [...polar((RING + HUB) / 2, (k * TAU) / 4).slice(0, 2), DISC.z + DISC.thick / 2 + 0.05], angle: (k * TAU) / 4 })),
        { kind: "cylinder", role: "shaft", radius: 0.14, length: 0.4 - (BRIDGE_Z - 0.08), at: [0, 0, (0.4 + BRIDGE_Z - 0.08) / 2] },
        // 斜水斗 c:掛在開口下面的斜板,上緣在開口順時針的那一側(上緣疊進輪盤 0.01),往逆時針方向斜下去
        ...OPENINGS.map((a, k) => {
          const up = BUCKET.slope / 2; // 中心到上緣
          const t = [-Math.sin(a), Math.cos(a)];
          const u = -0.2 + up * Math.sin(BUCKET.tilt); // 中心在切線方向的位置(逆時針為正)
          const c = polar((BUCKET.r0 + BUCKET.r1) / 2, a);
          return {
            kind: "box",
            role: "bucket",
            size: [BUCKET.r1 - BUCKET.r0, 0.04, BUCKET.slope],
            at: [c[0] + u * t[0], c[1] + u * t[1], DISC.z - DISC.thick / 2 + 0.01 - up * Math.cos(BUCKET.tilt)],
            rotation: quatMul(quatAxisAngle(Z, a), quatAxisAngle([1, 0, 0], BUCKET.tilt)),
            ...(k === 0 ? { accent: true } : {}),
          };
        }),
      ],
    },
    ...[0, 1, 2].map((k) => ({ id: `labelA${k}`, kind: "group", label: "a", labelOffset: [...polar(WHEEL - 0.3, START + deg(45) + (k * TAU) / 3).slice(0, 2), 0.4], pieces: [] })),
    ...[0, 1].map((k) => ({ id: `labelC${k}`, kind: "group", label: "c", labelOffset: [...polar(0.5, OPENINGS[2 * k]).slice(0, 2), 0.45], pieces: [] })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: -TAU * progress } },
      flows: [{ fluid: "water", points: [...stream(SPIRAL, travel, { spacing: 0.22 }), ...INWARD.flatMap((p) => stream(p, travel, { spacing: 0.22 }))] }],
      readouts: [],
    };
  },
};
