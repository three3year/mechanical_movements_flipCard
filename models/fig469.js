// 第 469 種:一項法國發明,靠兩池水的溫度差得到旋轉運動。兩個水槽:左邊常溫,右邊較熱。右邊有一個水車,
// 以齒輪與左邊的阿基米德螺旋相連;從螺旋上方伸出一根管子,通到輪的下方。啟動時把螺旋朝與抬水相反的方向轉,
// 把空氣往下壓進管裡,空氣在管裡上升、越過、再下降,把運動傳給水車;據說空氣的體積隨溫度增加,使機器保持運轉。
// 至於溫度差要如何維持,原文沒有說明。
// 主動件是虛擬的「進程」:空氣推著水車已轉了幾圈(與全書其他水車相同,水車由流體推動);目標件是水車——
// 這組裝置的目的就是「得到旋轉運動」。螺旋經齒輪跟著水車轉,一直朝「與抬水相反」的方向轉,把空氣壓進管裡。
// 照原圖:螺旋裝在一根斜立的筒裡(剖開畫),整支在左槽裡、上端露出水面;筒的下端通到左下角瓶形的空氣室,
// 管子從瓶頸往上、越過頂上、通到水車下方(原文「從螺旋上方延伸出一根管子」以原圖為準是從螺旋筒的空氣室延伸出來);
// 螺旋頂端的傘齒輪咬一根斜放的中間軸上的傘齒輪,中間軸另一端的傘齒輪咬在水車軸前端的傘齒輪上。
// 推斷:中間軸從螺旋頂越過右槽的左壁上方、往前(觀者方向)斜下到水車軸的前端(原圖是平面圖,看不出前後);
// 齒數照原圖螺旋頂的齒輪較大、中間軸的較小(16 : 12,10 : 20),水車轉一圈螺旋轉 1.5 圈;軸承(筒底、筒頂的架、
// 槽壁頂的托架、槽底的立柱)與水車的輪輻、空氣室的形狀是推斷。氣泡從管口冒到水車一側的水斗下,推著水車逆時針轉。
// 螺旋的旋向由傳動的轉向決定:水車逆時針轉時螺紋往下走(把空氣往下壓),與原文「與抬水相反的方向」一致。
import { TAU, X, Y, Z, deg, polar, norm, add, sub, scale, dot, planeAngle, quatFromZ, quatMul, quatRotate } from "./kit.js";
import { stream } from "./flow.js";
import { shape, thickLine } from "./shapes.js";
import { bevelGear, pitchCones, bevelContact, meshAngle } from "./gears.js";
import { backHalf } from "./section.js";

export const WHEEL = { center: [1.55, 0.0, 0], radius: 0.75 };
const BUCKETS = 14;
const RIM = 0.75; // 兩個水槽的壁頂
export const WATER = 0.45; // 水面
const TANK_L = { left: -2.5, right: 0.15 }; // 左槽的壁(中心線)
const TANK_R = { left: 0.45, right: 2.85 };
const WALL = 0.08;
const tankOutline = (t) => thickLine([[t.left, RIM], [t.left, -1.7], [t.right, -1.7], [t.right, RIM]], WALL);
const FLOOR = Math.max(...tankOutline(TANK_L).filter((p) => p[1] < -1.5).map((p) => p[1])); // 槽底的內面(粗線在轉角處斜著偏,比中心線高 0.028)

// 螺旋:軸線從 BASE 朝 DIR 斜上;頂端傘齒輪的錐頂在 APEX
export const DIR = norm([Math.sin(deg(30)), Math.cos(deg(30)), 0]); // 與鉛直夾 30°
export const APEX = [-0.05, 1.3, 0];
const SCREW_LEN = 2.9; // 底到錐頂
export const BASE = sub(APEX, scale(DIR, SCREW_LEN));
export const CASING = { r: 0.31, inner: 0.27, len: 2.2, bottom: 0.14 }; // 螺旋筒:上端(斜的)開口整個在水面上
const WORM = { r: 0.25, thread: 0.17, from: 0.25, to: 1.95 }; // 螺紋的凸條半徑 0.17,凸條的兩端在 0.08 與 2.12,都在筒裡
const SHAFT_R = 0.07;
export const PITCH = 0.45;

