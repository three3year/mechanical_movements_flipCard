// 第 217、218 種:毛紡梳理機中驅動滾軸的裝置(同一裝置的兩個部件)。純函式與共用的模型定義。
// 第 217 種:輪面上開槽的心形凸輪 C、D、B,凸柱 A 在溝槽內;第 218 種:A 裝在一支以滾軸的軸 H 為樞軸的槓桿下端,
// 槓桿上端掛著卡榫 G,G 的爪落在凹槽輪 F 的凹槽裡。凸輪轉動:A 從 C 到 D 時槓桿把 F(與滾軸)往後轉,
// 從 D 到 e 時往前轉(後退一份、前進兩份——原文的三分之一與三分之二);A 到 e 時凸輪輪背的凸出部分把 G 抬起,
// A 從 e 回到 C 的期間 G 滑過 F 兩凹槽之間的光面,F 不動;A 回到 C 時 G 已落進下一個凹槽。
// 推斷:F 有 8 個凹槽,每循環前進一格(45°),所以後退 45°、前進 90°;溝槽的形狀是由這個動作反推出來的
// (凸柱在世界中的位置轉到凸輪的局部座標);凸輪順時針轉(第 217 種的箭頭);凸輪中心在 A 的右上方。
import { TAU, deg, smooth, rot2, polar, add } from "./kit.js";
import { shape, circle, thickLine, offsetLoop, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

export const H = [0, 0, 0];
const L = 2.1; // H 到 A
const NOTCHES = 8;
export const STEP = TAU / NOTCHES;
// 凸輪中心:在 A(原位)的右上方,讓溝槽上的 C 落在凸輪的左下方(與原圖相同);A 往前(往左)時離凸輪中心較遠
const K = [2.4 * Math.cos(deg(35)), -L + 2.4 * Math.sin(deg(35)), 0];
const RF = 1.55; // F 的半徑
const UPPER = { length: 1.75, angle: deg(70) }; // 槓桿上端(掛 G 的銷),相對 H
const CATCH = { angle: deg(122) }; // G 的爪在 F 圓周上的方向(槓桿在原位時)
// 一個循環(凸輪一圈)的時間分配
const PHASE = { back: 0.15, forward: 0.62, lift: 0.67, ret: 0.95 };

/** 凸輪轉了 u 圈(可大於 1):槓桿轉角 ψ、F 的轉角、G 被抬起的比例,與 A 在溝槽的哪一段 */
export function woolComb(u) {
  const k = Math.floor(u);
  const f = u - k;
  let psi;
  let lift = 0;
  let stage;
  if (f < PHASE.back) {
    psi = -STEP * smooth(f / PHASE.back);
    stage = "C→D";
  } else if (f < PHASE.forward) {
    psi = -STEP + 2 * STEP * smooth((f - PHASE.back) / (PHASE.forward - PHASE.back));
    stage = "D→e";
  } else if (f < PHASE.lift) {
    psi = STEP;
    lift = smooth((f - PHASE.forward) / (PHASE.lift - PHASE.forward));
    stage = "e(抬起 G)";
  } else if (f < PHASE.ret) {
    psi = STEP - STEP * smooth((f - PHASE.lift) / (PHASE.ret - PHASE.lift));
    lift = 1;
    stage = "e→C";
  } else {
    psi = 0;
    lift = 1 - smooth((f - PHASE.ret) / (1 - PHASE.ret));
    stage = "C(G 落下)";
  }
  const engaged = f < PHASE.forward;
  const roller = k * STEP + (engaged ? psi : STEP);
  return { psi, roller, lift, stage, engaged };
}

// 「往前」是順時針:槓桿往前擺時 A 往左、離凸輪中心越遠
const SENSE = -1;
/** 槓桿依程式轉 ψ(往前為正)時凸柱 A 的位置 */
export const studAt = (psi) => add(H, polar(L, -Math.PI / 2 + SENSE * psi));
/** 凸輪轉 u 圈時(順時針)的轉角 */
const camAngle = (u) => -TAU * u;

// 溝槽的中心線:凸柱在凸輪局部座標中走過的路線
const N = 360;
const groove = Array.from({ length: N }, (_, i) => {
  const u = i / N;
  const a = studAt(woolComb(u).psi);
  return rot2([a[0] - K[0], a[1] - K[1]], -camAngle(u));
});
const area = groove.reduce((s, p, i) => s + p[0] * groove[(i + 1) % N][1] - groove[(i + 1) % N][0] * p[1], 0);
const ccw = area > 0 ? groove : [...groove].reverse();
// 凸輪的軸朝 −z(順時針轉為正),局部 x 在世界中左右相反:畫凸輪時先把 x 翻過來
const mirror = (loop) => loop.map(([x, y]) => [-x, y]).reverse();
const CAM_R = Math.max(...groove.map(([x, y]) => Math.hypot(x, y))) + 0.55;
const FLOOR = K[1] - CAM_R - 0.3; // 第 217 種的底板(在凸輪下面)
const POST_X = K[0] - CAM_R - 0.5; // 托住 H 的支架立柱(在凸輪左外側)
export const geometry = { K, L, NOTCHES, CAM_R, groove };
const grooveAt = (u) => groove[Math.round(u * N) % N];
const TAGS = { C: grooveAt(0.02), D: grooveAt(PHASE.back), B: grooveAt((PHASE.back + PHASE.forward) / 2), e: grooveAt(PHASE.forward) };

// 凹槽輪 F:圓周上 8 個方形凹槽
const fOutline = (() => {
  const pts = [];
  const w = 0.11;
  for (let i = 0; i < NOTCHES; i++) {
    const a = CATCH.angle + i * STEP;
    const half = w / RF;
    pts.push(...arcPoints(RF, a + half, a + STEP - half));
    const b = a + STEP;
    pts.push(polar(RF, b - half).slice(0, 2), polar(RF - 0.2, b - half).slice(0, 2), polar(RF - 0.2, b + half).slice(0, 2), polar(RF, b + half).slice(0, 2));
  }
  return pts;
})();
// G:從槓桿上端的銷沿 F 的上緣往左彎的爪(局部座標:原點在銷,槓桿在原位)
const pivotG = polar(UPPER.length, UPPER.angle).slice(0, 2);
const tipG = polar(RF - 0.12, CATCH.angle).slice(0, 2);
const gArm = Array.from({ length: 12 }, (_, i) => {
  const a = UPPER.angle + ((CATCH.angle - UPPER.angle) * i) / 11;
  const r = UPPER.length + (RF + 0.15 - UPPER.length) * (i / 11);
  const p = polar(r, a);
  return [p[0] - pivotG[0], p[1] - pivotG[1]];
});
const G_SHAPE = shape(thickLine([...gArm, [tipG[0] - pivotG[0], tipG[1] - pivotG[1]]], 0.2));
const LIFT = deg(14);
const leverShape = shape(thickLine([polar(L, -Math.PI / 2 - 0.03).slice(0, 2), [0.12, -0.9], [0, 0], [0.32, 0.9], pivotG], 0.26), [circle(0.12).reverse()]);

/** fig 217(凸輪)或 218(凹槽輪 F 與卡榫 G)的模型 */
export function woolCombModel(figure) {
  const cam = figure === 217;
  const parts = [
    { id: "lever", kind: "plate", shape: leverShape, thickness: 0.12, arrow: false, center: [0, 0, 0.3] },
    { id: "stud", kind: "cylinder", radius: 0.13, length: 0.6, arrow: false, label: "A", labelOffset: [0.32, -0.1, 0] },
  ];
  if (cam) {
    parts.unshift(
      {
        id: "cam",
        kind: "group",
        center: K,
        axis: [0, 0, -1],
        spin: CAM_R,
        pieces: [
          { kind: "plate", shape: shape(circle(CAM_R), [mirror(offsetLoop(ccw, 0.16)).reverse()]), thickness: 0.2, mark: [0, CAM_R - 0.25], markSize: 0.09 },
          { kind: "plate", shape: shape(mirror(offsetLoop(ccw, -0.16)), [circle(0.32).reverse()]), thickness: 0.2 },
          { kind: "plate", shape: shape(mirror(offsetLoop(ccw, 0.3))), thickness: 0.05, at: [0, 0, 0.4] }, // 溝底(局部 +z 在世界中朝後)
          { kind: "cylinder", radius: 0.55, inner: 0.32, length: 0.3 },
        ],
      },
      ...Object.keys(TAGS).map((t) => ({ id: `tag${t}`, kind: "group", pieces: [], arrow: false, label: t })),
      {
        id: "frame",
        kind: "group",
        // 推斷(原圖只畫出軸頭):凸輪的軸往後伸進軸承座;槓桿的樞軸 H 在凸輪前面(凸輪盤蓋住 H 的後方),
        // 由一支從凸輪左外側立起的支架從前面托著
        pieces: [
          { kind: "cylinder", radius: 0.32, length: 0.5, at: [K[0], K[1], -0.55] },
          ...pedestal({ at: K, z: -0.85, bore: 0.32, floor: FLOOR, depth: 0.2 }),
          { kind: "cylinder", radius: 0.12, length: 0.5, at: [H[0], H[1], 0.45] },
          { kind: "cylinder", radius: 0.26, inner: 0.12, length: 0.2, at: [H[0], H[1], 0.65] },
          { kind: "box", size: [H[0] - POST_X - 0.24, 0.24, 0.2], at: [(H[0] - 0.24 + POST_X) / 2, H[1], 0.65] },
          { kind: "box", size: [0.26, H[1] + 0.12 - FLOOR, 0.2], at: [POST_X, (H[1] + 0.12 + FLOOR) / 2, 0.65] },
          { kind: "box", size: [1.0, 0.18, 0.6], at: [POST_X, FLOOR - 0.09, 0.65] },
        ],
      },
    );
  } else {
    parts.unshift(
      { id: "wheelF", kind: "plate", shape: shape(fOutline, [circle(0.2).reverse()]), thickness: 0.18, hub: 0.32, spin: RF, label: "F", labelOffset: [0.7, -0.3, 0.3] },
      { id: "shaftH", kind: "cylinder", radius: 0.2, length: 0.9, arrow: false, label: "H", labelOffset: [0, 0.35, 0.3] },
      {
        id: "frame",
        kind: "group",
        // 推斷(原圖只畫出軸頭):滾軸的軸 H 往後伸進軸承座
        pieces: [{ kind: "cylinder", radius: 0.2, length: 0.3, at: [H[0], H[1], -0.6] }, ...pedestal({ at: H, z: -0.85, bore: 0.2, floor: -2.6, depth: 0.2 })],
      },
      { id: "catch", kind: "group", arrow: false, label: "G", labelOffset: [-0.6, 0.35, 0], pieces: [{ kind: "plate", shape: G_SHAPE, thickness: 0.12 }, { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.25 }, { kind: "cylinder", radius: 0.08, length: 0.5, at: [tipG[0] - pivotG[0], tipG[1] - pivotG[1], -0.27] }] }, // 爪尖的銷往後伸進 F 的凹槽(G 在槓桿前面,F 在後面)
    );
  }
  return {
    figure,
    parts,
    driver: cam
      ? { part: "cam", type: "rotation", speed: 0.8 }
      : { type: "virtual", label: "凸輪轉了", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
    ...(cam ? {} : { powered: ["lever"] }), // 第 218 種沒畫凸輪:槓桿直接受(沒畫出來的)凸輪推動
    target: cam ? "lever" : "wheelF", // 第 217 種:凸輪帶動的槓桿;第 218 種:槓桿經卡榫帶動的凹槽輪 F(連著滾軸)
    view: { direction: [0.06, 0.05, 1] },
    pose(v) {
      const u = cam ? v / TAU : v;
      const s = woolComb(u);
      const a = studAt(s.psi);
      const out = {
        lever: { angle: SENSE * s.psi },
        stud: { position: [a[0], a[1], 0.25] },
      };
      if (cam) {
        out.cam = { angle: -camAngle(u) };
        for (const [t, p] of Object.entries(TAGS)) {
          const w = rot2(p, camAngle(u));
          out[`tag${t}`] = { position: [w[0] + K[0], w[1] + K[1], 0.2] };
        }
      } else {
        const pin = rot2(pivotG, SENSE * s.psi);
        out.wheelF = { angle: SENSE * s.roller };
        out.catch = { position: [pin[0], pin[1], 0.45], angle: SENSE * s.psi - s.lift * LIFT };
      }
      return { parts: out, readouts: [{ label: "凸柱 A", value: s.stage }] };
    },
  };
}
