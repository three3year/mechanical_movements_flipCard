// 第 240 種:棘輪擋止裝置的各種變形。原圖是同一個棘輪配三種擋止:左邊沿輪緣彎曲、末端成鉤的長爪,
// 右上的平桿爪,以及下方帶彈簧片的爪 C(握把在左,彈簧片把爪頂向輪)。
// 輪逆時針轉時三個爪都被齒背頂起、滑過去;要順時針倒轉時,齒的直面卡住爪尖,輪被擋住。
// 各爪靠自重或彈簧貼著輪,作用方式為推斷(原文只說是各種變形)。主動件是輪,往回只能轉到最近的擋止處。
// 接觸(由接觸算,共用 pawl-drive.js):三個爪都被齒背頂起、越過齒尖後從當下的速度起加速落下(不瞬移),
// 碰到下一個齒才停;倒轉時被擋住的位置就是各爪落定的位置。
// 彈簧片(原圖):一片 U 形板彈簧,上片從爪 C 的下緣伸出、往右彎成 U、下片回到框架上的固定座;
// 畫成一條隨爪彎曲的線:上片一端固定在爪上、隨爪轉,U 形彎與下片固定不動,彎曲吸收在上片裡。
import { TAU, deg, rot2 } from "./kit.js";
import { ratchetShape, circle, arcPoints, shape } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { lastStop } from "./contact.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

export const WHEEL = { teeth: 22, outer: 1.7, inner: 1.45, dir: 1 };
const PERIOD = TAU / WHEEL.teeth;
const Z = 0.2; // 各爪與輪的齒在同一平面,略往前

const rel = (pivot, pts) => pts.map(([x, y]) => [x - pivot[0], y - pivot[1]]);

// 右上:平桿爪,樞軸在右端
const BAR = {
  pivot: [3.35, 1.2],
  outline: [
    [0.2, 0.18],
    [-2.3, 0.3],
    [-2.56, 0.04],
    [-2.3, -0.12],
    [0.2, -0.18],
  ],
};
// 左:沿輪緣彎曲的長爪,末端的鉤伸進齒間
const HOOK_PIVOT = [-2.0, -0.1];
const HOOK = {
  pivot: HOOK_PIVOT,
  outline: rel(HOOK_PIVOT, [
    ...arcPoints(2.12, deg(184), deg(119)),
    [1.5 * Math.cos(deg(117)), 1.5 * Math.sin(deg(117))],
    ...arcPoints(1.88, deg(125), deg(184)),
  ]),
};
// 下:爪 C,樞軸在中間,左邊是握把,右上是爪尖
const C = {
  pivot: [0, -1.9],
  outline: [
    [-1.0, -0.3],
    [-0.9, -0.48],
    [-0.6, -0.3],
    [0.15, -0.15],
    [0.4, 0.12],
    [0.3, 0.37],
    [0.08, 0.18],
    [-0.4, 0.05],
    [-0.95, -0.1],
  ],
};

const STOPS = {
  bar: { ...BAR, from: deg(-12), into: 1 },
  hook: { ...HOOK, from: deg(8), into: -1 },
  pawlC: { ...C, from: deg(-14), into: 1 },
};

// 輪是主動件:三個爪隨輪的轉角起落,每個齒距一個週期。平桿爪、長爪靠自重,爪 C 由彈簧片往上頂
const drive = pawlDrive({
  period: PERIOD,
  samples: 360,
  pins: () => ({ bar: BAR.pivot, hook: HOOK.pivot, pawlC: C.pivot }),
  wheel: { obstacles: (w) => ratchetObstacles(WHEEL, w), angle: (w) => w },
  // 爪 C 越過齒尖後要彈回近 30°:落下的加速度取小一點(自靜止彈回 0.3 弧度花四分之一個齒距),看得出彈回的過程
  pawls: Object.fromEntries(Object.entries(STOPS).map(([id, st]) => [id, { outline: st.outline, into: st.into, angle: st.from, limits: [st.from - deg(20), st.from + deg(40)].sort((x, y) => x - y), fall: id === "pawlC" ? PERIOD / 4 : undefined }])),
});
export const stopAngle = (id, wheel) => drive.at(wheel).angles[id];

// 各爪落定的位置 = 倒轉時被擋住的位置:轉角驟變(落下)之後,第一個不再往下落的取樣
export const DROPS = Object.fromEntries(
  Object.keys(STOPS).map((id) => {
    const n = 720;
    const at = (i) => STOPS[id].into * stopAngle(id, (PERIOD * i) / n);
    let start = 0;
    let best = 0;
    for (let i = 1; i <= n; i++) {
      const d = at(i) - at(i - 1);
      if (d > best) [best, start] = [d, i];
    }
    let i = start;
    while (at(i + 1) - at(i) > 1e-6 && i < start + n / 4) i++;
    return [id, ((PERIOD * i) / n) % PERIOD];
  }),
);
export const STOP_OUTLINES = STOPS;
// 動力重演的中途事件:第二個齒距裡爪 C 被齒背壓下到八成的那一刻(預期爪真的被頂開,不只比落回後的位置;
// 取壓到最低之前,因為越過齒尖後彈回的快慢,重演的彈簧和模型的加速度不同)
const PRESS_C = (() => {
  const at = (w) => STOPS.pawlC.into * stopAngle("pawlC", w);
  const w0 = DROPS.bar + PERIOD;
  let low = { a: Infinity, w: w0 };
  for (let i = 0; i <= 200; i++) {
    const w = w0 + (i * PERIOD) / 200;
    if (at(w) < low.a) low = { a: at(w), w };
  }
  let w = w0;
  while (at(w) > at(w0) + 0.8 * (low.a - at(w0))) w += PERIOD / 400;
  return w;
})();
export const pawlCAngle = (wheel) => stopAngle("pawlC", wheel);

