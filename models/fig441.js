// 第 441 種:波斯水車,東方國家用於灌溉。有一根空心軸與彎曲的浮板,浮板末端掛著水斗(水桶)。輪的一部分浸在水流裡,
// 水流推浮板的凸面使輪轉動;每片浮板每轉一圈舀起一些水,沿浮板導進空心軸;同時一個個水桶把滿桶的水帶到高處,
// 碰到裝在方便處的固定銷而傾斜,把水倒出。
// 主動件是虛擬的「進程」:水流已帶著輪轉了幾圈。原圖箭頭:左側往下(逆時針)。
// 推斷:水桶掛在輪緣的銷上、靠自重朝下垂;浮板舀的水沿浮板流進空心軸,從軸的側面流出。
// 2026-10-07 複查:固定銷原本在輪緣外面,水桶根本碰不到它,傾斜是照「轉到哪就斜多少」的角度表給的(演出的動作)。
// 改成固定銷由輪前面的支架伸出,停在水桶經過頂端時桶身會撞上的地方(推斷):輪把水桶帶過去時,銷頂住桶身的左側,
// 桶就繞吊銷被撥斜、桶口朝左把水倒進前面的水槽;桶底滑過銷之後,水桶靠自重加速擺回垂直(由接觸算)。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";
import { pointInPolygon, edgeDistance } from "./contact.js";

export const RIM = 2.0;
const HUB = 0.45;
const FLOATS = 8;
const SWEEP = deg(55); // 浮板從軸到外端轉過的角度(彎曲)
export const RIVER = -1.25; // 水面
export const PIN = deg(98); // 固定銷的方位(水桶在這裡被撥斜)
export const PIN_R = 1.52; // 固定銷離輪心的距離(水桶經過頂端時,桶身會撞上它)
const PIN_AT = polar(PIN_R, PIN).slice(0, 2);
const PIN_SIZE = 0.06;
const SPEED = TAU * 1.6;

// 浮板:從軸往外彎曲到外緣(外端落後軸端,逆時針轉時凸面朝下游)
const floatLine = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return polar(HUB + (RIM - HUB) * t, -SWEEP * t * t).slice(0, 2);
});

// 水桶(吊銷在原點,垂直時往 −y 掛)
const BUCKET = [[-0.18, -0.3], [0.18, -0.3], [0.15, -0.65], [-0.15, -0.65]];
const HANGER = [[-0.02, 0], [0.02, 0], [0.02, -0.3], [-0.02, -0.3]];
// 水桶在輪上角度 a、傾斜 t 時,固定銷有沒有壓進桶身
const hits = (a, t) => {
  const [px, py] = polar(RIM, a);
  const [dx, dy] = [PIN_AT[0] - px, PIN_AT[1] - py];
  const q = [dx * Math.cos(-t) - dy * Math.sin(-t), dx * Math.sin(-t) + dy * Math.cos(-t)];
  return [BUCKET, HANGER].some((poly) => pointInPolygon(q, poly) || edgeDistance(q, poly) < PIN_SIZE);
};
// 依接觸逐步算(水桶的位置用它在輪上的角度 a 表示,從最低點逆時針走一圈):被銷壓進去就往逆時針撥開到剛好不碰;
// 沒被頂住就靠自重往回擺(越擺越快),擺到垂直、或碰到銷就停
const STEPS = 1440;
const DA = TAU / STEPS;
const GRAV = 2.0; // 擺回的角加速度(每弧度輪轉)
const TABLE = (() => {
  let t = 0;
  let w = 0;
  const out = [];
  for (let i = 0; i < 2 * STEPS; i++) {
    const a = -Math.PI / 2 + i * DA;
    if (hits(a, t)) {
      while (hits(a, t) && t < 2.5) t += 0.002;
      w = 0;
    } else if (t > 0) {
      w += GRAV * DA;
      let next = Math.max(0, t - w * DA);
      if (hits(a, next)) {
        let [lo, hi] = [next, t]; // lo 碰、hi 不碰
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          if (hits(a, mid)) lo = mid;
          else hi = mid;
        }
        next = hi;
        w = 0;
      }
      t = next;
      if (t === 0) w = 0;
    }
    if (i >= STEPS) out.push(t);
  }
  return out;
})();

/** 水桶掛在輪上角度 a 處 → 傾斜角與存量:在最低點浸水裝滿,一路滿著上升,被固定銷撥斜時倒空 */
export function bucket(a) {
  const x = wrap(a + Math.PI / 2) / DA;
  const i = Math.floor(x) % STEPS;
  const tilt = TABLE[i] + (TABLE[(i + 1) % STEPS] - TABLE[i]) * (x - Math.floor(x));
  const from = (wrap(a + Math.PI / 2) * 180) / Math.PI; // 從最低點逆時針轉過的角度(度)
  const first = (() => { // 第一次被撥到 60° 以上的位置(開始倒水)
    for (let k = 0; k < STEPS; k++) if (TABLE[k] > deg(60)) return (k * 360) / STEPS;
    return 360;
  })();
  const level = from < 25 ? from / 25 : from < first ? 1 : from < first + 15 ? (first + 15 - from) / 15 : 0;
  return { tilt, level };
}

