// 第 30 種:矩形齒輪。被驅動、做變速旋轉的右輪就是原文裝鉛字的「矩形滾筒」:節曲線是圓角正方形(四邊是直線段),
// 起始時平邊正對左輪,和插圖一樣。左輪(主動)的節曲線依純滾動求出,是正方形的共軛:四個外凸的瓣、瓣間內凹
// (兩輪中心固定又要一直保持接觸,兩個方形不能互相滾動,其中一輪一定是共軛形)。起始時瓣尖對著右輪的平邊。
// 與原圖的差異:原圖左輪是轉成菱形的方形,這裡是四瓣形,只有「角對著右輪的平邊」對得上;
// 原圖右輪較大,要讓兩輪每轉一圈都回到同樣的咬合,兩輪節曲線周長必須相同,所以這裡兩輪等大;
// 正方形的角做成圓角(半徑 ROUND),否則共軛的左輪在角上會有尖點、齒排不上去。
import { conjugatePair } from "./conjugate-pair.js";

const HALF = 1.0; // 正方形邊長的一半(中心到平邊)
const ROUND = 0.3; // 圓角半徑
const square = (a) => {
  const q = ((a % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
  const t = Math.min(q, Math.PI / 2 - q); // 從最近的平邊中點量起,0…π/4
  const c = HALF - ROUND; // 圓角圓心在 (c, c)
  if (Math.tan(t) * HALF <= c) return HALF / Math.cos(t);
  const k = Math.cos(t) + Math.sin(t);
  return c * k + Math.sqrt(c * c * k * k - 2 * c * c + ROUND * ROUND);
};

const pair = conjugatePair({ figure: 30, r2: square, teeth: 32, module: 0.075 });
export const { D, driven, r1, r2 } = pair;
export default pair.def;
