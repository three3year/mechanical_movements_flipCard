// 第 85 種:軸上有兩個凸輪(推板),連續旋轉時頂起桿 A 上的凸塊 B,把桿抬起;推板滑脫後桿憑自重落下。
// 用於礦石搗碎機與錘子。軸每轉一圈,桿被抬起兩次。主動件是凸輪軸(順時針)。
// 桿抬起的高度由推板與凸塊 B 的接觸算;推板滑脫後桿從靜止起步、越來越快地落到底
// (推斷:原文只說「憑其自身重量下落」,落下期間下一片推板尚未碰到凸塊)。
import { TAU, deg, polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { placeOutline, polygonsOverlap, withFall } from "./contact.js";

const CAM = { center: [0.42, 0.55, 0], hub: 0.28, tip: 0.82 };
const ROD = { x: -0.62, bottom: -2.6, top: 1.9, radius: 0.12 };
// 凸塊 B(桿落到底時的位置):伸到推板的路徑上,推板從它下面往上頂
const TAPPET = { size: [0.45, 0.2], at: [0.345, 0.7] };
const TAPPET_BOX = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [ROD.x + TAPPET.at[0] + (sx * TAPPET.size[0]) / 2, TAPPET.at[1] + (sy * TAPPET.size[1]) / 2]);

const blade = (a) =>
  shape([...arcPoints(CAM.hub, a - deg(40), a + deg(20)), polar(CAM.tip, a - deg(5)).slice(0, 2), polar(CAM.tip - 0.12, a - deg(30)).slice(0, 2)]);
const BLADES = [Math.PI, 0].map((a) => blade(a).outline);

// 桿憑自重靠在推板上的高度(由接觸算;沒有推板頂著就落到底,為 0)
function resting(c) {
  const blades = BLADES.map((o) => placeOutline(o, CAM.center, -c));
  const hit = (h) => blades.some((b) => polygonsOverlap(TAPPET_BOX.map(([x, y]) => [x, y + h]), b));
  // 從上往下找:凸塊落到第一個碰到推板的高度就停住(推板還在它下方時,不會掉過去)
  let lo = 1.2;
  while (lo > 0 && !hit(lo)) lo -= 0.02;
  if (lo <= 0 && !hit(0)) return 0;
  lo = Math.max(lo, 0);
  let hi = lo + 0.02;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (hit(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** 凸輪軸順時針轉 c:桿 A 抬起的高度。推板頂著時由接觸算,滑脫後憑自重加速落到底 */
export const rodLift = withFall(resting, TAU / 2, deg(25));

export default {
  figure: 85,
  parts: [
    {
      id: "cam",
      kind: "group",
      center: CAM.center,
      spin: 0.8,
      pieces: [
        { kind: "plate", shape: shape(circle(CAM.hub), [circle(0.1).reverse()]), thickness: 0.3, circles: [0.18] },
        { kind: "plate", shape: blade(Math.PI), thickness: 0.3, mark: polar(0.45, Math.PI - 0.3).slice(0, 2), markSize: 0.06 },
        { kind: "plate", shape: blade(0), thickness: 0.3 },
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: [ROD.x, 0, 0],
      pieces: [
        { kind: "cylinder", axis: [0, 1, 0], radius: ROD.radius, length: ROD.top - ROD.bottom, at: [0, (ROD.top + ROD.bottom) / 2, 0] },
        { kind: "box", size: [TAPPET.size[0], TAPPET.size[1], 0.3], at: [TAPPET.at[0], TAPPET.at[1], 0], accent: false }, // 桿身往左讓開凸輪,只有凸塊 B 伸到凸輪的路徑上
        { kind: "lathe", axis: [0, 1, 0], at: [0, ROD.bottom - 0.05, 0], profile: [[0, -0.55], [0.52, -0.55], [0.42, 0], [0.18, 0.05], [0, 0.05]] },
      ],
      label: "A",
      labelOffset: [-0.45, 0.2, 0.2],
    },
    { id: "labelB", kind: "group", center: [ROD.x - 0.3, TAPPET.at[1], 0.2], label: "B" },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[0.95, -3.5], [3.3, -3.5], [3.3, -3.3], [2.5, -3.2], [2.0, -2.0], [1.9, 1.6], [1.6, 2.3], [-0.65, 2.3], [-0.65, 2.0], [0.95, 2.0]]), thickness: 0.45, at: [0, 0, -0.35] },
        { kind: "box", size: [1.7, 0.22, 0.45], at: [0.1, -1.0, 0] },
        { kind: "box", size: [1.7, 0.22, 0.45], at: [0.1, 2.0, 0] },
        { kind: "box", size: [5.0, 0.08, 1.2], at: [0.5, -3.55, 0] },
      ],
    },
  ],
  // 動力重演:只推凸輪軸;桿在導座裡自由上下,靠自重落下
  replay: {
    // 從桿落到底的時刻開始走半圈(一片推板的週期)
    from: -1.6,
    to: -1.6 - Math.PI,
    free: { rod: { slide: [0, 1, 0], limits: [0, 2] } },
    ignore: [["rod", "frame"]], // 導座由滑軌約束代表;桿落到底由 limits 代表
    expect: [
      { at: -1.6 - 2.35, part: "rod", label: "推板頂著凸塊把桿抬起", quote: "頂起桿 A 上的凸塊 B,把桿抬起" },
      { at: -1.6 - Math.PI, part: "rod", label: "推板滑脫後桿憑自重落回", quote: "憑其自身重量下落" },
    ],
  },
  driver: { part: "cam", type: "rotation", speed: -1.0 },

  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const h = rodLift(-v);
    return {
      parts: { cam: { angle: v }, rod: { position: [ROD.x, h, 0] }, labelB: { position: [ROD.x - 0.3, TAPPET.at[1] + h, 0.2] } },
      readouts: [],
    };
  },
};
