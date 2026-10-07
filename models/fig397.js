// 第 397 種:把連續的圓周運動變成間歇的直線往復運動(用在多種縫紉機上推動梭子,也用在三轉式圓筒印刷機上)。
// 一根擺桿的下端以樞軸接在底座上,中段是一道彎曲的長槽,曲柄銷在槽裡走:銷走過槽的彎曲部分時擺桿停住,
// 走過其餘部分時擺桿擺動;擺桿上端經連桿推拉上方的滑桿,滑桿因此一陣一陣地往復。主動件是曲柄。
// 推斷:槽的形狀(曲柄圓的半圈,見下);各桿長依原圖。
// 結構(原圖):擺桿兩端各有圓形的轂,下端的轂以銷接在底座上;上端的轂以銷接連桿;連桿在滑桿下方,
// 另一端以銷接滑桿左端垂下的耳;滑桿從那顆銷往右伸、蓋過擺桿頂端。模型原本連桿只是一條細桿、
// 兩端沒有銷穿過擺桿與滑桿(連桿的 z 層與擺桿不相接),滑桿又往左伸;現在補上轂、貫穿的銷、滑桿的耳、
// 底座的軸承座與曲柄後面的軸承柱,滑桿改成往右伸。連桿長、擺桿長、滑桿的高度都沒動。
// 由接觸算(2026-10-07 複查):擺桿的角度原本照「曲柄轉到哪、擺桿擺到哪」的進度表給,槽只是畫出來的折線,銷會擦到槽壁
// (演出的動作)。現在槽的中心線是曲柄銷的圓在擺桿停頓位置的那半圈(左半圈):銷走過這半圈時,槽與銷的路徑重合,擺桿停住;
// 銷走右半圈時,銷到擺桿樞軸的距離決定它在槽裡的哪一點,擺桿被轉到讓那一點對上銷——擺出去再回來。
// 所以每轉一圈:停半圈、擺出去再擺回來半圈,擺幅 2·asin(曲柄半徑 / 樞軸到曲柄軸的距離),全部由銷在槽裡的位置決定。
// 曲柄軸移到擺桿停住時的中心線上(原本偏右 0.05)。
import { shape, thickLine, circle } from "./shapes.js";

const PIVOT = [0, -2.2, 0]; // 擺桿下端的樞軸
const CRANK = { center: [0, -0.45, 0], r: 0.35 };
const L = CRANK.center[1] - PIVOT[1]; // 樞軸到曲柄軸的距離
const ARM = 3.6; // 擺桿長
export const PIN_R = 0.07; // 曲柄銷半徑
const SLOT_HALF = PIN_R + 0.015; // 槽的半寬(銷與槽壁留一點間隙)
export const SWING = 2 * Math.asin(CRANK.r / L); // 擺幅
const ROD = 1.6;
const BAR_Y = 1.75; // 連桿與滑桿的接點高度(滑桿本體在它上方)
const Z_ROD = 0.2; // 連桿那一層(擺桿板在 z = 0)
const BAR = { length: 3.0, lead: 0.3 }; // 滑桿:從接點往左 lead、往右其餘

/** 槽的中心線在擺桿局部座標(擺桿直立、樞軸在原點)裡的點:曲柄圓的左半圈,t ∈ [π/2, 3π/2] */
export const slotPoint = (t) => [CRANK.r * Math.cos(t), L + CRANK.r * Math.sin(t)];

/** 曲柄轉 theta → 曲柄銷的世界座標 */
export const pinAt = (theta) => [CRANK.center[0] + CRANK.r * Math.cos(theta), CRANK.center[1] + CRANK.r * Math.sin(theta)];

/**
 * 曲柄轉 theta → 擺桿的轉角(逆時針為正)與銷在槽裡的位置 t:
 * 銷到樞軸的距離 d 決定它在槽(左半圈)的哪一點,擺桿轉到讓那一點對上銷。
 */
export function lever(theta) {
  const [px, py] = pinAt(theta);
  const dx = px - PIVOT[0];
  const dy = py - PIVOT[1];
  const d2 = dx * dx + dy * dy;
  const sin = Math.max(-1, Math.min(1, (d2 - L * L - CRANK.r * CRANK.r) / (2 * L * CRANK.r)));
  const t = Math.PI - Math.asin(sin); // 左半圈上離樞軸 d 的那一點
  const [qx, qy] = slotPoint(t);
  const angle = Math.atan2(dy, dx) - Math.atan2(qy, qx);
  return { angle: Math.atan2(Math.sin(angle), Math.cos(angle)), t };
}

