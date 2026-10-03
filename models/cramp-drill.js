// 第 379、380 種(同一條目的兩種可攜式夾鉗鑽)共用:C 形夾鉗、上臂的曲柄與鑽頭心軸。兩者的進料方式不同:
// 第 379 種的進料螺桿在下臂、與鑽頭相對,把工件往上頂向鑽頭;第 380 種的鑽頭心軸穿過上臂進料螺桿的中心,
// 轉進料螺桿就把鑽頭往下送。主動件是曲柄(轉鑽頭);進料以每圈固定的量跟著鑽頭(推斷:原文只說螺桿的位置)。
import { Y } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

export const FEED = 0.04; // 鑽頭每轉一圈,進料的距離(推斷)
export const MAX = 8 * Math.PI * 2; // 曲柄可轉的範圍(進料到底)

export const frame = {
  id: "frame",
  kind: "group",
  pieces: [{ kind: "plate", shape: shape(thickLine([[0.5, 1.9], [-1.6, 1.9], [-1.6, -1.9], [0.6, -1.9]], 0.55)), thickness: 0.4 }],
};

/** 曲柄(上臂上方的橫柄與握把):局部 z 是鑽頭心軸 */
export const crankPieces = [
  { kind: "box", size: [1.3, 0.1, 0.1], at: [-0.65, 0, 0] },
  { kind: "cylinder", axis: Y, radius: 0.08, length: 0.4, at: [-1.3, 0, 0.15], accent: true },
];

export const feedOf = (theta) => (FEED * Math.min(Math.max(theta, 0), MAX)) / (Math.PI * 2);
