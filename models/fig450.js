// 第 450 種:普通的壓力泵,有兩個閥門。泵筒在水面之上,配實心活塞;一個閥門封住出水管,另一個封住吸水管。
// 活塞上升時吸水閥打開、水湧進泵筒,出水閥關閉;活塞下降時吸水閥關閉,水被迫經出水閥往上送到任何距離或高度。
// 機構見 force-pump.js。推斷:手柄、閥箱與管路的位置依原圖。
import { makeForcePump } from "./force-pump.js";

export default {
  ...makeForcePump(450),
  waivers: [
    { check: "interference", parts: ["works", "deliveryValve"], reason: "簡化畫法:出水閥的閥瓣開到底時貼著泵體,重疊 0.13(96 個取樣中 46 個)" },
    { check: "interference", parts: ["works", "handle"], reason: "接合處的簡化畫法:手柄鉸接在泵體的耳上,重疊 0.08" },
    { check: "interference", parts: ["suction", "works"], reason: "簡化畫法:吸水管接在泵體上,接口處重疊 0.05" },
    { check: "interference", parts: ["barrel", "works"], reason: "簡化畫法:泵筒嵌在泵體裡,重疊 0.20" },
  ],
};
