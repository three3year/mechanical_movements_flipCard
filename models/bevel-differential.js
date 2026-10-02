// 第 61、62 種共用:皮帶輪內的斜齒輪差動。軸沿 x;固定在軸上的斜齒輪 s1(朝右)、
// 對面鬆套的斜齒輪 s2(朝左),兩者之間的橫向斜齒輪(行星)裝在一個皮帶輪(行星架)上。
// 以繞 +x 的轉角計:s1 + s2 = 2·行星架(標準差動關係)。
import { X, Z, deg, add, quatMul, quatAxisAngle, quatFromZ, rotateAbout } from "./kit.js";
import { bevelGear } from "./gears.js";

export function bevelDifferential({ x0, radius = 0.42, teeth = 16 }) {
  const cone = deg(45);
  const s1 = bevelGear({ apex: [x0, 0, 0], axis: [1, 0, 0], teeth, radius, cone, width: 0.22 });
  const s2 = bevelGear({ apex: [x0, 0, 0], axis: [-1, 0, 0], teeth, radius, cone, width: 0.22 });
  const planet0 = bevelGear({ apex: [x0, 0, 0], axis: [0, -1, 0], teeth, radius, cone, width: 0.22 });
  const part = (id, g, extra = {}) => ({ id, kind: "gear", center: g.center, axis: g.axis, teeth, radius, cone, width: g.width, ...extra });
  return {
    parts: [part("sun1", s1), part("sun2", s2), part("planet", planet0, { arrow: false })],
    /** 由行星架與 s2 的轉角(繞 +x)求 s1(軸)的轉角 */
    shaftFrom: (carrier, sun2) => 2 * carrier - sun2,
    /** 各斜齒輪的姿勢;s2 的軸朝 −x,所以它自己的轉角是 −sun2 */
    poses(shaft, carrier, sun2) {
      const offset = [planet0.center[0] - x0, planet0.center[1], planet0.center[2]];
      const center = add([x0, 0, 0], rotateAbout(offset, X, carrier));
      // 行星相對行星架的自轉:(s1 − 行星架) 經咬合轉成行星繞自己的軸
      const spin = shaft - carrier;
      const rotation = quatMul(quatAxisAngle(X, carrier), quatMul(quatFromZ([0, -1, 0]), quatAxisAngle(Z, spin)));
      return {
        sun1: { angle: shaft },
        sun2: { angle: -sun2 },
        planet: { position: center, rotation },
      };
    },
  };
}
