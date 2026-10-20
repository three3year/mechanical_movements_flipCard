// 第 443 種:用阿基米德螺旋抽水,以水流為動力。輪的斜軸裡有一條貫穿的螺旋通道,下端浸在水裡;水流推動下端的輪使它旋轉,
// 水就沿螺旋通道不斷往上送,從頂端排出。
// 主動件是虛擬的「進程」:水流已帶著螺旋轉了幾圈。
// 推斷:螺旋通道做成斜筒(外殼)裡一片連到中心軸的螺旋葉片——原圖的筒是實心的、螺旋用虛線畫(藏在筒裡),這裡把外殼畫成
// 半透明(姿勢標 ghost),看得到裡面的葉片與水;每一圈葉片的最低處存著一團水,坐在葉片上,螺旋每轉一圈水往上移一個螺距;
// 頂端開口,水從開口的最低處流進岸上的水槽。
// 下端的輪照原圖:筒的下端一個大圓盤,圓盤後面的鼓上一圈放射狀的浮板。河水橫過輪面(維護者 2026-10-20 的決定 (a)):
// 流向和輪最低處浮板的運動同向,所以水流把輪推往把水往上送的方向。
// 斜軸的兩端各有一個軸承(推斷):下端立在河底的軸承座,上端岸上立柱伸出的托架;岸上另有立柱托著水槽。
import { TAU, X, Z, quatFromZ, quatMul, quatAxisAngle, quatRotate, norm, sub, scale, add, dot, cross } from "./kit.js";
import { stream } from "./flow.js";

export const AXIS = norm([-0.85, 0.48, -0.2]); // 斜軸方向(往上)
export const BASE = [1.6, -1.25, 0.4]; // 下端(圓盤)的中心
export const LENGTH = 4.4; // 筒的長度(局部 z 沿軸,0 在圓盤)
export const PITCH = 0.7;
export const R = 0.45; // 筒的外半徑
const WALL = 0.04;
export const SHAFT = { r: 0.12, z0: -1.2, z1: LENGTH + 0.55 }; // 中心軸(沿軸的範圍)
export const PADDLE = { r0: 0.5, r1: 1.25, count: 10, z0: -0.75, z1: -0.15 }; // 下端的輪:浮板的半徑範圍與沿軸的範圍
const BEARING_Z = [-1.1, LENGTH + 0.45]; // 兩個軸承環的中心(沿軸)
export const RIVER = -1.6;
export const BED = -2.85; // 河底(輪最低處離河底 0.14)
const BANK = -1.3; // 岸的高度
const SPEED = TAU * 0.9;

// 局部座標軸(quatFromZ 把局部 z 轉到 AXIS 時,局部 x、y 在世界的方向)
const q0 = quatFromZ(AXIS);
const localX = quatRotate(q0, X);
const localY = quatRotate(q0, [0, 1, 0]);
/** 垂直於軸、朝下的方向(筒內最低線的方向) */
export const DOWN = norm(sub([0, -1, 0], scale(AXIS, dot([0, -1, 0], AXIS))));
const TANGENT = norm(cross(AXIS, DOWN)); // 繞軸正轉時最低處的運動方向
/** 河水的流向:輪最低處的浮板轉動的方向(螺旋把水往上送時,pose 裡的轉角為負) */
export const FLOW = scale(TANGENT, -1);
const along = (z, r = 0) => add(add(BASE, scale(AXIS, z)), scale(DOWN, r));
const low = Math.atan2(dot(DOWN, localY), dot(DOWN, localX)); // 最低線在局部平面上的角

/** 螺旋轉 a(繞軸,往上看逆時針為正)→ 各團水沿軸的位置(葉片穿過最低線的 z) */
export function pockets(a) {
  // 葉片在局部角 θ 的 z 是 θ·PITCH/2π;轉了 a 之後世界角 θ + a 落在最低線 low 的那幾圈
  const out = [];
  for (let k = -1; k < LENGTH / PITCH + 1; k++) {
    const z = ((low - a) / TAU + k) * PITCH;
    if (z > 0.35 && z < LENGTH - 0.1) out.push(z);
  }
  return out;
}

/** 一團水的流體示意點:坐在葉片上(z 比葉片高 0.08–0.32)、貼著筒壁的最低線與兩側 */
export function pocketPoints(z) {
  const r = R - WALL - 0.1;
  const side = (s) => add(add(BASE, scale(AXIS, z + 0.2)), scale(add(scale(DOWN, Math.cos(0.35)), scale(TANGENT, s * Math.sin(0.35))), r));
  return [along(z + 0.08, r), along(z + 0.2, r), along(z + 0.32, r), side(1), side(-1)];
}

