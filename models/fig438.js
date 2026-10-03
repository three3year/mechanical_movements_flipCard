// 第 438 種:巴克氏水車(反作用式水車)。中央的空心軸靠水從臂的末端噴出時的反作用力旋轉,轉向與水噴出的方向相反。
// 主動件是虛擬的「進程」:水已帶著軸轉了幾圈。
// 推斷(依原圖):水從右上的水管流進軸頂的漏斗,沿空心軸流到下端的兩根橫臂,從臂端朝切線方向的噴口噴出;
// 軸的下端尖頂立在底座上,上端由牆上伸出的托架扶著。
import { TAU, Y, polar } from "./kit.js";
import { stream } from "./flow.js";

export const ARM = 1.6; // 臂長(軸心到噴口)
const ARM_Y = -1.2;
const SPEED = TAU * 1.0;
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];

/** 軸轉 a(繞 +y)→ 兩個噴口的位置與噴水方向(切線方向) */
export function nozzles(a) {
  return [1, -1].map((s) => {
    const tip = rotY([s * ARM, ARM_Y, s * -0.25], a);
    const dir = rotY([0, 0, -s], a);
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
        { kind: "box", size: [0.25, 5.4, 1.4], at: [2.7, 0.4, -0.4] },
        // 托架(從牆上伸出,扶著軸的上端)
        { kind: "box", size: [2.7, 0.1, 0.12], at: [1.4, 1.05, 0] },
        { kind: "cylinder", radius: 0.2, length: 0.12, axis: Y, at: [0, 1.05, 0] },
        // 底座與尖頂的座
        { kind: "box", size: [0.7, 0.25, 0.7], at: [0, -2.25, 0] },
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
        // 局部 z 是直立方向
        { kind: "cylinder", radius: 0.16, length: 2.6, at: [0, 0, 0.0] },
        { kind: "lathe", profile: [[0.12, 0], [0.75, 0.75], [0.8, 0.8], [0.18, 0.05]], axis: [0, 0, 1], at: [0, 0, 1.3] },
        { kind: "lathe", profile: [[0, -0.45], [0.16, 0]], axis: [0, 0, 1], at: [0, 0, ARM_Y - 0.47] },
        { kind: "cylinder", radius: 0.2, length: 0.3, at: [0, 0, ARM_Y] },
      ],
    },
    {
      id: "arms",
      kind: "group",
      center: [0, ARM_Y, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 2 * ARM, axis: [1, 0, 0] },
        // 臂端彎向切線方向的噴口
        { kind: "cylinder", radius: 0.07, length: 0.3, axis: [0, 0, 1], at: [ARM, 0, -0.12] },
        { kind: "cylinder", radius: 0.07, length: 0.3, axis: [0, 0, 1], at: [-ARM, 0, 0.12] },
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.2 },
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
      parts: {
        shaft: { angle: a },
        arms: { rotation: [0, Math.sin(a / 2), 0, Math.cos(a / 2)] },
      },
      flows: [{ fluid: "water", points: [...stream(FEED, travel, { spacing: 0.2 }), ...jets] }],
      readouts: [],
    };
  },
};
