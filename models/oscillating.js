// 擺動式引擎(第 171、344、345 種)共用:汽缸以長度中點(或上端)的樞軸裝在固定的軸承上,隨曲柄擺動;
// 活塞桿不用導件,直接接曲柄銷,所以活塞桿始終指向樞軸。汽缸內正在推活塞的那一側以蒸汽填色,
// 進汽經樞軸流入。全是曲柄轉角的純函式。第 344、345 種另外共用耳軸、斷開接軸承環的橫樑與曲柄的寫法。
import { Y, Z, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, thickLine } from "./shapes.js";

/**
 * 汽缸的耳軸(放進 cylinderPieces):從汽缸局部 y = from 沿局部 +Y(世界的後方 −z)伸到 to 的圓柱(半徑 r),
 * 在樞軸上(汽缸中心沿軸線離樞軸 cyl.offset)
 */
export const trunnionStub = ({ r, from, to }, cyl) => ({ kind: "cylinder", axis: [0, 1, 0], radius: r, length: to - from, at: [0, (from + to) / 2, -cyl.offset] });

/** 機架的橫樑(x −1.8 到 1.8,深度 z、截面 t × t)在 c 處斷開、接上一個軸承環(外半徑 0.3,孔半徑 inner) */
export const beamWithBearing = (c, inner, { z, t }) => [
  { kind: "box", size: [1.8 + c[0] - 0.26, t, t], at: [(-1.8 + c[0] - 0.26) / 2, c[1], z] },
  { kind: "box", size: [1.8 - c[0] - 0.26, t, t], at: [(1.8 + c[0] + 0.26) / 2, c[1], z] },
  { kind: "cylinder", radius: 0.3, inner, length: t, at: [c[0], c[1], z] },
];

/**
 * 曲柄的附件(曲柄零件的局部座標):半徑 r 的曲柄臂在深度 armZ(活塞桿後面一層),曲柄銷(半徑 pinR)從臂背面往前
 * 穿過活塞桿端的眼、前面有銷頭;輪轂在臂的背面,曲柄軸沿 z 從 shaft.from 到 shaft.to
 */
export const oscillatingCrank = ({ r, armZ, pinR, shaft }) => [
  { kind: "plate", shape: shape(thickLine([[0, 0], [r, 0]], 0.3)), thickness: 0.12, at: [0, 0, armZ] },
  { kind: "cylinder", radius: 0.2, length: 0.2, at: [0, 0, armZ - 0.16] }, // 輪轂(臂的背面)
  { kind: "cylinder", radius: 0.12, length: shaft.to - shaft.from, at: [0, 0, (shaft.from + shaft.to) / 2] },
  { kind: "cylinder", radius: pinR, length: 0.06 - (armZ - 0.06), at: [r, 0, (0.06 + armZ - 0.06) / 2], accent: true }, // 曲柄銷:從臂背面穿到活塞桿前面
  { kind: "cylinder", radius: 0.07, length: 0.03, at: [r, 0, 0.06], accent: true }, // 銷頭(擋住活塞桿的眼)
];

/**
 * trunnion:汽缸樞軸;crank:曲柄心、r:曲柄半徑;cyl:{ length, radius, offset }(汽缸中心沿軸線離樞軸的距離,
 * 正值為朝曲柄的方向);rod:活塞到曲柄銷的距離(活塞桿長)。
 * cylinderPieces:固定在汽缸上的附件(例如耳軸),座標是汽缸的局部座標:原點在汽缸中心、局部 Z 沿汽缸軸指向曲柄、
 * 局部 +Y 朝世界的後方(−z);省略時汽缸沒有附件。
 */
export function oscillating({ trunnion, crank, r, cyl, rod, cylinderPieces }) {
  const parts = [
    { id: "cylinder", kind: "lathe", axis: Y, profile: [[0.12, cyl.length / 2 + 0.12], [cyl.radius + 0.1, cyl.length / 2 + 0.12], [cyl.radius + 0.1, -cyl.length / 2 - 0.12], [0.12, -cyl.length / 2 - 0.12], [0.12, -cyl.length / 2], [cyl.radius, -cyl.length / 2], [cyl.radius, cyl.length / 2], [0.12, cyl.length / 2]], ...backHalf(Y), arrow: false, ...(cylinderPieces ? { pieces: cylinderPieces } : {}) },
    { id: "steamNear", kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * cyl.radius - 0.04, cyl.length, 0], level: 0 },
    { id: "steamFar", kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * cyl.radius - 0.04, cyl.length, 0], level: 0 },
    { id: "piston", kind: "cylinder", axis: Y, radius: cyl.radius - 0.02, length: 0.2, arrow: false },
    { id: "pistonRod", kind: "link", width: 0.09, thickness: 0.09 },
  ];
  /** 曲柄轉 theta → 曲柄銷、汽缸擺角、活塞沿汽缸軸離樞軸的距離與各零件的姿勢 */
  function at(theta) {
    const pin = [crank[0] + r * Math.cos(theta), crank[1] + r * Math.sin(theta), 0];
    const d = [pin[0] - trunnion[0], pin[1] - trunnion[1]];
    const dist = Math.hypot(d[0], d[1]);
    const u = [d[0] / dist, d[1] / dist, 0]; // 從樞軸指向曲柄銷
    const piston = dist - rod; // 活塞離樞軸的距離
    return { pin, u, swing: Math.atan2(d[1], d[0]), piston };
  }
  /** 汽缸零件的姿勢:汽缸軸指向曲柄銷;活塞往哪邊走,另一側就進汽 */
  function pose(theta) {
    const a = at(theta);
    const b = at(theta - 1e-4);
    const outward = a.piston > b.piston; // 活塞正往曲柄方向走:遠端(樞軸那一側)進汽
    const along = (s) => [trunnion[0] + a.u[0] * s, trunnion[1] + a.u[1] * s, 0];
    const tilt = quatAxisAngle(Z, a.swing - Math.PI / 2);
    const lo = cyl.offset - cyl.length / 2;
    const hi = cyl.offset + cyl.length / 2;
    const pFar = a.piston - 0.1;
    const pNear = a.piston + 0.1;
    // 填色零件的局部 +Y 是「往上」:以汽缸軸為上方,高度 = 一室的長度
    const farLen = Math.max(0, pFar - lo);
    const nearLen = Math.max(0, hi - pNear);
    const fillRot = (up) => (up ? tilt : quatMul(tilt, quatAxisAngle(Z, Math.PI)));
    return {
      parts: {
        cylinder: { position: along(cyl.offset), rotation: quatMul(tilt, quatFromZ(Y)) },
        piston: { position: along(a.piston), rotation: quatMul(tilt, quatFromZ(Y)) },
        pistonRod: { from: along(a.piston), to: a.pin },
        steamFar: { position: along(lo + cyl.length / 2), rotation: fillRot(true), level: outward ? farLen / cyl.length : 0 },
        steamNear: { position: along(hi - cyl.length / 2), rotation: fillRot(false), level: outward ? 0 : nearLen / cyl.length },
      },
      ...a,
      outward,
    };
  }
  return { parts, at, pose };
}
