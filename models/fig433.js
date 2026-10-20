// 第 433 種:水平式上射水車。原文只有名稱。
// 推斷(依原圖):直立軸的下端裝一個水平的輪,輪周一圈斜置的葉片;右上方的斜槽把水射到葉片上,
// 水的衝力與重量推著葉片,輪與直立軸一起轉,水從葉片之間落下。直立軸的上端由橫樑上的軸承扶著。
// 轉向:原圖沒有箭頭。葉片的斜向(頂往順時針側傾)讓水沿葉片往下滑時往逆時針側走,反作用力推輪順時針;
// 斜槽的水柱打在右前方的葉片上、水平分量往 −x,也是順著順時針的走向——所以輪從上往下看順時針轉(維護者 2026-10-20 決定)。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。
import { TAU, X, Y, Z, quatAxisAngle, quatMul, polar } from "./kit.js";
import { stream } from "./flow.js";

const VANE_COUNT = 18;
const R = { hub: 0.42, vane: 1.6 };
export const WHEEL_Y = -1.0;
const TILT = 0.55; // 葉片繞自己的半徑方向斜置(頂往順時針側傾)
const SPEED = TAU * 1.2;

// 葉片:輪上的一圈斜板,內端貼著輪轂。輪群組的局部座標 z 朝上(axis 是 Y):局部 x 沿半徑、y 是板厚、z 沿板高,
// 先繞半徑方向傾 TILT 再轉到各自的角度
export const VANES = Array.from({ length: VANE_COUNT }, (_, i) => {
  const a = (i * TAU) / VANE_COUNT;
  const mid = (R.hub + R.vane) / 2;
  return {
    kind: "box",
    size: [R.vane - R.hub, 0.05, 0.5],
    at: [mid * Math.cos(a), mid * Math.sin(a), 0],
    rotation: quatMul(quatAxisAngle(Z, a), quatAxisAngle(X, TILT)),
  };
});

// 水:沿斜槽流下,射到右前方的葉片上,再從輪下落(落點順著輪的轉向往前方散開)
const SPOUT = [[3.0, 1.9, 0.6], [1.35, -0.55, 0.6]];
export const JET = [...SPOUT, [1.2, WHEEL_Y + 0.15, 0.62]];
const FALLS = [0, 1, 2].map((k) => {
  const p = polar(1.15 + 0.15 * k, -0.45 - 0.3 * k);
  return [[p[0], WHEEL_Y - 0.25, -p[1]], [p[0] + 0.05, -2.4, -p[1]]];
});

export default {
  figure: 433,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 橫樑(兩端伸出畫面,原圖也是)、掛在樑底的軸承座塊、軸承
        { kind: "box", size: [5.0, 0.2, 0.5], at: [0, 2.9, 0] },
        { kind: "box", size: [0.9, 0.18, 0.5], at: [0, 2.71, 0] },
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
        ...VANES,
      ],
    },
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "wheel",
  view: { direction: [0.35, 0.45, 1] },
  pose(progress) {
    const a = -TAU * progress; // 繞 +y 反轉(從上往下看順時針)
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: a } },
      flows: [{ fluid: "water", points: [...stream(JET, travel, { spacing: 0.18 }), ...FALLS.flatMap((f) => stream(f, travel, { spacing: 0.22 }))] }],
      readouts: [],
    };
  },
};
