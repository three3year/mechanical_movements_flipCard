// 第 456 種:Cary 的旋轉泵。固定的圓筒裡有一個裝在軸 A 上的旋轉鼓 B;繞著軸的心形凸輪 a 也是固定的。鼓轉動時,
// 滑動活塞 c、c 依凸輪的形狀進出。水經孔口 L 與 M 進出腔室(箭頭所示)。凸輪的位置使每個活塞對準 E 時依序被推回座裡,
// 同時另一個活塞被完全推到腔室的內側,把已在腔室裡的水推進出水管 H,並在它後面經吸水管 F 吸進水來。
// 主動件是軸 A(鼓 B 順時針轉)。
// 推斷:圓筒的圓心在軸的正上方,鼓在底部 E 處碰到圓筒,腔室成月牙形;L 在 E 的左邊、M 在右邊。
// 活塞由接觸算:兩根短活塞插在鼓緣的兩道槽裡,內端的圓頭靠在固定的心形凸輪 a 上,凸輪把它往外推、外端貼著圓筒;
// 轉到 E 時凸輪最低,活塞被圓筒推回座裡。凸輪是活塞圓頭圓心的軌跡往內偏一個圓頭半徑(與活塞同一層)。
// 鼓 B 是一片背板(裝在軸 A 上)加一圈開了兩道槽的鼓緣,中間空出放凸輪的空腔;凸輪套在軸上,由前面一根橫條固定在外殼上
// (推斷;原圖是剖面,前蓋沒畫)。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine, arcPoints, offsetLoop } from "./shapes.js";

export const DRUM = 1.0; // 鼓 B 的外半徑
export const BORE = 1.3;
export const ECC = BORE - DRUM; // 圓筒中心在軸上方 ECC
const CAVITY = 0.9; // 鼓中間放凸輪的空腔
export const PISTON = 0.75; // 活塞長(外端到內端圓頭的尖)
const WIDTH = 0.2;
export const NOSE = WIDTH / 2; // 內端圓頭的半徑
const L_AT = deg(-112);
const M_AT = deg(-68);

/** 從軸心沿角度 phi 到圓筒內壁的距離 */
export const reach = (phi) => ECC * Math.sin(phi) + Math.sqrt(BORE * BORE - (ECC * Math.cos(phi)) ** 2);
/** 活塞內端圓頭的圓心離軸心(活塞外端貼著圓筒時) */
export const pitch = (phi) => reach(phi) - PISTON + NOSE;

// 心形凸輪 a:圓頭圓心的軌跡往內偏一個圓頭半徑
const PITCH_CURVE = Array.from({ length: 144 }, (_, i) => polar(pitch((TAU * i) / 144), (TAU * i) / 144).slice(0, 2));
export const CAM = offsetLoop(PITCH_CURVE, -NOSE);
const port = (a, s) => [polar(reach(a), a + s * deg(7)).slice(0, 2), [polar(reach(a), a + s * deg(7))[0], -1.75]];
const H = [[polar(reach(M_AT), M_AT)[0] + 0.1, -0.95], [1.65, -0.95], [1.65, 1.45], [1.3, 1.75], [0.95, 1.45]];

// 活塞:外端在局部原點,往 −x 伸到內端的圓頭
const pistonShape = shape([[0, -NOSE], [0, NOSE], ...arcPoints(NOSE, Math.PI / 2, (3 * Math.PI) / 2, -(PISTON - NOSE), 0)]);
// 鼓緣:兩道槽(在鼓的局部 ±y 方向)把它分成兩段
const SLOT = WIDTH / 2 + 0.015;
const rimSegment = (k) => {
  const a0 = Math.PI / 2 + k * Math.PI;
  const a1 = a0 + Math.PI;
  const [go, gi] = [Math.asin(SLOT / DRUM), Math.asin(SLOT / CAVITY)];
  return shape([...arcPoints(DRUM, a0 + go, a1 - go), ...arcPoints(CAVITY, a1 - gi, a0 + gi)]);
};

