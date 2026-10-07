// 第 354 種:第 93 種曲柄與開槽十字頭的變形。十字頭(上下有桿、在導件裡上下)裡開一道封閉的無端溝槽,
// 曲柄手腕在溝槽裡走;溝槽的形狀做成讓十字頭以均勻的速度上下往復(位移隨曲柄角成三角波)。
// 主動件是曲柄(在十字頭後方的圓盤上)。
// 推斷:溝槽是「曲柄手腕相對十字頭走過的軌跡」(由均勻往復反推),所以手腕始終在溝槽裡。
// 機架(推斷,原圖只畫出上下兩個導件):兩個導件是一個方框的上下兩邊,方框立在底板上;曲柄盤的軸往後伸進軸承座。
import { TAU } from "./kit.js";
import { shape, circle, offsetLoop } from "./shapes.js";
import { pedestal } from "./supports.js";

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
        { kind: "cylinder", radius: 0.1, length: 0.45, at: [0, 0, -0.62] }, // 曲柄盤的軸,往後伸進軸承座
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
        { kind: "box", size: [0.22, 4.0, 0.22], at: [0, 2.2, 0] },
        { kind: "box", size: [0.22, 4.0, 0.22], at: [0, -2.3, -0.2] },
      ],
    },
    {
      // 導座在曲柄輪盤的前面:方框的上下兩邊(十字頭的桿穿過它們),方框立在底板上(底板中間讓出下桿的路)
      id: "guides",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.8, 0.3, 0.4], at: [0, 2.4, -0.05] },
        { kind: "box", size: [4.8, 0.3, 0.4], at: [0, -2.4, -0.05] },
        { kind: "box", size: [0.3, 4.5, 0.4], at: [-2.25, 0, -0.05] },
        { kind: "box", size: [0.3, 4.5, 0.4], at: [2.25, 0, -0.05] },
        { kind: "box", size: [2.2, 0.15, 1.3], at: [-1.4, -2.625, -0.45] },
        { kind: "box", size: [2.2, 0.15, 1.3], at: [1.4, -2.625, -0.45] },
        ...pedestal({ at: [0, 0], z: -0.7, bore: 0.11, floor: -2.55 }),
      ],
    },
  ],
  driver: { part: "crank", type: "rotation", initial: Math.PI / 2 },
  target: "crosshead", // 等速往復的十字頭
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    return { parts: { crank: { angle: theta }, crosshead: { position: [0, crosshead(theta), 0] } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["crank", "crosshead"], reason: "接合處的簡化畫法:曲柄銷在十字頭的橫槽裡滑動,銷與槽壁(畫成圓條)重疊 0.13" },
  ],
};
