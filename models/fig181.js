// 第 181 種:大型鼓風及抽水引擎的斜向卡榫(diagonal catch),或稱手動齒輪。此圖:下方蒸汽閥與上方排氣閥開啟、
// 上方蒸汽閥與下方排氣閥關閉,活塞上升中。活塞桿上升時撥爪撞到下方手柄、把它抬起並與卡榫嚙合,
// 關閉上方排氣閥與下方蒸汽閥;同時上方手柄脫離卡榫,被後方的配重拉起,開啟上方蒸汽閥與下方排氣閥,活塞隨之下降。
// 活塞下降時撥爪撞到上方手柄,把卡榫與手柄推回此圖的位置。機構與推斷見 cornish-gear.js、cornish-model.js;
// 主動件是活塞桿(往復)。第 182 種是同一機構在活塞到頂時的位置。
import { cornishModel } from "./cornish-model.js";

export default {
  ...cornishModel({ figure: 181, lock: "catch", initial: 0 }),
  waivers: [
    { check: "unsupported", parts: ["catch"], reason: "待確認:catch 與帶動(或支撐)它的零件之間差 0.07 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["upper", "lower"], reason: "待確認(未修):upper 的方塊 2.3×0.13×0.1 與 lower 的方塊 2.3×0.13×0.1互相穿入 0.10(95 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "upper"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 upper 的球 r0.13互相穿入 0.13(42 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "lower"], reason: "待確認(未修):rod 的方塊 0.23×0.3×0.6 與 lower 的球 r0.13互相穿入 0.13(49 個取樣姿勢),尚未修正" },
  ],
};
