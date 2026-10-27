// 第 33 種:橢圓形正齒輪。左輪是長軸直立、繞中心轉的橢圓;右輪的節曲線依純滾動求出(近似橢圓、長軸水平),
// 起始時和插圖一樣左直右橫。與原圖的差異:繞中心轉的橢圓,共軛不是真的橢圓,右輪和同長短軸的橢圓差約 5%。
// 主動輪等速轉時,從動輪的轉速隨接觸點兩側半徑的比例變化,變化幅度取決於長短軸的比例。
import { conjugatePair } from "./conjugate-pair.js";

const A = 1.3; // 半長軸
const B = 0.85; // 半短軸
// 以中心為原點的橢圓,長軸在局部 ±π/2:r(θ) = AB / √((B·cos θ)² + (A·sin θ)²),θ 從長軸量起
const ellipse = (a) => (A * B) / Math.sqrt((B * Math.cos(a - Math.PI / 2)) ** 2 + (A * Math.sin(a - Math.PI / 2)) ** 2);

const pair = conjugatePair({ figure: 33, r1: ellipse, teeth: 24, module: 0.09 });
export const { D, driven, r1, r2 } = pair;
export const axes = [A, B];
export default pair.def;
