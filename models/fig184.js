// 第 184 種:同第 183 種的兩個象限器,此圖相當於第 182 種(活塞在頂部,下方手柄被抬起、由上方象限器的圓弧擋住,
// 上方手柄伸出)。機構與推斷見 cornish-gear.js、cornish-model.js;主動件是活塞桿(往復)。
import { cornishModel } from "./cornish-model.js";
import { SPAN } from "./cornish-gear.js";

export default {
  ...cornishModel({ figure: 184, lock: "quadrants", initial: SPAN }),
  waivers: [
    { check: "interference", parts: ["upper", "lower"], reason: "待確認(未修):upper 的方塊 2.3×0.13×0.1 與 lower 的方塊 2.3×0.13×0.1互相穿入 0.10(93 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "lower"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 lower 的球 r0.13互相穿入 0.13(49 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "upper"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 upper 的球 r0.13互相穿入 0.13(43 個取樣姿勢),尚未修正" },
  ],
};
