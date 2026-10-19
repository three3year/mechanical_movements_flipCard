// 第 328 種:卡特萊特博士(1787 年)的平行運動。兩個直徑與齒數相同的齒輪 C、C 互相咬合,各帶一個半徑相等的曲柄 A、A,
// 兩曲柄方向相反;兩根連桿從曲柄銷接到活塞桿上十字頭的兩端,齒輪轉動時兩連桿的傾斜角始終相等,
// 活塞桿 B 因此被迫沿直線運動。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:進汽的時機。後方的大輪是飛輪:原圖右齒輪 C 的正下方有一個小齒輪,飛輪就以它的軸為中心,
// 所以飛輪由右齒輪經這個小齒輪帶動(原本畫成不會轉的圓環)。
// 目標件是飛輪(這部引擎最終帶動的東西;齒輪 C、C 與曲柄在輸入這一側)。
// 前後順序照原圖:齒輪在最後,橫樑在齒輪前面、擋住齒輪下半,齒輪軸的軸承座立在樑頂,
// 齒輪軸往前穿過軸承座接到曲柄,曲柄端的曲柄銷穿過連桿上端的眼;連桿下端以銷接到十字頭兩端。
// 比例照原圖與 507movements 的動畫:齒輪約 36 齒、小齒輪 12 齒;曲柄是齒輪半徑的 0.7 倍、十字頭兩端在兩齒輪中心的正下方、
// 連桿約 3 倍,起始姿勢的兩連桿從靠中間的曲柄銷往下張開(原圖的梯形)。
// 推斷:樑兩端往下接到底座的立柱(原圖樑的兩端畫成斷口,接到畫面外的機架)、飛輪軸的軸承座、汽缸。
import { TAU, deg, rot2 } from "./kit.js";
import { meshAngle } from "./gears.js";
import { cylinderParts, cylinderPose, steamPipe, rodHub } from "./vertical-engine.js";
import { shape, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const G = { teeth: 36, radius: 0.88, width: 0.16 };
const M = (2 * G.radius) / G.teeth; // 模數
export const GL = { ...G, center: [-G.radius, 2.0, 0] };
export const GR = { ...G, center: [G.radius, 2.0, 0] };
const R = 0.62; // 曲柄半徑(齒輪半徑的 0.7 倍)
const ROD = 2.6;
const HALF = G.radius; // 十字頭半長:兩端在兩齒輪中心的正下方
const PISTON_ROD = 1.8;
const FLOOR = -3.36; // 底座頂面
const CYL = { x: 0, top: -1.6, length: 1.6, radius: 0.42, seat: FLOOR };
// 飛輪軸上的小齒輪,在右齒輪正下方與它咬合;中心距多留 0.006 的背隙(12 齒的小齒輪,齒形是近似的,不留會互相咬進 0.003)
const PIN_TEETH = 12;
const PIN_R = (PIN_TEETH * M) / 2;
export const PINION = { teeth: PIN_TEETH, radius: PIN_R, center: [GR.center[0], GR.center[1] - G.radius - PIN_R - 0.006, 0] };
const FLY_R = 3.2;
// 深度:齒輪 z 0;樑、軸承座 0.10–0.34;曲柄板 0.36–0.44;曲柄銷與十字頭的銷 0.36–0.60;連桿 0.52;十字頭橫桿 0.36–0.48
const BEAM = { y0: 1.2, y1: 1.72, z0: 0.1, z1: 0.34, half: 2.3 };
const BEAM_Z = (BEAM.z0 + BEAM.z1) / 2;
const CRANK_Z = 0.4;
const PIN_Z = [0.36, 0.6];
const ROD_Z = 0.52;
const POST_X = 2.15;

/** 進程 p → 兩齒輪角、兩曲柄銷、十字頭高度、活塞高度 */
export function cartwright(p) {
  const a = -TAU * p + deg(-30);
  const b = meshAngle(GL, GR, a);
  // 右曲柄是左曲柄的鏡像(方向相反)
  const pinL = [GL.center[0] + R * Math.cos(a), GL.center[1] + R * Math.sin(a), 0];
  const pinR = [-pinL[0], pinL[1], 0];
  const headAt = (ang) => GL.center[1] + R * Math.sin(ang) - Math.sqrt(ROD * ROD - (R * Math.cos(ang)) ** 2);
  const head = headAt(a);
  return { a, b, pinL, pinR, head, piston: head - PISTON_ROD, downward: head < headAt(a + 1e-4) };
}

// 齒輪軸(從齒輪往前穿過樑頂的軸承座)、曲柄板與曲柄銷;angle 是曲柄在齒輪上的方向
const crank = (angle) => {
  const [px, py] = rot2([R, 0], angle);
  const back = -G.width / 2;
  const front = CRANK_Z + 0.04;
  return [
    { kind: "cylinder", radius: 0.1, length: front - back, at: [0, 0, (back + front) / 2] },
    { kind: "plate", shape: shape([[0, -0.13], [R, -0.09], [R, 0.09], [0, 0.13]]), thickness: 0.08, at: [0, 0, CRANK_Z], angle },
    { kind: "cylinder", radius: 0.06, length: PIN_Z[1] - PIN_Z[0], at: [px, py, (PIN_Z[0] + PIN_Z[1]) / 2], accent: true },
  ];
};
// 右曲柄在右齒輪上的方向:讓它始終是左曲柄的鏡像(兩齒輪反向轉,這個差是常數)
const MIRROR = Math.PI - meshAngle(GL, GR, 0);

// 齒輪軸在樑頂的軸承座:軸承環和樑同一層,下面一塊座立在樑頂
const bearing = (g) => [
  { kind: "cylinder", radius: 0.24, inner: 0.11, length: BEAM.z1 - BEAM.z0, at: [g.center[0], g.center[1], BEAM_Z] },
  { kind: "box", size: [0.44, 0.2, BEAM.z1 - BEAM.z0], at: [g.center[0], BEAM.y1 + 0.1, BEAM_Z] },
];

export default {
  figure: 328,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [2 * BEAM.half, BEAM.y1 - BEAM.y0, BEAM.z1 - BEAM.z0], at: [0, (BEAM.y0 + BEAM.y1) / 2, BEAM_Z] },
        // 底座:往後加深,托住飛輪軸的軸承座
        { kind: "box", size: [4.8, 0.18, 1.7], at: [0, FLOOR - 0.09, -0.45] },
        // 樑兩端的立柱,落到底座上(推斷)
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.3, BEAM.y0 - FLOOR, BEAM.z1 - BEAM.z0], at: [s * POST_X, (BEAM.y0 + FLOOR) / 2, BEAM_Z] })),
        ...bearing(GL),
        ...bearing(GR),
        // 飛輪軸的軸承座(在飛輪後面)
        ...pedestal({ at: [PINION.center[0], PINION.center[1]], z: -1.0, bore: 0.15, floor: FLOOR }),
      ],
    },
    {
      id: "flywheel",
      kind: "group",
      center: PINION.center,
      spin: FLY_R - 0.15,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(FLY_R, 0, TAU).slice(0, -1)], [arcPoints(FLY_R - 0.25, 0, TAU).slice(0, -1).reverse()]), thickness: 0.15, at: [0, 0, -0.7] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [2 * FLY_R - 0.2, 0.14, 0.1], at: [0, 0, -0.7], angle: (i * Math.PI) / 3 })),
        { kind: "cylinder", radius: 0.15, length: 1.0, at: [0, 0, -0.5] },
        { kind: "box", size: [0.3, 0.3, 0.17], at: [FLY_R - 0.12, 0, -0.7], accent: true },
      ],
    },
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.16, arrow: false },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    { id: "gearL", kind: "gear", center: GL.center, teeth: G.teeth, radius: G.radius, width: G.width, pieces: crank(0), label: "C", labelOffset: [-0.6, 0.6, 0.3] },
    { id: "gearR", kind: "gear", center: GR.center, teeth: G.teeth, radius: G.radius, width: G.width, pieces: crank(MIRROR), label: "C", labelOffset: [0.6, 0.6, 0.3] },
    { id: "rodL", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "rodR", kind: "link", width: 0.12, thickness: 0.06 },
    {
      id: "crosshead",
      kind: "group",
      label: "B",
      labelOffset: [0.3, -0.6, 0.3],
      pieces: [
        { kind: "box", size: [2 * HALF + 0.24, 0.14, 0.12], at: [0, 0, 0.42] },
        // 兩端接連桿的銷
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.05, length: PIN_Z[1] - PIN_Z[0], at: [s * HALF, 0, (PIN_Z[0] + PIN_Z[1]) / 2] })),
        { kind: "box", size: [0.08, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] },
        rodHub({ rodZ: 0, rodHalf: 0.04, barBack: 0.36, radius: 0.09 }), // 轂套住活塞桿頂端、往前接到橫桿背面(推斷)
      ],
    },
    { id: "labelA1", kind: "group", center: GL.center, label: "A", labelOffset: [0.25, -0.5, 0.7] },
    { id: "labelA2", kind: "group", center: GR.center, label: "A", labelOffset: [-0.25, -0.5, 0.7] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "flywheel", // 輸出的飛輪(由右齒輪經小齒輪帶動)
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const c = cartwright(p);
    const cyl = cylinderPose(CYL, c.piston, c.downward, p);
    const fly = meshAngle(GR, PINION, c.b);
    return {
      parts: {
        gearL: { angle: c.a },
        // 右齒輪:咬合角;它的曲柄畫成左曲柄的鏡像方向
        gearR: { angle: c.b },
        // 飛輪與小齒輪同軸,由右齒輪帶動
        pinion: { angle: fly },
        flywheel: { angle: fly },
        rodL: { from: [c.pinL[0], c.pinL[1], ROD_Z], to: [-HALF, c.head, ROD_Z] },
        rodR: { from: [c.pinR[0], c.pinR[1], ROD_Z], to: [HALF, c.head, ROD_Z] },
        crosshead: { position: [0, c.head, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
