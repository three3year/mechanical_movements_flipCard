// 第 354 種:第 93 種曲柄與開槽十字頭的變形。十字頭(上下有桿、在導件裡上下)是一塊板,板上開一道封閉的
// 無端溝槽,曲柄銷在溝槽裡走;溝槽的形狀做成讓十字頭以均勻的速度上下往復(位移隨曲柄角成三角波)。
// 主動件是曲柄(在十字頭後方的曲柄盤上)。
// 推斷:溝槽是「曲柄銷相對十字頭走過的軌跡」(由均勻往復反推),寬度是銷徑加 0.02,所以曲柄銷始終在溝槽裡、
// 不碰槽壁。軌跡在十字頭換向處(曲柄角 90°、270°)有尖角,上下兩半在板的中心相接成兩瓣;
// 溝槽開穿整塊板,兩瓣中間剩下的兩塊「島」各由正面一條壓條跨過溝槽接回板上(銷只伸進板的後三分之二,
// 從壓條底下通過)。原圖曲柄輪在前、十字頭在後(虛線是被遮住的桿與溝),模型前後對調讓溝看得見,原理不變。
// 機架(推斷,原圖只畫出上下兩個導件):兩個導件是一個方框的上下兩邊,方框立在底板上;曲柄盤的軸往後伸進軸承座。
// 曲柄臂貼在曲柄盤的盤面上,曲柄銷立在臂的外端、往前伸進溝槽。
import { TAU } from "./kit.js";
import { shape, circle, offsetLoop, arcPoints, zCylinder } from "./shapes.js";
import { pedestal } from "./supports.js";

const R = 1.6; // 曲柄半徑 = 十字頭的單邊行程
const PIN = 0.12; // 曲柄銷的半徑
const SLOT = PIN + 0.01; // 溝槽的半寬

/** 曲柄轉 theta → 十字頭的位移(三角波:勻速上下,與曲柄的上下分量同步) */
export function crosshead(theta) {
  const f = (((theta / TAU) % 1) + 1) % 1;
  const tri = f < 0.25 ? 4 * f : f < 0.75 ? 2 - 4 * f : 4 * f - 4;
  return R * tri;
}

// 溝槽的中心線:曲柄銷在十字頭座標中的軌跡(逆時針;上半從右到左、下半從左到右,在原點相接)
export const GROOVE = Array.from({ length: 720 }, (_, i) => {
  const theta = (i / 720) * TAU;
  return [R * Math.cos(theta), R * Math.sin(theta) - crosshead(theta)];
});

// 點到中心線的距離
function toGroove([x, y]) {
  let best = Infinity;
  for (let i = 0; i < GROOVE.length; i++) {
    const [ax, ay] = GROOVE[i];
    const [bx, by] = GROOVE[(i + 1) % GROOVE.length];
    const [dx, dy] = [bx - ax, by - ay];
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}
// 溝槽的邊:中心線往外、往內平移半寬;尖角處平移出來的線會互相穿過,離中心線不到半寬的點拿掉
const edge = (d) => offsetLoop(GROOVE, d).filter((p) => toGroove(p) >= SLOT - 0.003);
const OUTER = edge(SLOT); // 溝槽的外緣(板上的孔)
// 兩瓣中間的島(左右各一塊),依繞自己中心的角度排好
const island = (side) => {
  const pts = edge(-SLOT).filter(([x]) => side * x > 0);
  const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
  return pts.sort((a, b) => Math.atan2(a[1] - c[1], a[0] - c[0]) - Math.atan2(b[1] - c[1], b[0] - c[0]));
};

// 十字頭的板:兩端圓的長條,包住溝槽;正面的壓條在溝槽的兩端跨過去,把島接回板上
const HALF = { x: 2.0, y: 0.62 };
const plateOutline = [...arcPoints(HALF.y, -Math.PI / 2, Math.PI / 2, HALF.x - HALF.y, 0), ...arcPoints(HALF.y, Math.PI / 2, (3 * Math.PI) / 2, -(HALF.x - HALF.y), 0)];
const Z = { plate: -0.1, thick: 0.3 }; // 板在 −0.25..0.05
const FRONT = Z.plate + Z.thick / 2;
const ROD = 3.8; // 上下兩根桿的長度:整個行程都留在導件裡

export default {
  figure: 354,
  parts: [
    {
      id: "crank",
      kind: "group",
      spin: R + 0.3,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.45), [circle(R + 0.25).reverse()]), thickness: 0.15, at: [0, 0, -0.35] }, // 輪緣
        { kind: "plate", shape: shape(circle(R + 0.3), [circle(0.1).reverse()]), thickness: 0.05, at: [0, 0, -0.42] }, // 盤面 −0.445..−0.395
        { kind: "box", size: [R + 0.12, 0.18, 0.1], at: [(R + 0.12) / 2 - 0.06, 0, -0.345] }, // 曲柄臂:貼在盤面上
        { ...zCylinder(-0.295, FRONT - 0.07, PIN, [R, 0]), accent: true }, // 曲柄銷:立在臂上、往前伸進溝槽
        { kind: "cylinder", radius: 0.1, length: 0.45, at: [0, 0, -0.62] }, // 曲柄盤的軸,往後伸進軸承座
      ],
    },
    {
      id: "crosshead",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(plateOutline, [OUTER.slice().reverse()]), thickness: Z.thick, at: [0, 0, Z.plate] },
        ...[-1, 1].map((s) => ({ kind: "plate", shape: shape(island(s)), thickness: Z.thick, at: [0, 0, Z.plate] })),
        // 壓條:跨過溝槽兩端,把島接回板上
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.6, 0.14, 0.06], at: [s * (R + 0.02), 0, FRONT + 0.03] })),
        // 上下兩根桿,穿過上下兩個導件(桿的長度讓它在整個行程中都留在導件裡)
        { kind: "box", size: [0.22, ROD, 0.22], at: [0, HALF.y + ROD / 2, Z.plate] },
        { kind: "box", size: [0.22, ROD, 0.22], at: [0, -HALF.y - ROD / 2, Z.plate] },
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
};
