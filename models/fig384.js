// 第 384 種:螺旋線描繪儀(helicograph)。一根有螺紋的軸,一端是插在紙上的固定中心尖;軸上的小輪(輪緣有齒)
// 壓在紙上。繞中心轉動軸時,小輪在紙上滾動,同時沿螺紋往外(或往內,看轉的方向)移動,於是畫出一條渦線(螺旋線);
// 紙上鋪著一張有色面朝下的複寫紙,小輪壓在上面,把同樣的圖形轉印到紙上。主動件是軸(繞中心尖轉)。軌跡由 pose 回傳。
// 照原圖:中心尖是另一個固定的零件,尖端插進紙裡,頂上有圓形的握柄(手按著它);軸的一端是一塊扁環,套在中心尖上
// 繞著轉,扁環下面由尖上的凸緣托著。
// 小輪在紙上純滾動:輪往 ψ 增加的方向滾時,繞自己的軸(沿臂往外)是反轉,所以螺紋做成左旋,小輪這樣轉時沿螺紋往外走。
// 推斷:螺距與小輪的大小;小輪在紙上純滾動(齒頂貼著紙面滾);螺紋的旋向(原圖看不出);凸緣與握柄的大小。
import { X, Y, Z, TAU, clamp, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { gearSize } from "./shapes.js";

const WHEEL = 0.45; // 小輪節圓半徑(也是臂的軸心離紙面的高度減去齒頂高)
const TEETH = 30;
const ROLL = WHEEL + gearSize(WHEEL, TEETH).addendum; // 齒頂貼著紙面滾:滾動半徑
const PITCH = 0.16; // 螺紋的螺距
const HAND = -1; // 左旋
const D0 = 1.1; // 起始時小輪離中心的距離
export const K = PITCH / (TAU * ROLL); // 每單位轉角,距離增加的比例:d(ψ) = D0·e^(Kψ)
export const RANGE = [0, 2.5 * TAU];
const PAPER_TOP = WHEEL - ROLL; // 紙面(臂的軸心在 y = WHEEL)
const RING = { y: WHEEL, half: 0.04, bore: 0.06 }; // 臂端扁環的高度、半厚與孔

/** 軸繞中心轉 psi → 小輪離中心的距離、小輪相對軸的自轉角(繞沿臂往外的軸;滾動時是反轉) */
export function helicograph(psi0) {
  const psi = clamp(psi0, ...RANGE);
  const d = D0 * Math.exp(K * psi);
  // 純滾動:自轉 dθ = −d·dψ / ROLL;左旋螺紋上反轉 dθ 讓小輪往外走 HAND·PITCH·dθ/2π = dd
  return { psi, d, spin: (HAND * (d - D0) * TAU) / PITCH };
}

export default {
  figure: 384,
  parts: [
    { id: "paper", kind: "box", center: [0, PAPER_TOP - 0.02, 0], size: [6.2, 0.04, 6.2] },
    // 中心尖(固定):尖端插進紙裡,往上是托著扁環的凸緣、穿過扁環的一段,頂上是握柄
    {
      id: "center",
      kind: "lathe",
      axis: Y,
      profile: [
        [0, PAPER_TOP - 0.03], [0.012, PAPER_TOP], [0.045, 0.3], [RING.bore, 0.33], [0.13, 0.33], [0.13, RING.y - RING.half],
        [RING.bore, RING.y - RING.half], [RING.bore, 0.6], [0.1, 0.62], [0.15, 0.7], [0.15, 0.78], [0.1, 0.85], [0, 0.87],
      ],
    },
    {
      id: "arm",
      kind: "group",
      axis: Y,
      center: [0, WHEEL, 0],
      spin: 0.3, // 螺紋軸繞中心尖轉:中心尖旁標轉向
      pieces: [
        // 扁環(局部 z 是繞中心尖的軸):孔套著中心尖;帶螺紋的軸從扁環伸出
        { kind: "cylinder", role: "ring", radius: 0.2, inner: RING.bore, length: 2 * RING.half },
        { kind: "worm", axis: [1, 0, 0], radius: 0.07, length: 2.9, pitch: PITCH, thread: 0.025, hand: HAND, at: [1.6, 0, 0] },
      ],
    },
    { id: "wheel", kind: "gear", axis: [1, 0, 0], teeth: TEETH, radius: WHEEL, width: 0.12, pieces: [{ kind: "cylinder", radius: 0.12, length: 0.35, at: [0, 0, 0.2] }] },
    { id: "spiral", kind: "trace" },
  ],
  driver: { part: "arm", type: "rotation", range: RANGE, initial: 0 },
  target: "wheel", // 在紙上滾出渦線的小輪
  view: { direction: [0.1, 0.45, 1], fit: ["arm", "wheel"] },
  pose(psi0) {
    const h = helicograph(psi0);
    const n = Math.max(2, Math.round((h.psi / TAU) * 64));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const a = (h.psi * i) / n;
      const d = D0 * Math.exp(K * a);
      return [d * Math.cos(a), PAPER_TOP + 0.01, -d * Math.sin(a)];
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
  waivers: [
    { check: "interference", parts: ["paper", "center"], reason: "中心尖的尖端插進紙裡 0.03(原圖中心尖插在紙上,小輪繞這個固定的中心點轉);紙上的針孔沒有畫出來" },
  ],
};
