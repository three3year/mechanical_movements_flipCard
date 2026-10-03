// 第 295 種(條目 294–295 的放大圖):從上方看擒縱輪的一段與圓筒;機構見 cylinder-escapement.js。
import { cylinderEscapement } from "./cylinder-escapement.js";

export default {
  ...cylinderEscapement(295, { direction: [0.05, 0.1, 1] }),
  waivers: [
    { check: "interference", parts: ["wheel", "cylinder"], reason: "待確認:wheel 的板 與 cylinder 的旋轉體重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
};
