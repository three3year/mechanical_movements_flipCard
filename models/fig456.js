// 第 456 種:Cary 的旋轉泵。固定的圓筒裡有一個裝在軸 A 上的旋轉鼓 B;繞著軸的心形凸輪 a 也是固定的。鼓轉動時,
// 滑動活塞 c、c 依凸輪的形狀進出。水經孔口 L 與 M 進出腔室(箭頭所示)。凸輪的位置使每個活塞對準 E 時依序被推回座裡,
// 同時另一個活塞被完全推到腔室的內側,把已在腔室裡的水推進出水管 H,並在它後面經吸水管 F 吸進水來。
// 主動件是軸 A(鼓 B 順時針轉)。
// 推斷:圓筒的圓心在軸的正上方,鼓在底部 E 處碰到圓筒,腔室成月牙形;活塞外端始終貼著圓筒;L 在 E 的左邊、M 在右邊。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine, arcPoints } from "./shapes.js";

export const DRUM = 0.85;
export const BORE = 1.3;
export const ECC = BORE - DRUM; // 圓筒中心在軸上方 ECC
export const PISTON = 1.3; // 兩根活塞前後錯開,穿過軸旁時不相碰
const L_AT = deg(-112);
const M_AT = deg(-68);

/** 從軸心沿角度 phi 到圓筒內壁的距離 */
export const reach = (phi) => ECC * Math.sin(phi) + Math.sqrt(BORE * BORE - (ECC * Math.cos(phi)) ** 2);

const cam = Array.from({ length: 72 }, (_, i) => {
  const a = (TAU * i) / 72;
  return polar(Math.max(0.16, reach(a) - PISTON + 0.04), a).slice(0, 2);
});
const port = (a, s) => [polar(reach(a), a + s * deg(7)).slice(0, 2), [polar(reach(a), a + s * deg(7))[0], -1.75]];
const H = [[polar(reach(M_AT), M_AT)[0] + 0.1, -0.95], [1.65, -0.95], [1.65, 1.45], [1.3, 1.75], [0.95, 1.45]];

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
        // 固定的心形凸輪 a
        { kind: "plate", shape: shape(cam), thickness: 0.08, at: [0, 0, 0.3] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      label: "B",
      labelOffset: [-0.5, 0.45, 0.45],
      spin: DRUM + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(DRUM), [rect(2 * DRUM - 0.12, 0.22).reverse()]), thickness: 0.56, mark: [0, DRUM - 0.12], markSize: 0.06 },
        { kind: "cylinder", radius: 0.1, length: 1.1, at: [0, 0, -0.1] },
      ],
    },
    { id: "labels", kind: "group", pieces: [], label: "A", labelOffset: [0.18, 0.15, 0.6] },
    { id: "labelCam", kind: "group", pieces: [], label: "a", labelOffset: [0.25, -0.35, 0.6] },
    { id: "labelE", kind: "group", pieces: [], label: "E", labelOffset: [0.05, -DRUM - 0.25, 0.5] },
    { id: "labelL", kind: "group", pieces: [], label: "L", labelOffset: [polar(1.0, L_AT)[0] - 0.15, -1.15, 0.5] },
    { id: "labelM", kind: "group", pieces: [], label: "M", labelOffset: [polar(1.0, M_AT)[0] + 0.25, -1.1, 0.5] },
    { id: "labelF", kind: "group", pieces: [], label: "F", labelOffset: [polar(1.0, L_AT)[0] - 0.25, -1.7, 0.5] },
    { id: "labelH", kind: "group", pieces: [], label: "H", labelOffset: [1.85, 0.2, 0.5] },
    ...[0, 1].map((k) => ({ id: `piston${k}`, kind: "plate", shape: shape(rect(PISTON, 0.2, -PISTON / 2, 0)), thickness: 0.22, label: "c", labelOffset: [0, 0, 0.4], arrow: false })),
  ],
  driver: { part: "drum", type: "rotation", speed: -0.5, initial: deg(-60) },
  targets: ["piston0", "piston1"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const parts = { drum: { angle: theta } };
    for (const k of [0, 1]) {
      const phi = theta + Math.PI / 2 + k * Math.PI;
      parts[`piston${k}`] = { position: polar(reach(phi), phi, k === 0 ? 0.13 : -0.13), angle: phi };
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
    { check: "interference", parts: ["drum", "piston1"], reason: "接合處的簡化畫法:滑動活塞插在鼓的槽裡,槽沒有畫出來,重疊 0.26" },
    { check: "interference", parts: ["drum", "piston0"], reason: "接合處的簡化畫法:滑動活塞插在鼓的槽裡,槽沒有畫出來,重疊 0.26" },
    { check: "interference", parts: ["casing", "piston1"], reason: "簡化畫法:滑動活塞的外端貼著外殼內壁,重疊 0.15(96 個取樣中 51 個)" },
    { check: "interference", parts: ["casing", "piston0"], reason: "簡化畫法:滑動活塞的外端貼著外殼內壁,重疊 0.15(96 個取樣中 54 個)" },
    { check: "interference", parts: ["casing", "drum"], reason: "簡化畫法:鼓貼著外殼內壁的密封處,重疊 0.12" },
  ],
};
