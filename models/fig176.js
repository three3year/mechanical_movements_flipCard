// 第 176 種:引擎脫鉤的裝置,環的溝槽在接上的位置:後面曲柄上的手腕銷卡在溝槽裡,帶著圖中的曲柄一起轉。
// 第 177 種是同一裝置的脫開位置。機構與推斷見 uncoupling.js。
import { uncouplingModel } from "./uncoupling.js";

export default {
  ...uncouplingModel({ figure: 176, initial: "coupled" }),
  waivers: [
    { check: "unsupported", parts: ["crank"], reason: "待確認(未修):crank 在動,但離帶動(或支撐)它的零件還有 0.37 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["ring"], reason: "待確認:ring 與帶動(或支撐)它的零件之間差 0.09 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "unsupported", parts: ["wristArm"], reason: "待確認:wristArm 與帶動(或支撐)它的零件之間差 0.09 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["crank", "wristArm"], reason: "待確認(未修):crank 的板 與 wristArm 的圓柱 r0.28×0.75互相穿入 0.20(5 個取樣姿勢),尚未修正" },
  ],
};
