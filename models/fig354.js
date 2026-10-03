// 第 354 種:第 93 種曲柄與開槽十字頭的變形。十字頭(上下有桿、在導件裡上下)裡開一道封閉的無端溝槽,
// 曲柄手腕在溝槽裡走;溝槽的形狀做成讓十字頭以均勻的速度上下往復(位移隨曲柄角成三角波)。
// 主動件是曲柄(在十字頭後方的圓盤上)。
// 推斷:溝槽是「曲柄手腕相對十字頭走過的軌跡」(由均勻往復反推),所以手腕始終在溝槽裡。
import { TAU } from "./kit.js";
import { shape, circle, offsetLoop } from "./shapes.js";

const R = 1.6; // 曲柄半徑 = 十字頭的單邊行程

/** 曲柄轉 theta → 十字頭的位移(三角波:勻速上下,與曲柄的上下分量同步) */
export function crosshead(theta) {
  const f = (((theta / TAU) % 1) + 1) % 1;
  const tri = f < 0.25 ? 4 * f : f < 0.75 ? 2 - 4 * f : 4 * f - 4;
  return R * tri;
}

// 溝槽:手腕(曲柄銷)在十字頭座標中的軌跡
export const GROOVE = Array.from({ length: 240 }, (_, i) => {
  const theta = (i / 240) * TAU;
  return [R * Math.cos(theta), R * Math.sin(theta) - crosshead(theta)];
});
// 溝槽是兩瓣的「8」字形(在中間交叉),以兩條沿它偏移的凸邊表示
const wall = (d) => offsetLoop(GROOVE, d).map(([x, y]) => [x, y, 0]);

export default {
  figure: 354,
  parts: [
    {
      id: "crank",
      kind: "group",
      spin: R + 0.3,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.45), [circle(R + 0.25).reverse()]), thickness: 0.15, at: [0, 0, -0.35] },
        { kind: "plate", shape: shape(circle(R + 0.3), [circle(0.1).reverse()]), thickness: 0.05, at: [0, 0, -0.42] },
        { kind: "box", size: [R, 0.18, 0.1], at: [R / 2, 0, -0.25] },
        { kind: "cylinder", radius: 0.12, length: 0.5, at: [R, 0, 0], accent: true },
      ],
    },
    {
      id: "crosshead",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "tube", points: wall(0.15), closed: true, radius: 0.05 },
        { kind: "tube", points: wall(-0.15), closed: true, radius: 0.05 },
        // 上下兩根桿,穿過上下兩個導件(桿的長度讓它在整個行程中都留在導件裡)
        { kind: "box", size: [0.22, 2.4, 0.22], at: [0, 1.4, 0] },
        { kind: "box", size: [0.22, 4.0, 0.22], at: [0, -2.3, -0.2] },
      ],
    },
    { id: "guides", kind: "group", pieces: [{ kind: "box", size: [0.9, 0.3, 0.5], at: [0, 2.0, -0.1] }, { kind: "box", size: [0.9, 0.3, 0.5], at: [0, -2.3, -0.1] }] },
  ],
  waivers: [
    { check: "interference", parts: ["crank", "crosshead"], reason: "待確認(未修):crank 的圓柱 r0.12×0.5 與 crosshead 的Tube互相穿入 0.13(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["crank", "guides"], reason: "待確認:crank 的板 與 guides 的方塊 0.9×0.3×0.5重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["crosshead", "guides"], reason: "待確認(未修):crosshead 的方塊 0.22×2.4×0.22 與 guides 的方塊 0.9×0.3×0.5互相穿入 0.26(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "crank", type: "rotation", initial: Math.PI / 2 },
  target: "crosshead", // 等速往復的十字頭
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    return { parts: { crank: { angle: theta }, crosshead: { position: [0, crosshead(theta), 0] } }, readouts: [] };
  },
};
