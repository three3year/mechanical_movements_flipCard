// 第 474 種:汽轉球,亞歷山大港的希羅在西元前 130 年描述的蒸汽玩具,被視為第一具蒸汽機,代表的是旋轉式引擎。
// 從下方的容器(鍋爐)升起兩根管子,把蒸汽導進上方的球,同時當球的樞軸;蒸汽從幾根彎曲的臂逸出,使球朝箭頭方向轉。
// 原理與第 438 種巴克氏水車相同。
// 主動件是虛擬的「進程」:球已轉了幾圈。
// 推斷:兩根管子在球的左右兩側,球繞水平軸轉;兩根彎臂在球的上下,噴口朝相反的切線方向。
import { TAU, X, Y } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

const BOILER = { y: -0.9, r: 1.05 };
export const SPHERE = { center: [0, 1.0, 0], r: 0.62 };
const ARM_OUT = 0.3;

/** 球轉 a(繞 +x)→ 兩個噴口的位置與噴汽方向(與零件的畫法一致:彎臂先沿局部 x 伸出,再沿局部 ∓y 彎) */
export function nozzles(a) {
  // 零件的局部座標:z 是世界 x;局部 (x, y, z) → 世界 (z, y, −x),再繞世界 x 轉 a
  const toWorld = ([x, y, z]) => {
    const w = [z, y, -x];
    return [w[0], w[1] * Math.cos(a) - w[2] * Math.sin(a), w[1] * Math.sin(a) + w[2] * Math.cos(a)];
  };
  return [1, -1].map((s) => {
    const t = toWorld([s * (SPHERE.r + ARM_OUT), -s * 0.235, 0]);
    return { tip: [t[0], t[1] + SPHERE.center[1], t[2]], dir: toWorld([0, -s, 0]) };
  });
}

export default {
  figure: 474,
  parts: [
    {
      id: "boiler",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -0.55], [0.6, -0.5], [0.95, -0.25], [BOILER.r, 0.2], [BOILER.r + 0.1, 0.25], [BOILER.r - 0.05, 0.25], [0.88, -0.2], [0.58, -0.44], [0, -0.48]], at: [0, BOILER.y, 0], ...backHalf(Y) },
        // 四隻腳、兩根管子(兼樞軸)
        ...[[0.6, 0.4], [-0.6, 0.4], [0.6, -0.4], [-0.6, -0.4]].map(([x, z]) => ({ kind: "box", size: [0.06, 0.7, 0.06], at: [x, BOILER.y - 0.7, z] })),
        ...[1, -1].map((s) => ({ kind: "cylinder", radius: 0.05, length: SPHERE.center[1] - BOILER.y - 0.2, axis: Y, at: [s * 0.85, (SPHERE.center[1] + BOILER.y + 0.2) / 2, 0] })),
        ...[1, -1].map((s) => ({ kind: "cylinder", radius: 0.05, length: 0.2, axis: X, at: [s * 0.75, SPHERE.center[1], 0] })),
      ],
    },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, BOILER.y - 0.15, 0], size: [1.5, 0.5, 0], level: 0.8 },
    {
      id: "sphere",
      kind: "group",
      axis: X,
      center: SPHERE.center,
      spin: SPHERE.r + 0.15,
      pieces: [
        { kind: "sphere", radius: SPHERE.r },
        // 兩根彎臂(局部 z 是轉軸方向 = 世界 x;局部 x、y 在轉動平面)
        ...[1, -1].flatMap((s) => [
          { kind: "cylinder", radius: 0.05, length: ARM_OUT, axis: [1, 0, 0], at: [s * (SPHERE.r + ARM_OUT / 2), 0, 0] },
          { kind: "cylinder", radius: 0.05, length: 0.25, axis: [0, 1, 0], at: [s * (SPHERE.r + ARM_OUT), -s * 0.11, 0] },
        ]),
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.3 },
  target: "sphere",
  view: { direction: [0.55, 0.35, 1] },
  pose(progress) {
    const a = TAU * progress;
    const travel = progress * 10;
    const jets = nozzles(a).flatMap(({ tip, dir }) => stream(Array.from({ length: 6 }, (_, i) => [tip[0], tip[1] + dir[1] * i * 0.2, tip[2] + dir[2] * i * 0.2]), travel, { spacing: 0.14 }));
    const rising = [1, -1].flatMap((s) => stream([[s * 0.85, BOILER.y + 0.25, 0], [s * 0.85, SPHERE.center[1], 0], [s * 0.6, SPHERE.center[1], 0]], travel, { spacing: 0.2 }));
    return {
      parts: { sphere: { angle: a } },
      flows: [{ fluid: "steam", points: [...rising, ...jets] }],
      readouts: [],
    };
  },
};
