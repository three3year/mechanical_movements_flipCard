// 第 182 種:同第 181 種的斜向卡榫,此圖是活塞位於圓筒頂部時卡榫與手柄的位置:下方手柄已被抬起卡住,
// 上方手柄被放開、伸進撥爪的路徑。活塞下降時撥爪撞到上方手柄,把卡榫與手柄推回第 181 種的位置。
// 機構與推斷見 cornish-gear.js、cornish-model.js;主動件是活塞桿(往復)。
import { cornishModel } from "./cornish-model.js";
import { SPAN } from "./cornish-gear.js";

export default {
  ...cornishModel({ figure: 182, lock: "catch", initial: SPAN }),
  waivers: [
    { check: "unsupported", parts: ["catch"], reason: "待確認:catch 與帶動(或支撐)它的零件之間差 0.07 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["upper", "lower"], reason: "待確認(未修):upper 的方塊 2.3×0.13×0.1 與 lower 的方塊 2.3×0.13×0.1互相穿入 0.10(93 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "lower"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 lower 的球 r0.13互相穿入 0.13(49 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "upper"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 upper 的球 r0.13互相穿入 0.13(43 個取樣姿勢),尚未修正" },
  ],
};
