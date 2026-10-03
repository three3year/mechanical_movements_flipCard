// 第 433 種:水平式上射水車。原文只有名稱。
// 推斷(依原圖):直立軸的下端裝一個水平的輪,輪周一圈斜置的葉片;右上方的斜槽把水射到葉片上,
// 水的衝力與重量推著葉片,輪與直立軸一起轉,水從葉片之間落下。直立軸的上端由橫樑上的軸承扶著。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。
import { TAU, Y, quatAxisAngle, quatMul, polar } from "./kit.js";
import { stream } from "./flow.js";

const VANES = 18;
const R = { hub: 0.42, vane: 1.6 };
export const WHEEL_Y = -1.0;
const TILT = 0.55; // 葉片繞自己的半徑方向斜置
const SPEED = TAU * 1.2;

// 葉片:半徑方向的斜板(局部 x 沿半徑);繞 y 排一圈
const vanes = Array.from({ length: VANES }, (_, i) => {
  const a = (i * TAU) / VANES;
  const mid = (R.hub + R.vane) / 2;
  return {
    kind: "box",
    size: [R.vane - R.hub, 0.5, 0.05],
    at: [mid * Math.cos(a), 0, -mid * Math.sin(a)],
    rotation: quatMul(quatAxisAngle(Y, a), quatAxisAngle([1, 0, 0], TILT)),
  };
});

// 水:沿斜槽流下,射到右前方的葉片上,再從輪下落
const SPOUT = [[3.0, 1.9, 0.6], [1.35, -0.55, 0.6]];
export const JET = [...SPOUT, [1.2, WHEEL_Y + 0.15, 0.62]];
const FALLS = [0, 1, 2].map((k) => {
  const p = polar(1.15 + 0.15 * k, -0.2 - 0.32 * k);
  return [[p[0], WHEEL_Y - 0.25, -p[1]], [p[0] + 0.05, -2.4, -p[1]]];
});

export default {
  figure: 433,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [5.0, 0.2, 0.5], at: [0, 2.9, 0] },
        { kind: "box", size: [0.9, 0.18, 0.5], at: [0, 2.7, 0] },
        { kind: "cylinder", radius: 0.16, length: 0.3, axis: Y, at: [0, 2.48, 0] },
        // 斜槽
        { kind: "box", size: [3.0, 0.1, 0.3], at: [(SPOUT[0][0] + SPOUT[1][0]) / 2, (SPOUT[0][1] + SPOUT[1][1]) / 2 - 0.08, 0.6], angle: Math.atan2(SPOUT[0][1] - SPOUT[1][1], SPOUT[0][0] - SPOUT[1][0]) },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      center: [0, WHEEL_Y, 0],
      spin: R.vane + 0.15,
      pieces: [
        // 局部 z 是直立方向
        { kind: "cylinder", radius: 0.11, length: 3.45, at: [0, 0, 1.72] },
        { kind: "cylinder", radius: R.hub, length: 0.4 },
        { kind: "cylinder", radius: 0.22, length: 0.25, at: [0, 0, 0.32] },
      ],
    },
    { id: "vanes", kind: "group", center: [0, WHEEL_Y, 0], arrow: false, pieces: vanes },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "wheel",
  view: { direction: [0.35, 0.45, 1] },
  pose(progress) {
    const a = TAU * progress; // 繞 +y 轉(從上往下看逆時針)
    const travel = progress * SPEED;
    return {
      parts: {
        wheel: { angle: a },
        vanes: { rotation: quatAxisAngle(Y, a) },
      },
      flows: [{ fluid: "water", points: [...stream(JET, travel, { spacing: 0.18 }), ...FALLS.flatMap((f) => stream(f, travel, { spacing: 0.22 }))] }],
      readouts: [],
    };
  },
};
