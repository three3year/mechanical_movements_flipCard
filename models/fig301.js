// 第 301 種(條目 300–301 的側視立面圖):雙擒縱輪與半圓叉瓦;機構見 twin-wheel-escapement.js。
import { twinWheels } from "./twin-wheel-escapement.js";

export default {
  ...twinWheels(301, [1, 0.06, 0.05]),
  waivers: [
    { check: "unsupported", parts: ["wheels"], reason: "擒縱的接觸是瞬間的(輪齒落在掣子上、滑過衝擊面);模型依相位演出,零件的外形沒有畫到真的互相碰到(差 0.16)。要補得重排擺軸、掣子與擒縱輪的相對位置(列入待確認清單)" },
    { check: "unsupported", parts: ["staff"], reason: "擒縱的接觸是瞬間的(輪齒落在掣子上、滑過衝擊面);模型依相位演出,零件的外形沒有畫到真的互相碰到(差 0.16)。要補得重排擺軸、掣子與擒縱輪的相對位置(列入待確認清單)" },
  ],
};
