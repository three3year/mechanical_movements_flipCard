// 第 297 種:搭配燈籠輪的擒縱。輪的盤面上一圈立著銷(燈籠輪);搖臂 A 在上方以樞軸吊著,臂上裝兩個擒縱叉瓦 B、C,
// 搖臂來回擺時,B、C 輪流擋住、放開銷,輪依原圖箭頭逆時針一格一格地轉(每擺一次半個銷距)。
// 主動件是搖臂 A;目標件是燈籠輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受重錘的固定力矩往逆時針轉,往上走的銷被叉瓦擋住就停;
// 下面的叉瓦 C 從銷圈裡面往外伸、上面的叉瓦 B 從銷圈外面往裡伸,搖臂往左擺時 C 退出、B 伸進來,
// 銷從 C 的末端滑脫,加速走半個銷距碰上 B;往右擺時反過來。
// 推斷:擺幅與銷的數目(依原圖八根)、叉瓦的位置與形狀(兩叉瓦在銷圈上相隔半個銷距;原圖的叉瓦是斜放的直條,
// 模型做成以樞軸為圓心的弧形塊,鎖住時輪才不會被推回);
// 輪軸與搖臂的樞軸裝在後面的夾板條上(原圖沒畫)。
// 推斷的擺(原圖沒畫;這是時鐘的擒縱,搖臂 A 由擺帶著來回擺):搖臂的樞軸往後穿過夾板條,軸的後端有一個轂,
// 擺桿從轂往下伸過輪的下緣,下端是擺錘;擺和搖臂是同一件(主動件),擺多少搖臂就擺多少。
// 擺在夾板條後面、輪盤的背後,不擋住前面的叉瓦與銷。
// 推斷的驅動(原文只說搖臂上的叉瓦擋住銷,沒說輪為什麼往前轉;共用 weight-drive.js):輪軸上、輪盤後面有一個鼓,
// 繩從鼓頂往左拉到夾板條左端的滑輪,再垂下吊著重錘;重錘的重量就是讓輪逆時針轉的固定力矩,輪轉多少重錘降多少,
// 被叉瓦擋住時重錘也停。輪每轉一圈(搖臂擺八個來回)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。
// 實物也可能用發條;重錘只是示意「輪受固定的力矩」。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, thickLine } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const PINS = 8;
export const PITCH = TAU / PINS;
export const SWING = deg(8);
const P = [1.15, 2.6]; // 搖臂樞軸
const R = 1.85; // 輪盤
const RP = 1.5; // 銷圈
const PIN = 0.16;
const AT_C = deg(15); // 叉瓦 C 在銷圈上的方位
const AT_B = AT_C + PITCH / 2; // 叉瓦 B:往前半個銷距

const local = (pts) => pts.map(([x, y]) => [x - P[0], y - P[1]]);
// 叉瓦(相對樞軸,搖臂居中時):以樞軸為圓心的弧形塊(擋住銷的面與樞軸同心,鎖住時輪不回退),
// 尖端正好在銷圈中線上;C 從銷圈裡面伸出來,B 從銷圈外面伸進來
function arcPallet(at, length, inward) {
  const p = [RP * Math.cos(at), RP * Math.sin(at)];
  const rho = Math.hypot(p[0] - P[0], p[1] - P[1]);
  const psi = Math.atan2(p[1] - P[1], p[0] - P[0]);
  const dir = inward ? -1 : 1; // 弧往哪邊延伸(繞樞軸):C 往輪心那一側、B 往輪外
  const n = 10;
  const arc = (r) => Array.from({ length: n + 1 }, (_, i) => {
    const a = psi + (dir * length * i) / (n * rho);
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const outer = arc(rho + 0.06);
  const inner = arc(rho - 0.06).reverse();
  return { poly: [...outer, ...inner], end: [(rho) * Math.cos(psi + (dir * length) / rho), rho * Math.sin(psi + (dir * length) / rho)] };
}
const C_ARC = arcPallet(AT_C, 0.55, true);
const B_ARC = arcPallet(AT_B, 0.6, false);
const PALLET_C = C_ARC.poly;
const PALLET_B = B_ARC.poly;
const pins = Array.from({ length: PINS }, (_, i) => circlePolygon([RP * Math.cos(i * PITCH), RP * Math.sin(i * PITCH)], PIN, 16));

/** 搖臂累計擺動 v → 擺角 */
export const armAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth: pins, dir: 1, period: 4 * SWING, stops: (v) => [PALLET_C, PALLET_B].map((p) => placePoly(p, P, armAngle(v))) }),
  period: 4 * SWING,
};
/** 搖臂累計擺動 v → 輪的轉角(逆時針為正,由接觸算) */
export const wheelAngle = escapement.angle;

