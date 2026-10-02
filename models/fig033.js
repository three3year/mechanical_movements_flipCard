// 第 33 種:橢圓形正齒輪。左輪是長軸直立、繞中心轉的橢圓;右輪的節曲線依純滾動求出(近似橢圓、長軸水平)。
// 主動輪等速轉時,從動輪的轉速隨接觸點兩側半徑的比例變化,變化幅度取決於長短軸的比例。
import { conjugatePair } from "./conjugate-pair.js";

const A = 1.3; // 半長軸
const B = 0.85; // 半短軸
const ellipse = (a) => (A * B) / Math.sqrt((A * Math.cos(a - Math.PI / 2)) ** 2 + (B * Math.sin(a - Math.PI / 2)) ** 2);

const pair = conjugatePair({ figure: 33, r1: ellipse, teeth: 24, module: 0.09 });
export const { D, driven } = pair;
export const axes = [A, B];
export default pair.def;
