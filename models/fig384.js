// 第 384 種:螺旋線描繪儀(helicograph)。一根有螺紋的軸,一端是插在紙上的固定中心尖;軸上的小輪(輪緣有齒)
// 壓在紙上。繞中心轉動軸時,小輪在紙上滾動,同時沿螺紋往外(或往內,看轉的方向)移動,於是畫出一條渦線(螺旋線);
// 小輪下面墊著有色面朝下的描圖紙,把同樣的圖形印到紙上。主動件是軸(繞中心尖轉)。軌跡由 pose 回傳。
// 推斷:螺距與小輪的大小;小輪在紙上純滾動。
import { X, Y, Z, TAU, clamp, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";

const WHEEL = 0.45; // 小輪半徑
const PITCH = 0.16; // 螺紋的螺距
const D0 = 1.1; // 起始時小輪離中心的距離
export const K = PITCH / (TAU * WHEEL); // 每單位轉角,距離增加的比例:d(ψ) = D0·e^(Kψ)
export const RANGE = [0, 2.5 * TAU];
const Z0 = 0.0; // 紙面

/** 軸繞中心轉 psi → 小輪離中心的距離、小輪的自轉角 */
export function helicograph(psi0) {
  const psi = clamp(psi0, ...RANGE);
  const d = D0 * Math.exp(K * psi);
  return { psi, d, spin: (d - D0) / (PITCH / TAU) };
}

export default {
  figure: 384,
  parts: [
    { id: "paper", kind: "box", center: [0, -0.05, 0], size: [6.2, 0.04, 6.2] },
    {
      id: "arm",
      kind: "group",
      axis: Y,
      center: [0, WHEEL, 0],
      arrow: false,
      pieces: [
        // 中心尖、帶螺紋的軸
        { kind: "lathe", axis: [0, 0, 1], profile: [[0, -WHEEL], [0.04, -WHEEL + 0.12], [0.06, 0.25], [0, 0.25]], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.15, length: 0.08, at: [0, 0, 0.12] },
        { kind: "worm", axis: [1, 0, 0], radius: 0.07, length: 3.0, pitch: PITCH, thread: 0.025, at: [1.55, 0, 0] },
      ],
    },
    { id: "wheel", kind: "gear", axis: [1, 0, 0], teeth: 30, radius: WHEEL, width: 0.12, pieces: [{ kind: "cylinder", radius: 0.12, length: 0.35, at: [0, 0, 0.2] }] },
    { id: "spiral", kind: "trace" },
  ],
  driver: { part: "arm", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.1, 0.45, 1], fit: ["arm", "wheel"] },
  pose(psi0) {
    const h = helicograph(psi0);
    const n = Math.max(2, Math.round((h.psi / TAU) * 64));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const a = (h.psi * i) / n;
      const d = D0 * Math.exp(K * a);
      return [d * Math.cos(a), Z0 + 0.01, -d * Math.sin(a)];
    });
    const c = Math.cos(h.psi);
    const s = Math.sin(h.psi);
    return {
      parts: {
        arm: { angle: h.psi },
        // 小輪:軸沿臂的方向(水平),中心在離中心 d、紙面上方一個輪半徑處
        wheel: { position: [h.d * c, WHEEL, -h.d * s], rotation: quatMul(quatAxisAngle(Y, h.psi), quatMul(quatFromZ(X), quatAxisAngle(Z, h.spin))) },
      },
      paths: { spiral: { points, closed: false } },
      readouts: [],
    };
  },
};
