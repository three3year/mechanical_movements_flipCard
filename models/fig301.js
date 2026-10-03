// 第 301 種(條目 300–301 的側視立面圖):雙擒縱輪與半圓叉瓦;機構見 twin-wheel-escapement.js。
import { twinWheels } from "./twin-wheel-escapement.js";

export default {
  ...twinWheels(301, [1, 0.06, 0.05]),
  waivers: [
    { check: "unsupported", parts: ["staff"], reason: "待確認(未修):staff 在動,但離帶動(或支撐)它的零件還有 0.16 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["wheels"], reason: "待確認(未修):wheels 在動,但離帶動(或支撐)它的零件還有 0.16 的空隙,少了相連的軸、銷或連桿,尚未補上" },
  ],
};