// 中間軸:從螺旋的錐頂 APEX 到水車軸前端的 Q,兩端各一個傘齒輪
export const Q = [WHEEL.center[0], WHEEL.center[1], 0.75];
export const U3 = norm(sub(Q, APEX)); // 中間軸的方向(零件的軸)
const SHAFT_LEN = Math.hypot(...sub(Q, APEX));
const [CONE_SCREW, CONE_UP] = pitchCones(16, 12, Math.acos(dot(DIR, scale(U3, -1))));
const [CONE_LOW, CONE_CROWN] = pitchCones(10, 20, Math.acos(dot(U3, Z)));
const M1 = 0.035; // 兩對齒輪各自的模數
const M2 = 0.03;
export const GEARS = {
  screw: bevelGear({ apex: APEX, axis: DIR, teeth: 16, radius: 8 * M1, cone: CONE_SCREW, width: 0.15 }),
  up: bevelGear({ apex: APEX, axis: scale(U3, -1), teeth: 12, radius: 6 * M1, cone: CONE_UP, width: 0.15 }),
  low: bevelGear({ apex: Q, axis: U3, teeth: 10, radius: 5 * M2, cone: CONE_LOW, width: 0.12 }),
  crown: bevelGear({ apex: Q, axis: Z, teeth: 20, radius: 10 * M2, cone: CONE_CROWN, width: 0.12 }),
};
export const CONTACTS = { upper: bevelContact(GEARS.up, GEARS.screw), lower: bevelContact(GEARS.crown, GEARS.low) };
// 中間軸上端的齒輪錐頂朝 −z(零件的軸是 U3):它的齒 0 在齒輪自己的座標裡差一個固定相位
const FLIP = planeAngle(scale(U3, -1), quatRotate(quatMul(quatFromZ(U3), quatFromZ([0, 0, -1])), X));

/** 水車轉 theta(逆時針)→ 中間軸繞 U3 的轉角 */
export const shaftAngle = (theta) => meshAngle(GEARS.crown, GEARS.low, theta, CONTACTS.lower);
/** 水車轉 theta(逆時針)→ 螺旋繞自己的軸(朝上)的轉角 */
export const screwAngle = (theta) => meshAngle(GEARS.up, GEARS.screw, FLIP - shaftAngle(theta), CONTACTS.upper);
const RATE = (screwAngle(1e-3) - screwAngle(0)) / 1e-3; // 水車轉 1 時螺旋轉多少(含轉向)
export const HAND = Math.sign(RATE); // 旋向:讓螺紋在水車逆時針轉時往下走
/** 螺旋轉 a 時,螺紋沿軸往上走了多少(負的是往下,把空氣往下壓):螺紋 a(z) = HAND·2πz/PITCH 轉 a 後等於往上移 −HAND·a·PITCH/2π */
export const threadAdvance = (a) => (-HAND * a * PITCH) / TAU;

const along = (s) => add(BASE, scale(DIR, s)); // 螺旋軸上離底 s 的點
const onShaft = (s) => add(APEX, scale(U3, s)); // 中間軸上離錐頂 s 的點
const local = (g, origin, axis) => dot(sub(g.center, origin), axis); // 齒輪中心在零件軸上的位置
const BEARING = [0.5 / U3[0], 1.1]; // 中間軸的兩個軸承:越過右槽左壁的地方、槽底立柱的頂上
const P1 = onShaft(BEARING[0]);
const P2 = onShaft(BEARING[1]);
export const SHAFT = { at: onShaft(1.05), axis: U3, radius: 0.05, length: 1.7 };
export const AXLE = { at: [WHEEL.center[0], WHEEL.center[1], 0.025], axis: Z, radius: 0.08, length: 1.05 };
export const SCREW_SHAFT = { at: along(1.31), axis: DIR, radius: SHAFT_R, length: 2.82 }; // 從筒底的軸承下方到頂端齒輪的轂裡

