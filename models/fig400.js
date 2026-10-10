// 第 400 種:四向進料(A. B. Wilson 的專利,用在 Wheeler & Wilson、Sloat 等縫紉機上)。桿 A 是叉形的,第二根桿 B(帶著進料齒)
// 以樞軸接在叉口裡。桿 B 由凸輪 C 上的徑向凸起抬起,同時兩根桿被一起往前帶;彈簧產生回程,桿 B 靠自重落下。
// 進料齒因此走一個四向的循環:上、前、下、後(布每次被往前送一步)。主動件是凸輪 C。
// 推斷:循環的四段各佔凸輪的四分之一圈。
//
// 結構(原圖:A 的右段是叉,B 夾在叉的兩片之間,從叉根的樞軸往右伸過凸輪 C 上方,右端帶進料齒):
// - 凸輪 C 的軸上有兩片輪廓:前面一片在叉的兩片之間頂著 B 的底面,B 繞樞軸升起、落下(B 的轉角由 B 和凸輪相碰算,
//   B 靠自重坐在凸輪上);後面一片頂著 A 往下伸的垂耳,把 A(連同鉸在叉口裡的 B)往前推(原文的「被一起向前帶動」
//   由這一片做,推斷)。A 左端的鉤上掛著彈簧,把 A 往回拉,垂耳一直貼著後面那片。A 只前後走,不升降。
// - 兩片輪廓都由該走的位移反推(平底從動件的包絡線:接觸點 = h·n + h'·n');前面那片的升程照 B 在凸輪上方那一點該升的高度,
//   落下那一段讓 B 加速落下(憑自重),落到基圓時撞停。
// - 補上:托著 A 的導架(吊在台面下,A 在上面前後滑)、彈簧與彈簧柱、凸輪軸的軸承座(推斷,原圖沒畫)。
import { TAU, smooth } from "./kit.js";
import { falling } from "./jumps.js";
import { shape, rect, thickLine, circle } from "./shapes.js";
import { pedestal } from "./supports.js";
import { placeOutline, swingUntilContact } from "./contact.js";

export const LIFT = 0.12; // B 在凸輪上方那一點升起的高度
export const FEED = 0.2; // 進料步幅(原本 0.4:A 往前走 0.4 時左端的鉤撞上導架;原文沒有給步幅)
const B_BOTTOM = -0.06; // 桿 B 放平時底面的高度(B 落在凸輪的基圓上)
export const CAM_BASE = 0.42; // 抬起那片的基圓半徑
const FEED_BASE = 0.55; // 往前推那片的基圓半徑
const CAM = [0.6, B_BOTTOM - CAM_BASE, 0]; // 基圓頂剛好貼著 B 放平時的底面
const PIN_X = -0.5; // B 的樞軸(叉根)在 A 上的位置;B 從這裡往右伸過凸輪上方
const FORK = { from: -0.75, to: 0.9, z: 0.19 }; // 叉的兩片(前後各一片,B 夾在中間)
const FEED_Z = -0.8; // 往前推那片(與 A 的垂耳)那一層
const LUG_X = CAM[0] + FEED_BASE; // 垂耳的接觸面在 A 局部的 x

const phase = (theta) => (((theta / TAU) % 1) + 1) % 1;
/** 凸輪轉 theta → 平底從動件(B 在凸輪正上方那一點)離凸輪中心的高度:上(緩緩頂起)、停、落(加速落下,到基圓撞停)、停 */
export function liftHeight(theta) {
  const f = phase(theta);
  if (f < 0.25) return CAM_BASE + LIFT * smooth(f / 0.25);
  if (f < 0.5) return CAM_BASE + LIFT;
  if (f < 0.75) return CAM_BASE + LIFT * (1 - falling((f - 0.5) / 0.25));
  return CAM_BASE;
}
/** 凸輪轉 theta → A 的垂耳離凸輪中心的距離:停、往前、停、往回(彈簧拉回,垂耳貼著輪廓) */
export function feedReach(theta) {
  const f = phase(theta);
  if (f < 0.25) return FEED_BASE;
  if (f < 0.5) return FEED_BASE + FEED * smooth((f - 0.25) / 0.25);
  if (f < 0.75) return FEED_BASE + FEED;
  return FEED_BASE + FEED * (1 - smooth((f - 0.75) / 0.25));
}

