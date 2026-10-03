// 第 183 種:第 181、182 種的變形,斜向卡榫由兩個象限器(quadrants)取代:上下兩根軸各帶一個扇形,
// 一個的圓弧擋住另一個的一角。此圖相當於第 181 種(活塞上升中,下方手柄伸出、上方手柄被下方象限器擋住)。
// 機構與推斷見 cornish-gear.js、cornish-model.js;主動件是活塞桿(往復)。
import { cornishModel } from "./cornish-model.js";

export default {
  ...cornishModel({ figure: 183, lock: "quadrants", initial: 0 }),
  waivers: [
    { check: "interference", parts: ["upper", "lower"], reason: "待確認(未修):upper 的方塊 2.3×0.13×0.1 與 lower 的方塊 2.3×0.13×0.1互相穿入 0.10(95 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "upper"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 upper 的球 r0.13互相穿入 0.13(42 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "lower"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 lower 的球 r0.13互相穿入 0.13(49 個取樣姿勢),尚未修正" },
  ],
};
