// 第 468 種:撓性輸水幹管(平面圖與剖面圖)。兩條內徑 15 吋與 18 吋的管子,部分接頭做成這樣,把水送過克萊德河,
// 供應格拉斯哥自來水廠。管子固定在堅固的原木框架上,框架之間以帶水平樞軸的鉸鏈相連。框架與管子在南岸組好,
// 管子北端封堵後,用機械從北岸拖過河;它的撓性使它能順著河床的起伏。
// 主動件是虛擬的「拖曳」:管子被拖過河的進度。畫面是剖面(側視),左邊是南岸、右邊是北岸。
// 推斷:河床的起伏;每節管子與框架當作剛體,節與節之間以鉸鏈相連,沿著河床前進(各節的兩端都落在河床上)。
import { clamp } from "./kit.js";
import { shape } from "./shapes.js";

export const SEGMENT = 1.0; // 每節長
export const COUNT = 8;
const PIPE_R = 0.14;
/** 河床(兩岸 y = 0) */
export const bed = (x) => {
  if (x <= -3.2 || x >= 3.2) return 0;
  const t = (x + 3.2) / 6.4;
  return -1.3 * Math.sin(Math.PI * t) ** 0.7 + 0.18 * Math.sin(5 * Math.PI * t) * Math.sin(Math.PI * t);
};
const X0 = -12;
const X1 = 6.0;
// 沿河床的弧長表
const STEP = 0.01;
const ARC = [{ x: X0, s: 0 }];
for (let x = X0; x < X1; x += STEP) {
  const last = ARC[ARC.length - 1];
  ARC.push({ x: x + STEP, s: last.s + Math.hypot(STEP, bed(x + STEP) - bed(x)) });
}
const at = (s0) => {
  const s = clamp(s0, 0, ARC[ARC.length - 1].s);
  let lo = 0;
  let hi = ARC.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ARC[mid].s < s) lo = mid;
    else hi = mid;
  }
  const a = ARC[lo];
  const b = ARC[hi];
  const x = a.x + ((b.x - a.x) * (s - a.s)) / (b.s - a.s || 1);
  return [x, bed(x) + PIPE_R + 0.05, 0];
};
const sOf = (x) => ARC.find((p) => p.x >= x).s;
export const START = sOf(-3.6); // 管頭(北端)從南岸邊出發
export const END = sOf(4.4); // 拖到北岸

/** 拖曳進度 u → 每個鉸點的位置(管頭在前) */
export function joints(u) {
  const head = START + (END - START) * clamp(u, 0, 1);
  // 節與節之間是直的:沿弧長取點近似鉸點,再把每節校正成固定長度
  const pts = [at(head)];
  let s = head;
  for (let k = 0; k < COUNT; k++) {
    // 往後找弧長使弦長 = SEGMENT
    let lo = s - SEGMENT * 1.6;
    let hi = s - SEGMENT * 0.999;
    const prev = pts[pts.length - 1];
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const q = at(mid);
      if (Math.hypot(q[0] - prev[0], q[1] - prev[1]) > SEGMENT) lo = mid;
      else hi = mid;
    }
    s = (lo + hi) / 2;
    pts.push(at(s));
  }
  return pts;
}

const bank = (x0, x1) => {
  const pts = [];
  for (let x = x0; x <= x1 + 1e-9; x += 0.1) pts.push([x, bed(x)]);
  return pts;
};

export default {
  figure: 468,
  parts: [
    {
      id: "river",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([...bank(-6.0, 6.0), [6.0, -2.2], [-6.0, -2.2]]), thickness: 1.6 },
        // 北岸的絞盤
        { kind: "cylinder", radius: 0.3, length: 0.8, at: [5.4, 0.45, 0] },
        { kind: "box", size: [0.12, 0.5, 0.9], at: [5.4, 0.22, 0] },
      ],
    },
    { id: "water", kind: "fill", fluid: "water", center: [0, -0.7, 0], size: [6.4, 1.4, 1.4], level: 0.95 },
    ...Array.from({ length: COUNT }, (_, k) => ({
      id: `segment${k}`,
      kind: "link",
      width: 2 * PIPE_R,
      thickness: 2 * PIPE_R,
      pieces: [],
    })),
    ...Array.from({ length: COUNT + 1 }, (_, k) => ({ id: `joint${k}`, kind: "group", arrow: false, pieces: [{ kind: "box", size: [0.3, 0.42, 0.6] }, { kind: "cylinder", radius: 0.05, length: 0.8 }] })),
    { id: "hawser", kind: "rope", radius: 0.025 },
  ],
  driver: { type: "virtual", label: "拖曳", mode: "balance", range: [0, 1], initial: 0.45, format: (u) => Math.round(u * 100) + "%" },
  view: { direction: [0.1, 0.12, 1] },
  pose(u) {
    const pts = joints(u);
    const parts = {};
    pts.forEach((p, k) => {
      if (k < COUNT) parts[`segment${k}`] = { from: p, to: pts[k + 1] };
      const d = pts[Math.min(k + 1, COUNT)];
      const c = pts[Math.max(k - 1, 0)];
      parts[`joint${k}`] = { position: p, angle: Math.atan2(c[1] - d[1], c[0] - d[0]) };
    });
    const head = pts[0];
    return {
      parts,
      paths: { hawser: { points: [head, [5.4, 0.45, 0]], closed: false, phase: 0 } },
      readouts: [{ label: "管頭", value: head[0] < 3.2 ? "在河裡,順著河床前進" : "到北岸" }],
    };
  },
};

