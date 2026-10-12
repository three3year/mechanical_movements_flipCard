// 第 275 種:蝸桿的旋轉運動賦予齒條直線運動。蝸桿的軸與齒條平行,螺紋嵌在齒條的齒間;
// 蝸桿每轉一圈,齒條沿軸移動一個螺距(等於齒條的齒距)。主動件是蝸桿。
// 照原圖是左旋蝸桿(525 px 原圖螺紋正面的線由左上往右下):蝸桿繞 +y 轉時,咬合處(朝齒條那一側)的螺紋
// 沿軸往 +y 走,齒條跟著螺紋往同一個方向走,螺紋全程落在兩齒之間。
// 螺紋的管徑照齒間的寬度取(半徑 0.11):齒條沿軸錯開 0.01 就碰到螺紋,螺紋推著齒走。
// 推斷:蝸桿軸兩端的軸承架、齒條的導塊與後面的背板(原圖只畫蝸桿與齒條);導塊做成 U 形,
// 從背面與前後兩面夾著齒條,行程內齒條都在導塊裡;軸端的鍵條是轉向記號。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { rackShape } from "./shapes.js";

export const PITCH = 0.36;
export const RANGE = [-2.5 * TAU, 2.5 * TAU];
const HAND = -1; // 左旋
const THREAD = 0.11; // 螺紋管的半徑
const WORM = { radius: 0.48, length: 1.9, center: [0.55, -0.55, 0] };
const RACK = { teeth: 13, depth: 0.25, thick: 0.3, tipGap: 0.01 };
const TIP = PITCH / Math.PI; // 齒條齒頂離節線
const ROOT = 1.2 * TIP; // 齒根離節線(同 rackShape)
// 齒頂離蝸桿的芯 tipGap
const RACK_X = WORM.center[0] - (WORM.radius - THREAD) - RACK.tipGap - TIP;
// 蝸桿轉 0 時,朝齒條那一側(局部角 π)的螺紋在 y = 中心 − L/2 + (π/HAND)·螺距/2π(每隔一個螺距一道);
// 齒條的齒間對準它,齒的中心就差半個齒距(再加整數個齒距,讓齒條大致居中)
const RACK_Y0 = WORM.center[1] - WORM.length / 2 + ((Math.PI / HAND) * PITCH) / TAU + PITCH / 2 + 5 * PITCH;

/** 蝸桿轉 theta → 齒條的位移(往上為正):沿咬合處螺紋前進的方向,每圈一個螺距 */
export const rack = (theta) => -screwAdvance(clamp(theta, ...RANGE), PITCH, HAND);

// 齒條的導塊:U 形(背面一塊往後接到背板,前後兩片夾板),和齒條之間留 0.005
const BACK_X = RACK_X - ROOT - RACK.depth; // 齒條背面
const CHEEK_TO = RACK_X - ROOT - 0.07; // 夾板只蓋到齒根之前
const guideAt = (y, len) => {
  const web = { kind: "box", size: [0.1, len, 1.07], at: [BACK_X - 0.055, y, -0.315] };
  const cheekX = [BACK_X - 0.105, CHEEK_TO];
  const cheek = (s) => ({ kind: "box", size: [cheekX[1] - cheekX[0], len, 0.07], at: [(cheekX[0] + cheekX[1]) / 2, y, s * (RACK.thick / 2 + 0.005 + 0.035)] });
  return { web, cheeks: [cheek(1), cheek(-1)] };
};
/** 兩個導塊:齒條走到行程兩端(±0.9)時都還蓋著這兩段 */
export const GUIDES = [guideAt(-0.8, 0.6), guideAt(1.4, 0.6)];

export default {
  figure: 275,
  parts: [
    {
      id: "worm",
      kind: "worm",
      axis: Y,
      center: WORM.center,
      radius: WORM.radius,
      length: WORM.length,
      pitch: PITCH,
      thread: THREAD,
      hand: HAND,
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 3.2 },
        { kind: "box", size: [0.05, 0.06, 0.4], at: [0.1, 0, 1.25], accent: true }, // 軸上的鍵條(看轉向)
      ],
    },
    // 齒條:沿 y,齒朝 +x(朝蝸桿);齒距等於螺距
    { id: "rack", kind: "plate", shape: rackShape({ teeth: RACK.teeth, pitch: PITCH, depth: RACK.depth }), thickness: RACK.thick, arrow: false },
    {
      id: "guide",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.4, 4.8, 0.1], at: [0.05, -0.4, -0.85] }, // 背板
        ...GUIDES.flatMap((g) => [g.web, ...g.cheeks]),
        // 蝸桿軸兩端的軸承架
        ...[-2.0, 0.9].flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.2, inner: 0.1, length: 0.16, at: [WORM.center[0], y, 0] },
          { kind: "box", size: [0.16, 0.16, 0.62], at: [WORM.center[0], y, -0.5] },
        ]),
      ],
    },
  ],
  driver: { part: "worm", type: "rotation", range: RANGE, initial: 0 },
  target: "rack", // 直線移動的齒條
  view: { direction: [0.25, 0.1, 1] },
  pose(theta) {
    // 齒條零件的局部 x 沿齒條,齒朝局部 +y:轉 −90° 讓齒條沿世界 y、齒朝 +x
    return { parts: { worm: { angle: clamp(theta, ...RANGE) }, rack: { position: [RACK_X, RACK_Y0 + rack(theta), 0], angle: -Math.PI / 2 } }, readouts: [] };
  },
};
