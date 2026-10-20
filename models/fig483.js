// 第 483 種:乾式氣錶。兩個像風箱一樣的腔室 A、A',輪流被氣體充滿,經一個閥門 B 排出;閥門有點像蒸汽機的滑閥,
// 由腔室 A、A' 帶動。腔室的容積已知,充滿的次數由錶盤機構記錄,所以通過的氣量就顯示在錶盤上。
// 主動件是虛擬的「進程」:通過的氣量(以兩個腔室各充放一次為一單位)。
// 推斷:兩個腔室的隔膜(皺褶的皮)左右擺動、相位差 90°(兩個風箱輪流過死點,實物的乾式氣錶都是這樣),經頂上的曲軸帶動滑閥 B
// 與錶盤指針;剖面圖(外殼留背面的壁)。
// 閥(推斷,2026-10-21):一片滑閥服侍不了相位差 90° 的兩個腔室(一片滑閥的兩個口只能一開一關、互為反相),所以閥 B 是
// 同一個閥座上的兩片 D 形滑閥 B、B'——各管一個腔室、各由曲軸上自己那一拐帶動、和自己的腔室相差 90°(蒸汽機的閥在活塞的
// 前 90°):閥座上每個腔室有一個進氣口(經隔板裡的通道通到風箱裡)與一個排氣口(通到隔板中間的排氣道、從底下的出口管出去);
// 滑閥往一邊滑時進氣口露給閥箱(入口的氣從頂上的入口管進到閥座上方的空間),往另一邊滑時進氣口被 D 形閥腔罩住、和排氣口相通。
// 風箱張開時進氣、縮小時排氣,由幾何決定(ports)。
import { TAU, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine, circle, spanBox } from "./shapes.js";
import { pipeWalls } from "./pump.js";

export const STROKE = 0.38; // 隔膜擺動的半幅
export const CENTERS = [-1.2, 1.2]; // 兩個腔室的中心
export const WALL = 0.6; // 風箱固定端:隔板的外壁(x = ±0.6)
const H = 2.2; // 腔室高(閥座的下面)
const DIAPHRAGM_H = 1.7;
const FOLDS = 6; // 皺褶數(皮分 2·FOLDS 段)
const PANEL = 0.15; // 皮每一段的長度(固定;折角隨隔膜的距離變)
const Z = 0.34; // 外殼內部零件的深度(半);外殼本身 ±0.4,背面的壁在 −0.4..−0.34
export const SEAT = { y0: H / 2 + 0.01, y1: H / 2 + 0.09 }; // 閥座(隔層):1.11..1.19
export const THROW = 0.08; // 滑閥的半行程
const LIP = 0.1; // 滑閥兩端的唇(蓋住口的部分)寬
export const PORTS = [
  // 每個腔室:進氣口(到風箱的通道)與排氣口(到中間的排氣道)在閥座上的 x 範圍
  { chamber: [-0.55, -0.45], exhaust: [-0.35, -0.27] },
  { chamber: [0.45, 0.55], exhaust: [0.27, 0.35] },
];
const SLIDE_X = [-0.315, 0.315]; // 兩片滑閥靜止時的中心(左唇蓋住進氣口、右唇在排氣口外側)
const EXHAUST_DUCT = 0.4; // 排氣道:x = ±0.4 之間,從閥座通到底下的出口管
const OPENING = [-0.2, 0.2]; // 通道在隔板外壁上開進風箱的口(y)
const OUTLET_W = 0.46; // 出口管、入口管(管壁中心線的間距)
const INLET_X = -1.5;

/** 風箱的容積(相對量):隔膜偏離中心 d 時,隔膜到隔板外壁的距離 */
export const chamberVolume = (d, k) => Math.abs(CENTERS[k] + d) - WALL;

/** 進程 v → 兩片隔膜的位置(偏離中心)、兩片滑閥的位移、錶盤指針角 */
function motion(v) {
  const a = TAU * v;
  const d = [STROKE * Math.sin(a), -STROKE * Math.cos(a)];
  const slide = [-THROW * Math.cos(a), -THROW * Math.sin(a)]; // 各比自己的隔膜早 90°(往外滑時露出進氣口)
  return { a, d, slide, dial: -a / 4 };
}

/** 進程 v → motion 的各量,加上 filling:哪個腔室在進氣(進氣口露給閥箱,由 ports 的幾何推出) */
export const meter = (v) => ({ ...motion(v), filling: ports(v).map((p) => p.toChest > 0) });

