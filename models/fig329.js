// 第 329 種:活塞桿導引裝置。活塞桿 A 接在齒輪 B 上的一個腕銷(wrist)上;B 繞著曲柄銷轉,曲柄銷由牢固在軸上的板 C
// 承載。B 在一個靜止的內齒輪 D 裡面滾動,D 的直徑是 B 的兩倍,所以 B 節圓上的腕銷走的是一條直線(直徑),
// 運動傳給曲柄銷,而活塞桿保持直立。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:腕銷在 B 的節圓上;進汽的時機;外圈的大輪是飛輪(依原圖)。
// 機架照原圖是兩支斜腳:下端站在底座上,上端用螺栓接在 D 外緣水平直徑兩側的耳座;D 後面的橫樑與軸承座是推斷
// (原圖看不到,曲柄軸要有軸承),兩端接在斜腳上。
// 深度由後往前:飛輪、橫樑與軸承座、板 C、B 與 D(同一層,咬滿齒寬)、B 正面的臂與腕銷、活塞桿 A;
// 活塞桿 A 在汽缸的軸線上(z 0),所以整組齒輪放在它後面 ZD。腕銷裝在 B 正面的臂上(推斷,實物的內擺線直線導引
// 都是這樣),臂與腕銷整根在 D 的齒前面:腕銷走到行程兩端時就在 D 的節圓上。
import { TAU, Z, rot2 } from "./kit.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { meshAngle } from "./gears.js";

const C0 = [0, 0.9, 0]; // 主軸(平面位置)
const ZD = -0.25; // B、D 的中面深度(活塞桿 A 與汽缸在 z 0)
const AXIS = [C0[0], C0[1], ZD];
const RB = 0.62; // 齒輪 B 的節圓半徑
const NB = 14;
const ND = 2 * NB;
const CYL = { x: 0, top: -1.3, length: 2.85, radius: 0.42, seat: -4.28 };
const PISTON_ROD = 3.6; // 腕銷到活塞

const PHI0 = Math.PI / 2; // 進程 0 時曲柄朝上
const D = { center: C0, axis: Z, internal: true, teeth: ND, radius: 2 * RB };
// B 的齒相位:進程 0 時由 meshAngle 對 D 排好(齒嵌進齒槽),之後絕對自轉 = −公轉(在兩倍大的內齒輪裡滾動)。
// 不逐步呼叫 meshAngle,是因為它的「減整數個齒距」會隨公轉跳格。
const SPIN0 = meshAngle(D, { center: [C0[0] + RB * Math.cos(PHI0), C0[1] + RB * Math.sin(PHI0), 0], axis: Z, teeth: NB, radius: RB }, 0);
// 腕銷在 B 上的局部角:節圓上的點走的直線方向是 (自轉相位 + 局部角)/2,要直立就得 自轉相位 + 局部角 = π
export const WRIST = Math.PI - (SPIN0 + PHI0);
const WRIST_AT = rot2([RB, 0], WRIST);

// 斜腳:腳底中心 x ±FOOT 站在底座頂 SEAT,上端中心 x ±HEAD、高 TOP(到 D 的水平直徑上方一點),水平寬 LEG_W
const SEAT = CYL.seat; // 底座頂面
const FOOT = 2.6;
const HEAD = 1.85;
const TOP = C0[1] + 0.15;
const LEG_W = 0.28;
const RIM = 2 * RB + 0.3; // D 的外緣半徑
const legX = (y) => HEAD + ((FOOT - HEAD) * (TOP - y)) / (TOP - SEAT); // 斜腳中心線在高度 y 的 x
const BOLT = legX(C0[1]); // 耳座的螺栓
const BACK = { z: ZD - 0.35, depth: 0.3 }; // 斜腳、橫樑與軸承座的深度(D 後面)
const leg = (s) => {
  const pts = [[FOOT - LEG_W / 2, SEAT], [FOOT + LEG_W / 2, SEAT], [HEAD + LEG_W / 2, TOP], [HEAD - LEG_W / 2, TOP]].map(([x, y]) => [s * x, y]);
  return { kind: "plate", shape: shape(s > 0 ? pts : pts.reverse()), thickness: BACK.depth, at: [0, 0, BACK.z] };
};
const LUG = { inner: RIM, outer: BOLT + 0.16, z0: BACK.z + BACK.depth / 2, z1: ZD + 0.07 };
const lug = (s) => ({ kind: "box", size: [LUG.outer - LUG.inner, 0.26, LUG.z1 - LUG.z0], at: [(s * (LUG.inner + LUG.outer)) / 2, C0[1], (LUG.z0 + LUG.z1) / 2] });
const BOLT_Z = [BACK.z - BACK.depth / 2 - 0.03, LUG.z1 + 0.03]; // 螺栓穿過斜腳與耳座,兩頭各露出一點
const bolt = (s) => ({ kind: "cylinder", radius: 0.07, length: BOLT_Z[1] - BOLT_Z[0], at: [s * BOLT, C0[1], (BOLT_Z[0] + BOLT_Z[1]) / 2] });
const beam = (s) => ({ kind: "box", size: [BOLT - 0.3, 0.2, BACK.depth], at: [(s * (BOLT + 0.3)) / 2, C0[1], BACK.z] });

// B 正面的臂:從輪轂伸到腕銷(B 的局部座標,已轉到腕銷的方向)
const ARM_Z = [0.095, 0.155]; // 臂的深度(B 的齒寬 ±0.07 之前;輪轂伸到 0.1 與它相接)
const armShape = shape([...arcPoints(0.09, -Math.PI / 2, Math.PI / 2, RB, 0), ...arcPoints(0.12, Math.PI / 2, (3 * Math.PI) / 2)].map((p) => rot2(p, WRIST)));
const PIN_Z = [ARM_Z[0], -ZD + 0.07]; // 腕銷從臂的背面穿過臂,伸過活塞桿 A 的頂端(A 在 z 0 ±0.04)

