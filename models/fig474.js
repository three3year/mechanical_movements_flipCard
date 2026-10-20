// 第 474 種:汽轉球,亞歷山大港的希羅在西元前 130 年描述的蒸汽玩具,被視為第一具蒸汽機,代表的是旋轉式引擎。
// 從下方的容器(鍋爐)升起兩根管子,把蒸汽導進上方的球,同時當球的樞軸;蒸汽從幾根彎曲的臂逸出,使球朝箭頭方向轉。
// 原理與第 438 種巴克氏水車相同。
// 主動件是虛擬的「進程」:球已轉了幾圈。
// 推斷:兩根管子在球的左右兩側,球繞水平軸轉;四根彎臂照原圖在球的上下左右(間隔 90°),噴口都朝同一個轉向的切線。
// 鍋爐有蓋(原圖的碗口上有蓋,兩根管立在蓋上;2026-10-20 補),管子穿過蓋伸進鍋爐;鍋爐與蓋剖開後半看得到水,
// 四隻腳都排在留下的後半(剖面的副作用:腳在剖掉的前半會懸空)。樞軸短管套進球兩側的軸頸(推斷:原圖的管端直接插進球)。
import { TAU, X, Y } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

const BOILER = { y: -0.9, r: 1.05 };
export const SPHERE = { center: [0, 1.0, 0], r: 0.62 };
const ARM_OUT = 0.3;
const ARMS = [0, 1, 2, 3].map((k) => (k * TAU) / 4); // 四根彎臂在轉動平面上的角度
const LID = { y0: 0.25, t: 0.08 }; // 蓋:坐在碗口頂(局部高度),厚 t
const PIPE = { x: 0.85, r: 0.05, bottom: BOILER.y + 0.15 }; // 兩根管子:穿過蓋、下端伸進鍋爐
const STUB = { r: 0.05, x0: SPHERE.r + 0.01, x1: PIPE.x - PIPE.r }; // 樞軸短管:從管子的側面往內伸到球面(留 0.01)
const NECK = { r: 0.1, collar: 0.05 }; // 球兩側的軸頸:套著短管的環,根部是嵌在球面裡的實心套環

/** 球轉 a(繞 +x)→ 四個噴口的位置與噴汽方向(與零件的畫法一致:彎臂先沿局部徑向伸出,再沿局部 −切線彎) */
export function nozzles(a) {
  // 零件的局部座標:z 是世界 x;局部 (x, y, z) → 世界 (z, y, −x),再繞世界 x 轉 a
  const toWorld = ([x, y, z]) => {
    const w = [z, y, -x];
    return [w[0], w[1] * Math.cos(a) - w[2] * Math.sin(a), w[1] * Math.sin(a) + w[2] * Math.cos(a)];
  };
  return ARMS.map((th) => {
    const u = [Math.cos(th), Math.sin(th)];
    const t = [-Math.sin(th), Math.cos(th)];
    const tip = toWorld([u[0] * (SPHERE.r + ARM_OUT) - t[0] * 0.235, u[1] * (SPHERE.r + ARM_OUT) - t[1] * 0.235, 0]);
    return { tip: [tip[0], tip[1] + SPHERE.center[1], tip[2]], dir: toWorld([-t[0], -t[1], 0]) };
  });
}

export default {
  figure: 474,
  parts: [
    {
      id: "boiler",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -0.55], [0.6, -0.5], [0.95, -0.25], [BOILER.r, 0.2], [BOILER.r + 0.1, LID.y0], [BOILER.r - 0.05, LID.y0], [0.88, -0.2], [0.58, -0.44], [0, -0.48]], at: [0, BOILER.y, 0], ...backHalf(Y) },
        // 蓋(推斷:原圖碗口上的蓋;剖開後半,和碗一起)
        { kind: "lathe", role: "lid", axis: Y, profile: [[0, LID.y0], [BOILER.r + 0.1, LID.y0], [BOILER.r + 0.1, LID.y0 + LID.t], [0, LID.y0 + LID.t]], at: [0, BOILER.y, 0], ...backHalf(Y) },
        // 四隻腳,都排在留下的後半(z < 0)
        ...[200, 250, 290, 340].map((deg) => ({ kind: "box", size: [0.06, 0.7, 0.06], at: [0.72 * Math.cos((deg * Math.PI) / 180), BOILER.y - 0.7, 0.72 * Math.sin((deg * Math.PI) / 180)] })),
        // 兩根管子(穿過蓋伸進鍋爐,頂到球心的高度)與樞軸短管(從管頂往內伸、套在球的軸頸裡)
        ...[1, -1].map((s) => ({ kind: "cylinder", role: "pipe", radius: PIPE.r, length: SPHERE.center[1] - PIPE.bottom, axis: Y, at: [s * PIPE.x, (SPHERE.center[1] + PIPE.bottom) / 2, 0] })),
        ...[1, -1].map((s) => ({ kind: "cylinder", role: "stub", radius: STUB.r, length: STUB.x1 - STUB.x0, axis: X, at: [s * ((STUB.x0 + STUB.x1) / 2), SPHERE.center[1], 0] })),
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
        // 四根彎臂(局部 z 是轉軸方向 = 世界 x;局部 x、y 在轉動平面):先沿徑向伸出,再沿 −切線彎,噴口都朝同一個轉向
        ...ARMS.flatMap((th, k) => {
          const u = [Math.cos(th), Math.sin(th)];
          const t = [-Math.sin(th), Math.cos(th)];
          return [
            { kind: "cylinder", radius: 0.05, length: ARM_OUT, axis: [u[0], u[1], 0], at: [u[0] * (SPHERE.r + ARM_OUT / 2), u[1] * (SPHERE.r + ARM_OUT / 2), 0], ...(k === 0 ? { accent: true } : {}) }, // 一根彎臂塗記號色
            { kind: "cylinder", radius: 0.05, length: 0.25, axis: [t[0], t[1], 0], at: [u[0] * (SPHERE.r + ARM_OUT) - t[0] * 0.11, u[1] * (SPHERE.r + ARM_OUT) - t[1] * 0.11, 0] },
          ];
        }),
        // 兩側的軸頸(推斷):嵌在球面裡的實心套環,外接套著樞軸短管的環(孔 = 短管半徑)
        ...[1, -1].flatMap((s) => [
          { kind: "cylinder", radius: NECK.r, length: NECK.collar, at: [0, 0, s * (STUB.x0 - NECK.collar / 2)] },
          { kind: "cylinder", radius: NECK.r, inner: STUB.r, length: STUB.x1 - STUB.x0, at: [0, 0, s * ((STUB.x0 + STUB.x1) / 2)] },
        ]),
      ],
    },
  ],
  powered: ["sphere"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.3 },
  target: "sphere",
  view: { direction: [0.55, 0.35, 1] },
  pose(progress) {
    const a = TAU * progress;
    const travel = progress * 10;
    const jets = nozzles(a).flatMap(({ tip, dir }) => stream(Array.from({ length: 6 }, (_, i) => [tip[0], tip[1] + dir[1] * i * 0.2, tip[2] + dir[2] * i * 0.2]), travel, { spacing: 0.14 }));
    const rising = [1, -1].flatMap((s) => stream([[s * PIPE.x, PIPE.bottom, 0], [s * PIPE.x, SPHERE.center[1], 0], [s * 0.6, SPHERE.center[1], 0]], travel, { spacing: 0.2 }));
    return {
      parts: { sphere: { angle: a } },
      flows: [{ fluid: "steam", points: [...rising, ...jets] }],
      readouts: [],
    };
  },
};
