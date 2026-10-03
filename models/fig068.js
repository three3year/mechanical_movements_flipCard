// 第 68 種:驅動輪 B 上唯一的齒 A 嵌進輪 C 的凹槽,B 每轉一圈,C 轉過一個凹槽的距離。
// 不需要擋止裝置:B 的圓周嵌在 C 兩個凹槽之間的凹陷處,把 C 鎖住。主動件是 B(順時針)。
// 齒 A 的齒端是圓頭(原圖是圓鼓的單齒),凹槽是徑向的直槽、槽口張開(原圖槽與槽之間是尖的凸角):
// 齒端在槽裡像日內瓦機構的銷在槽裡——C 的轉角就是從 C 軸心看齒端的方位角,齒端在槽裡時 C 跟著轉,
// 其餘時間 C 不動。齒端中心離 B 軸心的距離 RT 取成:齒端中心進出 C 輪緣時 C 正好轉過一格
// (用固定的擺線曲線排時序的話,C 在中段跑得比齒快兩倍,槽壁會穿進齒裡)。
import { TAU, deg, polar } from "./kit.js";
import { arcPoints, circle, shape } from "./shapes.js";

const B = { center: [-1.5, 0, 0], radius: 1.5 };
const C = { center: [1.52, 0, 0], radius: 1.5, notches: 10 };
const D = C.center[0] - B.center[0];
const STEP = TAU / C.notches;
const TOOTH = deg(60); // 齒 A 在 B 上的局部角
const PIN = 0.085; // 齒端(圓頭)半徑
const SLOT = 0.09; // 凹槽的半寬(直槽段)
const SLOT_BOTTOM = C.radius - 0.28;
const FLARE_FROM = C.radius - 0.1; // 槽口從這個半徑往外張開
const FLARE_HALF = 0.19; // 槽口在輪緣處的半寬:齒端斜著進槽時不碰到槽口的角

/** 齒端中心在 B 局部角 TOOTH + 世界角 t(相對連心線)時,從 C 軸心看它的方位角(相對 C 指向 B 的方向) */
const bearing = (RT, t) => Math.atan2(RT * Math.sin(t), D - RT * Math.cos(t));
/** 齒端中心進入 C 輪緣圓時,它相對連心線的角 */
const entry = (RT) => Math.acos((D * D + RT * RT - C.radius ** 2) / (2 * D * RT));
// 解 RT:齒端中心從進入到離開 C 的輪緣圓,方位角正好掃過一格(STEP)
const RT = (() => {
  let lo = B.radius;
  let hi = B.radius + 0.4;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (2 * bearing(mid, entry(mid)) < STEP) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
const WINDOW = entry(RT); // 齒端在槽裡的半角(B 的轉角)

/** B 順時針轉過 b:C 的轉角(逆時針)。齒 A 指向 C(與連心線重合)時 b = TOOTH */
export function cAngle(b) {
  const k = Math.floor((b - TOOTH + WINDOW) / TAU);
  const t = TOOTH - (b - k * TAU); // 齒端相對連心線的世界角(B 順時針轉,t 遞減)
  const turned = t > WINDOW ? 0 : t < -WINDOW ? STEP : STEP / 2 - bearing(RT, t);
  return Math.PI - STEP / 2 + k * STEP + turned;
}
export const notchStep = STEP;
export const geometry = { RT, WINDOW, PIN, SLOT };

// B:圓盤加一個圓頭的齒(頸部從輪緣伸到齒端)
const NECK = Math.asin(PIN / B.radius) + deg(0.5);
const bOutline = [
  ...arcPoints(B.radius, TOOTH + NECK, TOOTH + TAU - NECK),
  ...arcPoints(PIN, TOOTH - Math.PI / 2, TOOTH + Math.PI / 2, RT * Math.cos(TOOTH), RT * Math.sin(TOOTH)),
];
// C:徑向直槽(槽口張開),槽與槽之間是凹進去的弧(讓 B 的圓周嵌入鎖住)
const cOutline = [];
const flareAngle = Math.atan2(FLARE_HALF, C.radius);
for (let j = 0; j < C.notches; j++) {
  const a = j * STEP;
  const wall = (side) => [
    polar(Math.hypot(C.radius, FLARE_HALF), a + side * flareAngle).slice(0, 2),
    polar(Math.hypot(FLARE_FROM, SLOT), a + side * Math.atan2(SLOT, FLARE_FROM)).slice(0, 2),
    polar(Math.hypot(SLOT_BOTTOM, SLOT), a + side * Math.atan2(SLOT, SLOT_BOTTOM)).slice(0, 2),
  ];
  cOutline.push(...wall(-1), ...wall(1).reverse());
  const from = a + flareAngle + deg(1);
  const to = a + STEP - flareAngle - deg(1);
  for (let i = 1; i < 8; i++) {
    const t = from + ((to - from) * i) / 8;
    const dip = 0.1 * Math.sin((Math.PI * i) / 8);
    cOutline.push(polar(C.radius - dip, t).slice(0, 2));
  }
}

export default {
  figure: 68,
  parts: [
    {
      id: "b",
      kind: "plate",
      center: B.center,
      shape: shape(bOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      mark: [0.9, -0.3],
      markSize: 0.09,
      spin: B.radius,
      label: "B",
      labelOffset: [0.6, 0, 0.3],
    },
    { id: "labelA", kind: "group", label: "A", labelOffset: [0, 0, 0.3] },
    {
      id: "c",
      kind: "plate",
      center: C.center,
      shape: shape(cOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      mark: [0.9, 0],
      markSize: 0.09,
      spin: C.radius,
      label: "C",
      labelOffset: [-0.55, 0, 0.3],
    },
  ],
  driver: { part: "b", type: "rotation", speed: -1.0, initial: deg(-40) },
  target: "c",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const tip = polar(RT + 0.3, TOOTH + v);
    return {
      parts: {
        b: { angle: v },
        c: { angle: cAngle(-v) },
        labelA: { position: [B.center[0] + tip[0], B.center[1] + tip[1], 0.2] },
      },
      readouts: [],
    };
  },
};
