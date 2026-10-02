// 第 71 種:驅動輪 B 的內側圓周(護輪緣,原圖以虛線示意)作為鎖定機構:輪 C 上有兩根凸柱靠在它上面,
// 直到撥爪 A 撞擊其中一根,下方那根便從護輪緣下方的凹槽離開,另一根從上方的凹槽進入輪緣。
// B 每轉一圈,C 轉過一個凸柱的距離。主動件是 B(逆時針)。
import { deg } from "./kit.js";
import { studIndex } from "./stud-index.js";

const index = studIndex({
  figure: 71,
  wheel: { center: [-1.62, -0.1, 0], radius: 1.82 },
  driver: { center: [1.55, 0.1, 0], radius: 2.15 },
  studs: { count: 10, radius: 1.5 },
  rim: { radius: 2.0, inner: 1.76, gaps: [[deg(140), deg(158)], [deg(202), deg(220)]] },
  tappet: 1.3,
  labels: { wheel: "C", driver: "B", tappet: "A" },
});

export const { index: cAngle, step } = index;
export default index.def;
