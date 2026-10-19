// 第 379、380 種(同一條目的兩種可攜式夾鉗鑽)共用:C 形夾鉗、上臂的曲柄與鑽頭心軸。兩者的進料方式不同:
// 第 379 種的進料螺桿在下臂、與鑽頭相對,把工件往上頂向鑽頭;第 380 種的鑽頭心軸穿過上臂進料螺桿的中心,
// 轉進料螺桿就把鑽頭往下送。主動件是曲柄(轉鑽頭);進料以每圈固定的量跟著鑽頭(推斷:原文只說螺桿的位置)。
// 兩張的 drill、screw、feedScrew 的軸都是 Y:零件的局部 z 是世界的上下,局部 y 是深度(尺寸照這個寫)。
import { shape, thickLine } from "./shapes.js";

export const FEED = 0.04; // 鑽頭每轉一圈,進料的距離(推斷)
export const MAX = 8 * Math.PI * 2; // 曲柄可轉的範圍(進料到底)
export const PITCH = 0.12; // 進料螺桿的螺距

const ARM_Y = 1.9; // 上下臂的中心線離中間的高度
const ARM_W = 0.55; // 臂的寬度
/** C 形夾鉗上下兩臂的上下範圍(世界座標) */
export const ARMS = { upper: [ARM_Y - ARM_W / 2, ARM_Y + ARM_W / 2], lower: [-ARM_Y - ARM_W / 2, -ARM_Y + ARM_W / 2] };

export const frame = {
  id: "frame",
  kind: "group",
  pieces: [{ kind: "plate", shape: shape(thickLine([[0.5, ARM_Y], [-1.6, ARM_Y], [-1.6, -ARM_Y], [0.6, -ARM_Y]], ARM_W)), thickness: 0.4 }],
};

/**
 * 曲柄(心軸頂上的橫臂與握把),局部 z 是鑽頭心軸、心軸在局部原點:臂的底面在 top(貼著心軸頂),
 * 臂的內端蓋住心軸頂,握把直立在臂的外端上(原圖)
 */
export const crankPieces = (top) => [
  { kind: "box", role: "arm", size: [1.45, 0.14, 0.1], at: [-0.6, 0, top + 0.05] },
  { kind: "cylinder", role: "grip", radius: 0.08, length: 0.4, at: [-1.22, 0, top + 0.3], accent: true },
];

export const feedOf = (theta) => (FEED * Math.min(Math.max(theta, 0), MAX)) / (Math.PI * 2);
