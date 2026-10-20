// 第 438 種:巴克氏水車(反作用式水車)。中央的空心軸靠水從臂的末端噴出時的反作用力旋轉,轉向與水噴出的方向相反。
// 主動件是虛擬的「進程」:水已帶著軸轉了幾圈。
// 推斷(依原圖):水從右上的水管流進軸頂的漏斗,沿空心軸流到下端十字交叉的兩根橫管(四個噴口,都朝同一個轉動方向彎),
// 從臂端朝切線方向的噴口噴出;軸的下端收成尖頂、立在底座上,上端由牆上伸出的托架扶著。
// 2026-10-20:臂併進軸(同一件);尖頂接在軸底;底座與牆立在同一塊地板上(推斷)。
import { TAU, Y } from "./kit.js";
import { stream } from "./flow.js";

export const ARM = 1.6; // 臂長(軸心到噴口)
const ARM_Y = -1.2;
const NOZZLE = 0.25; // 噴口離臂的中線(切線方向)
const TIP = { top: ARM_Y - 0.35, height: 0.45 }; // 尖頂:頂面(接在軸底)的高度與高
const FLOOR_TOP = -2.3; // 地板的頂面(牆與底座都立在上面)
const SPEED = TAU * 1.0;
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
// 四個臂端的平面角(軸的局部座標:z 直立、y 是世界的 −z)
const ENDS = [0, 1, 2, 3].map((k) => (k * Math.PI) / 2);
const radial = (phi) => [Math.cos(phi), Math.sin(phi)];
const tangent = (phi) => [-Math.sin(phi), Math.cos(phi)]; // 逆時針的切線方向(繞局部 z)

/** 軸轉 a(繞 +y)→ 四個噴口的位置與噴水方向(切線方向;世界座標) */
export function nozzles(a) {
  return ENDS.map((phi) => {
    const e = radial(phi);
    const t = tangent(phi);
    const local = [ARM * e[0] + NOZZLE * t[0], ARM * e[1] + NOZZLE * t[1]];
    // 局部 (x, y, z) → 世界 (x, z, −y)
    const tip = rotY([local[0], ARM_Y, -local[1]], a);
    const dir = rotY([t[0], 0, -t[1]], a);
    return { tip, dir };
  });
}

const FEED = [[3.0, 2.9, 0], [1.2, 2.45, 0], [0.45, 2.05, 0], [0.05, 1.55, 0]];

export default {
  figure: 438,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", role: "wall", size: [0.25, 5.4, 1.4], at: [2.7, 0.4, -0.4] },
        // 托架(從牆上伸出,扶著軸的上端)
        { kind: "box", size: [2.7, 0.1, 0.12], at: [1.4, 1.05, 0] },
        { kind: "cylinder", radius: 0.2, length: 0.12, axis: Y, at: [0, 1.05, 0] },
        // 地板(推斷)與尖頂的底座
        { kind: "box", role: "floor", size: [3.55, 0.1, 1.8], at: [1.05, FLOOR_TOP - 0.05, -0.2] },
        { kind: "box", role: "base", size: [0.7, TIP.top - TIP.height - FLOOR_TOP, 0.7], at: [0, (TIP.top - TIP.height + FLOOR_TOP) / 2, 0] },
        // 水管
        { kind: "box", size: [2.6, 0.12, 0.12], at: [1.65, 2.8, 0], angle: 0.25 },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      axis: Y,
      center: [0, 0, 0],
      spin: 0.4,
      pieces: [
        // 局部 z 是直立方向;軸從尖頂的頂面到漏斗
        { kind: "cylinder", role: "shaft", radius: 0.16, length: 1.3 - TIP.top, at: [0, 0, (1.3 + TIP.top) / 2] },
        { kind: "lathe", profile: [[0.12, 0], [0.75, 0.75], [0.8, 0.8], [0.18, 0.05]], axis: [0, 0, 1], at: [0, 0, 1.3] },
        { kind: "lathe", role: "tip", profile: [[0, -TIP.height], [0.16, 0]], axis: [0, 0, 1], at: [0, 0, TIP.top] },
        { kind: "cylinder", radius: 0.2, length: 0.3, at: [0, 0, ARM_Y] },
        // 兩根橫管十字交叉穿過軸,臂端彎向切線方向的噴口(裝在軸上,跟著轉)
        { kind: "cylinder", role: "arm", radius: 0.08, length: 2 * ARM, axis: [1, 0, 0], at: [0, 0, ARM_Y] },
        { kind: "cylinder", role: "arm", radius: 0.08, length: 2 * ARM, axis: [0, 1, 0], at: [0, 0, ARM_Y] },
        ...ENDS.map((phi) => {
          const e = radial(phi);
          const t = tangent(phi);
          return { kind: "cylinder", role: "nozzle", radius: 0.07, length: 0.3, axis: [t[0], t[1], 0], at: [ARM * e[0] + 0.12 * t[0], ARM * e[1] + 0.12 * t[1], ARM_Y] };
        }),
      ],
    },
  ],
  powered: ["shaft"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.2 },
  target: "shaft",
  view: { direction: [0.2, 0.35, 1] },
  pose(progress) {
    // 噴口朝 -z(右臂)噴水,反作用力把右臂推向 +z:繞 +y 為負
    const a = -TAU * progress;
    const travel = progress * SPEED;
    const jets = nozzles(a).flatMap(({ tip, dir }) => {
      const path = Array.from({ length: 8 }, (_, i) => {
        const s = i / 7;
        return [tip[0] + dir[0] * s * 1.2, tip[1] - s * s * 0.9, tip[2] + dir[2] * s * 1.2];
      });
      return stream(path, travel * 2, { spacing: 0.16 });
    });
    return {
      parts: { shaft: { angle: a } },
      flows: [{ fluid: "water", points: [...stream(FEED, travel, { spacing: 0.2 }), ...jets] }],
      readouts: [],
    };
  },
};