/** 進程 p → 板 C(曲柄)的轉角、B 的中心與自轉角、腕銷位置 */
export function hypo(p) {
  const phi = TAU * p + PHI0;
  const center = [C0[0] + RB * Math.cos(phi), C0[1] + RB * Math.sin(phi), 0];
  const spin = SPIN0 - (phi - PHI0); // 在兩倍大的內齒輪裡滾動:絕對自轉 = −公轉
  const wrist = [center[0] + RB * Math.cos(spin + WRIST), center[1] + RB * Math.sin(spin + WRIST), 0];
  const nextY = C0[1] + 2 * RB * Math.sin(phi + 1e-4);
  return { phi, center, spin, wrist, downward: nextY < wrist[1] };
}

export default {
  figure: 329,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        leg(-1),
        leg(1),
        { kind: "box", size: [2 * FOOT + 0.7, 0.18, 1.5], at: [0, SEAT - 0.09, -0.05] }, // 底座:斜腳與汽缸都站在上面
        // D 外緣水平直徑兩側的耳座(原圖),用螺栓接在斜腳的上端
        lug(-1),
        lug(1),
        bolt(-1),
        bolt(1),
        // D 後面的橫樑與曲柄軸的軸承座(推斷):兩端接在斜腳上
        beam(-1),
        beam(1),
        { kind: "plate", shape: shape(circle(0.34), [circle(0.21).reverse()]), thickness: BACK.depth, at: [C0[0], C0[1], BACK.z] },
      ],
    },
    // 靜止的內齒輪 D
    { id: "ringD", kind: "gear", center: AXIS, internal: true, teeth: ND, radius: 2 * RB, width: 0.14, rim: 2 * RB + 0.3, arrow: false, label: "D", labelOffset: [0.9, -1.2, 0.3] },
    {
      id: "flywheel",
      kind: "group",
      center: AXIS,
      spin: 2.7,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(2.8, 0, TAU).slice(0, -1)], [arcPoints(2.55, 0, TAU).slice(0, -1).reverse()]), thickness: 0.2, at: [0, 0, -0.68] },
        // 四根輪輻(上下左右,原圖)
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [2.6, 0.14, 0.1], at: [1.3 * Math.cos((i * TAU) / 4), 1.3 * Math.sin((i * TAU) / 4), -0.68], angle: (i * TAU) / 4 })),
        { kind: "cylinder", radius: 0.2, length: 0.625, at: [0, 0, -0.4675] }, // 軸穿過軸承座,止於板 C 的背面(B 的輪緣繞著軸心轉)
        // 板 C:從軸心到曲柄銷
        { kind: "plate", shape: shape([[0, -0.14], [RB, -0.1], [RB, 0.1], [0, 0.14]], [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, -0.115] }, // 板 C 在行星齒輪 B 的後面,曲柄銷往前插進 B 的輪轂
        { kind: "cylinder", radius: 0.06, length: 0.225, at: [RB, 0, -0.0425], accent: true },
      ],
      label: "C",
      labelOffset: [0.35, -0.25, 0.4],
    },
    {
      id: "gearB",
      kind: "gear",
      teeth: NB,
      radius: RB,
      width: 0.14,
      bore: 0.4, // 輪圈;中間是輪轂與四根輪輻(原圖)
      hub: false,
      label: "B",
      labelOffset: [-0.3, 0, 0.45],
      pieces: [
        { kind: "cylinder", radius: 0.12, length: ARM_Z[0] + 0.005 + 0.07, at: [0, 0, (ARM_Z[0] + 0.005 - 0.07) / 2] }, // 輪轂:套在曲柄銷上,往前伸到臂
        ...[0, 1, 2, 3].map((i) => {
          const a = WRIST + (i * Math.PI) / 2;
          return { kind: "box", size: [0.43, 0.07, 0.08], at: [0.215 * Math.cos(a), 0.215 * Math.sin(a), 0], angle: a };
        }),
        { kind: "plate", shape: armShape, thickness: ARM_Z[1] - ARM_Z[0], at: [0, 0, (ARM_Z[0] + ARM_Z[1]) / 2] },
        { kind: "cylinder", radius: 0.05, length: PIN_Z[1] - PIN_Z[0], at: [...WRIST_AT, (PIN_Z[0] + PIN_Z[1]) / 2] },
      ],
    },
    // 活塞桿 A:頂端的眼套在腕銷上,下端穿過汽缸上蓋接到活塞
    { id: "rodA", kind: "box", size: [0.09, PISTON_ROD, 0.08], label: "A", labelOffset: [0.25, 1.2, 0.3], pieces: [{ kind: "cylinder", radius: 0.1, length: 0.08, at: [0, PISTON_ROD / 2, 0] }] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "flywheel", // 蒸汽最終帶動的軸(板 C 與飛輪);活塞桿 A 在輸入這一側,被導引得保持直立
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const h = hypo(p);
    const piston = h.wrist[1] - PISTON_ROD;
    const cyl = cylinderPose(CYL, piston, h.downward, p);
    return {
      parts: {
        flywheel: { angle: h.phi },
        gearB: { position: [h.center[0], h.center[1], ZD], angle: h.spin },
        rodA: { position: [0, h.wrist[1] - PISTON_ROD / 2, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
