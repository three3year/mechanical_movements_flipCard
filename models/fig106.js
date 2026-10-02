// 第 106 種(條目 106–107):開槽凸輪——圓筒表面斜繞一圈的溝,使上方的桿做均勻的往復直線運動,
// 圓筒每轉一圈,桿往返一次。
import { grooveCam } from "./groove-cam-pair.js";

const cam = grooveCam({ figure: 106, waves: 1, amp: 0.45, length: 1.1 });
export const { rodX, amp, waves } = cam;
export default cam.def;