// 空氣室(瓶形,剖開)與它到螺旋筒底的接管
const BOTTLE = { x: -2.15, y: FLOOR, top: 1.3 };
const BOTTLE_PROFILE = [[0.24, 0], [0.24, 0.76], [0.18, 0.9], [0.09, 0.99], [0.09, BOTTLE.top], [0.05, BOTTLE.top], [0.05, 0.96], [0.14, 0.86], [0.2, 0.72], [0.2, 0.04], [0, 0.04], [0, 0]];
const CAP_PORT = add(BASE, scale([-DIR[1], DIR[0], 0], 0.22)); // 筒底蓋上接管的位置(底蓋的環 0.14…0.31 之內)
const DUCT = [[-2.1, -1.36, 0], [-1.84, -1.36, 0], CAP_PORT];
// 管子:從瓶頸往上、越過頂上、從右槽裡下來、管口朝上通到輪的下方
const PIPE_CORNERS = [[BOTTLE.x, BOTTLE.y + BOTTLE.top - 0.05], [BOTTLE.x, 1.95], [2.65, 1.95], [2.65, -1.25], [WHEEL.center[0] + 0.45, -1.25], [WHEEL.center[0] + 0.45, -1.0]];
/** 折線的每個轉角前後補一點,管子的直段才不會被曲線拉彎 */
function stiffen(corners, d = 0.15) {
  const pts = [corners[0]];
  for (let i = 1; i < corners.length - 1; i++) {
    const [p, a, b] = [corners[i], corners[i - 1], corners[i + 1]];
    const inDir = norm([p[0] - a[0], p[1] - a[1], 0]);
    const outDir = norm([b[0] - p[0], b[1] - p[1], 0]);
    pts.push([p[0] - inDir[0] * d, p[1] - inDir[1] * d], p, [p[0] + outDir[0] * d, p[1] + outDir[1] * d]);
  }
  pts.push(corners[corners.length - 1]);
  return pts;
}
export const PIPE = stiffen(PIPE_CORNERS);
/** 空氣的路:從螺旋筒的開口往下、經接管進空氣室、從瓶頸上管子、到輪下的管口 */
export const AIR_PATH = [along(CASING.len), along(0.3), CAP_PORT, DUCT[1], DUCT[0], [BOTTLE.x, -1.1, 0], [BOTTLE.x, BOTTLE.y + BOTTLE.top, 0], ...PIPE.map(([x, y]) => [x, y, 0])];

const tankPlate = (t) => ({ kind: "plate", shape: shape(tankOutline(t)), thickness: 1.0 });
const ring = (at, axis, radius, inner, length) => ({ kind: "cylinder", axis, radius, inner, length, at });
const casingAngle = planeAngle(DIR, Z); // 觀者方向在筒的局部平面上的角

