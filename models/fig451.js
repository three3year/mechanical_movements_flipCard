// 第 451 種:壓力泵,與上一種相同,但在出水口加了空氣室,使出水持續穩定。空氣室的出水口畫在兩處,可從任一處取水。
// 活塞下行時空氣被水壓縮,上行時膨脹,把水從空氣室推出。
// 機構見 force-pump.js。推斷:空氣室畫成倒扣的罐,出水管從底部穿到頂上,側面另有一個出口。
import { makeForcePump } from "./force-pump.js";

export default {
  ...makeForcePump(451, { air: true }),
  waivers: [
    { check: "interference", parts: ["works", "deliveryValve"], reason: "簡化畫法:出水閥的閥瓣開到底時貼著泵體,重疊 0.04(96 個取樣中 46 個)" },
    { check: "interference", parts: ["works", "handle"], reason: "接合處的簡化畫法:手柄鉸接在泵體的耳上,重疊 0.08" },
    { check: "interference", parts: ["suction", "works"], reason: "簡化畫法:吸水管接在泵體上,接口處重疊 0.05" },
    { check: "interference", parts: ["barrel", "works"], reason: "簡化畫法:泵筒嵌在泵體裡,重疊 0.20" },
  ],
};