// 彈簧片:上片從爪 C 下緣的 SPRING.root(爪的局部座標)沿 SPRING.dir 伸出,彎到固定的 U 形彎頂端 SPRING.bend;
// U 形彎的半徑 SPRING.r;下片從彎底回到固定座 SPRING.anchor
const SPRING = { root: [0.05, -0.22], dir: deg(-6), bend: [1.6, -2.25], r: 0.15, anchor: [0.56, -2.9] };
export function springPoints(pawl) {
  const [rx, ry] = rot2(SPRING.root, pawl);
  const p0 = [C.pivot[0] + rx, C.pivot[1] + ry];
  const d = SPRING.dir + pawl;
  const p1 = [p0[0] + 0.7 * Math.cos(d), p0[1] + 0.7 * Math.sin(d)];
  const p3 = SPRING.bend;
  const p2 = [p3[0] - 0.6, p3[1]];
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, e = t ** 3;
    pts.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]]);
  }
  const cy = p3[1] - SPRING.r;
  for (let i = 1; i <= 8; i++) {
    const a = Math.PI / 2 - (Math.PI * i) / 8;
    pts.push([p3[0] + SPRING.r * Math.cos(a), cy + SPRING.r * Math.sin(a)]);
  }
  pts.push(SPRING.anchor);
  return pts.map(([x, y]) => [x, y, Z]);
}

const plateOf = (id, s, extra) => ({
  id,
  kind: "plate",
  center: [...s.pivot, Z],
  shape: shape(s.outline, [circle(0.07).reverse()]),
  thickness: 0.12,
  ...extra,
});

export default {
  figure: 240,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: ratchetShape({ ...WHEEL, bore: 0.14 }),
      thickness: 0.16,
      hub: 0.38,
      circles: [0.38],
      mark: [1.0, 0],
      markSize: 0.1,
      spin: WHEEL.outer,
      center: [0, 0, Z],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.14, length: 0.6, at: [0, 0, -0.1] }, // 輪軸
        ...pedestal({ at: [0, 0], z: -0.35, bore: 0.14, floor: -3.2 }),
        ...[BAR.pivot, HOOK.pivot, C.pivot].map((p) => ({ kind: "cylinder", radius: 0.065, length: 0.6, at: [p[0], p[1], Z - 0.05] })), // 三個爪的樞軸銷
        { kind: "box", size: [0.3, 4.3, 0.12], at: [BAR.pivot[0] + 0.3, BAR.pivot[1] - 2.05, -0.35] },
        { kind: "box", size: [0.5, 0.25, 0.12], at: [BAR.pivot[0] + 0.15, BAR.pivot[1], -0.35] },
        { kind: "box", size: [0.25, 3.1, 0.12], at: [HOOK.pivot[0] - 0.3, HOOK.pivot[1] - 1.55, -0.35] },
        { kind: "box", size: [0.45, 0.25, 0.12], at: [HOOK.pivot[0] - 0.15, HOOK.pivot[1], -0.35] },
        { kind: "box", size: [0.25, 1.3, 0.12], at: [C.pivot[0], C.pivot[1] - 0.65, -0.35] },
        { kind: "box", size: [7.2, 0.2, 0.6], at: [0.3, -3.3, -0.2] }, // 底座
      ],
    },
    plateOf("bar", BAR),
    plateOf("hook", HOOK),
    plateOf("pawlC", C, { label: "C", labelOffset: [-0.75, 0.2, 0] }),
    { id: "spring", kind: "rod", radius: 0.045 },
    { id: "springSeat", kind: "cylinder", center: [...SPRING.anchor, Z], radius: 0.09, length: 0.24, pieces: [{ kind: "box", size: [0.3, 0.14, 0.24], at: [0, -0.14, 0] }] },
  ],
  // 動力重演:只轉輪;平桿爪、長爪鉸在銷上靠自重搭在齒上,爪 C 由彈簧片往上頂;由齒背頂起、越過後落下
  replay: {
    from: DROPS.bar,
    to: DROPS.bar + 2 * PERIOD,
    seconds: 16,
    ignore: [["wheel", "frame"]],
    free: { bar: {}, hook: {}, pawlC: { spring: 1, gravity: false } },
    expect: [
      { at: DROPS.bar + PERIOD, part: "bar", label: "平桿爪越過一齒、落回齒間" },
      { at: DROPS.bar + 2 * PERIOD, part: "hook", label: "長爪越過兩齒、落回齒間" },
      { at: PRESS_C, part: "pawlC", label: "爪 C 被齒背壓下(彈簧被壓縮)" },
      { at: DROPS.bar + 2 * PERIOD, part: "pawlC", label: "爪 C 越過兩齒、落回齒間" },
    ],
  },
  driver: {
    part: "wheel",
    type: "rotation",
    initial: DROPS.bar,
    speed: 0.5,
    backstop: (v) => Math.max(...Object.values(DROPS).map((d) => lastStop(v, d, PERIOD))),
  },
  targets: ["hook", "bar", "pawlC"], // 三種擋止爪都是這張圖的重點
  view: { direction: [0.08, 0.06, 1] },
  pose(wheel) {
    const pawlC = pawlCAngle(wheel);
    return {
      parts: {
        wheel: { angle: wheel },
        bar: { angle: stopAngle("bar", wheel) },
        hook: { angle: stopAngle("hook", wheel) },
        pawlC: { angle: pawlC },
      },
      paths: { spring: { points: springPoints(pawlC), closed: false } },
      readouts: [],
    };
  },
};
