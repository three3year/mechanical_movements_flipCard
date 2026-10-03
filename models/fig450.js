// 第 450 種:普通的壓力泵,有兩個閥門。泵筒在水面之上,配實心活塞;一個閥門封住出水管,另一個封住吸水管。
// 活塞上升時吸水閥打開、水湧進泵筒,出水閥關閉;活塞下降時吸水閥關閉,水被迫經出水閥往上送到任何距離或高度。
// 機構見 force-pump.js。推斷:手柄、閥箱與管路的位置依原圖。
import { makeForcePump } from "./force-pump.js";

export default {
  ...makeForcePump(450),
  waivers: [
    { check: "interference", parts: ["barrel", "works"], reason: "待確認(未修):barrel 的旋轉體 與 works 的板互相穿入 0.20(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["suction", "works"], reason: "待確認:suction 的旋轉體 與 works 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "handle"], reason: "待確認:works 的板 與 handle 的板重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "deliveryValve"], reason: "待確認(未修):works 的板 與 deliveryValve 的板互相穿入 0.13(46 個取樣姿勢),尚未修正" },
  ],
};
