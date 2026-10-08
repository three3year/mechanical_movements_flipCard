// 第 110 種:捲線機上導引線繞到線軸的機構,把均勻的圓周運動轉換為均勻的直線運動。
// 上方的滾軸分兩段,各切細螺紋,左段右旋、右段左旋。下方與滾軸平行的心軸上有兩支搖臂,
// 各承載一個半螺帽,一個從上方、一個從下方扣在螺紋上;一個嚙合時另一個脫離。
// 把右端的槓桿往左或往右扳,心軸轉一點、換另一個半螺帽嚙合,心軸(連同搖臂)就朝相反方向橫移。
// 主動件是滾軸(在行程內往返);狀態是槓桿的位置。
//
// 半螺帽怎麼切換(2026-10-08 複查:原本心軸畫在滾軸正下方,搖臂轉一點只是把半螺帽往旁邊挪,看不出哪個扣上了):
// 心軸放在滾軸的下方偏前,兩支搖臂從心軸立起、再彎到滾軸的正上方 / 正下方托著半螺帽。心軸轉一點時,
// 兩個半螺帽都繞心軸往同一個方向擺——心軸偏在前面,這個方向對上方的半螺帽是往下壓到螺紋上、
// 對下方的半螺帽是往下離開螺紋;反過來轉就換下方的扣上、上方的抬開。半螺帽是扣住螺紋 90° 的鞍形塊。
import { X, deg, TAU, screwAdvance } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";

const PITCH = 0.16;
const ROLLER = { y: 1.25, radius: 0.3 };
const SPINDLE = { y: -0.4, z: 0.75 }; // 心軸:在滾軸下方、偏前
const ARMS = { left: -1.0, right: 0.75 }; // 兩支搖臂的 x 位置(左臂托上方的半螺帽,右臂托下方的)
const TURNS = 4; // 行程:螺帽橫移到底仍在螺紋段內、搖臂碰不到機架
const TILT = deg(7); // 心軸轉這麼多切換半螺帽:脫離的那個離開螺紋約 0.09
const NUT = { radius: ROLLER.radius + 0.02, half: Math.PI / 4, length: 0.6, body: 0.75 }; // 鞍形塊:扣住 ±45°,塊高 0.75

/** 滾軸轉 angle、槓桿在 state:心軸的橫移量 */
export const traverse = (angle, state) => (state === "right" ? 1 : -1) * screwAdvance(angle, PITCH);
export const pitch = PITCH;
/** 槓桿在 state 時心軸的轉角(繞 x 軸,逆時針為正;轉負的是上方半螺帽嚙合) */
export const tilt = (state) => (state === "right" ? -TILT : TILT);

