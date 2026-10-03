// 第 218 種:毛紡梳理機驅動滾軸的裝置之另一部件:槓桿以滾軸的軸 H 為樞軸,下端是在凸輪溝槽中的凸柱 A,
// 上端掛著卡榫 G,G 的爪落在凹槽輪 F 的凹槽裡,把槓桿的擺動傳給 F 與滾軸;G 被抬起時滑過兩凹槽間的光面。
// 凸輪(第 217 種)不在這張圖裡,以「凸輪轉了幾圈」的滑桿代替。機構與推斷見 wool-comb.js。
import { woolCombModel } from "./wool-comb.js";

export default {
  ...woolCombModel(218),
  waivers: [
    { check: "unsupported", parts: ["wheelF"], reason: "待確認(未修):wheelF 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["catch"], reason: "待確認(未修):catch 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["lever"], reason: "待確認(未修):lever 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["stud"], reason: "待確認(未修):stud 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
  ],
};
