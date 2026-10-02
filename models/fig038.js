// 第 38 種:一部分旋轉中保持均勻速度、另一部分中變速。主動輪的節曲線四分之三是圓(兩輪等速),
// 其餘四分之一先外凸再內凹;從動輪是它的共軛(相應處先內凹再外凸)。
// 走到這一段時從動輪先快後慢,轉完一圈兩輪仍同步。原圖以兩段不同半徑的扇形齒表示這一段,
// 這裡用平滑的節曲線,咬合才連續(與原圖畫法的差異)。
import { TAU } from "./kit.js";
import { conjugatePair } from "./conjugate-pair.js";

const R = 1.2;
const K = 0.3;
const SECTOR = TAU / 4;
// 局部角 0 到 90° 是變速段(在 θ = 0 時正對從動輪)
const r1 = (a) => {
  const phi = ((a % TAU) + TAU) % TAU;
  if (phi >= SECTOR) return R;
  return R * (1 + K * Math.sin((TAU * phi) / SECTOR) * Math.sin((Math.PI * phi) / SECTOR));
};

const pair = conjugatePair({ figure: 38, r1, teeth: 36, module: 0.075 });
export const { D, driven } = pair;
export const sectorSpan = SECTOR;
export default pair.def;