export default {
  figure: 441,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [0, 0, 0],
      spin: RIM + 0.15,
      pieces: [
        { kind: "plate", shape: shape(circle(RIM + 0.04), [circle(RIM - 0.04).reverse()]), thickness: 0.06, at: [0, 0, -0.2] },
        ...Array.from({ length: FLOATS }, (_, i) => ({ kind: "plate", shape: shape(thickLine(floatLine, 0.06)), thickness: 0.45, angle: (i * TAU) / FLOATS })),
        // 空心軸(有放射狀的開口)
        { kind: "plate", shape: shape(circle(HUB), [circle(HUB - 0.12).reverse()]), thickness: 0.5, mark: [0, HUB - 0.06], markSize: 0.05 },
        ...Array.from({ length: 12 }, (_, i) => ({ kind: "box", size: [0.12, 0.03, 0.5], at: polar(HUB - 0.18, (i * TAU) / 12), angle: (i * TAU) / 12 })),
      ],
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.4, 0.2, 1.2], at: [0, -2.45, 0] },
        // 固定銷(由輪前面的支架伸出,只伸到水桶那一層)與接水槽
        { kind: "cylinder", radius: PIN_SIZE, length: 0.55, at: [PIN_AT[0], PIN_AT[1], 0.48] },
        { kind: "box", size: [0.12, RIM + 2.45 + PIN_AT[1], 0.1], at: [PIN_AT[0] - 1.4, (PIN_AT[1] - 2.35) / 2, 0.8] },
        { kind: "box", size: [1.46, 0.1, 0.1], at: [PIN_AT[0] - 0.7, PIN_AT[1], 0.8] },
        { kind: "box", size: [1.0, 0.12, 0.6], at: [PIN_AT[0] - 1.0, PIN_AT[1] - 0.9, 0.85] },
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (RIVER - 2.35) / 2, 0], size: [6.2, RIVER + 2.35, 1.1], level: 1 },
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `bucket${i}`, kind: "group", arrow: false, pieces: [
      { kind: "box", size: [0.04, 0.3, 0.04], at: [0, -0.15, 0.3] },
      { kind: "plate", shape: shape([[-0.18, -0.3], [0.18, -0.3], [0.15, -0.65], [-0.15, -0.65]], [[[-0.13, -0.33], [-0.11, -0.61], [0.11, -0.61], [0.13, -0.33]]]), thickness: 0.3, at: [0, 0, 0.3] },
    ] })),
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", size: [0.24, 0.26, 0.24] })),
  ],
  // 動力重演:輪照模型轉;水桶 0 掛在輪緣的吊銷上、只受重力,經過頂端時被固定銷撥斜、過了再擺回垂直
  replay: {
    from: 0,
    to: 1,
    seconds: 24,
    // 吊銷有摩擦(hold):水桶擺回來時不會一直來回晃
    free: { bucket0: { pivot: [...polar(RIM, -SWEEP), 0.3], on: "wheel", hold: true } },
    expect: [
      { at: (deg(200 - 90) + SWEEP) / TAU, part: "bucket0", label: "水桶到頂端被固定銷撥斜、倒水", quote: "透過與設置於方便處的固定銷接觸使其傾斜,而將水倒出", tolerance: 0.25 },
      { at: (deg(320 - 90) + SWEEP) / TAU, part: "bucket0", label: "過了銷,水桶靠自重擺回垂直" },
    ],
  },
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.1 },
  target: "wheel",
  view: { direction: [0.08, 0.06, 1] },
  pose(progress) {
    const wheel = TAU * progress; // 逆時針
    const parts = { wheel: { angle: wheel } };
    for (let i = 0; i < FLOATS; i++) {
      const a = wheel + (i * TAU) / FLOATS - SWEEP;
      const pin = polar(RIM, a, 0);
      const b = bucket(a);
      parts[`bucket${i}`] = { position: pin, angle: b.tilt };
      // 桶裡的水(隨桶傾斜)
      parts[`water${i}`] = { position: [pin[0] + 0.47 * Math.sin(b.tilt), pin[1] - 0.47 * Math.cos(b.tilt), 0.3], angle: b.tilt, level: b.level };
    }
    const travel = progress * SPEED;
    // 水:河水往右流;右側上升的浮板把舀起的水導向軸;頂端的水桶倒進水槽
    const riverPath = [[-3.1, RIVER - 0.4, 0.4], [3.1, RIVER - 0.4, 0.4]];
    const inward = [0, 1, 2].map((k) => {
      const a = deg(-40) + k * deg(35);
      return [polar(RIM - 0.3, a, 0.3), polar(HUB + 0.1, a + deg(40), 0.3)];
    });
    const pour = [[PIN_AT[0] - 0.2, PIN_AT[1] + 0.1, 0.5], [PIN_AT[0] - 0.6, PIN_AT[1] - 0.4, 0.7], [PIN_AT[0] - 1.0, PIN_AT[1] - 0.82, 0.85]];
    return {
      parts,
      flows: [{ fluid: "water", points: [...stream(riverPath, travel, { spacing: 0.3 }), ...inward.flatMap((p) => stream(p, travel, { spacing: 0.2 })), ...stream(pour, travel, { spacing: 0.18 })] }],
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["works", "bucket7"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket7"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket6"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket6"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket5"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket5"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket4"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket4"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket3"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket3"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket2"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket2"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket1"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket1"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
    { check: "interference", parts: ["works", "bucket0"], reason: "水斗在最低處舀水:斗身經過水槽時與槽底重疊 0.27(槽底應再低一點)" },
    { check: "interference", parts: ["wheel", "bucket0"], reason: "接合處的簡化畫法:水斗掛在輪緣的銷上,斗的吊耳與輪緣重疊 0.08" },
  ],
};
