// 第 206 種:棘輪的連續圓周運動,由一支承載兩個棘爪的槓桿振動產生。右上方的槓桿繞它的軸擺動,
// 槓桿端的銷上掛著一塊跨過棘輪上方的弧形棘爪,兩端各是一個爪:槓桿端上升時左爪鉤住左側的齒往上拉,
// 下降時右爪壓住右側的齒往下推,兩者都讓棘輪朝同一方向(順時針)轉,所以每一程都在推,幾乎連續。
// 主動量是槓桿的累計擺動量。
// 推斷:兩爪各自以掛銷為樞軸(畫成從銷到爪尖的兩段);擺幅。
import { deg, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { shape, circle, ratchetShape, thickLine } from "./shapes.js";

const WHEEL = { teeth: 40, outer: 2.25, inner: 2.02, pitchR: 2.12 };
const P = [1.0, 3.3, 0]; // 槓桿的軸
const E0 = [0.05, 2.95]; // 掛棘爪的銷(槓桿在原圖位置時)
const HANDLE = [2.05, 3.6];
const PAWL = { left: 2.52, right: 2.26 };
const SIDE = { left: -1, right: 1 };
const SWING = deg(24);

const pinAt = (psi) => bodyPoint(P, psi, [E0[0] - P[0], E0[1] - P[1]]);
/** 爪尖:從掛銷量一個爪長,落在齒圈上 */
const tip = (which, psi) => circleCircle(pinAt(psi), PAWL[which], [0, 0, 0], WHEEL.pitchR, SIDE[which]).point;
const tipAngle = (which) => (psi) => Math.atan2(tip(which, psi)[1], tip(which, psi)[0]);

/** 主動量 v(槓桿累計擺動):棘輪的轉角。槓桿往 −SWING/2 擺時掛銷上升、左爪拉;往回擺時右爪推。 */
export const wheelAngle = (v) => doubleAction(v, SWING / 2, -SWING / 2, tipAngle("left"), tipAngle("right"));
export const swing = SWING;
export const tipOf = tip;

// 爪:從掛銷到爪尖的弧形板,往外拱(不碰到棘輪的齒);局部 +x 由銷指向爪尖
const pawl = (id, which, bulge) => {
  const L = PAWL[which];
  const pts = Array.from({ length: 21 }, (_, i) => [(L * i) / 20, bulge * 0.45 * 4 * (i / 20) * (1 - i / 20)]);
  return { id, kind: "plate", shape: shape(thickLine(pts, 0.22)), thickness: 0.1, arrow: false };
};

export default {
  figure: 206,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: WHEEL.outer,
      pieces: [
        { kind: "plate", shape: ratchetShape({ teeth: WHEEL.teeth, outer: WHEEL.outer, inner: WHEEL.inner, bore: 0.25, dir: -1 }), thickness: 0.22 },
        { kind: "cylinder", radius: 0.48, inner: 0.25, length: 0.3 },
        { kind: "plate", shape: shape(circle(1.75), [circle(1.7).reverse()]), thickness: 0.24, mark: [1.2, 0.6], markSize: 0.08 },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[E0[0] - P[0], E0[1] - P[1]], [0, 0], [HANDLE[0] - P[0], HANDLE[1] - P[1]]], 0.28)), thickness: 0.12, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.3, inner: 0.14, length: 0.4, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.14, length: 0.5, at: [E0[0] - P[0], E0[1] - P[1], 0.3] },
      ],
    },
    pawl("pawlLeft", "left", -1),
    pawl("pawlRight", "right", 1),
  ],
  waivers: [
    { check: "unsupported", parts: ["wheel"], reason: "待確認:wheel 與帶動(或支撐)它的零件之間差 0.04 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["pawlLeft", "pawlRight"], reason: "待確認:pawlLeft 的板 與 pawlRight 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "lever", type: "rotation", cycle: [SWING / 2, -SWING / 2] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = swingAt(v, SWING / 2, -SWING / 2);
    const pin = [...pinAt(psi).slice(0, 2), 0.2];
    const at = (w) => [...tip(w, psi).slice(0, 2), 0.2];
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: wheelAngle(v) },
        pawlLeft: { position: pin, angle: Math.atan2(at("left")[1] - pin[1], at("left")[0] - pin[0]) },
        pawlRight: { position: pin, angle: Math.atan2(at("right")[1] - pin[1], at("right")[0] - pin[0]) },
      },
      readouts: [],
    };
  },
};

