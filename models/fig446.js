// 第 446 種:D'Ectol 的振盪水柱,圓錐凸進細管擋住水流、水柱上升的階段(機構見 oscillating-column.js)。
import { makeModel } from "./oscillating-column.js";

export default {
  ...makeModel(446, 0.72),
  waivers: [
    { check: "interference", parts: ["pipes", "riser"], reason: "待確認:pipes 的板 與 riser 的板重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
};
