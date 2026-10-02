// 離合器模型共用:狀態「接合 / 脫開」、撥動滑動半的曲柄槓桿(bell crank)。
// 軸沿 x;撥桿樞軸在軸下方,直臂頂端的叉卡在滑動半的頸槽裡,橫臂伸向右方。
import { stadium } from "./shapes.js";

export const CLUTCH_STATES = {
  options: [
    { id: "engaged", label: "接合" },
    { id: "free", label: "脫開" },
  ],
  initial: "engaged",
};

/** 曲柄槓桿:pivot 樞軸,up 直臂長(往上到叉),out 橫臂長(往右) */
export function bellCrank({ id = "lever", pivot, up, out, z = 0.4 }) {
  return {
    id,
    kind: "group",
    center: [pivot[0], pivot[1], z],
    posed: true,
    arrow: false,
    pieces: [
      { kind: "plate", shape: stadium(up, 0.16, 0.05), thickness: 0.08, angle: Math.PI / 2 },
      { kind: "plate", shape: stadium(out, 0.16, 0.05), thickness: 0.08 },
      { kind: "cylinder", radius: 0.12, length: 0.2 },
    ],
  };
}

/** 滑動半往右移 shift 時槓桿要轉的角度(直臂頂端水平移動 shift) */
export const leverTurn = (shift, up) => -Math.asin(Math.max(-1, Math.min(1, shift / up)));