// 滑閥的剖面(局部原點在靜止時的中心、閥座面上):兩端的唇、中間的 D 形閥腔(開口朝下,一直罩著排氣口)
const CAVITY = [-(LIP + 0.035), LIP + 0.035]; // 閥腔的 x 範圍(靜止時):左唇 −0.235..−0.135、右唇 0.135..0.235
const SLIDE_H = 0.14;
const CAVITY_H = 0.08;
const slideOutline = [[CAVITY[0] - LIP, 0], [CAVITY[0], 0], [CAVITY[0], CAVITY_H], [CAVITY[1], CAVITY_H], [CAVITY[1], 0], [CAVITY[1] + LIP, 0], [CAVITY[1] + LIP, SLIDE_H], [CAVITY[0] - LIP, SLIDE_H]];

/** 進程 v → 每個腔室的進氣口露給閥箱(入口)的寬度 toChest,與被閥腔罩住、和排氣口相通的寬度 toExhaust(照滑閥的唇算) */
export function ports(v) {
  const { slide } = motion(v);
  return [0, 1].map((k) => {
    const [x0, x1] = PORTS[k].chamber;
    const lipL = SLIDE_X[k] + slide[k] + (k === 0 ? CAVITY[0] - LIP : CAVITY[1]); // 蓋著進氣口的那片唇
    const lipR = lipL + LIP;
    const w = x1 - x0;
    // 左腔室:口的外側在左,唇往右滑就露出;右腔室鏡像
    const toChest = k === 0 ? clamp(lipL - x0, 0, w) : clamp(x1 - lipR, 0, w);
    const toExhaust = k === 0 ? clamp(x1 - lipR, 0, w) : clamp(lipL - x0, 0, w);
    return { toChest, toExhaust };
  });
}

// 傳動(推斷;原圖沒有畫出來,只說滑閥由腔室帶動、錶盤記錄次數):外殼正面一根四拐的曲軸,
// 兩片隔膜與兩片滑閥各伸出一個直槽框(蘇格蘭軛)套在自己那一拐的銷上——隔膜來回推銷,曲軸就轉,
// 曲軸再經第三、四拐帶著兩片滑閥;軸上的小齒輪經大齒輪(4:1)帶動錶盤指針。四個直槽框各在一層,互不相碰。
const CRANK_Y = 1.9; // 曲軸的高度
const LAYER = [0.7, 0.86, 1.02, 1.18]; // 四個直槽框所在的前後層(隔膜 A、隔膜 A'、滑閥 B、滑閥 B')
const PIN_Y = 0.75; // 隔膜上接直槽框的銷
const slotBars = (x, half, z) => [-1, 1].map((s) => ({ kind: "box", size: [0.06, 2 * half + 0.16, 0.06], at: [x + s * 0.075, CRANK_Y, z] }));
// 隔膜的直槽框:隔膜上緣往前伸一根銷,接一根立桿、一根橫桿,到曲軸正下方再接直槽(k:0 左、1 右)
const diaphragmYoke = (k) => {
  const to = -CENTERS[k]; // 直槽相對隔膜的位置(曲軸在 x = 0)
  const z = LAYER[k];
  const low = CRANK_Y - STROKE - 0.11;
  return [
    { kind: "cylinder", radius: 0.03, length: z + 0.03 - 0.3, at: [0, PIN_Y, (z + 0.03 + 0.3) / 2] },
    { kind: "box", size: [0.06, low - PIN_Y + 0.06, 0.06], at: [0, (low + PIN_Y) / 2, z] },
    { kind: "box", size: [Math.abs(to) + 0.21, 0.06, 0.06], at: [to / 2, low, z] },
    ...slotBars(to, STROKE, z),
  ];
};
// 滑閥的直槽框:閥身往前伸一根桿到自己那一層,接橫桿到曲軸正下方,再接直槽(從閥的高度往上伸)
const slidePart = (k) => {
  const to = -SLIDE_X[k];
  const z = LAYER[2 + k];
  const top = CRANK_Y + THROW + 0.08 - SEAT.y1;
  const mid = SLIDE_H / 2;
  return {
    id: `slide${k}`,
    kind: "plate",
    shape: shape(slideOutline),
    thickness: 0.35,
    arrow: false,
    label: k === 0 ? "B" : "B'",
    labelOffset: [k === 0 ? -0.3 : 0.3, 0.2, 0.3],
    pieces: [
      { kind: "cylinder", radius: 0.03, length: z + 0.03 - 0.175, at: [0, mid, (z + 0.03 + 0.175) / 2] },
      { kind: "box", size: [Math.abs(to) + 0.21, 0.06, 0.06], at: [to / 2, mid, z] },
      ...[-1, 1].map((s) => ({ kind: "box", size: [0.06, top - mid, 0.06], at: [to + s * 0.075, (top + mid) / 2, z] })),
    ],
  };
};

