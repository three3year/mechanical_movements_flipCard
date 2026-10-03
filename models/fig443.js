// 第 443 種:用阿基米德螺旋抽水,以水流為動力。輪的斜軸裡有一條貫穿的螺旋通道,下端浸在水裡;水流推動下端的輪使它旋轉,
// 水就沿螺旋通道不斷往上送,從頂端排出。
// 主動件是虛擬的「進程」:水流已帶著螺旋轉了幾圈。
// 推斷:螺旋通道以斜筒表面上的螺旋線表示(筒壁不畫,看得到裡面的水);每一圈通道最低處存著一團水,螺旋每轉一圈,水往上移一個螺距;
// 頂端的水流進左上方的水槽。
import { TAU, quatFromZ, quatMul, quatAxisAngle, quatRotate, norm, sub, scale, add, dot } from "./kit.js";
import { stream } from "./flow.js";

export const AXIS = norm([-0.85, 0.48, -0.2]); // 斜軸方向(往上)
export const BASE = [1.6, -1.25, 0.4]; // 下端(輪)的中心
export const LENGTH = 4.4;
export const PITCH = 0.7;
const R = 0.45;
const PADDLE = { r0: 0.55, r1: 1.25, count: 10 };
export const RIVER = -1.6;
const SPEED = TAU * 0.9;

// 螺旋線(局部 z 沿軸)
const helix = Array.from({ length: 241 }, (_, i) => {
  const z = 0.3 + ((LENGTH - 0.4) * i) / 240;
  const a = (TAU * z) / PITCH;
  return [(R + 0.01) * Math.cos(a), (R + 0.01) * Math.sin(a), z];
});

// 筒內最低處的方向(垂直於軸、朝下)
const down = norm(sub([0, -1, 0], scale(AXIS, dot([0, -1, 0], AXIS))));
const along = (z, r = 0) => add(add(BASE, scale(AXIS, z)), scale(down, r));

/** 螺旋轉 a(繞軸,往上看逆時針為正)→ 各團水沿軸的位置 */
export function pockets(a) {
  // 螺旋線在最低處的相位:局部角 = 2π z / PITCH + a = 最低處的角
  const low = Math.atan2(dot(down, localY), dot(down, localX));
  const out = [];
  for (let k = -1; k < LENGTH / PITCH + 1; k++) {
    const z = ((low - a) / TAU + k) * PITCH;
    if (z > 0.35 && z < LENGTH - 0.1) out.push(z);
  }
  return out;
}
// 局部座標軸(quatFromZ 把局部 z 轉到 AXIS 時,局部 x、y 在世界的方向)
const q0 = quatFromZ(AXIS);
const localX = quatRotate(q0, [1, 0, 0]);
const localY = quatRotate(q0, [0, 1, 0]);
const TOP = along(LENGTH);

export default {
  figure: 443,
  parts: [
    {
      id: "screw",
      kind: "group",
      axis: AXIS,
      center: BASE,
      spin: PADDLE.r1 + 0.15,
      pieces: [
        // 螺旋通道(畫成筒壁上的螺旋,看得到裡面的水)、兩端的箍與中心軸
        { kind: "tube", points: helix, radius: 0.05 },
        { kind: "cylinder", radius: R + 0.02, inner: R - 0.04, length: 0.12, at: [0, 0, 0.32] },
        { kind: "cylinder", radius: R + 0.02, inner: R - 0.04, length: 0.12, at: [0, 0, LENGTH - 0.06] },
        { kind: "cylinder", radius: 0.12, length: LENGTH + 0.8, at: [0, 0, LENGTH / 2] },
        // 下端的輪:兩圈輪緣與放射的浮板
        { kind: "cylinder", radius: PADDLE.r1, inner: PADDLE.r1 - 0.06, length: 0.06, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: PADDLE.r1, inner: PADDLE.r1 - 0.06, length: 0.06, at: [0, 0, 0.55] },
        ...Array.from({ length: PADDLE.count }, (_, i) => {
          const a = (i * TAU) / PADDLE.count;
          const m = (PADDLE.r0 + PADDLE.r1) / 2;
          return { kind: "box", size: [PADDLE.r1 - PADDLE.r0 + 0.1, 0.04, 0.6], at: [m * Math.cos(a), m * Math.sin(a), 0.3], angle: a };
        }),
      ],
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "box", size: [7.0, 0.3, 3.0], at: [0, -2.4, 0] },
        // 上端的軸承架與水槽
        { kind: "box", size: [0.2, 1.4, 0.2], at: [TOP[0] - 0.3, TOP[1] - 0.6, TOP[2] - 0.1] },
        { kind: "box", size: [1.6, 0.12, 0.7], at: [TOP[0] - 0.5, TOP[1] - 0.6, TOP[2]] },
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [0.8, (RIVER - 2.25) / 2, 0], size: [5.4, RIVER + 2.25, 2.8], level: 1 },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  view: { direction: [0.35, 0.3, 1] },
  pose(progress) {
    const a = -TAU * progress; // 水流推下端的輪,螺旋這個方向轉時水往上走
    const travel = progress * SPEED;
    const water = pockets(a).flatMap((z) => [-0.12, 0, 0.12].map((dz) => along(z + dz, R - 0.12)));
    const top = along(LENGTH, R - 0.1);
    const spill = [top, [top[0] - 0.2, top[1] - 0.5, top[2]], [top[0] - 1.0, top[1] - 0.48, top[2]]];
    return {
      parts: { screw: { rotation: quatMul(q0, quatAxisAngle([0, 0, 1], a)) } },
      flows: [{ fluid: "water", points: [...water, ...stream(spill, travel, { spacing: 0.18 }), ...stream([[3.4, RIVER - 0.2, 1.3], [-1.6, RIVER - 0.2, 1.3]], travel, { spacing: 0.3 })] }],
      readouts: [{ label: "水團沿軸的位置", value: pockets(a).map((z) => z.toFixed(1)).join(" / ") }],
    };
  },
};
