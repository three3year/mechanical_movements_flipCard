// 第 400 種:四向進料(A. B. Wilson 的專利,用在 Wheeler & Wilson、Sloat 等縫紉機上)。桿 A 是叉形的,第二根桿 B(帶著進料齒)
// 以樞軸接在叉口裡。凸輪 C 上的徑向凸起把桿 A 抬起,同時兩根桿被一起往前帶;彈簧產生回程,桿 B 靠自重落下。
// 進料齒因此走一個四向的循環:上、前、下、後(布每次被往前送一步)。主動件是凸輪 C。
// 推斷:循環的四段各佔凸輪的四分之一圈。
//
// 由接觸算(2026-10-07 複查):原本只有「抬起」是凸輪頂出來的,「往前」照進度表平移、彈簧沒畫,B 另外照進度表升降。現在:
// - 凸輪 C 的軸上有兩片輪廓:前面一片頂著 A 的底面(平底從動件),A 靠自重坐在上面;後面一片頂著 A 往下伸的垂耳,
//   把 A 往前推(原文的「被一起向前帶動」由這一片做,推斷)。A 左端的鉤上掛著彈簧,把 A 往回拉,垂耳一直貼著後面那片。
// - 兩片輪廓都由 A 該走的位移反推(平底從動件的包絡線:接觸點 = h·n + h'·n'),所以 A 的位置就是它和凸輪相碰的地方。
// - 落下那一段的輪廓讓 A 加速落下(憑自重),落到基圓時撞停;B 鉸在 A 的叉口裡、坐在 A 的右端上,跟著 A 升、前、落、後。
// - 補上:托著 A 的導架(吊在台面下,讓 A 能升降、前後走)、彈簧與彈簧柱、凸輪軸的軸承座(推斷,原圖沒畫)。
import { TAU, smooth } from "./kit.js";
import { falling } from "./jumps.js";
import { shape, rect, thickLine, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

export const LIFT = 0.18;
export const FEED = 0.2;
const A_BOTTOM = -0.06; // 桿 A 底面(相對桿 A 的位置)
export const CAM_BASE = 0.42; // 抬起那片的基圓半徑
const FEED_BASE = 0.55; // 往前推那片的基圓半徑
const CAM = [0.6, A_BOTTOM - CAM_BASE, 0]; // 基圓頂剛好貼著 A 在最低位置時的底面
const FORK_X = 0.85; // 叉口(B 的銷)在 A 上的位置
const FEED_Z = -0.8; // 往前推那片(與 A 的垂耳)那一層
const LUG_X = CAM[0] + FEED_BASE; // 垂耳的接觸面在 A 局部的 x

const phase = (theta) => (((theta / TAU) % 1) + 1) % 1;
/** 凸輪轉 theta → A 的底面離凸輪中心的高度:上(緩緩頂起)、停、落(加速落下,到基圓撞停)、停 */
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

/** 凸輪轉 theta → 進料齒的抬起與前進量(四向循環) */
export const fourMotion = (theta) => ({ lift: liftHeight(theta) - CAM_BASE, feed: feedReach(theta) - FEED_BASE });

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
        // 托著 A 的導架:從台面吊下兩片側板與底檔,A 在裡面升降、前後走
        { kind: "box", size: [0.2, 0.43, 0.04], at: [-1.0, 0.055, 0.2] },
        { kind: "box", size: [0.2, 0.43, 0.04], at: [-1.0, 0.055, -0.2] },
        { kind: "box", size: [0.2, 0.06, 0.44], at: [-1.0, -0.13, 0] },
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
        { kind: "plate", shape: shape(rect(2.4, 0.12, -0.3, 0)), thickness: 0.3 },
        // 叉口:兩片頰板夾著 B 的銷
        { kind: "box", size: [0.16, 0.5, 0.08], at: [FORK_X, 0.19, 0.19] },
        { kind: "box", size: [0.16, 0.5, 0.08], at: [FORK_X, 0.19, -0.19] },
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
      labelOffset: [0.9, -0.25, 0.3],
      pieces: [
        { kind: "plate", shape: shape(rect(1.6, 0.12, 0, 0)), thickness: 0.2 },
        // 進料齒
        { kind: "plate", shape: shape(Array.from({ length: 9 }, (_, i) => [0.2 + i * 0.08, i % 2 ? 0.16 : 0.06]).concat([[0.84, 0.06], [0.2, 0.06]])), thickness: 0.2 },
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
  // 動力重演:只推凸輪;A 沿直立的滑軌靠自重坐在前面那片輪廓上(前後的移動與 B 照模型走),看它落下、停在基圓上
  replay: {
    seconds: 12,
    free: { barA: { slide: [0, 1, 0] } },
    ignore: [["barA", "barB"], ["barA", "pinB"], ["barA", "bed"], ["barA", "springA"], ["barA", "feedCam"]],
    expect: [
      { at: TAU * 0.25, part: "barA", label: "凸輪的凸起把 A 頂起", quote: "桿 A 由凸輪 C 上的徑向凸出部分抬起" },
      // 落下之後 A 還在往回走(滑軌只放了上下),比對取轉完一圈、前後都回到原處的時候
      { at: TAU, part: "barA", label: "凸起轉過去,A 與 B 靠自重落回", quote: "桿 B 則憑自身重力落下" },
    ],
  },
  driver: { part: "cam", type: "rotation" },
  target: "barB", // 帶著進料齒走四向循環的桿
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const m = fourMotion(theta);
    return {
      parts: {
        cam: { angle: theta },
        feedCam: { angle: theta },
        barA: { position: [m.feed, m.lift, 0] },
        barB: { position: [1.35 + m.feed, m.lift + 0.12, 0] },
        pinB: { position: [FORK_X + m.feed, m.lift + 0.12, 0] },
        springA: { from: [-2.34, -0.35, 0], to: [-1.66 + m.feed, -0.35 + m.lift, 0] },
      },
      readouts: [],
    };
  },
};
