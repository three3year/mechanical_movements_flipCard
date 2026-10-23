// 第 397 種:把連續的圓周運動變成間歇的直線往復運動(用在多種縫紉機上推動梭子,也用在三轉式圓筒印刷機上)。
// 一根擺桿的下端以樞軸接在底座上,中段是一道彎曲的長槽,曲柄銷在槽裡走:銷走過槽的彎曲部分時擺桿停住,
// 走過其餘部分時擺桿擺動;擺桿上端經連桿推拉上方的滑桿,滑桿因此一陣一陣地往復。主動件是曲柄。
// 結構(原圖):擺桿兩端各有圓形的轂,下端的轂以銷接在底座上;上端的轂以銷接連桿;連桿在滑桿下方,
// 另一端以銷接滑桿左端垂下的耳;滑桿從那顆銷往右伸、蓋過擺桿頂端。曲柄整個在擺桿後面,只有銷伸進槽。
// 由接觸算(2026-10-07 複查):擺桿的角度由銷在槽裡的位置決定——銷到擺桿樞軸的距離 d 決定它在槽的哪一點
// (槽上各點離樞軸的距離沿槽單調變化),擺桿轉到讓那一點對上銷。
//
// 2026-10-20(model-audit-fixes-3 #397-1、#397-2):照 525 px 原圖的比例重排。
// - 量原圖(px,擺桿長 305):曲柄軸在擺桿停住時的中心線右邊 55、樞軸上方 168,曲柄半徑 94(約擺桿長的 0.31);
//   停住時槽的中心線就是曲柄銷的圓,槽的兩端在曲柄圓上約 127° 與 242°。原本曲柄只有原圖約三分之一大、
//   曲柄軸移到中心線上,槽成了正好半圈。
// - 槽 = 曲柄銷圓上從 127° 到 β + 180°(β 是樞軸到曲柄軸的方向,銷離樞軸最近的那一點)的一段,加上從上端沿切線
//   往右上延長到離樞軸 L + r(銷離樞軸最遠)的一段。偏離插圖:原圖槽的上端停在 127°,但銷轉到離樞軸最遠時
//   (L + r)槽上沒有那麼遠的點、銷會卡住,所以上端沿切線延長約 0.5(原圖擺桿頸部往右鼓起的地方);
//   下端多伸 10°(到銷離樞軸最近的那一點)。停住的那一段就是和曲柄圓同心的 125°,每圈停約三分之一圈。
// - 擺幅照這個配置是 2·asin(r / L) ≈ 64°,擺桿上端往下掉約 2;連桿從原圖的 2.0 加長到 2.4 才搆得到(偏離插圖),
//   滑桿行程約 4.4,滑桿跟著加長。
// - 機架(推斷):底座往後加深,曲柄軸的軸承座站在上面;滑桿穿過兩個方形導套,導套由立柱撐在底座上。
import { shape, thickLine, circle, roundEnd } from "./shapes.js";
import { pedestal, squareGuide } from "./supports.js";

const PX = 3.6 / 305; // 原圖 1 px
const PIVOT = [0, -2.2, 0]; // 擺桿下端的樞軸
const ARM = 305 * PX; // 擺桿長
const CRANK = { center: [PIVOT[0] + 55 * PX, PIVOT[1] + 168 * PX, 0], r: 94 * PX };
const O = [CRANK.center[0] - PIVOT[0], CRANK.center[1] - PIVOT[1]]; // 曲柄軸(擺桿局部座標:擺桿停住、樞軸在原點)
const L = Math.hypot(...O); // 樞軸到曲柄軸的距離
const BETA = Math.atan2(O[1], O[0]); // 樞軸到曲柄軸的方向
export const PIN_R = 0.07; // 曲柄銷半徑
const SLOT_HALF = PIN_R + 0.015; // 槽的半寬(銷與槽壁留一點間隙)
export const SWING = 2 * Math.asin(CRANK.r / L); // 擺幅
const ROD = 2.4; // 連桿長
const BAR_Y = PIVOT[1] + ARM; // 連桿與滑桿的接點高度(停住時連桿水平,照原圖)
const Z_ROD = 0.2; // 連桿那一層(擺桿板在 z = 0)