export default {
  figure: 469,
  parts: [
    {
      id: "tanks",
      kind: "group",
      pieces: [
        tankPlate(TANK_L),
        tankPlate(TANK_R),
        // 螺旋筒(剖開,留背向讀者的一半):底有孔讓軸穿過,下端擱在槽底的座上(推斷)
        { kind: "lathe", axis: DIR, at: BASE, profile: [[CASING.bottom, -0.02], [CASING.r, -0.02], [CASING.r, CASING.len], [CASING.inner, CASING.len], [CASING.inner, 0.02], [CASING.bottom, 0.02]], ...backHalf(DIR) },
        ring(along(0), DIR, CASING.bottom, SHAFT_R, 0.12), // 筒底的軸承
        { kind: "box", size: [0.3, BASE[1] - FLOOR + 0.02, 0.3], at: [BASE[0], (BASE[1] + FLOOR + 0.02) / 2, 0] },
        // 筒頂的架:橫過開口的橋,中央是軸承(推斷)
        { kind: "box", size: [2 * CASING.r + 0.12, 0.06, 0.1], axis: DIR, at: along(CASING.len), angle: casingAngle + Math.PI / 2 },
        ring(along(CASING.len), DIR, 0.12, SHAFT_R, 0.1),
        // 空氣室(剖開)與接管
        { kind: "lathe", axis: Y, at: [BOTTLE.x, BOTTLE.y, 0], profile: BOTTLE_PROFILE, ...backHalf(Y) },
        { kind: "tube", points: DUCT, radius: 0.06 },
        { kind: "tube", points: PIPE.map(([x, y]) => [x, y, 0]), radius: 0.07 },
        { kind: "box", size: [0.1, 0.12, 0.12], at: [2.765, 0.3, 0] }, // 管子固定在右槽壁上的夾(推斷)
        // 水車軸的軸承座:兩根立柱立在右槽底(推斷)
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.3, -0.1 - FLOOR, 0.12], at: [WHEEL.center[0], (-0.1 + FLOOR) / 2, s * 0.37] },
          ring([WHEEL.center[0], WHEEL.center[1], s * 0.37], Z, 0.14, AXLE.radius, 0.12),
        ]),
        // 中間軸的軸承:右槽左壁頂上的托架、右槽底的立柱(推斷)
        { kind: "box", size: [0.24, 0.11, 0.24], at: [TANK_R.left, RIM + 0.055, P1[2]] },
        ring(P1, U3, 0.1, SHAFT.radius, 0.14),
        { kind: "box", size: [0.2, P2[1] - 0.05 - FLOOR, 0.12], at: [P2[0], (P2[1] - 0.05 + FLOOR) / 2, P2[2]] },
        ring(P2, U3, 0.1, SHAFT.radius, 0.14),
      ],
    },
    { id: "cool", kind: "fill", fluid: "water", center: [(TANK_L.left + TANK_L.right) / 2, (WATER + FLOOR) / 2, 0], size: [TANK_L.right - TANK_L.left - WALL, WATER - FLOOR, 0.9], level: 1 },
    { id: "warm", kind: "fill", fluid: "water", center: [(TANK_R.left + TANK_R.right) / 2, (WATER + FLOOR) / 2, 0], size: [TANK_R.right - TANK_R.left - WALL, WATER - FLOOR, 0.9], level: 1 },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.radius + 0.15,
      pieces: [
        { kind: "cylinder", radius: WHEEL.radius, inner: WHEEL.radius - 0.06, length: 0.5 },
        ...Array.from({ length: BUCKETS }, (_, i) => {
          const a = (i * TAU) / BUCKETS;
          return { kind: "box", size: [0.3, 0.05, 0.5], at: polar(WHEEL.radius - 0.15, a), angle: a + deg(30) };
        }),
        { kind: "cylinder", radius: 0.16, length: 0.5 }, // 輪轂
        ...Array.from({ length: 6 }, (_, i) => ({ kind: "box", size: [0.56, 0.06, 0.08], at: polar(0.42, (i * TAU) / 6), angle: (i * TAU) / 6 })), // 輪輻(推斷)
        { kind: "cylinder", radius: AXLE.radius, length: AXLE.length, at: [0, 0, AXLE.at[2]] },
        // 軸前端的傘齒輪(錐頂朝前),咬中間軸下端的傘齒輪
        { kind: "gear", teeth: 20, radius: GEARS.crown.radius, cone: GEARS.crown.cone, width: GEARS.crown.width, at: [0, 0, local(GEARS.crown, WHEEL.center, Z)] },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      axis: U3,
      center: APEX,
      spin: 0.12,
      spinOffset: 0.8,
      pieces: [
        { kind: "cylinder", radius: SHAFT.radius, length: SHAFT.length, at: [0, 0, local({ center: SHAFT.at }, APEX, U3)] },
        { kind: "gear", teeth: 12, radius: GEARS.up.radius, cone: GEARS.up.cone, width: GEARS.up.width, axis: [0, 0, -1], at: [0, 0, local(GEARS.up, APEX, U3)] },
        { kind: "gear", teeth: 10, radius: GEARS.low.radius, cone: GEARS.low.cone, width: GEARS.low.width, at: [0, 0, local(GEARS.low, APEX, U3)] },
      ],
    },
    {
      id: "screw",
      kind: "group",
      axis: DIR,
      center: BASE,
      spin: 0.3,
      spinOffset: 2.3,
      pieces: [
        // 螺旋葉片:從軸到筒壁的連續螺旋面(worm 的螺紋),旋向由傳動決定
        { kind: "worm", radius: WORM.r, thread: WORM.thread, pitch: PITCH, hand: HAND, length: WORM.to - WORM.from, at: [0, 0, (WORM.from + WORM.to) / 2] },
        { kind: "cylinder", radius: SHAFT_R, length: SCREW_SHAFT.length, at: [0, 0, local({ center: SCREW_SHAFT.at }, BASE, DIR)] },
        { kind: "gear", teeth: 16, radius: GEARS.screw.radius, cone: GEARS.screw.cone, width: GEARS.screw.width, at: [0, 0, local(GEARS.screw, BASE, DIR)] },
      ],
    },
  ],
  powered: ["wheel"], // 外力來源:空氣推著水車轉
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.1 },
  target: "wheel",
  view: { direction: [0.08, 0.08, 1] },
  pose(v) {
    const theta = TAU * v;
    const travel = theta * 0.8;
    // 氣泡:沿管子越過頂上,從水車右下方冒出,沿右側往上
    const rise = [[WHEEL.center[0] + 0.45, -0.9, 0.3], [WHEEL.center[0] + 0.55, -0.2, 0.3], [WHEEL.center[0] + 0.5, 0.6, 0.3], [WHEEL.center[0] + 0.45, 0.85, 0.3]];
    return {
      parts: {
        wheel: { angle: theta },
        shaft: { angle: shaftAngle(theta) },
        screw: { angle: screwAngle(theta) },
      },
      flows: [{ fluid: "air", points: [...stream(AIR_PATH.map(([x, y]) => [x, y, 0.15]), travel, { spacing: 0.3 }), ...stream(rise, travel, { spacing: 0.22 })] }],
      readouts: [{ label: "溫度差如何維持", value: "原文未說明" }],
    };
  },
};
