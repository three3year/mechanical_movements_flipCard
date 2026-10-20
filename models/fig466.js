// 第 466 種:液壓機。水由泵經小管壓進柱塞缸,進到實心柱塞下方,把柱塞往上推。得到的力與泵柱塞、柱塞兩者的面積比
// (直徑平方比)成正比;例如泵柱塞直徑 1 吋、柱塞 30 吋,柱塞受的向上壓力就是加在泵柱塞上向下壓力的 900 倍。
// 主動件是泵的手柄(每壓一下,柱塞上升一點)。
// 照原圖(2026-10-20):手柄的支點在泵柱塞左邊——手柄左端掛在泵座立柱頂的吊桿上(兩端銷接),泵柱塞頂的銷
// 直接銷接在手柄中段,把手往右伸;往下壓把手就壓下柱塞送水。立柱立在柱塞缸座的凸緣上(原圖的大凸緣),
// 前後各一對,小管才從中間通過。泵掛在開口的水箱上方、下端浸在水裡(吸水閥在筒底),出水閥在小管起點的閥室裡
// (原圖泵座左邊的圓球閥),小管從閥室底往下、往左接進柱塞缸開著口的壁。泵座、閥室、吊桿的立柱都是推斷。
// 柱塞與泵柱塞的直徑比依原圖(約 7 : 1),每一下柱塞上升泵行程的 1/52(畫面上放大 8 倍才看得出來);
// 讀數另外列出原文 30 : 1 的例子。剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { leverPart, hangerLever, rodPin, stroke, strokeCount, valveOpening, flap, barrel, pipeWalls } from "./pump.js";
import { shape, thickLine, circle, spanBox } from "./shapes.js";

export const RAM_D = 1.3; // 柱塞直徑
export const PLUNGER_D = 0.18; // 泵柱塞直徑
const RAM = { x: -1.2, y0: -1.6, y1: 0.0 }; // 柱塞缸
const RAM_LEN = 1.6;
export const RAM_TRAVEL = 0.8;
export const PUMP_X = 1.6;
const PUMP = { y0: -0.95, y1: 0.4, r: PLUNGER_D / 2 + 0.03, wall: 0.06 };
const FLOOR_TOP = -1.66; // 地面:缸座的凸緣與水箱都立在上面
const CISTERN = { x0: 1.2, x1: 2.4, y0: FLOOR_TOP + 0.05, y1: -0.45, wall: 0.05 }; // 開口的水箱(內側)
const WATER_Y = -0.73;
/** 吊桿:泵座立柱頂的下銷(ear)、吊桿長、吊桿上銷(手柄左端)到柱塞銷的距離 */
export const HANGER = { ear: [PUMP_X - 0.75, 0.6], length: 0.8, short: 0.8 };
export const SWING = [deg(15), deg(-15)]; // 把手從上到下:第一程往下壓,送水
const ROD = 1.25; // 泵柱塞長(銷到底)
const OPEN = deg(55);
const HANDLE_Z = -0.09; // 手柄在柱塞後面一層;吊桿再後一層,吊桿的立柱與耳再後一層
const FEED_Y = -0.3; // 小管離開泵筒的高度(在水箱口之上)
const FEED_W = 0.16; // pipeWalls:壁中心線相距 0.16、壁厚 0.04 → 內寬 0.12、外寬 0.2
const CHAMBER = { x0: 0.75, x1: 1.15, y0: -0.5, y1: -0.1, t: 0.04 }; // 出水閥的閥室(推斷)
const DOWN_X = (CHAMBER.x0 + CHAMBER.x1) / 2; // 閥室底往下的管
const INLET_Y = RAM.y0 + 0.2; // 小管接進柱塞缸的高度
const inlet = [[PUMP_X - PUMP.r, FEED_Y], [CHAMBER.x1 - CHAMBER.t, FEED_Y]];
const down = [[DOWN_X, CHAMBER.y0], [DOWN_X, INLET_Y], [RAM.x + RAM_D / 2, INLET_Y]];

const hangerArm = hangerLever({ anchor: HANGER.ear, length: HANGER.length, short: HANGER.short, line: { origin: [PUMP_X, 0], dir: [0, 1] } });
/** 手柄角 theta → 吊桿上銷 hang(手柄左端)、柱塞銷 E(在泵筒軸線上) */
function place(theta) {
  const { P, F } = hangerArm(theta);
  return { hang: [F[0], F[1], 0], E: [P[0], P[1], 0] };
}
const LO = place(SWING[1]).E[1] - ROD;
const HI = place(SWING[0]).E[1] - ROD;
export const PUMP_STROKE = HI - LO;

/** 累計主動量 v → 手柄角、吊桿上銷、柱塞銷(top)、泵柱塞底的高度、是否在壓、柱塞(大)已升起多少 */
export function press(v) {
  const phase = stroke(v, ...SWING);
  const { at, forward } = phase;
  const { hang, E } = place(at);
  const y = E[1] - ROD;
  // 每一次下壓(第一程、第三程…)把泵行程的水送進柱塞缸:柱塞上升 = 泵行程 × 面積比(畫面上再放大 8 倍才看得出來,見檔頭)
  const strokes = strokeCount(phase);
  const ratio = (PLUNGER_D / RAM_D) ** 2;
  const rise = Math.min(RAM_TRAVEL, strokes * PUMP_STROKE * ratio * 8);
  return { theta: at, hang, E, top: E, plunger: y, down: forward, rise, phase };
}

