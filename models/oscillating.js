// 擺動式引擎(第 344、345 種)共用:汽缸以長度中點(或上端)的樞軸裝在固定的軸承上,隨曲柄擺動;
// 活塞桿不用導件,直接接曲柄銷,所以活塞桿始終指向樞軸。汽缸內正在推活塞的那一側以蒸汽填色,
// 進汽經樞軸流入。全是曲柄轉角的純函式。
import { Y, Z, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { backHalf } from "./section.js";

/**
 * trunnion:汽缸樞軸;crank:曲柄心、r:曲柄半徑;cyl:{ length, radius, offset }(汽缸中心沿軸線離樞軸的距離,
 * 正值為朝曲柄的方向);rod:活塞到曲柄銷的距離(活塞桿長)。
 */
export function oscillating({ trunnion, crank, r, cyl, rod }) {
  const parts = [
    { id: "cylinder", kind: "lathe", axis: Y, profile: [[0.12, cyl.length / 2 + 0.12], [cyl.radius + 0.1, cyl.length / 2 + 0.12], [cyl.radius + 0.1, -cyl.length / 2 - 0.12], [0.12, -cyl.length / 2 - 0.12], [0.12, -cyl.length / 2], [cyl.radius, -cyl.length / 2], [cyl.radius, cyl.length / 2], [0.12, cyl.length / 2]], ...backHalf(Y), arrow: false },
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