// 滾軸的軸心(心軸的局部座標,原點在心軸)
const RC = [ROLLER.y - SPINDLE.y, -SPINDLE.z];
const rotYZ = ([y, z], a) => [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
/** 槓桿在 state 時,上方 / 下方半螺帽的鞍離滾軸軸心的距離(0 是扣上、與螺紋同心) */
export function nutOffsets(state) {
  const gap = (side) => {
    const c = rotYZ(rotYZ(RC, side * TILT), tilt(state));
    return Math.hypot(c[0] - RC[0], c[1] - RC[1]);
  };
  return { upper: gap(1), lower: gap(-1) };
}

// 鞍形半螺帽的輪廓(板的局部座標:板沿 x 擠出,輪廓的 x → 世界 −z、y → 世界 y;原點在鞍的圓心):
// 凹面是繞滾軸的一段圓弧,塊身往外(上方的往上、下方的往下)
function nutShape(side) {
  const r = NUT.radius;
  const w = r * Math.sin(NUT.half);
  if (side > 0) return shape([...arcPoints(r, Math.PI / 2 - NUT.half, Math.PI / 2 + NUT.half), [-w, NUT.body], [w, NUT.body]]);
  return shape([...arcPoints(r, (3 * Math.PI) / 2 - NUT.half, (3 * Math.PI) / 2 + NUT.half), [w, -NUT.body], [-w, -NUT.body]]);
}

// 一支搖臂:心軸上的轂、從心軸立起的直桿、彎到滾軸正上方 / 正下方的橫桿、鞍形半螺帽。
// 半螺帽在心軸轉到 side × (−TILT) 時正好與滾軸同心(扣上),所以靜止時擺在 RC 繞心軸轉 side × TILT 的地方
function arm(x, side) {
  const center = rotYZ(RC, side * TILT); // 鞍的圓心(靜止時)
  const reach = center[0] + side * (NUT.body - 0.25); // 橫桿的高度:伸進塊身
  return [
    { kind: "box", size: [0.45, 0.35, 0.35], at: [x, 0, 0] },
    { kind: "box", size: [0.22, reach, 0.18], at: [x, reach / 2, 0] },
    { kind: "box", size: [0.22, 0.18, -center[1] + 0.09], at: [x, reach, (center[1] - 0.09) / 2] },
    { kind: "plate", axis: X, shape: nutShape(side), thickness: NUT.length, at: [x, center[0], center[1]], angle: side * TILT },
  ];
}

export default {
  figure: 110,
  parts: [
    {
      id: "roller",
      kind: "group",
      axis: X,
      center: [0, ROLLER.y, 0],
      spin: ROLLER.radius,
      pieces: [
        { kind: "worm", radius: ROLLER.radius, length: 1.5, pitch: PITCH, thread: 0.05, hand: 1, at: [0, 0, -1.25] },
        { kind: "worm", radius: ROLLER.radius, length: 1.5, pitch: PITCH, thread: 0.05, hand: -1, at: [0, 0, 0.95] },
        { kind: "cylinder", radius: 0.18, length: 4.4 },
      ],
    },
    {
      id: "spindle",
      kind: "group",
      center: [0, SPINDLE.y, SPINDLE.z],
      posed: true,
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.1, length: 7.0, at: [0.4, 0, 0] }, // 兩端穿在機架的孔裡,橫移到底仍在孔裡
        ...arm(ARMS.left, 1),
        ...arm(ARMS.right, -1),
        // 槓桿在機架外側夠遠處,心軸橫移到底也碰不到機架
        { kind: "box", size: [0.3, 0.3, 0.3], at: [3.5, 0, 0] },
        { kind: "box", size: [0.1, 2.0, 0.1], at: [3.5, 0, 0] },
        { kind: "sphere", radius: 0.12, at: [3.5, 1.0, 0] },
        { kind: "sphere", radius: 0.12, at: [3.5, -1.0, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩塊立板:滾軸與心軸都架在上面(心軸在前,立板往前加厚)
        { kind: "box", size: [0.45, 2.6, 1.5], at: [-2.35, 0.45, 0.35] },
        { kind: "box", size: [0.45, 2.6, 1.5], at: [2.15, 0.45, 0.35] },
      ],
    },
  ],
  driver: { part: "roller", type: "rotation", range: [0, TURNS * TAU] },
  target: "spindle", // 來回橫移的心軸(導引線)
  states: {
    options: [
      { id: "right", label: "槓桿扳向右(上方半螺帽嚙合)" },
      { id: "left", label: "槓桿扳向左(下方半螺帽嚙合)" },
    ],
    initial: "right",
  },
  view: { direction: [0.08, 0.12, 1] },
  pose(angle, state = "right") {
    // 心軸繞自己的軸轉一點:一個半螺帽壓上螺紋、另一個離開
    const t = tilt(state);
    return {
      parts: { roller: { angle }, spindle: { position: [traverse(angle, state), SPINDLE.y, SPINDLE.z], rotation: [Math.sin(t / 2), 0, 0, Math.cos(t / 2)] } },
      readouts: [],
    };
  },
};