// 槽:曲柄圓上的一段(停住的那一段),上端沿切線延長到離樞軸 L + r
const PHI_TOP = (127 * Math.PI) / 180;
const PHI_LOW = BETA + Math.PI;
const onArc = (phi) => [O[0] + CRANK.r * Math.cos(phi), O[1] + CRANK.r * Math.sin(phi)];
const A = onArc(PHI_TOP);
const T = [Math.sin(PHI_TOP), -Math.cos(PHI_TOP)]; // 從上端往外的切線方向
const EXT = (() => {
  const b = A[0] * T[0] + A[1] * T[1];
  const c = A[0] ** 2 + A[1] ** 2 - (L + CRANK.r) ** 2;
  return -b + Math.sqrt(b * b - c);
})();
const E = [A[0] + EXT * T[0], A[1] + EXT * T[1]];

/** 槽的中心線(擺桿局部座標),從延長段的頂端 E 經上端 A、沿曲柄圓到下端;n 是圓弧上的段數 */
const slotLine = (n) => [E, ...Array.from({ length: n + 1 }, (_, i) => onArc(PHI_TOP + ((PHI_LOW - PHI_TOP) * i) / n))];
export const SLOT = slotLine(240);

/** 槽上離樞軸 d 的那一點(槽上各點離樞軸的距離沿槽單調變化) */
function slotAt(d) {
  const dTop = Math.hypot(...A);
  if (d <= dTop) {
    const c = Math.max(-1, Math.min(1, (d * d - L * L - CRANK.r * CRANK.r) / (2 * L * CRANK.r)));
    return onArc(BETA + Math.acos(c)); // 圓弧上 φ − β ∈ [55°, 180°]
  }
  const b = A[0] * T[0] + A[1] * T[1];
  const l = -b + Math.sqrt(Math.max(0, b * b - (dTop * dTop - d * d)));
  return [A[0] + l * T[0], A[1] + l * T[1]];
}

/** 曲柄轉 theta → 曲柄銷的世界座標 */
export const pinAt = (theta) => [CRANK.center[0] + CRANK.r * Math.cos(theta), CRANK.center[1] + CRANK.r * Math.sin(theta)];

/** 曲柄轉 theta → 擺桿的轉角(逆時針為正):擺桿轉到讓槽上離樞軸同樣遠的那一點對上銷 */
export function lever(theta) {
  const [px, py] = pinAt(theta);
  const dx = px - PIVOT[0];
  const dy = py - PIVOT[1];
  const q = slotAt(Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) - Math.atan2(q[1], q[0]);
  return { angle: Math.atan2(Math.sin(angle), Math.cos(angle)), slot: q };
}

/** 擺桿轉角 a(逆時針)→ 上端位置、滑桿的位移 */
export function slide(a) {
  const top = [PIVOT[0] - ARM * Math.sin(a), PIVOT[1] + ARM * Math.cos(a), 0];
  const x = top[0] - Math.sqrt(ROD * ROD - (BAR_Y - top[1]) ** 2);
  return { top, x };
}

// 滑桿的行程、長度與導套的位置:導套在滑桿左端的耳走不到的右邊,滑桿全程蓋住兩個導套
const XS = Array.from({ length: 721 }, (_, i) => slide(lever((2 * Math.PI * i) / 720).angle).x);
const [X_MIN, X_MAX] = [Math.min(...XS), Math.max(...XS)];
const GUIDE_LEN = 0.3;
const GUIDES = [X_MAX + 0.4, X_MAX + 1.2];
const BAR = { lead: 0.3 }; // 滑桿從接點往左伸 lead
BAR.length = GUIDES[1] + GUIDE_LEN / 2 + 0.15 - (X_MIN - BAR.lead);
const BODY = { y: 0.3, h: 0.14, z: 0.11, depth: 0.5 }; // 滑桿本體(相對接點)
const FLOOR = PIVOT[1] - 0.3; // 底座頂面(擺桿擺到最右時下段離它最近)