// 桿 B(局部,樞軸為原點):從樞軸往右伸過凸輪上方的長條,右端墊高一段、上面是進料齒
const SPUR_X = 2.05; // 進料齒的起點(B 局部)
const B_BAR = rect(2.85, 0.12, 1.325, 0); // x 從 −0.1 到 2.75,底面在 −0.06
const B_RISER = rect(0.75, 0.1, SPUR_X + 0.325, 0.1); // 進料齒下的墊高段
const B_SPUR = Array.from({ length: 9 }, (_, i) => [SPUR_X + 0.15 + i * 0.08, i % 2 ? 0.27 : 0.15]).concat([[SPUR_X + 0.79, 0.15], [SPUR_X + 0.15, 0.15]]);
const SPUR_TIP = [SPUR_X + 0.47, 0.27]; // 量進料齒升起多少的點(齒列中間的齒尖)
const camAt = (theta) => placeOutline(camOutline(liftHeight, Math.PI / 2), CAM, theta);
const pivotAt = (theta) => [PIN_X + feedReach(theta) - FEED_BASE, 0]; // B 的樞軸(跟著 A 前後走)

/** 凸輪轉 theta → B 繞樞軸的轉角(逆時針為正,放平時 0):B 靠自重往下擺,停在碰到凸輪的地方 */
export function bAngle(theta) {
  return swingUntilContact({ pivot: pivotAt(theta), outline: B_BAR, from: 0.3, into: -1, sweep: 0.4, steps: 80 }, [camAt(theta)]);
}

/** 測試用:凸輪轉 theta 時 B 的長條(再多轉 extra)與凸輪的世界座標外形 */
export function contactAt(theta, extra = 0) {
  return { b: placeOutline(B_BAR, pivotAt(theta), bAngle(theta) + extra), cam: camAt(theta) };
}

/** 凸輪轉 theta → 進料齒的抬起與前進量(四向循環) */
export function fourMotion(theta) {
  const a = bAngle(theta);
  return { lift: SPUR_TIP[0] * Math.sin(a) + SPUR_TIP[1] * (Math.cos(a) - 1), feed: feedReach(theta) - FEED_BASE };
}

/**
 * 平底從動件的凸輪輪廓:從動件的平面朝世界方向 alpha、離凸輪中心 h(θ)。凸輪轉 θ 時,局部方向 β = alpha − θ 上的支撐距離是
 * H(β) = h(alpha − β);輪廓點 = H·e(β) + H′·e′(β)。逆時針排列。
 */
export function camOutline(h, alpha, samples = 360) {
  const d = 1e-4;
  const H = (b) => h(alpha - b);
  return Array.from({ length: samples }, (_, i) => {
    const b = (i / samples) * TAU;
    const [v, dv] = [H(b), (H(b + d) - H(b - d)) / (2 * d)];
    return [v * Math.cos(b) - dv * Math.sin(b), v * Math.sin(b) + dv * Math.cos(b)];
  });
}