// 隔膜的皺褶(之字形的皮):每一段長 PANEL 不變,折的深淺照隔板外壁到隔膜的距離算;兩端在壁與隔膜上(外側的折)
const pleats = (x0, x1, y, sign) => {
  const n = 2 * FOLDS;
  const dx = (x1 - x0) / n;
  const amp = Math.sqrt(PANEL * PANEL - dx * dx) / 2; // 相鄰兩折相距 2·amp
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([x0 + dx * i, y + sign * amp * (i % 2 ? -1 : 1), 0.15]);
  return pts;
};

const sb = (x0, x1, y0, y1) => spanBox(x0, x1, y0, y1, -Z, Z);
const mirror = (pieces) => pieces.map((q) => ({ ...q, at: [-q.at[0], q.at[1], q.at[2]] }));
// 隔板(左半;右半鏡像):外壁(中段開口進風箱)、內壁、通道底;中間是排氣道
const partitionHalf = [sb(-0.6, -0.55, -H / 2 - 0.25, OPENING[0]), sb(-0.6, -0.55, OPENING[1], SEAT.y0), sb(-0.45, -0.4, -0.45, SEAT.y0), sb(-0.55, -0.45, -0.45, -0.4)];
// 閥座:四個口之間的板
const seatSegments = [
  [-2.2, PORTS[0].chamber[0]],
  [PORTS[0].chamber[1], PORTS[0].exhaust[0]],
  [PORTS[0].exhaust[1], PORTS[1].exhaust[0]],
  [PORTS[1].exhaust[1], PORTS[1].chamber[0]],
  [PORTS[1].chamber[1], 2.2],
].map(([x0, x1]) => sb(x0, x1, SEAT.y0, SEAT.y1));

