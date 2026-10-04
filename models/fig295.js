// 第 295 種(條目 294–295 的放大圖):從上方看擒縱輪的一段與圓筒;機構見 cylinder-escapement.js。
import { cylinderEscapement } from "./cylinder-escapement.js";

export default {
  ...cylinderEscapement(295, { direction: [0.05, 0.1, 1] }),
  waivers: [
    { check: "interference", parts: ["wheel", "cylinder"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算工字輪(空心圓筒)的唇口與輪齒的接觸;重疊 0.06(96 個取樣中 39 個)。列入待確認清單的動力重演名單" },
  ],
};
