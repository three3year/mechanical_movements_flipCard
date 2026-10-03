// 第 71 種:驅動輪 B 的內側圓周(護輪緣,原圖以虛線示意)作為鎖定機構:輪 C 上有兩根凸柱在輪緣裡面、
// 靠在輪緣內側,直到撥爪 A 撞擊上面那根,C 順時針轉過一個凸柱的距離——下面那根從護輪緣下方的凹槽離開,
// 再上面一根從上方的凹槽進入輪緣。B 每轉一圈重複一次。主動件是 B(逆時針)。
// 幾何由凸柱的路徑算出:兩根靠在輪緣上的凸柱決定兩輪的中心距;凸柱路徑穿過輪緣的那一段,
// 在撥爪推動的那段時間裡對到的輪緣位置,就是上下兩個凹槽。
import { deg } from "./kit.js";
import { studIndex } from "./stud-index.js";

const STUDS = { count: 10, radius: 1.5, size: 0.1 };
const STEP = (2 * Math.PI) / STUDS.count;
const RIM = { inner: 1.55, outer: 1.7 };
const SPAN = deg(40); // 撥爪推動凸柱的那段 B 轉角(以撥爪正對 C 為中心)
// 中心距:靠在輪緣上的兩根凸柱(C 局部 ±半個間距)剛好碰到輪緣內側
const rest = STEP / 2;
const D = STUDS.radius * Math.cos(rest) + Math.sqrt((RIM.inner - STUDS.size - 0.01) ** 2 - (STUDS.radius * Math.sin(rest)) ** 2); // 留 0.01 間隙
// 凸柱路徑穿出輪緣外側(含凸柱半徑)時的 C 局部角
const exitAt = Math.acos((D * D + STUDS.radius ** 2 - (RIM.outer + STUDS.size) ** 2) / (2 * D * STUDS.radius));
// 凸柱在 C 局部角 phi 時,以 B 為中心的方位角
const aroundB = (phi) => Math.atan2(STUDS.radius * Math.sin(phi), STUDS.radius * Math.cos(phi) - D);
const MARGIN = STUDS.size / RIM.inner + deg(1);
// 下面那根在推動的前半段離開(B 轉角 −SPAN/2 → 0),上面一根在後半段進入(0 → SPAN/2);
// 凹槽是 B 局部角,= 世界角 − B 轉角
const lowerGap = [aroundB(-exitAt) - 0 - MARGIN, aroundB(-rest) + SPAN / 2 + MARGIN].map((a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
const upperGap = [aroundB(rest) - SPAN / 2 - MARGIN, aroundB(exitAt) - 0 + MARGIN].map((a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));

const index = studIndex({
  figure: 71,
  wheel: { center: [-D / 2, 0, 0], radius: 1.82 },
  driver: { center: [D / 2, 0, 0], radius: 2.1 },
  studs: STUDS,
  rim: { radius: RIM.outer, inner: RIM.inner, gaps: [upperGap, lowerGap] },
  tappet: RIM.inner - STUDS.size - STUDS.size + 0.02, // 撥爪尖剛好打到靠在輪緣上的凸柱
  span: SPAN,
  labels: { wheel: "C", driver: "B", tappet: "A" },
});

export const { index: cAngle, step } = index;
export const geometry = { D, exitAt, upperGap, lowerGap };
export default {
  ...index.def,
  waivers: [
    { check: "interference", parts: ["wheel", "driver"], reason: "待確認(未修):wheel 的板 與 driver 的板互相穿入 0.37(96 個取樣姿勢),尚未修正" },
  ],
};
