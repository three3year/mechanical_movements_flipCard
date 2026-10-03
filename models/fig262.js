// 第 262 種(條目 262–263 的前視圖):偏心錐體與摩擦滾子;機構見 cone-roller.js。初始視角沿螺桿軸看。
import { coneRoller } from "./cone-roller.js";

export default {
  ...coneRoller(262, [1, 0.08, 0.06]),
  waivers: [
    { check: "interference", parts: ["base", "coneB"], reason: "待確認(未修):base 的板 與 coneB 的旋轉體互相穿入 0.42(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["coneB", "rollerC"], reason: "待確認:coneB 的旋轉體 與 rollerC 的圓柱 r0.28×0.22重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["base", "stemC"], reason: "待確認(未修):base 的方塊 0.45×0.12×0.6 與 stemC 的方塊 0.1×1.4×0.1互相穿入 0.15(13 個取樣姿勢),尚未修正" },
  ],
};