/** 擺桿轉角 a(逆時針)→ 上端位置、滑桿的位移 */
export function slide(a) {
  const top = [PIVOT[0] - ARM * Math.sin(a), PIVOT[1] + ARM * Math.cos(a), 0];
  const x = top[0] - Math.sqrt(ROD * ROD - (BAR_Y - top[1]) ** 2);
  return { top, x };
}

// 擺桿:下段直桿從樞軸往上、接到槽的外側(左邊),上段再接回中心線到上端;槽是曲柄圓的左半圈(兩端各多留一點)
const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? [...poly].reverse() : poly;
};
const arc = (from, to, n = 32) => Array.from({ length: n + 1 }, (_, i) => slotPoint(from + ((to - from) * i) / n));
const SLOT_OUTLINE = ccw(thickLine(arc(Math.PI / 2 - 0.45, 1.5 * Math.PI + 0.45), 2 * (SLOT_HALF + 0.12)));
const SLOT_HOLE = ccw(thickLine(arc(Math.PI / 2 - 0.25, 1.5 * Math.PI + 0.25), 2 * SLOT_HALF)).reverse();
export const geometry = { PIVOT, CRANK, L, SLOT_HALF };

export default {
  figure: 397,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 底座(原圖的地面)與擺桿樞軸的軸承座:兩片夾住擺桿下端的轂,銷穿過
        { kind: "box", size: [1.6, 0.15, 0.7], at: [0, -2.45, 0] },
        { kind: "box", size: [0.34, 0.36, 0.1], at: [0, -2.25, 0.13] },
        { kind: "box", size: [0.34, 0.36, 0.1], at: [0, -2.25, -0.13] },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: PIVOT },
        // 曲柄軸的軸承柱(在擺桿後面)
        // 曲柄整個在擺桿的後面:只有曲柄銷往前伸進擺桿的槽(曲柄軸不穿過擺桿擺動的那一層)
        { kind: "box", size: [0.26, 1.95, 0.14], at: [CRANK.center[0], CRANK.center[1] - 0.975, -0.6] },
        { kind: "cylinder", radius: 0.14, length: 0.2, at: [CRANK.center[0], CRANK.center[1], -0.55] },
        // 滑桿的導軌(在滑桿後面)
        { kind: "box", size: [5.4, 0.12, 0.3], at: [-0.2, BAR_Y + 0.3, -0.3] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.2,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [CRANK.r, 0]], 0.22), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, -0.25] },
        { kind: "cylinder", radius: 0.2, length: 0.15, at: [0, 0, -0.38] },
        { kind: "cylinder", radius: PIN_R, length: 0.4, at: [CRANK.r, 0, -0.05], accent: true },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 擺桿:下段、槽(曲柄圓的左半圈)、上段;兩端各一個圓轂,上端的銷穿到連桿那一層
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.2, 0.8], [-0.5, L - 0.25]], 0.14)), thickness: 0.1 },
        { kind: "plate", shape: shape(SLOT_OUTLINE, [SLOT_HOLE]), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine([[-0.5, L + 0.25], [-0.2, L + CRANK.r + 0.6], [0, ARM]], 0.14)), thickness: 0.1 },
        { kind: "cylinder", radius: 0.15, length: 0.1 },
        { kind: "cylinder", radius: 0.15, length: 0.1, at: [0, ARM, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, ARM, 0.15] },
      ],
    },
    { id: "rod", kind: "link", width: 0.12, thickness: 0.06 },
    {
      // 滑桿:位置是連桿接點;左端垂下的耳接連桿,本體在接點上方、往右伸
      id: "bar",
      kind: "group",
      pieces: [
        { kind: "box", size: [BAR.length, 0.14, 0.5], at: [BAR.length / 2 - BAR.lead, 0.3, 0.11] },
        { kind: "box", size: [0.2, 0.3, 0.1], at: [0, 0.15, Z_ROD + 0.11] },
        { kind: "cylinder", radius: 0.13, length: 0.1, at: [0, 0, Z_ROD + 0.11] },
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, Z_ROD - 0.05] },
      ],
    },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "bar",
  view: { direction: [0.08, 0.08, 1] },
  pose(theta) {
    const a = lever(theta).angle;
    const s = slide(a);
    return {
      parts: {
        crank: { angle: theta },
        lever: { angle: a },
        rod: { from: [s.top[0], s.top[1], Z_ROD], to: [s.x, BAR_Y, Z_ROD] },
        bar: { position: [s.x, BAR_Y, 0] },
      },
      readouts: [],
    };
  },
};