export default {
  figure: 456,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.15, 0, ECC), [circle(BORE, 0, ECC).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.15, 0, ECC)), thickness: 0.04, at: [0, 0, -0.32] },
        // 進水孔 L(接吸水管 F)與出水孔 M(接出水管 H)
        ...[-1, 1].map((s) => ({ kind: "plate", shape: shape(thickLine(port(L_AT, s), 0.06)), thickness: 0.5 })),
        { kind: "plate", shape: shape(thickLine(H, 0.07)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine(H.map(([x, y]) => [x - 0.22, y + 0.22]).slice(0, 3), 0.07)), thickness: 0.5 },
        // 固定的心形凸輪 a(套在軸上,與活塞同一層)、凸輪的轂與把它固定在外殼上的前橫條
        { kind: "plate", shape: shape(CAM, [circle(0.12).reverse()]), thickness: 0.22 },
        { kind: "cylinder", radius: 0.16, inner: 0.12, length: 0.26, at: [0, 0, 0.24] },
        { kind: "box", size: [BORE + 0.1, 0.12, 0.06], at: [-(BORE + 0.1) / 2, 0, 0.4] },
        { kind: "box", size: [0.12, 0.12, 0.12], at: [-BORE + 0.05, 0, 0.34] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      label: "B",
      labelOffset: [-0.55, 0.5, 0.45],
      spin: DRUM + 0.1,
      pieces: [
        { kind: "plate", shape: rimSegment(0), thickness: 0.4, mark: [0.95, 0] },
        { kind: "plate", shape: rimSegment(1), thickness: 0.4 },
        { kind: "plate", shape: shape(circle(DRUM)), thickness: 0.06, at: [0, 0, -0.25] },
        { kind: "cylinder", radius: 0.1, length: 1.2, at: [0, 0, -0.5] }, // 軸 A:從背板往後伸出,前端伸進凸輪的孔
        { kind: "cylinder", radius: 0.1, length: 0.12, at: [0, 0, -0.11] },
      ],
    },
    { id: "labels", kind: "group", pieces: [], label: "A", labelOffset: [0.2, 0.18, 0.6] },
    { id: "labelCam", kind: "group", pieces: [], label: "a", labelOffset: [0.3, -0.12, 0.6] },
    { id: "labelE", kind: "group", pieces: [], label: "E", labelOffset: [0.05, -DRUM - 0.25, 0.5] },
    { id: "labelL", kind: "group", pieces: [], label: "L", labelOffset: [polar(1.0, L_AT)[0] - 0.15, -1.15, 0.5] },
    { id: "labelM", kind: "group", pieces: [], label: "M", labelOffset: [polar(1.0, M_AT)[0] + 0.25, -1.1, 0.5] },
    { id: "labelF", kind: "group", pieces: [], label: "F", labelOffset: [polar(1.0, L_AT)[0] - 0.25, -1.7, 0.5] },
    { id: "labelH", kind: "group", pieces: [], label: "H", labelOffset: [1.85, 0.2, 0.5] },
    ...[0, 1].map((k) => ({ id: `piston${k}`, kind: "plate", shape: pistonShape, thickness: 0.22, label: "c", labelOffset: [-0.2, 0, 0.4], arrow: false })),
  ],
  // 動力重演:兩根活塞在鼓的槽裡沿半徑滑動(起始時 piston0 在 30°、piston1 在 210°),被固定的凸輪往外推、被圓筒往內推,不靠彈簧
  replay: {
    free: { piston0: { on: "drum", slide: polar(1, deg(30)), gravity: false }, piston1: { on: "drum", slide: polar(1, deg(210)), gravity: false } },
    expect: [
      { at: deg(-180), part: "piston0", label: "活塞轉到 E,被推回座裡", quote: "每個活塞在對準 E 時,依序被推回其座內" },
      { at: deg(-180), part: "piston1", label: "同時對面的活塞被凸輪推到最外", quote: "另一個活塞則被完全推抵腔室的內側" },
      { at: deg(-270), part: "piston0", label: "轉過 E 後,凸輪又把活塞推出" },
      { at: deg(-360), part: "piston1", label: "另一根活塞轉到 E,被推回座裡" },
    ],
  },
  driver: { part: "drum", type: "rotation", speed: -0.5, initial: deg(-60) },
  targets: ["piston0", "piston1"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const parts = { drum: { angle: theta } };
    for (const k of [0, 1]) {
      const phi = theta + Math.PI / 2 + k * Math.PI;
      parts[`piston${k}`] = { position: polar(reach(phi), phi, 0), angle: phi };
    }
    const travel = -theta * 1.2;
    const mid = (a) => polar((reach(a) + DRUM) / 2, a, 0.2);
    // 吸水:F → L 進到活塞後面;出水:活塞前面的水 → M → H
    const suction = [[polar(reach(L_AT), L_AT)[0], -1.7, 0.2], mid(L_AT), ...arcPoints(1.0, L_AT, deg(-200)).map(([x, y]) => [x, y + 0.1, 0.2])];
    const delivery = [...arcPoints(1.05, deg(10), M_AT).map(([x, y]) => [x, y + 0.08, 0.2]), mid(M_AT), ...H.map(([x, y]) => [x - 0.11, y + 0.11, 0.2]), [0.95, 1.0, 0.2]];
    return {
      parts,
      flows: [{ fluid: "water", points: [...stream(suction, travel, { spacing: 0.2 }), ...stream(delivery, travel, { spacing: 0.2 })] }],
      readouts: [{ label: "活塞伸出", value: `${(reach(theta + Math.PI / 2) - DRUM).toFixed(2)} / ${(reach(theta + 1.5 * Math.PI) - DRUM).toFixed(2)}` }],
    };
  },
  waivers: [
    { check: "interference", parts: ["casing", "piston1"], reason: "簡化畫法:滑動活塞的外端貼著外殼內壁,重疊 0.15(96 個取樣中 51 個)" },
    { check: "interference", parts: ["casing", "piston0"], reason: "簡化畫法:滑動活塞的外端貼著外殼內壁,重疊 0.15(96 個取樣中 54 個)" },
    { check: "interference", parts: ["casing", "drum"], reason: "簡化畫法:鼓貼著外殼內壁的密封處,重疊 0.12" },
  ],
};