// 推斷的重錘驅動:鼓在輪盤後面的輪軸上,繩從鼓頂往左拉到夾板條左端的滑輪頂上,再垂下吊重錘
const ROPE_R = 0.045; // 繩的半徑(畫面上的繩粗)
const DRUM_R = 0.15;
const DRUM_Z = -0.3; // 鼓(與繩、滑輪)所在的深度:輪盤背面與夾板條之間
const DRUM = { center: [0, 0, DRUM_Z], axis: Z, radius: DRUM_R + ROPE_R, sense: 1 }; // 輪往前(逆時針)轉時繩從鼓上放出
const PULLEY_R = 0.15;
const PULLEY = { center: [-2.15, DRUM.radius - PULLEY_R - ROPE_R, DRUM_Z], axis: Z, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = PINS * 4 * SWING; // 輪轉一圈(搖臂擺八個來回)上鍊一次
const WEIGHT = { radius: 0.17, height: 0.4 };
const BAR_Z = -0.6; // 夾板條
const PENDULUM = { z: -0.85, bob: 0.35 }; // 擺(推斷):在夾板條後面
const ROD = P[1] + R + 0.6; // 擺桿長(樞軸到擺錘中心):擺錘中心在輪的下緣下方 0.6
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, -0.4, DRUM_Z],
  reserve: DRUM.radius * TAU,
  spare: 0.8 * TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, wheelAngle, REWIND);
export const geometry = { DRUM, REWIND, R };

// 搖臂(相對樞軸):從樞軸往下到 C 的內端;B 用一段支臂接在搖臂上
const C_IN = C_ARC.end;
const B_OUT = B_ARC.end;
const ARM = thickLine([[0, 0], [B_OUT[0] - 0.25, B_OUT[1] + 0.15], [C_IN[0] + 0.05, C_IN[1] + 0.05]], 0.24);

export default {
  figure: 297,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.12).reverse()]), thickness: 0.14, circles: [R - 0.12] },
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        { kind: "cylinder", radius: 0.1, length: 0.6, at: [0, 0, -0.35] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: DRUM_R, length: 0.3, at: [0, 0, DRUM_Z] }, // 繞繩的鼓(推斷),接在輪轂背面
        ...Array.from({ length: PINS }, (_, i) => ({ kind: "cylinder", radius: PIN, length: 0.45, at: [RP * Math.cos(i * PITCH), RP * Math.sin(i * PITCH), 0.25], accent: i === 0 })),
      ],
    },
    {
      id: "armA",
      kind: "group",
      center: [...P, 0],
      arrow: false,
      label: "A",
      labelOffset: [0.05, -0.5, 0.4],
      pieces: [
        { kind: "plate", shape: shape(ARM, [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.55] },
        { kind: "plate", shape: shape(thickLine([[B_OUT[0] - 0.25, B_OUT[1] + 0.15], B_OUT], 0.14)), thickness: 0.1, at: [0, 0, 0.55] },
        { kind: "plate", shape: shape(PALLET_B), thickness: 0.3, at: [0, 0, 0.35] }, // 叉瓦 B
        { kind: "plate", shape: shape(PALLET_C), thickness: 0.3, at: [0, 0, 0.35] }, // 叉瓦 C
        { kind: "cylinder", radius: 0.08, length: 0.55 - PENDULUM.z + 0.1, at: [0, 0, (0.55 + PENDULUM.z - 0.1) / 2] }, // 搖臂的樞軸,往後穿過夾板條到擺的轂
        // 推斷的擺:轂固定在樞軸的後端,擺桿往下伸過輪的下緣,下端是擺錘
        { kind: "cylinder", radius: 0.16, length: 0.12, at: [0, 0, PENDULUM.z] },
        { kind: "box", size: [0.08, ROD, 0.06], at: [0, -ROD / 2, PENDULUM.z] },
        { kind: "cylinder", radius: PENDULUM.bob, length: 0.12, at: [0, -ROD, PENDULUM.z] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 夾板條從輪軸往右上到搖臂的樞軸、往左伸到滑輪的軸(推斷)
        ...plateBar({ points: [[PULLEY.center[0], PULLEY.center[1]], [0, 0], P], z: BAR_Z }),
        { kind: "cylinder", radius: 0.04, length: DRUM_Z + 0.1 - BAR_Z, at: [PULLEY.center[0], PULLEY.center[1], (DRUM_Z + 0.1 + BAR_Z) / 2] }, // 滑輪的軸
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelB", kind: "group", center: [...P, 0], label: "B", labelOffset: [B_OUT[0] + 0.25, B_OUT[1], 0.6] },
    { id: "labelC", kind: "group", center: [...P, 0], label: "C", labelOffset: [C_IN[0] - 0.2, C_IN[1] - 0.25, 0.6] },
  ],
  // 動力重演:只推搖臂;燈籠輪受重錘的固定力矩往逆時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),銷由兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [0, 0, 0], spring: 1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "搖臂擺過一次,輪轉過半個銷距" },
      { at: 4 * SWING, part: "wheel", label: "搖臂一個來回,輪轉過一個銷距" },
      { part: "wheel", label: "搖臂兩個來回,輪轉過兩個銷距", quote: "一根搖臂 A 承載著兩個擒縱叉瓦 B 和 C" },
    ],
  },
  driver: { part: "armA", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 燈籠輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const w = weightAt(v);
    const eye = w.eye;
    return {
      parts: {
        armA: { angle: armAngle(v) },
        wheel: { angle: wheelAngle(v) },
        pulley: { angle: w.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