export default {
  figure: 400,
  parts: [
    // 台面在進料齒的位置開了口(進料齒與桿 A 的叉口從開口升上來):左半塊台面加開口前後的兩條邊
    {
      id: "bed",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.6, 0.1, 1.0], at: [-1.0, 0.32, -0.1] },
        { kind: "box", size: [2.2, 0.1, 0.3], at: [1.4, 0.32, -0.45] },
        { kind: "box", size: [2.2, 0.1, 0.2], at: [1.4, 0.32, 0.35] },
        // 托著 A 的導架:從台面吊下兩片側板與底檔,A 坐在底檔上前後滑
        { kind: "box", size: [0.2, 0.43, 0.04], at: [-1.0, 0.055, 0.2] },
        { kind: "box", size: [0.2, 0.43, 0.04], at: [-1.0, 0.055, -0.2] },
        { kind: "box", size: [0.2, 0.06, 0.44], at: [-1.0, -0.09, 0] },
        // 彈簧柱
        { kind: "box", size: [0.12, 0.62, 0.2], at: [-2.4, -0.04, 0] },
        // 凸輪軸的軸承座(在兩片輪廓後面)
        ...pedestal({ at: [CAM[0], CAM[1]], z: -1.05, bore: 0.08, floor: -1.6 }),
      ],
    },
    {
      id: "barA",
      kind: "group",
      arrow: false,
      label: "A",
      labelOffset: [-2.0, 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.0, 0], [-1.6, 0], [-1.6, -0.35], [-1.35, -0.35]], 0.12)), thickness: 0.3 },
        { kind: "plate", shape: shape(rect(FORK.from + 1.5, 0.12, (FORK.from - 1.5) / 2, 0)), thickness: 0.3 },
        // 叉:從叉根往右分成前後兩片,B 夾在中間、以銷鉸在叉根;凸輪的前面那片從兩片之間頂到 B
        { kind: "box", size: [FORK.to - FORK.from, 0.12, 0.08], at: [(FORK.from + FORK.to) / 2, 0, FORK.z] },
        { kind: "box", size: [FORK.to - FORK.from, 0.12, 0.08], at: [(FORK.from + FORK.to) / 2, 0, -FORK.z] },
        // 垂耳:從 A 的右端往後、往下伸到後面那片輪廓的右邊,左面被輪廓推著
        { kind: "box", size: [0.5, 0.1, 0.1], at: [LUG_X - 0.15, -0.11, -0.2] },
        { kind: "box", size: [0.1, 0.1, 0.72], at: [LUG_X + 0.05, -0.11, -0.52] },
        { kind: "box", size: [0.1, 1.0, 0.12], at: [LUG_X + 0.05, CAM[1] + 0.06, FEED_Z] },
      ],
    },
    { id: "pinB", kind: "cylinder", radius: 0.05, length: 0.5 },
    {
      id: "barB",
      kind: "group",
      arrow: false,
      label: "B",
      labelOffset: [2.4, -0.25, 0.3],
      pieces: [
        { kind: "plate", shape: shape(B_BAR, [circle(0.05).reverse()]), thickness: 0.2 },
        { kind: "plate", shape: shape(B_RISER), thickness: 0.2 },
        // 進料齒
        { kind: "plate", shape: shape(B_SPUR), thickness: 0.2 },
      ],
    },
    { id: "springA", kind: "spring", coils: 7, radius: 0.07, wire: 0.015 },
    {
      id: "cam",
      kind: "plate",
      center: CAM,
      shape: shape(camOutline(liftHeight, Math.PI / 2), [circle(0.08).reverse()]),
      thickness: 0.25,
      hub: 0.12,
      mark: [0.3, 0],
      markSize: 0.05,
      spin: 0.6,
      label: "C",
      labelOffset: [-0.65, 0, 0.3],
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.3, at: [0, 0, -0.55] }],
    },
    // 往前推的那片輪廓:和 C 裝在同一根軸上(另列一個零件,動力重演時才分得開)
    { id: "feedCam", kind: "plate", center: [CAM[0], CAM[1], FEED_Z], shape: shape(camOutline(feedReach, 0), [circle(0.08).reverse()]), thickness: 0.12, arrow: false },
  ],
  // 動力重演:只推凸輪(A 的前後照模型走);B 鉸在 A 的叉根、靠自重坐在前面那片輪廓上,看它被頂起、落下、停在基圓上
  replay: {
    seconds: 12,
    free: { barB: { pivot: [PIN_X, 0, 0], on: "barA" } },
    ignore: [["barA", "barB"], ["barB", "pinB"]],
    expect: [
      { at: TAU * 0.25, part: "barB", label: "凸輪的徑向凸起把 B 抬起", quote: "桿 B 由凸輪 C 上的徑向凸出部分抬起" },
      { at: TAU * 0.5, part: "barB", label: "B 被抬著,和 A 一起往前" },
      { at: TAU, part: "barB", label: "凸起轉過去,B 憑自重落回", quote: "桿 B 則憑自身重力落下" },
    ],
  },
  driver: { part: "cam", type: "rotation" },
  target: "barB", // 帶著進料齒走四向循環的桿
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const feed = feedReach(theta) - FEED_BASE;
    const pivot = [...pivotAt(theta), 0];
    return {
      parts: {
        cam: { angle: theta },
        feedCam: { angle: theta },
        barA: { position: [feed, 0, 0] },
        barB: { position: pivot, angle: bAngle(theta) },
        pinB: { position: pivot },
        springA: { from: [-2.34, -0.35, 0], to: [-1.66 + feed, -0.35, 0] },
      },
      readouts: [],
    };
  },
};
