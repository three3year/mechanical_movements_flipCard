// 第 284 種:鋸機平台的進料裝置。圖底的曲柄旋轉,經連桿把往復運動傳給曲柄搖臂槓桿(bell-crank)的水平臂,
// 槓桿的支點在左上角的 a;槓桿垂直臂上連著卡榫,卡榫推棘輪,棘輪軸上的小齒輪作動於平台側邊的齒條,平台就一步一步前進。
// 進料速度可以用曲柄搖臂槓桿上的螺絲調節:連桿接在水平臂上離支點越遠,槓桿擺得越少,進料越慢。
// 主動件是曲柄;狀態按鈕切換連桿接在水平臂上的兩個位置(進料慢 / 快),原機構由人調螺絲,所以用按鈕。
//
// 接觸(由接觸算,共用 pawl-drive.js):卡榫鉸在垂直臂的下端,靠自重搭在棘輪右上方的齒上,末端的鉤朝輪心;
// 垂直臂往左擺時把卡榫往回拉,鉤頂著齒的直面把棘輪往逆時針拖;垂直臂往右擺時卡榫被齒背頂起、越過齒尖後加速落進
// 後面的齒間。棘輪左邊的止回爪靠自重搭在齒上,不讓棘輪倒轉。每程推過幾齒、停在哪裡都由爪與齒相碰算出:
// 進料慢時一程一齒,進料快時一程兩齒。
// 推斷:各桿長與棘輪齒數(依原圖);每程推過的齒數(慢一齒、快兩齒;原文只說螺絲可調進料速度),
// 為此曲柄半徑加大、進料快的接點移近支點;止回爪(原圖棘輪左上的小爪)的支架;
// 棘輪軸的軸承座與平台的導軌(原圖沒畫)。
import { TAU, deg } from "./kit.js";
import { crankPin, circleCircle, angleOf } from "./linkage.js";
import { rackOffset, circularPitch } from "./gears.js";
import { ratchetShape, shape, circle, thickLine, rect } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const A = [-1.55, 1.85, 0]; // 支點 a
const CRANK = { center: [2.15, -1.7, 0.3], r: 0.78 };
const ARM_V = 0.95; // 垂直臂長
const WHEEL = { center: [-1.55, -0.75, 0], teeth: 40, outer: 1.22, inner: 1.07, dir: 1 };
const PITCH = TAU / WHEEL.teeth;
const CATCH = 1.25; // 卡榫從樞軸到鉤
const PINION = { center: [WHEEL.center[0], WHEEL.center[1], -0.35], teeth: 12, radius: 0.42 };
const RACK = { origin: [WHEEL.center[0], WHEEL.center[1] + PINION.radius, -0.35], dir: [1, 0, 0], pitch: circularPitch(PINION) };
const ATTACH = { slow: 3.75, fast: 2.4 }; // 連桿接在水平臂上離支點的距離
// 卡榫(局部座標:原點在樞軸,沿 +x 伸向棘輪;−y 朝輪心):細桿,末端往下的鉤,鉤的後面(朝樞軸)是直的、前面斜
export const CATCH_OUTLINE = [
  [-0.06, 0.05],
  [-0.06, -0.05],
  [CATCH - 0.1, -0.05],
  [CATCH - 0.12, -0.16],
  [CATCH - 0.07, -0.16],
  [CATCH + 0.02, -0.05],
  [CATCH + 0.02, 0.05],
]; // 鉤比一個齒距窄,鉤背才不會壓到後一齒的齒尖;鉤的前面往後斜(倒鉤),拉的時候鉤往齒根吃進去
// 止回爪(局部座標:原點在樞軸,沿 +x 往下伸到棘輪的左上緣)
const CLICK = { pivot: [-2.15, 0.84], length: 0.8 }; // 樞軸在棘輪左上方(平台的上方),爪略往左斜垂到齒上
const CLICK_OUTLINE = [[-0.05, -0.05], [CLICK.length, -0.05], [CLICK.length, 0.03], [CLICK.length - 0.03, 0.14], [CLICK.length - 0.1, 0.05], [-0.05, 0.05]]; // 末端朝輪的一側凸出一個尖

