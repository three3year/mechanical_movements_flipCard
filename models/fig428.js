// 第 428 種:印度橡膠旋轉式引擎。汽缸有一層印度橡膠做的撓性內襯 E,以滾子 A、A 代替活塞,滾子裝在從主軸 B 放射出去的
// 臂上。蒸汽在橡膠與外圍剛性汽缸之間作用,把橡膠壓向滾子,使滾子繞著汽缸轉、帶動主軸。
// 主動件是主軸 B(原圖箭頭:順時針)。
// 推斷:三個滾子把橡膠壓貼在汽缸壁上;進汽口在左、排汽口在右(汽缸壁在這兩處開口,接到汽管)。從進汽口順時針到排汽口
// (上半圈)之間,每兩個相鄰滾子之間的內襯都被蒸汽往內壓——進汽口到最前面那個滾子之間是進汽段,兩個滾子之間封著的
// 是膨脹段——內襯包住滾子的後側、推它前進;最前面的滾子過了排汽口,它後面那段的蒸汽排掉、內襯貼回缸壁;
// 下半圈(排汽口到進汽口)的內襯都貼著缸壁。
// 內襯被壓進去的形狀:在兩端沿滾子的外緣包住滾子(離開缸壁的那一段,在進排汽口也用同樣的形狀),中間以兩端斜率
// 相接的三次曲線往內凹,凹的深度隨這段的長度變——照插圖,兩滾子之間最深約 0.4。橡膠環被壓進去時周長只縮不伸
// (最多縮 4%),是橡膠的彈性壓縮。
// 滾子裝在臂端的銷上(推斷:插圖的滾子中心有銷),臂在滾子後面,不穿過滾子的輪緣;滾子的軸不穿過固定的後蓋。
import { TAU, deg, wrap, signedAngle, polar, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, disc, thickLine, arcPoints } from "./shapes.js";

export const BORE = 1.8; // 汽缸內壁半徑
export const THICK = 0.09; // 橡膠內襯的厚度(路徑零件的直徑)
export const ROLLER = 0.26; // 滾子半徑(畫出的就是這個)
export const ARM = BORE - THICK - ROLLER; // 滾子中心離主軸:滾子把內襯壓貼在缸壁上
const WALL = BORE - THICK / 2; // 內襯貼著缸壁時中心線的半徑
const CLEAR = ROLLER + THICK / 2; // 內襯的中心線離滾子中心至少這麼遠
const SHADOW = Math.asin(CLEAR / ARM); // 從汽缸中心看,滾子蓋住的角度(單側)
const INLET = Math.PI; // 進汽口的口緣(左)
const EXHAUST = 0; // 排汽口的口緣(右)
const WRAP = deg(5); // 內襯離開缸壁時沿滾子外緣包住的角度(從汽缸中心量)

const rollerAngle = (theta, k) => theta + (k * TAU) / 3;

/** 從汽缸中心看,角度 delta(離滾子中心的方向)那條射線穿出滾子外緣的半徑;射線沒碰到滾子回傳 -Infinity */
function rollerEdge(delta) {
  if (Math.abs(delta) >= SHADOW) return -Infinity;
  const s = ARM * Math.sin(delta);
  return ARM * Math.cos(delta) + Math.sqrt(CLEAR * CLEAR - s * s);
}
const rollerEdgeSlope = (delta) => (rollerEdge(delta + 1e-5) - rollerEdge(delta - 1e-5)) / 2e-5;

/** 主軸轉 theta → 被蒸汽壓著的內襯段 [{ lo, hi }](世界角,逆時針;每段在兩個相鄰滾子之間,只取上半圈) */
export function chambers(theta) {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const front = signedAngle(rollerAngle(theta, k)); // 順時針前面的滾子
    const back = front + TAU / 3; // 後面的滾子
    const lo = Math.max(front, EXHAUST);
    const hi = Math.min(back, INLET);
    if (hi > lo + 1e-9) out.push({ lo, hi });
  }
  return out;
}

/** 一段被壓著的內襯在局部位置 u(從 lo 量起的角度)的半徑 */
function pressed(span, u) {
  const w = WRAP * clamp(span / (4 * WRAP), 0, 1); // 短的段包得少
  if (u <= w) return rollerEdge(u);
  if (u >= span - w) return rollerEdge(span - u);
  // 中段:三次曲線,兩端的位置與斜率接到包住滾子的弧
  const len = span - 2 * w;
  const t = (u - w) / len;
  const r0 = rollerEdge(w);
  const s0 = rollerEdgeSlope(w) * len; // dr/du 在兩端:離開滾子往內、接近滾子往外
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
  const h10 = t ** 3 - 2 * t ** 2 + t;
  const h01 = -2 * t ** 3 + 3 * t ** 2;
  const h11 = t ** 3 - t ** 2;
  return r0 * h00 + s0 * h10 + r0 * h01 - s0 * h11;
}

/** 橡膠內襯中心線在世界角 phi 的半徑:被蒸汽壓著的段往內凹、包住滾子;其餘貼著缸壁;任何地方都不穿進滾子 */
export function lining(theta, phi) {
  let r = WALL;
  for (const { lo, hi } of chambers(theta)) {
    const u = wrap(phi - lo);
    if (u < hi - lo) r = Math.min(r, pressed(hi - lo, u));
  }
  for (let k = 0; k < 3; k++) r = Math.max(r, rollerEdge(signedAngle(phi - rollerAngle(theta, k))));
  return r;
}