/** 水箱、閥室的壁:座標範圍定的方塊,深度 depth 以 z = 0 為中心 */
const wallBox = (x0, x1, y0, y1, depth = 0.8) => spanBox(x0, x1, y0, y1, -depth / 2, depth / 2);

export default {
  figure: 466,
  parts: [
    // 柱塞缸:右壁在小管接進處開口
    barrel("ramCylinder", { x: RAM.x, r: RAM_D / 2, y0: RAM.y0, y1: RAM.y1, wall: 0.18, openings: [{ y0: INLET_Y - FEED_W / 2 - 0.05, y1: INLET_Y + FEED_W / 2 + 0.05, side: 1, depth: 0.2 }] }),
    // 泵筒:左壁在小管接出處開口;下端浸在水箱裡
    barrel("pump", { x: PUMP_X, r: PUMP.r, y0: PUMP.y0, y1: PUMP.y1, wall: PUMP.wall, openings: [{ y0: FEED_Y - FEED_W / 2 - 0.05, y1: FEED_Y + FEED_W / 2 + 0.05, side: -1, depth: 0.2 }] }),
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 地面;缸座的凸緣(原圖的大凸緣),四根立柱立在上面(前後各一對,讓開中間的小管),頂上的橫樑
        { kind: "box", size: [5.2, 0.12, 1.2], at: [0, FLOOR_TOP - 0.06, 0] },
        { kind: "box", size: [2.6, 0.2, 0.9], at: [RAM.x, RAM.y0 - 0.1, 0] },
        ...[-1, 1].flatMap((sx) => [-0.3, 0.3].map((z) => ({ kind: "box", size: [0.16, 3.5, 0.16], at: [RAM.x + sx * 1.0, RAM.y0 + 1.75, z] }))),
        { kind: "box", size: [2.3, 0.35, 0.8], at: [RAM.x, 2.05, 0] },
        // 開口的水箱(底與兩側壁;剖開)
        wallBox(CISTERN.x0 - CISTERN.wall, CISTERN.x1 + CISTERN.wall, CISTERN.y0 - CISTERN.wall, CISTERN.y0),
        wallBox(CISTERN.x0 - CISTERN.wall, CISTERN.x0, CISTERN.y0 - CISTERN.wall, CISTERN.y1),
        wallBox(CISTERN.x1, CISTERN.x1 + CISTERN.wall, CISTERN.y0 - CISTERN.wall, CISTERN.y1),
        // 出水閥的閥室(推斷):右壁在小管接進處、底在往下的管接出處開口
        wallBox(CHAMBER.x0, CHAMBER.x0 + CHAMBER.t, CHAMBER.y0, CHAMBER.y1, 0.2),
        wallBox(CHAMBER.x0, CHAMBER.x1, CHAMBER.y1 - CHAMBER.t, CHAMBER.y1, 0.2),
        wallBox(CHAMBER.x1 - CHAMBER.t, CHAMBER.x1, CHAMBER.y0, FEED_Y - FEED_W / 2 - 0.02, 0.2),
        wallBox(CHAMBER.x1 - CHAMBER.t, CHAMBER.x1, FEED_Y + FEED_W / 2 + 0.02, CHAMBER.y1, 0.2),
        wallBox(CHAMBER.x0, DOWN_X - FEED_W / 2 - 0.02, CHAMBER.y0, CHAMBER.y0 + CHAMBER.t, 0.2),
        wallBox(DOWN_X + FEED_W / 2 + 0.02, CHAMBER.x1, CHAMBER.y0, CHAMBER.y0 + CHAMBER.t, 0.2),
        // 小管:泵筒 → 閥室,閥室底 → 往下、往左 → 柱塞缸(管壁都畫到被接的壁的內面)
        ...pipeWalls(inlet, FEED_W, 0.04, 0.2),
        ...pipeWalls(down, FEED_W, 0.04, 0.2),
        // 泵座(推斷):閥室到右前立柱的托架;閥室頂上立著吊桿的立柱,柱頂的耳有吊桿的下銷
        { kind: "box", size: [CHAMBER.x0 + 0.04 - (RAM.x + 1.08), 0.1, 0.3], at: [(CHAMBER.x0 + 0.04 + RAM.x + 1.08) / 2, FEED_Y, 0.2] },
        { kind: "box", size: [0.1, HANGER.ear[1] - 0.15 - CHAMBER.y1 + 0.04, 0.3], at: [HANGER.ear[0], (HANGER.ear[1] - 0.15 + CHAMBER.y1 - 0.04) / 2, -0.15] },
        { kind: "plate", shape: shape(thickLine([[HANGER.ear[0], HANGER.ear[1] - 0.2], [HANGER.ear[0], HANGER.ear[1] + 0.1]], 0.14), [circle(0.04, HANGER.ear[0], HANGER.ear[1]).reverse()]), thickness: 0.06, at: [0, 0, HANDLE_Z - 0.17] },
      ],
    },
    { id: "cistern", kind: "fill", fluid: "water", center: [(CISTERN.x0 + CISTERN.x1) / 2, (CISTERN.y0 + WATER_Y) / 2, 0], size: [CISTERN.x1 - CISTERN.x0 - 0.02, WATER_Y - CISTERN.y0, 0.75], level: 1 },
    { id: "ramWater", kind: "fill", fluid: "water", shape: "cylinder", size: [RAM_D - 0.02, RAM_TRAVEL + 0.3, 0], level: 0 },
    {
      id: "ram",
      kind: "cylinder",
      axis: Y,
      radius: RAM_D / 2 - 0.02,
      length: RAM_LEN,
      arrow: false,
      // 附件的尺寸是零件的局部座標(局部 z 是世界的 y、局部 y 是世界的 z):頂端的壓板 1.8 寬、0.15 厚,上面是被壓的貨包
      pieces: [
        { kind: "box", size: [1.8, 0.8, 0.15], at: [0, 0, RAM_LEN / 2 + 0.08] },
        { kind: "box", size: [1.3, 0.6, 0.5], at: [0, 0, RAM_LEN / 2 + 0.155 + 0.25] },
      ],
    },
    // 泵柱塞:頂端收成細頸,頸頂的銷往後穿過手柄的銷孔(柱塞身在手柄下方 0.12,不碰手柄)
    {
      id: "plunger",
      kind: "cylinder",
      axis: Y,
      radius: PLUNGER_D / 2,
      length: ROD - 0.12,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.03, length: 0.14, at: [0, 0, (ROD - 0.12) / 2 + 0.07] },
        rodPin((ROD - 0.12) / 2 + 0.12),
      ],
    },
    leverPart("handle", { short: HANGER.short, long: 2.2, side: 1, bend: [1.3, -0.05], grip: [2.2, -0.35] }),
    { id: "hanger", kind: "link", width: 0.08, thickness: 0.05 },
    flap("suction", 2 * PUMP.r - 0.05),
    flap("delivery", 0.2),
  ],
  powered: ["ram", "suction", "delivery"], // 外力來源:柱塞是被泵打進來的水頂起的、閥瓣是被水頂開的(液壓傳動,沒有實體相連)
  driver: { part: "handle", grips: ["plunger"], type: "rotation", cycle: SWING },
  target: "ram",
  view: { direction: [0.08, 0.08, 1] },
  pose(v) {
    const p = press(v);
    const ramBottom = RAM.y0 + 0.05 + p.rise;
    const travel = v * 5;
    return {
      parts: {
        handle: { position: [p.hang[0], p.hang[1], HANDLE_Z], angle: p.theta },
        hanger: { from: [HANGER.ear[0], HANGER.ear[1], HANDLE_Z - 0.09], to: [p.hang[0], p.hang[1], HANDLE_Z - 0.09] },
        plunger: { position: [PUMP_X, p.plunger + (ROD - 0.12) / 2, 0] },
        ram: { position: [RAM.x, ramBottom + RAM_LEN / 2, 0] },
        ramWater: { position: [RAM.x, RAM.y0 + (RAM_TRAVEL + 0.3) / 2, 0], level: (p.rise + 0.05) / (RAM_TRAVEL + 0.3) },
        // 閥瓣被水頂開、回程加速落回閥座(pump.js 的 valveOpening):吸水閥在泵筒底,出水閥鉸在閥室進口的下緣、往閥室裡張開
        suction: { position: [PUMP_X - PUMP.r + 0.03, PUMP.y0 + 0.03, 0.05], angle: OPEN * valveOpening(!p.down, p.phase) },
        delivery: { position: [CHAMBER.x1 - CHAMBER.t, FEED_Y - FEED_W / 2 - 0.02, 0.05], angle: Math.PI / 2 + OPEN * valveOpening(p.down, p.phase) },
      },
      flows: p.down
        ? p.rise < RAM_TRAVEL
          ? [{ fluid: "water", points: stream([[PUMP_X, p.plunger - 0.15, 0.2], [PUMP_X, FEED_Y, 0.2], [CHAMBER.x1 - 0.1, FEED_Y, 0.2], [DOWN_X, CHAMBER.y0 + 0.1, 0.2], [DOWN_X, INLET_Y, 0.2], [RAM.x + 0.3, INLET_Y, 0.2]], travel, { spacing: 0.15 }) }]
          : []
        : [{ fluid: "water", points: stream([[PUMP_X, CISTERN.y0 + 0.1, 0.2], [PUMP_X, PUMP.y0 + 0.15, 0.2], [PUMP_X, p.plunger - 0.1, 0.2]], travel, { spacing: 0.15 }) }],
      readouts: [
        { label: "力的倍數(模型)", value: `${Math.round((RAM_D / PLUNGER_D) ** 2)} 倍` },
        { label: "原文的例子", value: "1 吋 : 30 吋 → 900 倍" },
      ],
    };
  },
  waivers: [],
};