const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? [...poly].reverse() : poly;
};
// 槽兩端沿切線多伸一點(槽孔多 PIN_R、外框再多 0.12),孔的兩端才容得下銷
const extend = (pts, a, b) => {
  const dir = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
  const [s, s1] = [pts[0], pts[1]];
  const [e, e1] = [pts[pts.length - 1], pts[pts.length - 2]];
  const ds = dir(s1, s);
  const de = dir(e1, e);
  return [[s[0] + a * ds[0], s[1] + a * ds[1]], ...pts, [e[0] + b * de[0], e[1] + b * de[1]]];
};
const LINE = slotLine(32);
const SLOT_OUTLINE = ccw(thickLine(extend(LINE, PIN_R + 0.14, PIN_R + 0.14), 2 * (SLOT_HALF + 0.12)));
const SLOT_HOLE = ccw(thickLine(extend(LINE, PIN_R + 0.02, PIN_R + 0.02), 2 * SLOT_HALF)).reverse();
// 上下兩段擺桿身從槽外框的兩端伸出:先沿槽端的法線繞開槽孔,再接到兩端的轂
const LOW_END = onArc(PHI_LOW);
const T_LOW = [-Math.sin(PHI_LOW), Math.cos(PHI_LOW)]; // 下端往外的切線方向
const away = (p, t, along, side) => [p[0] + along * t[0] - side * t[1], p[1] + along * t[1] + side * t[0]];
const LOWER = [[0, 0], [0.16, 0.3], away(LOW_END, T_LOW, 0.2, -0.3), away(LOW_END, T_LOW, 0.2, 0)];
const UPPER = [away(E, T, 0.2, 0), away(E, T, 0.2, 0.3), [0, ARM]];
export const geometry = { PIVOT, CRANK, L, ARM, ROD, SLOT_HALF };

export default {
  figure: 397,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 底座(原圖的地面,往後加深、往右伸到導套的立柱)與擺桿樞軸的軸承座:兩片夾住擺桿下端的轂,銷穿過
        { kind: "box", size: [GUIDES[1] + 0.6 + 1.2, 0.2, 1.1], at: [(GUIDES[1] + 0.6 - 1.2) / 2, FLOOR - 0.1, -0.2] },
        { kind: "box", size: [0.34, 0.5, 0.1], at: [0, PIVOT[1] - 0.12, 0.13] },
        { kind: "box", size: [0.34, 0.5, 0.1], at: [0, PIVOT[1] - 0.12, -0.13] },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: PIVOT },
        // 曲柄軸的軸承座(推斷,在擺桿與曲柄後面,站在底座上)
        ...pedestal({ at: CRANK.center, z: -0.6, bore: 0.08, floor: FLOOR }),
        // 滑桿的兩個方形導套與撐著它們的立柱(推斷;立柱在導套後面,站在底座上)
        ...GUIDES.flatMap((g) => [
          ...squareGuide({ at: [g, BAR_Y + BODY.y, BODY.z], width: BODY.h, thickness: BODY.depth, length: GUIDE_LEN }).map((q) => ({ ...q, role: "guide" })),
          { kind: "box", size: [0.2, BAR_Y + BODY.y - BODY.h / 2 - 0.08 - FLOOR, 0.16], at: [g, (BAR_Y + BODY.y - BODY.h / 2 - 0.08 + FLOOR) / 2, -0.22] },
        ]),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.2,
      pieces: [
        // 曲柄整個在擺桿的後面:只有曲柄銷往前伸進擺桿的槽;軸往後穿過軸承座。曲柄臂的軸孔開在端頭,
        // 端頭畫成半寬 0.11 的圓頭把軸孔包住(落在同一層半徑 0.3 的圓盤裡,外觀不變)
        { kind: "plate", shape: shape(roundEnd(thickLine([[0, 0], [CRANK.r, 0]], 0.22), [0, 0], 0.11), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, -0.16] },
        { kind: "cylinder", radius: 0.3, length: 0.1, at: [0, 0, -0.16] },
        { kind: "cylinder", radius: 0.08, length: 0.69, at: [0, 0, -0.455] },
        { kind: "cylinder", radius: PIN_R, length: 0.3, at: [CRANK.r, 0, -0.06], accent: true },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 擺桿:下段、槽、上段;兩端各一個圓轂,上端的銷穿到連桿那一層
        { kind: "plate", shape: shape(ccw(thickLine(LOWER, 0.2))), thickness: 0.1 },
        { kind: "plate", shape: shape(SLOT_OUTLINE, [SLOT_HOLE]), thickness: 0.1 },
        { kind: "plate", shape: shape(ccw(thickLine(UPPER, 0.2))), thickness: 0.1 },
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
        { kind: "box", size: [BAR.length, BODY.h, BODY.depth], at: [BAR.length / 2 - BAR.lead, BODY.y, BODY.z] },
        { kind: "box", size: [0.2, 0.3, 0.1], at: [0, 0.15, Z_ROD + 0.11] },
        { kind: "cylinder", radius: 0.13, length: 0.1, at: [0, 0, Z_ROD + 0.11] },
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, Z_ROD - 0.05] },
      ],
    },
  ],
  driver: { part: "crank", type: "rotation", initial: (148 * Math.PI) / 180 }, // 一開始照原圖:擺桿停住,銷在槽的上段
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
