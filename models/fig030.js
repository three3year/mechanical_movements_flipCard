// 第 30 種:矩形齒輪。左輪是轉成菱形的方形(圓角),右輪的節曲線依純滾動求出(四角外凸的近似方形:
// 兩輪中心固定又要一直保持接觸,共軛曲線就是這個形狀);
// 兩輪中心固定,被動輪做變速旋轉(曾用於印刷機的方形鉛字滾筒)。
// 原圖右輪較大;要讓兩輪每轉一圈都回到同樣的咬合,兩輪節曲線周長必須相同,所以這裡兩輪等大(與原圖的差異)。
import { conjugatePair } from "./conjugate-pair.js";

const HALF = 1.0;
const n = 7; // 超橢圓指數:越大越接近方形
const square = (a) => HALF / (Math.abs(Math.cos(a)) ** n + Math.abs(Math.sin(a)) ** n) ** (1 / n);
const diamond = (a) => square(a - Math.PI / 4);

const pair = conjugatePair({ figure: 30, r1: diamond, teeth: 32, module: 0.075 });
export const { D, driven } = pair;
export default pair.def;