// 螺旋葉片:筒裡一片連到中心軸的螺旋面,用每圈 SLATS 片短板拼成(每片繞自己的半徑方向斜成螺旋角);右旋,θ = 2π z / PITCH
const SLATS = 30;
const BLADE_Z = [0.3, LENGTH - 0.1];
const BLADE = (() => {
  const rIn = SHAFT.r - 0.02; // 伸進中心軸 0.02,和軸連成一件
  const rOut = R - WALL;
  const mid = (rIn + rOut) / 2;
  const tilt = Math.atan(PITCH / (TAU * mid)); // 中半徑處的螺旋角
  const n = Math.round(((BLADE_Z[1] - BLADE_Z[0]) / PITCH) * SLATS);
  return Array.from({ length: n + 1 }, (_, i) => {
    const z = BLADE_Z[0] + ((BLADE_Z[1] - BLADE_Z[0]) * i) / n;
    const th = (TAU * z) / PITCH;
    return { kind: "box", size: [rOut - rIn, 0.1, 0.03], at: [mid * Math.cos(th), mid * Math.sin(th), z], rotation: quatMul(quatAxisAngle(Z, th), quatAxisAngle(X, tilt)), role: "blade" };
  });
})();

const EXIT = along(LENGTH, R - WALL - 0.06); // 頂端開口的最低處:水從這裡流出
const TROUGH = { x: [-3.6, -2.25], z: EXIT[2], floor: 0.17 }; // 岸上的水槽(槽底頂面的高度)
const lowerRing = along(BEARING_Z[0]);
const upperRing = along(BEARING_Z[1]);
const RING = { r: 0.2, length: 0.2 };
const ringDrop = RING.r * Math.abs(DOWN[1]) + (RING.length / 2) * Math.abs(AXIS[1]); // 軸承環最低點離環心的高度

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
        // 中心軸(兩端伸進軸承環)
        { kind: "cylinder", radius: SHAFT.r, length: SHAFT.z1 - SHAFT.z0, at: [0, 0, (SHAFT.z0 + SHAFT.z1) / 2], role: "shaft" },
        // 筒裡的螺旋葉片
        ...BLADE,
        // 下端的輪:筒下端的大圓盤(原圖)、圓盤後面的鼓、鼓上一圈放射狀的浮板、浮板外端的箍
        { kind: "cylinder", radius: PADDLE.r1, length: 0.08, at: [0, 0, 0] },
        { kind: "cylinder", radius: PADDLE.r0 + 0.05, length: PADDLE.z1 - PADDLE.z0, at: [0, 0, (PADDLE.z0 + PADDLE.z1) / 2] },
        { kind: "cylinder", radius: PADDLE.r1, inner: PADDLE.r1 - 0.06, length: 0.06, at: [0, 0, PADDLE.z0 - 0.03] },
        ...Array.from({ length: PADDLE.count }, (_, i) => {
          const a = (i * TAU) / PADDLE.count;
          const m = (PADDLE.r0 + PADDLE.r1) / 2;
          return { kind: "box", size: [PADDLE.r1 - PADDLE.r0, 0.05, PADDLE.z1 - PADDLE.z0], at: [m * Math.cos(a), m * Math.sin(a), (PADDLE.z0 + PADDLE.z1) / 2], angle: a, role: "paddle" };
        }),
      ],
    },
    {
      // 斜筒(外殼):筒壁、兩端的箍、下端連到中心軸的底板;頂端開口。跟著螺旋轉,畫成半透明(姿勢 ghost)看得到裡面
      id: "casing",
      kind: "lathe",
      axis: AXIS,
      center: BASE,
      profile: [[SHAFT.r, 0.1], [R + 0.05, 0.1], [R + 0.05, 0.2], [R, 0.2], [R, LENGTH - 0.1], [R + 0.05, LENGTH - 0.1], [R + 0.05, LENGTH], [R - WALL, LENGTH], [R - WALL, 0.16], [SHAFT.r, 0.16]],
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 河底與岸(推斷:岸在 −x 側高出水面,上端的托架與水槽立在岸上;河水沿 FLOW 橫過輪面)
        { kind: "box", size: [8.0, 0.3, 6.6], at: [0.3, BED - 0.15, 0] },
        { kind: "box", size: [3.0, BANK - BED + 0.05, 6.6], at: [-2.2, (BANK + BED) / 2 - 0.025, 0] },
        // 下端的軸承:立在河底的座與套著軸的環(推斷)
        { kind: "cylinder", radius: RING.r, inner: SHAFT.r, length: RING.length, axis: AXIS, at: lowerRing },
        { kind: "box", size: [0.32, lowerRing[1] - ringDrop + 0.03 - BED + 0.02, 0.32], at: [lowerRing[0], (lowerRing[1] - ringDrop + 0.03 + BED - 0.02) / 2, lowerRing[2]] },
        // 上端的軸承:岸上的立柱、伸向軸端的托架、套著軸的環(推斷,原圖左上角由岸上伸出的托架)
        { kind: "cylinder", radius: RING.r, inner: SHAFT.r, length: RING.length, axis: AXIS, at: upperRing },
        { kind: "box", size: [0.3, 0.3, 0.6], at: [upperRing[0] - 0.06, upperRing[1] - ringDrop + 0.03 - 0.15, upperRing[2] - 0.38] },
        { kind: "box", size: [0.22, upperRing[1] - ringDrop + 0.03 - BANK + 0.02, 0.22], at: [upperRing[0] - 0.06, (upperRing[1] - ringDrop + 0.03 + BANK - 0.02) / 2, upperRing[2] - 0.55] },
        // 岸上的水槽:槽底、兩側槽緣、靠筒那一端的擋板、立柱
        { kind: "box", size: [TROUGH.x[1] - TROUGH.x[0], 0.12, 0.7], at: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor - 0.06, TROUGH.z] },
        { kind: "box", size: [TROUGH.x[1] - TROUGH.x[0], 0.3, 0.05], at: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor + 0.03, TROUGH.z - 0.325] },
        { kind: "box", size: [TROUGH.x[1] - TROUGH.x[0], 0.3, 0.05], at: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor + 0.03, TROUGH.z + 0.325] },
        { kind: "box", size: [0.05, 0.3, 0.7], at: [TROUGH.x[1] - 0.025, TROUGH.floor + 0.03, TROUGH.z] },
        { kind: "box", size: [0.2, TROUGH.floor - 0.12 - BANK + 0.04, 0.2], at: [TROUGH.x[0] + 0.6, (TROUGH.floor - 0.12 + BANK) / 2 + 0.01, TROUGH.z] },
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [1.4, (RIVER + BED) / 2, 0], size: [4.2, RIVER - BED, 6.6], level: 1 },
    { id: "troughWater", kind: "fill", fluid: "water", center: [(TROUGH.x[0] + TROUGH.x[1]) / 2 - 0.02, TROUGH.floor + 0.05, TROUGH.z], size: [TROUGH.x[1] - TROUGH.x[0] - 0.1, 0.1, 0.6], level: 1 },
  ],
  powered: ["screw"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "screw",
  view: { direction: [0.6, 0.35, 0.8] }, // 斜軸與河水的流向都看得出:軸在畫面上斜向左上,河水斜向畫面深處
  pose(progress) {
    const a = -TAU * progress; // 水流推下端的輪,螺旋這個方向轉時水往上走
    const travel = progress * SPEED;
    const rotation = quatMul(q0, quatAxisAngle(Z, a));
    const water = pockets(a).flatMap(pocketPoints);
    const spill = [EXIT, [EXIT[0] - 0.08, EXIT[1] - 0.15, EXIT[2]], [EXIT[0] - 0.15, TROUGH.floor + 0.1, EXIT[2]], [TROUGH.x[0] + 0.1, TROUGH.floor + 0.1, EXIT[2]]];
    // 河水:兩道橫過輪面的流線,一道穿過輪的最低處,一道在它旁邊
    const bottom = along((PADDLE.z0 + PADDLE.z1) / 2, (PADDLE.r0 + PADDLE.r1) / 2);
    const line = (p) => [sub(p, scale(FLOW, 3.2)), add(p, scale(FLOW, 3.2))];
    const p1 = [bottom[0], RIVER - 0.15, bottom[2]];
    const p2 = sub(p1, scale(norm([FLOW[2], 0, -FLOW[0]]), 0.9));
    return {
      parts: { screw: { rotation }, casing: { rotation, ghost: true } },
      flows: [{ fluid: "water", points: [...water, ...stream(spill, travel, { spacing: 0.18 }), ...stream(line(p1), travel, { spacing: 0.3 }), ...stream(line(p2), travel, { spacing: 0.3 })] }],
      readouts: [{ label: "水團沿軸的位置", value: pockets(a).map((z) => z.toFixed(1)).join(" / ") }],
    };
  },
};
