// 第 195 種:驅動一對進料滾軸的方式,兩者相對的表面要朝同一方向運動。兩個輪完全相同,都與放在它們之間的
// 無端螺桿(蝸桿)咬合:上輪的齒在前面看得到,下輪在後面(兩輪前後錯開,所以在圖中重疊),齒被遮住。
// 蝸桿從上方帶上輪、從下方帶下輪,兩輪反向轉,相對的一側(靠蝸桿的一側)朝同一方向走。主動件是蝸桿。
// 推斷:兩輪前後錯開的距離;齒數;蝸桿為右旋單線;各輪同軸的光面進料滾軸;被送的材料(畫成一條線材,
// 夾在兩滾軸之間,隨滾軸的表面前進);三根軸的軸承與立柱(原圖沒畫)。
// 偏離插圖:原圖下輪前面是一個光面圓盤(遮住蝸桿),上輪的齒在前面。兩個進料滾軸要在同一層才夾得住材料
// (原文「相對的表面」),所以都放在兩個齒輪後面;這樣正面看得到蝸桿與兩輪的齒和轉向箭頭,下輪的齒也露出來。
import { TAU, X, beltTravel } from "./kit.js";

const N = 24;
const R = 1.4;
const PITCH = (TAU * R) / N;
const WORM = { radius: 0.22, length: 1.7 };
const Y = R + WORM.radius - 0.04;
const Z = 0.22;
const FLOOR = -Y - R - 0.35;
// 兩個進料滾軸:同一層(兩個齒輪的後面)、半徑相同,相對的表面之間留一條縫夾住材料
const FEED = { radius: Y - 0.06, z: -0.625, length: 0.36 };
const STOCK = (Y - FEED.radius) * 2; // 材料的粗細 = 兩滾軸表面之間的縫
const post = (x, y, z, ring) => [ring, { kind: "box", size: [0.2, y - 0.2 - FLOOR, 0.2], at: [x, (y - 0.2 + FLOOR) / 2, z] }];

// 蝸桿轉 theta 時,局部角 at 處螺紋的軸向位置(右旋:z = −L/2 + a·節距/2π)
const crest = (theta, at) => -WORM.length / 2 + ((at - theta) / TAU) * PITCH;

/** 蝸桿轉 theta:上輪與下輪的轉角(齒落在螺紋之間,每圈一齒) */
export function rolls(theta) {
  const top = crest(theta, Math.PI / 2);
  const bottom = crest(theta, -Math.PI / 2);
  return { upper: -Math.PI / 2 + (top + PITCH / 2) / R, lower: Math.PI / 2 - (bottom + PITCH / 2) / R };
}
export const geometry = { N, R };

// 輪的軸:上輪往後伸進後面的軸承,下輪往前伸進前面的軸承;兩根軸都往後整段穿過後面的進料滾軸(z −0.805–−0.445)
const AXLE = { upper: [-1.13, 0.47], lower: [-0.83, 1.13] };
const wheel = (id, y, z) => ({
  id,
  kind: "gear",
  center: [0, y, z],
  teeth: N,
  radius: R,
  width: 0.3,
  bore: 0.14,
  pieces: [
    { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.45 },
    { kind: "cylinder", radius: 0.14, length: AXLE[id][1] - AXLE[id][0], at: [0, 0, (AXLE[id][0] + AXLE[id][1]) / 2 - z] },
    // 同軸的進料滾軸(光面),兩輪的都在後面同一層
    { kind: "cylinder", radius: FEED.radius, length: FEED.length, at: [0, 0, FEED.z - z] },
  ],
});

export default {
  figure: 195,
  parts: [
    { id: "worm", kind: "worm", axis: X, center: [0, 0, 0], radius: WORM.radius, length: WORM.length, pitch: PITCH, thread: 0.08, pieces: [{ kind: "cylinder", radius: 0.12, length: 6.0 }] },
    wheel("upper", Y, Z),
    wheel("lower", -Y, -Z),
    // 被送的材料:夾在兩滾軸之間,沿 x 穿過(推斷)
    { id: "material", kind: "rope", radius: STOCK / 2 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...post(0, Y, -1.0, { kind: "cylinder", radius: 0.26, inner: 0.14, length: 0.2, at: [0, Y, -1.0] }), // 上輪的軸往後伸進軸承
        ...post(0, -Y, 1.0, { kind: "cylinder", radius: 0.26, inner: 0.14, length: 0.2, at: [0, -Y, 1.0] }), // 下輪的軸往前伸進軸承
        ...[-2.6, 2.6].flatMap((x) => post(x, 0, 0, { kind: "cylinder", axis: X, radius: 0.24, inner: 0.12, length: 0.2, at: [x, 0, 0] })),
        { kind: "box", size: [6.0, 0.12, 2.6], at: [0, FLOOR - 0.06, 0] },
      ],
    },
  ],
  driver: { part: "worm", type: "rotation", speed: 3 },
  targets: ["upper", "lower"], // 一對進料滾軸
  view: { direction: [0.3, 0.35, 1] }, // 稍微從右上方看:材料在齒輪後面,斜看才看得出它從蝸桿軸兩端伸出
  pose(theta) {
    const { upper, lower } = rolls(theta);
    // 材料隨滾軸的表面前進:上滾軸最下緣往 +x 的位移 = 半徑 × 轉角
    const fed = beltTravel(upper, FEED.radius, 1);
    return {
      parts: { worm: { angle: theta }, upper: { angle: upper }, lower: { angle: lower } },
      paths: { material: { points: [[-3.9, 0, FEED.z], [3.9, 0, FEED.z]], closed: false, phase: fed } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["worm", "lower"], reason: "簡化齒形:蝸桿畫成圓柱加螺紋、兩個蝸輪是直齒,齒頂伸進蝸桿的芯 0.05" },
    { check: "interference", parts: ["worm", "upper"], reason: "簡化齒形:蝸桿畫成圓柱加螺紋、兩個蝸輪是直齒,齒頂伸進蝸桿的芯 0.05" },
  ],
};