function setup(h) {
  const H0 = [A[0] + h, A[1], 0];
  const rod = Math.hypot(H0[0] - CRANK.center[0], H0[1] - CRANK.center[1]);
  const arm = (theta) => {
    const pin = crankPin(CRANK.center, CRANK.r, theta);
    const H = circleCircle(A, h, pin, rod, 1).point;
    const beta = angleOf(A, H); // 水平臂的角度
    const V = [A[0] + ARM_V * Math.cos(beta - Math.PI / 2), A[1] + ARM_V * Math.sin(beta - Math.PI / 2), 0];
    return { pin, H, beta, V };
  };
  const drive = pawlDrive({
    period: TAU,
    samples: 720,
    pins: (theta) => ({ catch: arm(theta).V.slice(0, 2), click: CLICK.pivot }),
    wheel: { obstacles: (w) => ratchetObstacles(WHEEL, w, WHEEL.center), dir: WHEEL.dir, pitch: PITCH },
    pawls: {
      // 垂直臂往左擺(V 的 x 變小)時卡榫在拉
      catch: { outline: CATCH_OUTLINE, into: -1, angle: deg(-46), limits: [deg(-75), deg(-20)], lift: [-0.03, 0], pushes: (theta) => arm(theta + 1e-3).V[0] < arm(theta - 1e-3).V[0] },
      click: { outline: CLICK_OUTLINE, into: 1, angle: deg(-105), limits: [deg(-140), deg(-85)] },
    },
  });
  return { arm, drive };
}
const SETUPS = { slow: setup(ATTACH.slow), fast: setup(ATTACH.fast) };

/** 曲柄轉 theta(狀態 state):槓桿姿勢、卡榫與止回爪的轉角、棘輪的累計轉角、平台的位移 */
export function feed(theta, state = "slow") {
  const S = SETUPS[state];
  const a = S.arm(theta);
  const s = S.drive.at(theta);
  const wheel = s.wheel - S.drive.at(0).wheel;
  return { ...a, wheel, catchAngle: s.angles.catch, clickAngle: s.angles.click, step: S.drive.step, carriage: rackOffset(PINION, RACK, wheel) };
}
export const geometry = { PITCH };
/** 檢查用:卡榫、止回爪與棘輪的齒(世界座標 2D) */
export const contactAt = (theta, state = "slow") => {
  const s = SETUPS[state].drive.shapes(theta);
  return { catch: s.pawls.catch, click: s.pawls.click, teeth: s.wheel };
};

const spokes = Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.inner - 0.2, 0.12, 0.1], angle: (i * Math.PI) / 4 }));
// 卡榫的鉤(卡榫末端那一段,往後伸到棘輪那一層)
const HOOK = [[CATCH - 0.14, 0.05], [CATCH - 0.14, -0.05], ...CATCH_OUTLINE.slice(2)];

