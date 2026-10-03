// 第 451 種:壓力泵,與上一種相同,但在出水口加了空氣室,使出水持續穩定。空氣室的出水口畫在兩處,可從任一處取水。
// 活塞下行時空氣被水壓縮,上行時膨脹,把水從空氣室推出。
// 機構見 force-pump.js。推斷:空氣室畫成倒扣的罐,出水管從底部穿到頂上,側面另有一個出口。
import { makeForcePump } from "./force-pump.js";

export default {
  ...makeForcePump(451, { air: true }),
  waivers: [
    { check: "interference", parts: ["barrel", "works"], reason: "待確認(未修):barrel 的旋轉體 與 works 的板互相穿入 0.20(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["suction", "works"], reason: "待確認:suction 的旋轉體 與 works 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "handle"], reason: "待確認:works 的板 與 handle 的板重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["works", "deliveryValve"], reason: "待確認:works 的板 與 deliveryValve 的板重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
};
