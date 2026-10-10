// 第 207 種:第 195 種的變形,用兩個蝸桿與兩個蝸輪:同一根軸上兩段旋向相反的蝸桿,各帶一個蝸輪。
// 兩輪因此反向轉(圖中的箭頭),相對的兩側朝同一方向走,用來驅動一對進料滾軸。主動件是蝸桿軸。
// 轉向照插圖的箭頭:軸的前面往上,左輪逆時針、右輪順時針,兩輪相對的內側往上。
// 推斷:左段右旋、右段左旋;齒數;各蝸輪同軸的光面進料滾軸(放在蝸輪後面同一層,正面看得到蝸輪、
// 蝸桿與轉向箭頭)與夾在兩者之間、隨滾軸表面往上送的材料(畫成一條線材)。原圖只畫兩個蝸輪與蝸桿軸。
import { TAU, X, beltTravel } from "./kit.js";
import { pedestal } from "./supports.js";

const N = 20;
const R = 1.1;
const PITCH = (TAU * R) / N;
const WORM = { radius: 0.2, length: 0.9 };
const XS = [-1.6, 1.6];
const HANDS = [1, -1];
const Y = R + WORM.radius + 0.04; // 蝸輪的齒只伸進螺紋,不碰蝸桿的芯
// 進料滾軸:兩個相同,在蝸輪後面同一層(避開蝸桿的螺紋),相對的表面之間留一條縫夾住材料
const FEED = { radius: XS[1] - 0.06, z: -0.495, length: 0.35 };
const STOCK = (XS[1] - FEED.radius) * 2; // 材料的粗細 = 兩滾軸表面之間的縫
const HUB = [FEED.z + FEED.length / 2, 0.2]; // 輪轂從蝸輪正面一直接到滾軸
const AXLE = [-1.02, 0.15]; // 蝸輪的固定軸(穿過輪轂與滾軸,後端伸進軸承座)

// 局部角 at 處螺紋的軸向位置(相對該段蝸桿中心):z = −L/2 + hand·a·節距/2π
const crest = (theta, at, hand) => -WORM.length / 2 + hand * ((at - theta) / TAU) * PITCH;

/** 軸轉 theta:左右兩個蝸輪的轉角(蝸輪在蝸桿上方,以最下方咬合) */
export function wheels(theta) {
  return HANDS.map((hand) => -Math.PI / 2 + (crest(theta, Math.PI / 2, hand) + PITCH / 2) / R);
}
export const geometry = { N, R };

const FLOOR = -WORM.radius - 0.7;
export default {
  figure: 207,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: X,
      spin: 0.3,
      spinOffset: -0.6, // 箭頭放在材料左邊,不和材料疊在一起
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 6.0, mark: true },
        ...XS.map((x, i) => ({ kind: "worm", radius: WORM.radius, length: WORM.length, pitch: PITCH, thread: 0.07, hand: HANDS[i], at: [0, 0, x] })),
      ],
    },
    ...XS.map((x, i) => ({
      id: i ? "right" : "left",
      kind: "gear",
      center: [x, Y, 0],
      teeth: N,
      radius: R,
      width: 0.3,
      bore: 0.14,
      pieces: [
        { kind: "cylinder", radius: 0.28, inner: 0.14, length: HUB[1] - HUB[0], at: [0, 0, (HUB[0] + HUB[1]) / 2] },
        { kind: "cylinder", radius: FEED.radius, inner: 0.14, length: FEED.length, at: [0, 0, FEED.z] }, // 進料滾軸(光面)
      ],
    })),
    // 被送的材料:從兩滾軸之間往上穿過(推斷)
    { id: "material", kind: "rope", radius: STOCK / 2 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推斷(原圖只畫出軸頭):兩個蝸輪的固定軸與軸承座、蝸桿軸兩端的軸承與立柱
        ...XS.flatMap((x) => [
          { kind: "cylinder", radius: 0.13, length: AXLE[1] - AXLE[0], at: [x, Y, (AXLE[0] + AXLE[1]) / 2] },
          ...pedestal({ at: [x, Y], z: AXLE[0] + 0.15, bore: 0.13, floor: FLOOR }),
        ]),
        ...[-2.8, 2.8].flatMap((x) => [
          { kind: "cylinder", axis: [1, 0, 0], radius: 0.24, inner: 0.12, length: 0.2, at: [x, 0, 0] },
          { kind: "box", size: [0.2, -0.2 - FLOOR, 0.2], at: [x, (-0.2 + FLOOR) / 2, 0] },
        ]),
        { kind: "box", size: [6.4, 0.12, 1.9], at: [0, FLOOR - 0.06, -0.45] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation", speed: -3 }, // 播放時轉角遞減:軸的前面往上(插圖的箭頭)
  targets: ["left", "right"], // 一對進料滾軸
  view: { direction: [0.08, 0.06, 1] },
  pose(theta) {
    const [left, right] = wheels(theta);
    // 材料隨滾軸的表面前進:左滾軸右緣往 +y 的位移 = 半徑 × 轉角
    const fed = beltTravel(left, FEED.radius, 1);
    return {
      parts: { shaft: { angle: theta }, left: { angle: left }, right: { angle: right } },
      paths: { material: { points: [[0, FLOOR + 0.25, FEED.z], [0, Y + 2.2, FEED.z]], closed: false, phase: fed } },
      readouts: [],
    };
  },
};
