// 第 294 種(條目 294–295 的立體圖):圓筒式擒縱的圓筒;機構見 cylinder-escapement.js。
// 初始視角:原圖只畫圓筒(從側面看、擺輪軸橫放),但只以圓筒取景時擒縱輪整個落在畫面外、圓筒又放得太大,
// 看不出它屬於哪個機構;改成從擺輪軸那一側斜上方看整組(擒縱輪 + 圓筒 + 擺輪軸),軸仍是橫放的、
// 圓筒的切口與停靠在裡面的齒都看得到。第 295 種從正面看。
import { cylinderEscapement } from "./cylinder-escapement.js";

export default {
  ...cylinderEscapement(294, { direction: [1, 0.45, 0.8] }),
  waivers: [
    { check: "interference", parts: ["wheel", "cylinder"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算工字輪(空心圓筒)的唇口與輪齒的接觸;重疊 0.06(96 個取樣中 39 個)。列入待確認清單的動力重演名單" },
  ],
};
