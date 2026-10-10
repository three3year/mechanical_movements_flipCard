// 第 217、218 種:毛紡梳理機中驅動滾軸的裝置(同一裝置的兩個部件)。純函式與共用的模型定義。
// 第 217 種:輪面上開槽的心形凸輪 C、D、B、e,凸柱 A 在溝槽內;第 218 種:A 裝在一支以滾軸的軸 H 為樞軸的槓桿下端,
// 槓桿上端掛著卡榫 G,G 的爪落在凹槽輪 F 的凹槽裡。凸輪轉動:A 從 C 到 D 時槓桿把 F(與滾軸)往後轉,
// 從 D 到 e 時往前轉(後退一份、前進兩份——原文的三分之一與三分之二);A 到 e 時凸輪輪背的凸出部分撞擊 G 上的凸出片、
// 把 G 抬出凹槽,A 從 e 回到 C 的期間 G 靠自重壓在 F 兩凹槽之間的光面上滑過,F 不動;A 回到 C 時 G 已落進下一個凹槽。
// 推斷:F 有 8 個凹槽,每循環前進一格(45°),所以後退 45°、前進 90°(維護者決定維持這個 1:2 的比例讀法);
// 溝槽的形狀是由這個動作反推出來的(凸柱在世界中的位置轉到凸輪的局部座標);凸輪順時針轉(第 217 種的箭頭);
// 凸輪中心在 A 的右上方。
import { TAU, deg, smooth, rot2, polar, add, signedAngle } from "./kit.js";
import { shape, circle, thickLine, offsetLoop, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";
import { pointInPolygon, edgeDistance, fallingRest } from "./contact.js";

export const H = [0, 0, 0];
const L = 2.1; // H 到 A
const NOTCHES = 8;
export const STEP = TAU / NOTCHES;
// 凸輪中心:在 A(原位)的右上方,讓溝槽上的 C 落在凸輪的左下方(與原圖相同);A 往前(往左)時離凸輪中心較遠
const K = [2.4 * Math.cos(deg(35)), -L + 2.4 * Math.sin(deg(35)), 0];
const RF = 1.55; // F 的半徑
const RH = 0.2; // 滾軸的軸 H 的半徑
const UPPER = { length: 1.75, angle: deg(70) }; // 槓桿上端(掛 G 的銷),相對 H
const CATCH = { angle: deg(122) }; // G 的爪在 F 圓周上的方向(槓桿在原位時)
// 一個循環(凸輪一圈)的時間分配;release(凸出部分放開 G)在下面由 F 的凹槽與 G 的銷算出。
// G 被抬起的那一段(forward 到 lift 抬起、撐到 release)是照時間排的,不是由凸出部分碰凸出片的接觸算出:
// 第 217 種只畫凸輪(沒有 G)、第 218 種只畫 G(沒有凸輪),原圖沒畫出凸輪背面的凸出部分和 G 的凸出片的相對位置
// (照兩張圖共用的座標,凸出部分在凸輪盤背面、A 到 e 時位於 A 那條徑向線上,離 G 的凸出片很遠,深度也不同),
// 所以兩者的接觸無從算起。由接觸算的是:G 抬起的高度(爪尖的銷離開 F 的外緣 0.05,LIFT)、撐到什麼時候
// (銷越過凹槽邊緣、落下會壓在光面上,PHASE.release)、以及其餘時間 G 靠自重落在 F 上的位置(restOnF)。
export const PHASE = { back: 0.15, forward: 0.62, lift: 0.67, release: 0, ret: 0.95 };

/**
 * 凸輪轉了 u 圈(可大於 1):槓桿轉角 ψ、F 的轉角、凸輪背面的凸出部分把 G 抬到幾成(hold,0 = 沒在撐 G;
 * 照時間排,見上面 PHASE 的說明),與 A 在溝槽的哪一段
 */
export function woolComb(u) {
  const k = Math.floor(u);
  const f = u - k;
  let psi;
  let hold = 0;
  let stage;
  if (f < PHASE.back) {
    psi = -STEP * smooth(f / PHASE.back);
    stage = "C→D";
  } else if (f < PHASE.forward) {
    psi = -STEP + 2 * STEP * smooth((f - PHASE.back) / (PHASE.forward - PHASE.back));
    stage = "D→e";
  } else if (f < PHASE.lift) {
    psi = STEP;
    hold = smooth((f - PHASE.forward) / (PHASE.lift - PHASE.forward));
    stage = "e(抬起 G)";
  } else if (f < PHASE.ret) {
    psi = STEP - STEP * smooth((f - PHASE.lift) / (PHASE.ret - PHASE.lift));
    if (f < PHASE.release) hold = 1;
    stage = "e→C";
  } else {
    psi = 0;
    stage = "C(G 已落入下一個凹槽)";
  }
  const engaged = f < PHASE.forward;
  const roller = k * STEP + (engaged ? psi : STEP);
  return { psi, roller, hold, stage, engaged };
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

// 凹槽輪 F:圓周上 8 個方形凹槽。推斷:槽口比槽底寬一點——G 繞自己的樞軸擺,爪尖的銷沿弧線斜著進出凹槽,
// 槽底只比銷寬一點(推、拉 F 時幾乎沒有空隙),槽口張開到銷斜著進出都碰不到槽邊
const NOTCH = { depth: 0.2, bottom: 0.09, mouth: 0.15 }; // 槽深、槽底與槽口的半寬
const fOutline = (() => {
  const pts = [];
  const top = NOTCH.mouth / RF;
  const bottom = NOTCH.bottom / (RF - NOTCH.depth);
  for (let i = 0; i < NOTCHES; i++) {
    const a = CATCH.angle + i * STEP;
    pts.push(...arcPoints(RF, a + top, a + STEP - top));
    const b = a + STEP;
    const r = RF - NOTCH.depth;
    pts.push(polar(RF, b - top).slice(0, 2), polar(r, b - bottom).slice(0, 2), polar(r, b + bottom).slice(0, 2), polar(RF, b + top).slice(0, 2));
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
// G 臂上方的小圓凸出片(原圖標 G 處):凸輪背面的凸出部分撞的就是它
const KNOB = (() => {
  const p = polar(1.92, deg(90));
  return [p[0] - pivotG[0], p[1] - pivotG[1]];
})();
// 槓桿:兩段臂接在 H 處的軸眼上(原圖的軸眼明顯大於 H;鬆套在 H 上,不跟著 H 轉),上端有掛 G 的銷
const EYE = 0.4;
const LEVER = { thickness: 0.12, width: 0.26 };
const leverPieces = [
  { kind: "plate", shape: shape(thickLine([polar(L, -Math.PI / 2 - 0.03).slice(0, 2), [0.12, -0.9], [0.02, -0.3]], LEVER.width)), thickness: LEVER.thickness },
  { kind: "plate", shape: shape(thickLine([[0.1, 0.28], [0.32, 0.9], pivotG], LEVER.width)), thickness: LEVER.thickness },
  { kind: "cylinder", radius: EYE, inner: RH, length: LEVER.thickness },
  { kind: "cylinder", radius: 0.08, length: 0.36, at: [pivotG[0], pivotG[1], 0.12] }, // 掛 G 的銷,往前穿過 G 的軸眼
];

// ── 第 218 種:G 靠自重壓在 F 上(由接觸算) ─────────────────
// G 繞槓桿上端的銷轉;往逆時針轉是爪往下落向 F(自重),往順時針是被抬起。只有爪尖往後伸的銷和 F 在同一層。
const R_PIN = 0.08;
const PIN = [tipG[0] - pivotG[0], tipG[1] - pivotG[1]];
/** G 相對槓桿轉了 rel 時,爪尖銷的中心(世界) */
function pinCenter(psi, rel) {
  const pv = rot2(pivotG, SENSE * psi);
  const p = rot2(PIN, SENSE * psi + rel);
  return [H[0] + pv[0] + p[0], H[1] + pv[1] + p[1]];
}
// 銷(F 的局部座標)碰不碰得到 F:不在 F 的輪廓裡,而且離輪廓的邊至少一個銷的半徑。只量銷附近的邊(省時間)
const F_EDGES = fOutline.map((p, i) => {
  const q = fOutline[(i + 1) % fOutline.length];
  return { poly: [p, q], at: Math.atan2(p[1] + q[1], p[0] + q[0]) };
});
function clearOfF(c) {
  const r = Math.hypot(c[0], c[1]);
  if (r < RF - NOTCH.depth || (r < RF + 0.01 && pointInPolygon(c, fOutline))) return false;
  if (r > RF + R_PIN + 0.01) return true;
  const a = Math.atan2(c[1], c[0]);
  return F_EDGES.every((e) => Math.abs(signedAngle(e.at - a)) > 0.3 || edgeDistance(c, e.poly) >= R_PIN);
}
const TOP = -0.4; // 掃描的起點:爪抬得夠高,不論 F 轉到哪裡都碰不到
/** 槓桿比 F 多轉 d 時,G 從高處落下、第一次碰到 F 的相對轉角(凹槽底、凹槽邊或光面) */
function restExact(d) {
  const clear = (rel) => clearOfF(pinCenter(d, rel));
  const steps = 16;
  const end = 0.1;
  let prev = TOP;
  for (let i = 1; i <= steps; i++) {
    const rel = TOP + ((end - TOP) * i) / steps;
    if (!clear(rel)) {
      let [lo, hi] = [prev, rel];
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (clear(mid)) lo = mid;
        else hi = mid;
      }
      return lo;
    }
    prev = rel;
  }
  return end;
}
// 銷和 F 的相對位置只看槓桿比 F 多轉了多少,F 的凹槽又每 STEP 重複一次:用到的格點才算、記下來,格點之間內插
const REST_N = 720;
const restGrid = new Map();
function restOnF(psi, roller) {
  const x = ((((psi - roller) % STEP) + STEP) % STEP) * (REST_N / STEP);
  const i = Math.floor(x);
  const at = (j) => {
    if (!restGrid.has(j)) restGrid.set(j, restExact((j * STEP) / REST_N));
    return restGrid.get(j);
  };
  return at(i) + (at(i + 1) - at(i)) * (x - i);
}
const pinRadius = (psi, rel) => Math.hypot(...pinCenter(psi, rel));
// 凸出部分把 G 抬到的高度:A 在 e 時,銷的下緣離開 F 的外緣 0.05
const LIFT = (() => {
  let [lo, hi] = [TOP, 0];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (pinRadius(STEP, mid) - R_PIN > RF + 0.05) lo = mid;
    else hi = mid;
  }
  return lo;
})();
// 凸出部分撐住 G 到什麼時候:槓桿往回擺,銷離開剛才那個凹槽的邊、落下來會壓在光面上,再留一點餘裕。
// 凸出部分在第 217 種凸輪盤背面的弧長就照這段時間做
PHASE.release = (() => {
  for (let f = PHASE.lift; f < PHASE.ret; f += 0.0005) {
    const s = woolComb(f);
    if (pinRadius(s.psi, restOnF(s.psi, s.roller)) > RF + R_PIN - 0.002) return f + 0.01;
  }
  return PHASE.ret;
})();
const held = (s) => (s.hold > 0 ? s.hold * LIFT : Infinity);
const restAt = (u) => {
  const s = woolComb(u);
  return Math.min(restOnF(s.psi, s.roller), held(s));
};
const FALL = { into: 1, accel: 450, window: 0.04 };
/** 凸輪轉了 u 圈時 G 相對槓桿的轉角與狀態:被凸出部分撐著、落下中、壓在光面上或落在凹槽裡 */
function catchAt(u) {
  const s = woolComb(u);
  const rel = fallingRest(restAt, u, FALL);
  const rest = restOnF(s.psi, s.roller);
  let state;
  if (s.hold > 0 && rel <= held(s) + 1e-9) state = "被凸輪背面的凸出部分抬起(凸輪見第 217 種)";
  else if (rel < rest - 1e-4) state = "靠自重落下";
  else if (pinRadius(s.psi, rel) < RF) state = "落在 F 的凹槽裡";
  else state = "靠自重壓在 F 的光面上滑過";
  return { rel, state };
}

// ── 第 217 種:凸輪盤背面抬起 G 的凸出部分 ─────────────────
// 原文「位於承載凸輪之輪的背面的一個凸出部分」。推斷:做成盤背面外圈附近的一段弧形凸塊,前緣和 e 點在同一條徑向線上
// (A 到 e 時轉到撞擊處——A 所在的徑向線上、靠外圈),往後延伸的弧長是凸輪從 A 到 e 轉到 release 的角度,
// 撐住 G 直到爪尖越過凹槽邊緣(第 218 種)。第 217 種沒畫 G,凸塊只隨凸輪轉;兩張圖是同一裝置的兩個部件,
// 原圖沒畫出兩者的相對位置,撞擊處和第 218 種 G 的凸出片之間的實際連接不在模型裡。
const BUMP = (() => {
  const a0 = Math.atan2(TAGS.e[1], TAGS.e[0]);
  const a1 = a0 + TAU * (PHASE.release - PHASE.forward);
  const [r0, r1] = [CAM_R - 0.45, CAM_R - 0.15];
  return shape(mirror([...arcPoints(r0, a0, a1), ...arcPoints(r1, a1, a0)]));
})();

/** fig 217(凸輪)或 218(凹槽輪 F 與卡榫 G)的模型 */
export function woolCombModel(figure) {
  const cam = figure === 217;
  const parts = [
    { id: "lever", kind: "group", pieces: leverPieces, arrow: false, center: [0, 0, 0.3] },
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
        // 局部 +z 在世界中朝後:外圈與內島在盤的前半(局部 −0.1..0.1),溝槽只開到這裡;溝底是盤背面一整片(0.1..0.18),
        // 接住外圈與內島;凸出部分在溝底的背面
        pieces: [
          { kind: "plate", shape: shape(circle(CAM_R), [mirror(offsetLoop(ccw, 0.16)).reverse()]), thickness: 0.2, mark: [0, CAM_R - 0.25], markSize: 0.09 },
          { kind: "plate", shape: shape(mirror(offsetLoop(ccw, -0.16)), [circle(0.32).reverse()]), thickness: 0.2 },
          { kind: "plate", shape: shape(circle(CAM_R), [circle(0.32).reverse()]), thickness: 0.08, at: [0, 0, 0.14] }, // 溝底
          { kind: "cylinder", radius: 0.55, inner: 0.32, length: 0.3 },
          { kind: "plate", shape: BUMP, thickness: 0.15, at: [0, 0, 0.255] }, // 抬起 G 的凸出部分
        ],
      },
      ...Object.keys(TAGS).map((t) => ({ id: `tag${t}`, kind: "group", pieces: [], arrow: false, label: t })),
      {
        id: "frame",
        kind: "group",
        // 推斷(原圖只畫出軸頭):凸輪的軸頭從軸承座往前伸進輪轂;槓桿的樞軸 H 在凸輪前面(凸輪盤蓋住 H 的後方),
        // 由一支從凸輪左外側立起的支架從前面托著。H 是滾軸的軸(第 218 種),這張圖沒畫 F,畫成固定的軸頭
        pieces: [
          { kind: "cylinder", radius: 0.32, length: 0.95, at: [K[0], K[1], -0.375] },
          ...pedestal({ at: K, z: -0.85, bore: 0.32, floor: FLOOR, depth: 0.2 }),
          { kind: "cylinder", radius: RH, length: 0.5, at: [H[0], H[1], 0.45] },
          { kind: "cylinder", radius: RH + 0.14, inner: RH, length: 0.2, at: [H[0], H[1], 0.65] },
          { kind: "box", size: [H[0] - POST_X - RH - 0.12, 0.24, 0.2], at: [(H[0] - RH - 0.12 + POST_X) / 2, H[1], 0.65] },
          { kind: "box", size: [0.26, H[1] + 0.12 - FLOOR, 0.2], at: [POST_X, (H[1] + 0.12 + FLOOR) / 2, 0.65] },
          { kind: "box", size: [1.0, 0.18, 0.6], at: [POST_X, FLOOR - 0.09, 0.65] },
        ],
      },
    );
  } else {
    parts.unshift(
      { id: "wheelF", kind: "plate", shape: shape(fOutline, [circle(RH).reverse()]), thickness: 0.18, hub: 0.32, spin: RF, label: "F", labelOffset: [0.7, -0.3, 0.3] },
      // 滾軸的軸 H:F 裝在它上面、一起轉;往後伸進軸承座(推斷,原圖只畫出軸頭)。轉向看 F 的箭頭,H 上的記號跟著轉
      { id: "shaftH", kind: "cylinder", radius: RH, length: 1.45, center: [H[0], H[1], -0.225], mark: true, label: "H", labelOffset: [0, 0.35, 0.55] },
      { id: "frame", kind: "group", pieces: pedestal({ at: H, z: -0.85, bore: RH, floor: -2.6, depth: 0.2 }) },
      {
        id: "catch",
        kind: "group",
        arrow: false,
        label: "G",
        labelOffset: [-0.6, 0.35, 0],
        pieces: [
          { kind: "plate", shape: G_SHAPE, thickness: 0.12 },
          { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.25 },
          { kind: "cylinder", radius: 0.08, length: 0.5, at: [PIN[0], PIN[1], -0.27] }, // 爪尖的銷往後伸進 F 的凹槽(G 在槓桿前面,F 在後面)
          { kind: "cylinder", radius: 0.1, length: 0.12, at: [KNOB[0], KNOB[1], 0] }, // 凸出片
        ],
      },
    );
  }
  return {
    figure,
    parts,
    driver: cam
      ? { part: "cam", type: "rotation", speed: 0.8 }
      : { type: "virtual", label: "凸輪轉了", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
    // 第 218 種沒畫凸輪:槓桿直接受(沒畫出來的)凸輪推動,G 在 A 到 e 時被凸輪背面的凸出部分撞起(其餘時間靠自重)
    ...(cam ? {} : { powered: ["lever", "catch"] }),
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
      const readouts = [{ label: "凸柱 A", value: s.stage }];
      if (cam) {
        out.cam = { angle: -camAngle(u) };
        for (const [t, p] of Object.entries(TAGS)) {
          const w = rot2(p, camAngle(u));
          out[`tag${t}`] = { position: [w[0] + K[0], w[1] + K[1], 0.2] };
        }
      } else {
        const pin = rot2(pivotG, SENSE * s.psi);
        const g = catchAt(u);
        out.wheelF = { angle: SENSE * s.roller };
        out.shaftH = { angle: SENSE * s.roller };
        out.catch = { position: [pin[0], pin[1], 0.45], angle: SENSE * s.psi + g.rel };
        readouts.push({ label: "卡榫 G", value: g.state });
      }
      return { parts: out, readouts };
    },
  };
}