export default {
  figure: 483,
  parts: [
    {
      id: "case",
      kind: "group",
      pieces: [
        // 外殼:底(中間留出口管的口)、兩側、頂(左邊留入口管的口)、背面的壁
        spanBox(-2.3, -OUTLET_W / 2 - 0.03, -1.45, -1.35, -0.4, 0.4),
        spanBox(OUTLET_W / 2 + 0.03, 2.3, -1.45, -1.35, -0.4, 0.4),
        spanBox(-2.3, -2.2, -1.45, 2.15, -0.4, 0.4),
        spanBox(2.2, 2.3, -1.45, 2.15, -0.4, 0.4),
        spanBox(-2.3, INLET_X - OUTLET_W / 2 - 0.03, 2.05, 2.15, -0.4, 0.4),
        spanBox(INLET_X + OUTLET_W / 2 + 0.03, 2.3, 2.05, 2.15, -0.4, 0.4),
        { kind: "plate", shape: shape(rect(4.6, 3.6, 0, 0.35)), thickness: 0.06, at: [0, 0, -0.37] },
        // 入口管(頂上;推斷)與出口管(底下,接排氣道;推斷)
        ...pipeWalls([[INLET_X, 2.45], [INLET_X, 2.05]], OUTLET_W, 0.06, 0.8),
        ...pipeWalls([[0, -1.35], [0, -1.85]], OUTLET_W, 0.06, 0.8),
        // 閥座(隔層)與隔板
        ...seatSegments,
        ...partitionHalf,
        ...mirror(partitionHalf),
        // 曲軸與指針齒輪的軸承座(接在頂壁下)
        { kind: "box", size: [0.9, 0.3, 0.1], at: [0.25, CRANK_Y + 0.02, 0.3] },
      ],
    },
    ...[0, 1].map((k) => ({ id: `diaphragm${k}`, kind: "group", label: k === 0 ? "A" : "A'", labelOffset: [0.25, -0.2, 0.4], arrow: false, pieces: [{ kind: "box", size: [0.08, DIAPHRAGM_H, 0.6] }, ...diaphragmYoke(k)] })),
    ...[0, 1].flatMap((k) => ["Top", "Bottom"].map((p) => ({ id: `pleat${k}${p}`, kind: "rod", radius: 0.02 }))),
    slidePart(0),
    slidePart(1),
    {
      id: "crankshaft",
      kind: "group",
      center: [0, CRANK_Y, 0],
      spin: 0.5,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 0.38, at: [0, 0, 0.44] },
        { kind: "gear", teeth: 8, radius: 0.1, width: 0.08, at: [0, 0, 0.48] },
        { kind: "plate", shape: shape(circle(STROKE + 0.08)), thickness: 0.06, at: [0, 0, 0.6] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [0, -STROKE, 0.69] }, // 隔膜 A 的拐
        { kind: "plate", shape: shape(thickLine([[0, -STROKE], [-STROKE, 0]], 0.1)), thickness: 0.04, at: [0, 0, 0.77] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [-STROKE, 0, 0.85] }, // 隔膜 A' 的拐
        { kind: "plate", shape: shape(thickLine([[-STROKE, 0], [-THROW, 0]], 0.1)), thickness: 0.04, at: [0, 0, 0.93] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [-THROW, 0, 1.01] }, // 滑閥 B 的拐(比隔膜 A 早 90°)
        { kind: "plate", shape: shape(thickLine([[-THROW, 0], [0, THROW]], 0.1)), thickness: 0.04, at: [0, 0, 1.09] },
        { kind: "cylinder", radius: 0.04, length: 0.12, at: [0, THROW, 1.17] }, // 滑閥 B' 的拐
      ],
    },
    // 錶盤指針裝在大齒輪上(齒輪在曲軸盤的後面一層)
    {
      id: "dial",
      kind: "gear",
      center: [0.5, CRANK_Y, 0.48],
      teeth: 32,
      radius: 0.4,
      width: 0.08,
      pieces: [
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0, -0.08] },
        { kind: "box", size: [0.34, 0.05, 0.03], at: [0.17, 0, 0.055], accent: true },
      ],
    },
  ],
  powered: ["diaphragm0", "diaphragm1"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.15 },
  target: "dial", // 錶盤指針
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const m = meter(v);
    const open = ports(v);
    const parts = { crankshaft: { angle: m.a }, dial: { angle: m.dial } };
    const paths = {};
    const z = 0.2;
    const travel = v * 10;
    const gas = [];
    [0, 1].forEach((k) => {
      const sgn = k === 0 ? -1 : 1;
      const x = CENTERS[k] + m.d[k];
      parts[`diaphragm${k}`] = { position: [x, 0, 0] };
      parts[`slide${k}`] = { position: [SLIDE_X[k] + m.slide[k], SEAT.y1, 0] };
      const face = x - sgn * 0.04; // 隔膜朝隔板的那一面
      paths[`pleat${k}Top`] = { points: pleats(sgn * WALL, face, DIAPHRAGM_H / 2, 1), closed: false };
      paths[`pleat${k}Bottom`] = { points: pleats(sgn * WALL, face, -DIAPHRAGM_H / 2, -1), closed: false };
      const [c0, c1] = PORTS[k].chamber;
      const inside = face - sgn * 0.12; // 風箱裡、隔膜前面一點
      const passage = (c0 + c1) / 2;
      if (open[k].toChest > 0.01) {
        // 進氣:入口管 → 閥箱 → 進氣口露出的部分 → 通道 → 風箱
        const px = k === 0 ? c0 + open[k].toChest / 2 : c1 - open[k].toChest / 2;
        gas.push(...stream([[INLET_X, 2.4, z], [INLET_X, 1.6, z], [px, 1.6, z], [px, SEAT.y0 - 0.1, z], [passage, SEAT.y0 - 0.3, z], [passage, 0, z], [inside, 0, z]], travel, { spacing: 0.2 }));
      } else if (open[k].toExhaust > 0.01) {
        // 排氣:風箱 → 通道 → 進氣口(在閥腔下)→ 閥腔 → 排氣口 → 排氣道 → 出口管
        const px = k === 0 ? c1 - open[k].toExhaust / 2 : c0 + open[k].toExhaust / 2;
        const ex = (PORTS[k].exhaust[0] + PORTS[k].exhaust[1]) / 2;
        gas.push(...stream([[inside, 0, z], [passage, 0, z], [passage, SEAT.y0 - 0.3, z], [px, SEAT.y0 - 0.1, z], [px, SEAT.y1 + CAVITY_H / 2, z], [ex, SEAT.y1 + CAVITY_H / 2, z], [ex, SEAT.y0 - 0.1, z], [0, -0.9, z], [0, -1.8, z]], travel, { spacing: 0.2 }));
      }
    });
    return {
      parts,
      paths,
      flows: [{ fluid: "air", points: gas }],
      readouts: [{ label: "錶盤記錄", value: `${(v * 2).toFixed(1)} 腔室` }],
    };
  },
  waivers: [
    { check: "interference", parts: ["crankshaft", "dial"], reason: "簡化齒形:曲軸上的小齒輪與指針齒輪的梯形齒齒側重疊 0.04" },
  ],
};