// 汽缸壁在進、排汽口開口(中間一層的環缺一個扇形),汽管的兩道壁接到開口兩側
const PORT = [deg(2.2), deg(10.6)]; // 口緣離水平線的角度(下緣、上緣)
const sector = (a0, a1) => shape([...arcPoints(BORE + 0.2, a0, a1), ...arcPoints(BORE, a1, a0)]);
const inletWalls = [
  [[-BORE - 0.9, 0.36], [-BORE - 0.02, 0.36]],
  [[-BORE - 0.9, 0.04], [-BORE - 0.05, 0.04]],
];
const exhaustWalls = inletWalls.map((line) => line.map(([x, y]) => [-x, -y]));
const inletPipe = [[-BORE - 0.9, 0.2, 0.2], [-BORE + 0.08, 0.2, 0.2]];
const exhaustPipe = inletPipe.map(([x, y, z]) => [-x, -y, z]).reverse();

export default {
  figure: 428,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.2), [circle(BORE).reverse()]), thickness: 0.2, at: [0, 0, 0.2] },
        { kind: "plate", shape: shape(circle(BORE + 0.2), [circle(BORE).reverse()]), thickness: 0.2, at: [0, 0, -0.2] },
        { kind: "plate", shape: sector(-PORT[0], Math.PI - PORT[1]), thickness: 0.22 }, // 上半圈的壁(進汽口上緣到排汽口上緣)
        { kind: "plate", shape: sector(Math.PI + PORT[0], TAU - PORT[1]), thickness: 0.22 }, // 下半圈的壁
        { kind: "plate", shape: shape(circle(BORE + 0.2)), thickness: 0.04, at: [0, 0, -0.32] }, // 後蓋
        { kind: "box", size: [2.6, 0.3, 0.9], at: [0, -BORE - 0.33, 0] },
        ...[...inletWalls, ...exhaustWalls].map((line) => ({ kind: "plate", shape: shape(thickLine(line, 0.06)), thickness: 0.24 })),
      ],
    },
    { id: "lining", kind: "rod", radius: THICK / 2, label: "E", labelOffset: [BORE * 0.62, BORE * 0.55, 0.3] }, // 路徑零件的標籤從原點量起
    {
      id: "arms",
      kind: "group",
      label: "B",
      labelOffset: [0.05, -0.4, 0.4],
      spin: 0.5,
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 0.44, at: [0, 0, -0.07] },
        // 臂在滾子後面(z −0.29..−0.21),臂端的銷伸進滾子的轂孔(推斷)
        ...[0, 1, 2].map((k) => ({ kind: "plate", shape: shape(thickLine([[0, 0], [ARM, 0]], 0.16)), thickness: 0.08, angle: (k * TAU) / 3, at: [0, 0, -0.25] })),
        ...[0, 1, 2].map((k) => ({ kind: "cylinder", radius: 0.04, length: 0.29, at: [...polar(ARM, (k * TAU) / 3).slice(0, 2), -0.145] })),
        { kind: "plate", shape: shape(circle(0.12)), thickness: 0.32, mark: [0, 0.05], markSize: 0.05 },
      ],
    },
    ...[0, 1, 2].map((k) => ({ id: `roller${k + 1}`, kind: "plate", shape: disc(ROLLER, 0.045), thickness: 0.4, mark: [0.15, 0], markSize: 0.05, label: "A", labelOffset: [0, 0, 0.45], arrow: false })),
  ],
  driver: { part: "arms", type: "rotation", speed: -0.5, initial: deg(80) },
  targets: ["roller1", "roller2", "roller3"], // 主軸 B 就是主動件(臂);標代替活塞、被橡膠內襯推著走的滾子 A
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const pts = Array.from({ length: 360 }, (_, i) => {
      const phi = (TAU * i) / 360;
      return polar(lining(theta, phi), phi, 0.05);
    });
    // 蒸汽:在被壓著的內襯和缸壁之間
    const dots = [];
    for (const { lo, hi } of chambers(theta)) {
      const n = Math.max(1, Math.round((hi - lo) / deg(6)));
      for (let i = 0; i < n; i++) {
        const phi = lo + ((hi - lo) * (i + 0.5 + 0.3 * Math.sin(theta * 3 + i))) / n;
        const r = lining(theta, phi);
        if (WALL - r > 0.1) dots.push(polar((r + WALL) / 2, phi, 0.1));
      }
    }
    const parts = { arms: { angle: theta } };
    for (let k = 0; k < 3; k++) {
      // 滾子沿內襯的內面滾、不打滑:接觸點速度為零,自轉 = −公轉 × 臂長 / 滾子半徑
      parts[`roller${k + 1}`] = { position: polar(ARM, rollerAngle(theta, k)), angle: (-theta * ARM) / ROLLER };
    }
    return {
      parts,
      paths: { lining: { points: pts, closed: true } },
      flows: [
        { fluid: "steam", points: [...dots, ...stream(inletPipe, -theta, { spacing: 0.18 })] },
        { fluid: "steam", points: stream(exhaustPipe, -theta, { spacing: 0.18 }) },
      ],
      readouts: [],
    };
  },
};
