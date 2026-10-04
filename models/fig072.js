// 第 72 種:傾動式錘子(tilt-hammer)。凸輪(推板輪)B 有四片推板,每轉一圈把錘子 A 抬起四次:
// 推板頂起錘柄下方的凸塊,錘子繞右端的支座擺起,推板一滑過凸塊,錘子便落回砧上。
// 主動件是 B(順時針,原圖箭頭)。每片推板經過時錘柄被頂起、滑脫後瞬間落下(時序為簡化的示意)。
import { TAU, deg, polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { falling, cycleOf } from "./jumps.js";
import { placeOutline, swingUntilContact } from "./contact.js";

const B = { center: [0, 0, 0], hub: 0.42, tip: 0.88 };
const PIVOT = [3.2, 0.42, 0]; // 錘柄的支點(右端)
const TAPPET = [0.12, 0.55]; // 錘子落在砧上時,凸塊底端的位置

// 推板:從輪轂伸出的彎刃,尖端在局部角 i·90°
const wiper = (i) => {
  const a = (i * TAU) / 4;
  return shape([...arcPoints(B.hub, a - deg(32), a + deg(14)), polar(B.tip, a).slice(0, 2), polar(B.tip - 0.25, a - deg(26)).slice(0, 2)]);
};
const WIPERS = [0, 1, 2, 3].map((i) => wiper(i).outline);

// 錘柄與它下方的凸塊(支點座標):推板頂的是這兩塊
// 錘柄在推板輪上方拱起,讓推板只碰得到凸塊(原圖的錘柄是直的,照畫推板會掃過錘柄;實物可行優先)
const HANDLE = [[0.15, -0.2], [0.18, 0.28], [-2.0, 0.55], [-2.9, 0.9], [-4.6, 0.95], [-6.3, 1.15], [-6.35, 0.72], [-4.6, 0.55], [-4.1, 0.51], [-2.85, 0.51], [-2.45, 0.2], [-2.2, 0.13], [-0.25, -0.2]];
const BLOCK_AT = [TAPPET[0] - PIVOT[0], TAPPET[1] - PIVOT[1] + 0.19];
const BLOCK = [[-0.07, -0.22], [0.07, -0.22], [0.07, 0.22], [-0.07, 0.22]].map(([x, y]) => [BLOCK_AT[0] + x, BLOCK_AT[1] + y]);
const SWEEP = deg(20);

// 錘柄憑自重靠在推板上的抬起角(由接觸算;沒有推板頂著就落在砧上,為 0)
function resting(b) {
  const blades = WIPERS.map((o) => placeOutline(o, B.center, -b));
  const rest = (outline) => swingUntilContact({ pivot: PIVOT, outline, from: -SWEEP, into: 1, sweep: SWEEP }, blades);
  return Math.max(0, -Math.min(rest(HANDLE), rest(BLOCK)));
}

// 一片推板經過的週期裡:推板滑脫的那一刻(抬起角驟降)與滑脫前的高度
const PERIOD = TAU / 4;
const SLIP = (() => {
  let at = 0;
  let drop = 0;
  const n = 720;
  for (let i = 1; i <= n; i++) {
    const d = resting((PERIOD * (i - 1)) / n) - resting((PERIOD * i) / n);
    if (d > drop) [drop, at] = [d, (PERIOD * (i - 1)) / n];
  }
  return { at, height: resting(at) };
})();
const DROP = deg(5); // 落下的過程佔推板輪轉過的角度(演出加速落下)

/** B 順時針轉 b:錘柄繞支點抬起的角度(0 為落在砧上)。推板頂起時由接觸算,滑脫後憑自重加速落回砧上 */
export function hammerLift(b) {
  const { u } = cycleOf(b, PERIOD);
  const since = (((u * PERIOD - SLIP.at) % PERIOD) + PERIOD) % PERIOD;
  const lift = resting(b);
  return since < DROP ? Math.max(lift, SLIP.height * (1 - falling(since / DROP))) : lift;
}

export default {
  figure: 72,
  parts: [
    {
      id: "wiper",
      kind: "group",
      center: B.center,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(circle(B.hub + 0.05), [circle(0.15).reverse()]), thickness: 0.3, circles: [0.22] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "plate", shape: wiper(i), thickness: 0.3, ...(i === 0 ? { mark: polar(0.62, -0.25).slice(0, 2), markSize: 0.07 } : {}) })),
      ],
      label: "B",
      labelOffset: [-0.3, 0.05, 0.3],
    },
    {
      id: "hammer",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 錘柄:從支點往左延伸,越過推板輪,錘頭落在左邊的砧上
        { kind: "plate", shape: shape(HANDLE), thickness: 0.32 },
        { kind: "box", size: [0.35, 0.55, 0.36], at: [0, -0.1, 0] },
        { kind: "sphere", radius: 0.2, at: [0, -0.32, 0] },
        { kind: "box", size: [1.0, 0.32, 0.4], at: [-5.75, 0.55, 0] },
        { kind: "box", size: [0.14, 0.44, 0.2], at: [...BLOCK_AT, 0] },
      ],
      label: "A",
      labelOffset: [-3.6, 1.15, 0.3],
    },
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.6, 1.7, 0.8], at: [-2.65, -0.05, 0] },
        { kind: "box", size: [2.1, 0.6, 0.8], at: [2.75, -0.65, 0] }, // 砧座壓低:錘頭落下時錘面落在砧面上,不陷進去
        { kind: "box", size: [0.9, 0.25, 0.8], at: [3.2, -0.225, 0] },
        { kind: "box", size: [8.2, 0.12, 1.2], at: [0, -0.95, 0] },
        { kind: "plate", shape: shape([[-3.6, 0.7], [-1.95, 0.7], [-1.95, 0.805], [-3.6, 0.805]]), thickness: 0.4 },
      ],
    },
  ],
  driver: { part: "wiper", type: "rotation", speed: -1.0 },
  // 動力重演:只推推板輪;錘子繞支座自由擺動,靠自重落下
  replay: {
    from: 0,
    to: -PERIOD,
    free: { hammer: {} },
    expect: [
      { at: -(SLIP.at - 0.08), part: "hammer", label: "推板把錘子頂到最高", quote: "每轉一圈把錘子抬起四次" },
      { at: -(SLIP.at + DROP + 0.15), part: "hammer", label: "推板滑脫後錘子落回" },
    ],
  },
  target: "hammer", // 被抬起又落下的錘子 A
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { wiper: { angle: v }, hammer: { angle: -hammerLift(-v) } }, readouts: [] };
  },
};

