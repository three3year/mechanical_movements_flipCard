// 第 107 種(條目 106–107):開槽凸輪——圓筒表面的溝彎繞成五個波,圓筒每轉一圈,
// 上方的桿往返五次,每一程都是均勻的直線運動。
import { grooveCam } from "./groove-cam-pair.js";

const cam = grooveCam({ figure: 107, waves: 5, amp: 0.38, length: 1.2 });
export const { rodX, amp, waves } = cam;
export default cam.def;
