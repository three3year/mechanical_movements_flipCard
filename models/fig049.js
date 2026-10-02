// 第 49 種:水平軸的往復圓周運動,透過連在斜齒輪上的棘輪,使直立軸連續旋轉。
// 兩個斜齒輪與它們的棘輪都鬆套在水平軸上,兩棘輪的齒方向相反;棘爪裝在固定於軸上的搖臂上,
// 也朝相反方向作動。軸往一個方向擺時,左棘爪帶動左斜齒輪;擺回來時右棘爪帶動右斜齒輪。
// 兩個斜齒輪都與上方直立軸的斜齒輪咬合、彼此反向轉,所以上方的輪始終朝同一方向轉。
// 主動量是水平軸的累計擺動量(見 kit.swing):左斜齒輪的轉角就等於它。
import { X, Y, deg, swingPhase, planeBasis, add, scale } from "./kit.js";
import { meshAngle, bevelGear, bevelContact } from "./gears.js";
import { ratchetShape, stadium, circle } from "./shapes.js";
import { pawlRest } from "./ratchets.js";

const SWING = deg(40); // 搖臂來回的角度
const M = 0.072;
const N = 40;
const APEX = [0, 0, 0];
export const LEFT = bevelGear({ apex: APEX, axis: [1, 0, 0], teeth: N, radius: (N * M) / 2, cone: Math.PI / 4, width: 0.6 });
export const RIGHT = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: N, radius: (N * M) / 2, cone: Math.PI / 4, width: 0.6 });
export const TOP = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: N, radius: (N * M) / 2, cone: Math.PI / 4, width: 0.6 });
const CONTACT_L = bevelContact(LEFT, TOP);
const CONTACT_R = bevelContact(RIGHT, TOP);
const RATCHET = { teeth: 24, outer: 0.72, inner: 0.6 };
const RX = 2.0; // 棘輪所在平面(左右對稱)
const ARM = { pivot: 0.92, length: 0.5 }; // 棘爪樞軸離軸心的距離、棘爪長

// 棘輪平面上的 2D 座標(繪圖層的局部 x、y)與世界座標的對應:軸沿 +x 時局部 x → 世界 −z
const toWorld = (x0, [u, v]) => {
  const [bu, bv] = planeBasis(X);
  return add([x0, 0, 0], add(scale(bu, u), scale(bv, v)));
};

/** 主動量 v(累計擺動)→ 軸的轉角、左右斜齒輪與上輪的轉角 */
export function motion(v) {
  const { at: shaft } = swingPhase(v, -SWING / 2, SWING / 2);
  const left = v - SWING / 2; // 累計擺動量:往正方向擺時左輪跟著軸,往回擺時左輪由上輪帶著繼續同向轉
  const top = meshAngle(LEFT, TOP, left, CONTACT_L);
  const right = meshAngle(TOP, RIGHT, top, CONTACT_R);
  return { shaft, left, right, top };
}

// 棘爪(在棘輪的局部平面內):樞軸在搖臂上(隨軸轉),爪尖靠在棘輪面上
function pawl(shaft, wheelAngle, dir) {
  const a = shaft + Math.PI / 2;
  const pivot = [ARM.pivot * Math.cos(a), ARM.pivot * Math.sin(a), 0];
  // dir = +1:爪尖在樞軸逆時針前方,推輪逆時針;−1 鏡像
  const from = a + dir * (Math.PI / 2 - deg(35));
  return { pivot, ...pawlRest({ pivot, length: ARM.length, from, into: dir, sweep: 1.4 }, { center: [0, 0], angle: wheelAngle, ...RATCHET, dir }) };
}

const bevel = (id, g, extra) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  ...extra,
});

const ratchet = (id, x, dir) => ({
  id,
  kind: "plate",
  axis: X,
  center: [x, 0, 0],
  shape: ratchetShape({ ...RATCHET, dir, bore: 0.12 }),
  thickness: 0.18,
  arrow: false,
});

const arm = (x) => ({ kind: "plate", shape: stadium(ARM.pivot, 0.14, 0.05), thickness: 0.06, at: [0, 0, x], angle: Math.PI / 2 });
const pawlPart = (id) => ({
  id,
  kind: "plate",
  axis: X,
  shape: { outline: [[-0.06, 0.05], [ARM.length * 0.5, 0.07], [ARM.length, 0], [ARM.length * 0.5, -0.02], [-0.06, -0.05]], holes: [] },
  thickness: 0.1,
  pieces: [{ kind: "cylinder", radius: 0.05, length: 0.16 }],
  arrow: false,
});

export default {
  figure: 49,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: X,
      posed: false,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 5.6 }, arm(-RX + 0.16), arm(RX - 0.16)],
      spin: 1.0,
      spinOffset: RX,
    },
    bevel("left", LEFT, { pieces: [{ kind: "cylinder", radius: 0.3, length: 0.75, at: [0, 0, -0.65] }] }),
    bevel("right", RIGHT, { pieces: [{ kind: "cylinder", radius: 0.3, length: 0.75, at: [0, 0, -0.65] }] }),
    bevel("top", TOP, { pieces: [{ kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -0.9] }] }),
    ratchet("ratchetL", -RX, 1),
    ratchet("ratchetR", RX, -1),
    pawlPart("pawlL"),
    pawlPart("pawlR"),
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.18, 2.0, 0.5], at: [s * 2.45, -0.7, 0] },
          { kind: "box", size: [0.7, 0.12, 0.8], at: [s * 2.45, -1.72, 0] },
        ]),
        { kind: "box", size: [6.2, 0.06, 1.4], at: [0, -1.8, 0] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  view: { direction: [0.05, 0.22, 1], fov: 20 },
  pose(v) {
    const { shaft, left, right, top } = motion(v);
    // 右棘輪的局部平面朝 +x 看與左邊相同(都以軸 +x 為法線),右輪的轉角也繞 +x 量:右斜齒輪的軸朝 −x
    const pl = pawl(shaft, left, 1);
    const pr = pawl(shaft, -right, -1);
    return {
      parts: {
        shaft: { angle: shaft },
        left: { angle: left },
        right: { angle: right },
        top: { angle: top },
        ratchetL: { angle: left },
        ratchetR: { angle: -right },
        pawlL: { position: toWorld(-RX + 0.02, pl.pivot), angle: pl.angle },
        pawlR: { position: toWorld(RX - 0.02, pr.pivot), angle: pr.angle },
      },
      readouts: [],
    };
  },
};
