// 第 288 種:回退式擒縱(時鐘)。錨形件 H–L–K 由擺帶動,繞軸 a 振動;兩端的叉瓦 H、K 之間是擒縱輪 A。
// 輪的齒輪流碰到兩個叉瓦;叉瓦的表面不與軸 a 同心,所以齒落到叉瓦上之後,擺繼續外擺時會把輪往回推一點(回退),
// 擺回來時齒沿表面 c、e 與 d、b 滑過,給擺一點衝擊。輪依原圖箭頭逆時針轉,擺每擺一次放走半個齒。
// 主動件是錨形件(擺)。
// 推斷:擺幅與回退量。
import { TAU, deg, swing } from "./kit.js";
import { escapeRecoil, escapeWheelPieces } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(7);
const A = [0, -1.25, 0];
const AXIS = [0, 1.75, 0];
export const RECOIL = PITCH * 0.12;

/** 錨形件累計擺動 v → 擒縱輪轉角(逆時針為正) */
export const wheelAngle = (v) => escapeRecoil(v, -SWING, SWING, PITCH / 2, RECOIL);

// 錨形件(相對軸 a):上橫樑,兩臂往下斜到叉瓦;叉瓦的內側面 c–e、d–b 是斜面
const anchor = shape(thickLine([[-1.05, -1.05], [-1.2, -0.25], [-1.0, 0], [0, 0.05], [1.0, 0], [1.2, -0.25], [1.05, -1.05]], 0.24), [circle(0.09).reverse()]);
const pallet = (s) => shape([[s * 0.95, -0.85], [s * 1.25, -0.9], [s * 0.98, -1.28], [s * 0.85, -1.15]]);

export default {
  figure: 288,
  parts: [
    { id: "wheelA", kind: "group", center: A, spin: 2.05, label: "A", labelOffset: [0.25, -0.1, 0.3], pieces: [...escapeWheelPieces({ teeth: N, outer: 2.05, inner: 1.78, dir: 1 }), { kind: "box", size: [0.14, 0.14, 0.14], at: [1.6, 0, 0.08], accent: true }] },
    {
      id: "anchor",
      kind: "group",
      center: AXIS,
      arrow: false,
      label: "L",
      labelOffset: [0, 0.35, 0.3],
      pieces: [{ kind: "plate", shape: anchor, thickness: 0.12, at: [0, 0, 0.12] }, { kind: "plate", shape: pallet(-1), thickness: 0.14, at: [0, 0, 0.12] }, { kind: "plate", shape: pallet(1), thickness: 0.14, at: [0, 0, 0.12] }, { kind: "cylinder", radius: 0.16, inner: 0.08, length: 0.3 }],
    },
    { id: "labelA", kind: "group", center: AXIS, label: "a", labelOffset: [0.3, -0.25, 0.4] },
    { id: "labelH", kind: "group", center: AXIS, label: "H", labelOffset: [-1.35, -0.3, 0.3] },
    { id: "labelK", kind: "group", center: AXIS, label: "K", labelOffset: [1.35, -0.3, 0.3] },
  ],
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const psi = swing(v, -SWING, SWING);
    return { parts: { anchor: { angle: psi }, wheelA: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
