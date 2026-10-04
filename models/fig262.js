// 第 262 種(條目 262–263 的前視圖):偏心錐體與摩擦滾子;機構見 cone-roller.js。初始視角沿螺桿軸看。
import { coneRoller } from "./cone-roller.js";

export default {
  ...coneRoller(262, [1, 0.08, 0.06]),
  waivers: [
    { check: "interference", parts: ["base", "stemC"], reason: "桿在座的導孔裡滑動,行程盡頭桿端進到座裡面 0.10(導孔沒有畫出來)" },
  ],
};
