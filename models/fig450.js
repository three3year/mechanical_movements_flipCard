// 第 450 種:普通的壓力泵,有兩個閥門。泵筒在水面之上,配實心活塞;一個閥門封住出水管,另一個封住吸水管。
// 活塞上升時吸水閥打開、水湧進泵筒,出水閥關閉;活塞下降時吸水閥關閉,水被迫經出水閥往上送到任何距離或高度。
// 機構見 force-pump.js。推斷:手柄、閥箱與管路的位置依原圖。
import { makeForcePump } from "./force-pump.js";

export default {
  ...makeForcePump(450),
};