export default {
  figure: 284,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 5.0, 0.3], at: [-2.65, -0.2, -0.6] },
        { kind: "box", size: [0.5, 0.9, 0.3], at: [A[0], A[1] - 0.1, -0.3] },
        { kind: "box", size: [4.9, 0.12, 0.6], at: [-0.1, -2.6, -0.4] },
        // 曲柄軸與棘輪軸的軸承座
        ...pedestal({ at: CRANK.center, z: -0.2, bore: 0.1, floor: -2.54 }),
        ...pedestal({ at: WHEEL.center, z: -0.75, bore: 0.1, floor: -2.54 }),
        // 止回爪的樞軸銷與支架
        { kind: "box", size: [-2.5 - CLICK.pivot[0] + 0.1, 0.2, 0.3], at: [(-2.5 + CLICK.pivot[0] - 0.1) / 2 + 0.1, CLICK.pivot[1], -0.6] },
        { kind: "cylinder", radius: 0.05, length: 0.75, at: [...CLICK.pivot, -0.33] },
        // 平台背面的導軌
        { kind: "box", size: [5.4, 0.16, 0.1], at: [-1.1, RACK.origin[1] + 0.55, -0.5] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.15,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [CRANK.r, 0]], 0.18), [circle(0.05).reverse()]), thickness: 0.1 },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [CRANK.r, 0, 0.1] },
        { kind: "cylinder", radius: 0.1, length: 0.55, at: [0, 0, -0.375] }, // 曲柄軸只往後伸(連桿從曲柄前面掃過軸心)
      ],
    },
    { id: "rod", kind: "link", width: 0.09, thickness: 0.06 },
    {
      id: "bellCrank",
      kind: "group",
      center: A,
      arrow: false,
      label: "a",
      labelOffset: [-0.35, 0.25, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [ATTACH.slow + 0.15, 0]], 0.13), [circle(0.05).reverse()]), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, -ARM_V]], 0.16)), thickness: 0.1, at: [0, 0, 0.1] },
        // 調節進料的螺絲座(水平臂上的兩個接點)
        { kind: "box", size: [0.14, 0.24, 0.16], at: [ATTACH.fast, 0, 0.1] },
        { kind: "box", size: [0.14, 0.24, 0.16], at: [ATTACH.slow, 0, 0.1] },
        { kind: "cylinder", radius: 0.11, length: 0.4 },
      ],
    },
    {
      id: "catch",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [CATCH - 0.08, 0]], 0.1), [circle(0.04).reverse()]), thickness: 0.08, at: [0, 0, 0.2] }, // 卡榫的桿在棘輪前面
        { kind: "plate", shape: shape(HOOK), thickness: 0.3, at: [0, 0, 0.09] }, // 鉤往後伸到棘輪那一層
        { kind: "cylinder", radius: 0.04, length: 0.2, at: [0, 0, 0.17] }, // 鉸在垂直臂下端的銷
      ],
    },
    {
      id: "click",
      kind: "group",
      center: [...CLICK.pivot, 0],
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(CLICK_OUTLINE, [circle(0.05).reverse()]), thickness: 0.12 }],
    },
    {
      id: "ratchet",
      kind: "plate",
      center: WHEEL.center,
      shape: ratchetShape({ ...WHEEL, bore: 0.1 }),
      thickness: 0.16,
      circles: [WHEEL.inner - 0.12],
      spin: WHEEL.outer,
      mark: [WHEEL.inner - 0.06, 0],
      markSize: 0.07,
      pieces: [...spokes, { kind: "cylinder", radius: 0.22, length: 0.8, at: [0, 0, -0.2] }, { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.75] }],
    },
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.2, arrow: false },
    {
      id: "carriage",
      kind: "rack",
      teeth: 25,
      pitch: RACK.pitch,
      width: 0.2,
      depth: 0.2,
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(rect(25 * RACK.pitch, 0.35, 0, -0.55)), thickness: 0.2 }],
    },
  ],
  // 動力重演:只推曲柄;棘輪靠摩擦定位,由卡榫拉動;卡榫鉸在垂直臂下端、止回爪鉸在銷上,都靠自重搭在齒上
  replay: {
    to: 2 * TAU,
    seconds: 20,
    free: { ratchet: { hold: true, gravity: false }, catch: { on: "bellCrank" }, click: {} },
    ignore: [["ratchet", "frame"], ["ratchet", "pinion"]],
    expect: [
      { at: TAU, part: "ratchet", label: "曲柄轉一圈,卡榫把棘輪拉過一齒", quote: "藉此將運動傳遞給連接於槓桿垂直臂上的卡榫，該卡榫再將運動傳遞給棘輪" },
      { at: 2 * TAU, part: "ratchet", label: "兩圈兩齒" },
    ],
  },
  driver: { part: "crank", type: "rotation" },
  target: "carriage", // 一步一步前進的平台
  states: {
    initial: "slow",
    options: [
      { id: "slow", label: "進料慢" },
      { id: "fast", label: "進料快" },
    ],
  },
  view: { direction: [0.04, 0.05, 1] },
  pose(theta, state = "slow") {
    const f = feed(theta, state);
    const z = 0.25;
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [f.pin[0], f.pin[1], z], to: [f.H[0], f.H[1], z] },
        bellCrank: { angle: f.beta },
        catch: { position: f.V, angle: f.catchAngle },
        click: { angle: f.clickAngle },
        ratchet: { angle: f.wheel },
        pinion: { angle: f.wheel },
        // 齒條齒朝下,咬在小齒輪頂上:齒條零件轉 180°
        carriage: { position: [RACK.origin[0] + f.carriage, RACK.origin[1], -0.35], angle: Math.PI },
      },
      readouts: [],
    };
  },
};
