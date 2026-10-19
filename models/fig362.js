// 第 362 種:上方的軸連同它的鼓輪交替地左右橫移。上方軸右端伸出一根銷,往下插進下方圓筒上的傾斜溝槽;
// 下方圓筒轉動時,斜溝槽把銷左右推,上方軸與鼓輪便來回橫移(圓筒每轉一圈一個來回)。主動件是下方的圓筒。
// 推斷:溝槽是一個斜截平面與圓筒面的交線,所以橫移隨轉角成正弦變化;斜度依原圖。機架(三根立柱與底座)。
// 鼓輪橫移 ±0.45,左立柱與中立柱之間要容得下鼓輪長加兩倍橫移,所以把左立柱往外移;上方軸往左加長,全程穿過兩根立柱。
// 鼓輪橫移的中點擺在兩柱正中,走到兩端時各離立柱 0.05。原圖鼓輪兩側的空隙(左約 0.28、右約 0.44 個鼓輪長)加起來
// 約等於兩倍橫移,是畫在偏左的那一刻;照原圖把中點擺偏,鼓輪走到右端時就會穿進中立柱,所以不照原圖的不對稱。
import { X, Y, TAU } from "./kit.js";

const UP_Y = 1.45;
const LOW = { center: [1.6, -0.55, 0], r: 0.75, length: 1.3 };
const SLANT = 0.45; // 溝槽在圓筒上的軸向幅度(單邊)
const POST = { left: -1.95, mid: 0.6, w: 0.3 }; // 左、中立柱的中心 x
const DRUM = { r: 0.85, length: 1.25, x: (POST.left + POST.mid) / 2 }; // 鼓輪擺在兩柱正中
const PIN = 0.06; // 從動銷的半徑
const RIB = { r: 0.025, gap: PIN + 0.01 }; // 凸棱的粗細;溝槽的半寬(垂直於溝槽量,從銷心到凸棱的表面)
const RIB_R = LOW.r + 0.02; // 凸棱的中心半徑:凸棱貼在圓筒面上(埋進 0.005)
const PIN_TIP = LOW.center[1] + LOW.r + 0.005; // 銷尖的高度

/** 下方圓筒轉 theta → 上方軸的橫移量(銷在圓筒頂上,溝槽在那裡的軸向位置) */
export const traverse = (theta) => -SLANT * Math.cos(theta);

// 斜溝槽:圓筒面上 x = −SLANT·cos(φ) 的曲線,以兩條凸棱表示(圓筒局部:軸沿 z)。
// 凸棱沿溝槽的法向量偏開(軸向偏移 = 半寬 / cos(斜角)),溝槽最陡處也和平的地方一樣寬,銷全程放得進去
const groove = (side) =>
  Array.from({ length: 145 }, (_, i) => {
    const phi = (i / 144) * TAU;
    // 圓筒局部角 phi 在頂端(世界 +y)時,溝槽的軸向位置要等於 traverse(theta)
    const slope = (SLANT * Math.sin(phi - Math.PI / 2)) / RIB_R; // 軸向位置對圓周弧長的斜率
    const d = side * (RIB.gap + RIB.r) * Math.hypot(1, slope);
    return [RIB_R * Math.cos(phi), RIB_R * Math.sin(phi), -SLANT * Math.cos(phi - Math.PI / 2) + d];
  });

export default {
  figure: 362,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立柱以兩根軸的中心線為中心(前後各 0.2),軸從柱身穿過、沿軸橫移時四周都被柱身圍著
        { kind: "box", size: [POST.w, 3.4, 0.4], at: [POST.left, 0.0, 0] },
        { kind: "box", size: [POST.w, 3.4, 0.4], at: [POST.mid, 0.0, 0] },
        { kind: "box", size: [0.3, 2.0, 0.4], at: [2.75, -0.7, 0] },
        { kind: "box", size: [5.9, 0.15, 0.8], at: [0.45, -1.75, 0] },
      ],
    },
    {
      id: "upper",
      kind: "group",
      arrow: false,
      pieces: [
        // 上方軸:左端在橫移到最右時仍伸出左立柱,右端過了銷
        { kind: "cylinder", axis: X, radius: 0.08, length: 4.45, at: [-0.425, UP_Y, 0] },
        { kind: "cylinder", axis: X, radius: DRUM.r, length: DRUM.length, at: [DRUM.x, UP_Y, 0] },
        // 右端往下的銷,插進下方圓筒的溝槽(銷尖離圓筒面 0.005,夾在兩道凸棱之間)
        { kind: "cylinder", axis: Y, radius: PIN, length: UP_Y - PIN_TIP, at: [LOW.center[0], (UP_Y + PIN_TIP) / 2, 0] },
      ],
    },
    {
      id: "cylinder",
      kind: "group",
      axis: X,
      center: LOW.center,
      spin: LOW.r,
      spinOffset: -LOW.length / 2,
      pieces: [
        { kind: "cylinder", radius: LOW.r, length: LOW.length, mark: true },
        { kind: "cylinder", radius: 0.07, length: 3.2 },
        { kind: "tube", points: groove(1), closed: true, radius: RIB.r },
        { kind: "tube", points: groove(-1), closed: true, radius: RIB.r },
      ],
    },
  ],
  driver: { part: "cylinder", type: "rotation" },
  target: "upper", // 來回橫移的上方軸
  view: { direction: [0.1, 0.25, 1] },
  pose(theta) {
    return { parts: { cylinder: { angle: theta }, upper: { position: [traverse(theta), 0, 0] } }, readouts: [] };
  },
};
