// 第 70 種:驅動輪 C 有一圈輪緣(原圖以虛線示意);撥爪 B 沒碰到凸柱的期間,輪緣外側作為輪 A 上凸柱的
// 軸承與擋止。輪緣上有一個開口,讓一根凸柱進入、另一根離開;撥爪正對開口的中央。
// C 每轉一圈,A 轉過一個凸柱的距離。主動件是 C(逆時針)。
import { deg } from "./kit.js";
import { studIndex } from "./stud-index.js";

const index = studIndex({
  figure: 70,
  wheel: { center: [-1.55, 0, 0], radius: 1.82 },
  driver: { center: [1.62, 0, 0], radius: 1.95 },
  studs: { count: 10, radius: 1.5 },
  rim: { radius: 1.82, inner: 1.68, gaps: [[deg(160), deg(200)]] },
  tappet: 1.75,
  labels: { wheel: "A", driver: "C", tappet: "B" },
});

export const { index: aAngle, step } = index;
export default index.def;
