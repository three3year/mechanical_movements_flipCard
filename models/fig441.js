// 第 441 種:波斯水車,東方國家用於灌溉。有一根空心軸與彎曲的浮板,浮板末端掛著水斗(水桶)。輪的一部分浸在水流裡,
// 水流推浮板的凸面使輪轉動;每片浮板每轉一圈舀起一些水,沿浮板導進空心軸;同時一個個水桶把滿桶的水帶到高處,
// 碰到裝在方便處的固定銷而傾斜,把水倒出。
// 主動件是虛擬的「進程」:水流已帶著輪轉了幾圈。原圖箭頭:左側往下(逆時針)。
// 推斷:水桶掛在浮板外端的吊銷上、靠自重朝下垂;浮板舀的水沿浮板流進空心軸,從軸前端的開口流出。
// 2026-10-07 複查:固定銷原本在輪緣外面,水桶根本碰不到它,傾斜是照「轉到哪就斜多少」的角度表給的(演出的動作)。
// 改成固定銷由輪前面的支架伸出,停在水桶經過頂端時桶身會撞上的地方(推斷):輪把水桶帶過去時,銷頂住桶身的左側,
// 桶就繞吊銷被撥斜、桶口朝左把水倒進前面的水槽;桶底滑過銷之後,水桶靠自重加速擺回垂直(由接觸算)。
// 2026-10-20(#441-1~6):
// - 浮板的彎向照原文與原圖反過來:外端領先軸端(逆時針轉的方向),最低處的浮板鼓向上游、水流推的是凸面;右側升起、
//   轉過水平的浮板凹面朝上兜住舀起的水,從外端到軸端一路下坡,水沿浮板流進空心軸。
// - 照原圖 6 片浮板、6 個水桶。
// - 輪補一根固定軸穿過空心軸,兩岸各立一根軸承柱(推斷,原圖是正面圖、只畫空心軸的端面);水從空心軸前端的開口流出。
// - 水桶掛在浮板外端伸出的吊銷上(原圖浮板末端有小環),吊耳套在吊銷上,桶身整個在浮板那一層的前面,不再穿過浮板。
// - 槽底(底座)與河水往下移,水桶在最低處不再穿進槽底;固定銷的支架立柱站在底座上,底座加寬到支柱那一層。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine, zCylinder } from "./shapes.js";
import { pointInPolygon, edgeDistance, placeOutline } from "./contact.js";

export const RIM = 2.0;
export const HUB = 0.45;
export const HUB_BORE = HUB - 0.12; // 空心軸的內徑
export const FLOATS = 6;
export const SWEEP = deg(55); // 浮板從軸端到外端轉過的角度(彎曲;外端領先軸端)
export const BASE_TOP = -2.85; // 槽底
const BASE_BOTTOM = BASE_TOP - 0.2;
export const RIVER = -1.25; // 水面
export const PIN = deg(98); // 固定銷的方位(水桶在這裡被撥斜)
export const PIN_R = 1.52; // 固定銷離輪心的距離(水桶經過頂端時,桶身會撞上它)
const PIN_AT = polar(PIN_R, PIN).slice(0, 2);
const PIN_SIZE = 0.06;
const SPEED = TAU * 1.6;
// 深度分層:浮板在中層,水桶掛在浮板前面一層;固定銷只伸到水桶那一層,碰不到浮板
const FLOAT_T = 0.45;
const BUCKET_Z = [0.25, 0.55];
const EYE_Z = [0.26, 0.34];
const HANG_PIN = { r: 0.035, z: [0.15, 0.4] };
const POST_Z = 0.8; // 軸承柱與固定銷支架的深度(兩岸)
const AXLE = { radius: 0.1, half: POST_Z + 0.06 };

// 浮板的中心線:從軸端往外彎到外端(局部座標,軸端在 0°;外端領先 SWEEP)
export const FLOAT = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return polar(HUB + (RIM - HUB) * t, SWEEP * t * t).slice(0, 2);
});
/** 外端在方位 outer 的浮板,中心線的世界座標(軸端 → 外端) */
export const floatAt = (outer) => placeOutline(FLOAT, [0, 0], outer - SWEEP);
const FLOAT_END = polar(RIM, SWEEP).slice(0, 2); // 浮板外端(吊銷在這裡)

// 水桶(吊銷在原點,垂直時往 −y 掛):桶身與吊耳下的吊條
export const BUCKET = [[-0.18, -0.3], [0.18, -0.3], [0.15, -0.65], [-0.15, -0.65]];
const HANGER = [[-0.02, 0], [0.02, 0], [0.02, -0.32], [-0.02, -0.32]];
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

// 水桶第一次被撥到 60° 以上的位置(開始倒水;從最低點逆時針轉過的角度,度)
const FIRST = (() => {
  for (let k = 0; k < STEPS; k++) if (TABLE[k] > deg(60)) return (k * 360) / STEPS;
  return 360;
})();

/** 水桶掛在輪上角度 a 處 → 傾斜角與存量:在最低點浸水裝滿,一路滿著上升,被固定銷撥斜時倒空 */
export function bucket(a) {
  const x = wrap(a + Math.PI / 2) / DA;
  const i = Math.floor(x) % STEPS;
  const tilt = TABLE[i] + (TABLE[(i + 1) % STEPS] - TABLE[i]) * (x - Math.floor(x));
  const from = (wrap(a + Math.PI / 2) * 180) / Math.PI; // 從最低點逆時針轉過的角度(度)
  const level = from < 25 ? from / 25 : from < FIRST ? 1 : from < FIRST + 15 ? (FIRST + 15 - from) / 15 : 0;
  return { tilt, level };
}

// 固定銷的支架:立柱站在底座上、橫臂伸到銷、接水槽掛在立柱上(推斷)
const BRACKET_X = PIN_AT[0] - 1.4;

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
        ...Array.from({ length: FLOATS }, (_, i) => ({ kind: "plate", shape: shape(thickLine(FLOAT, 0.06)), thickness: FLOAT_T, angle: (i * TAU) / FLOATS })),
        // 每片浮板外端的吊銷:從浮板伸到前面水桶那一層(原圖浮板末端的小環)
        ...Array.from({ length: FLOATS }, (_, i) => zCylinder(HANG_PIN.z[0], HANG_PIN.z[1], HANG_PIN.r, polar(RIM, SWEEP + (i * TAU) / FLOATS).slice(0, 2))),
        // 空心軸(有放射狀的開口)
        { kind: "plate", shape: shape(circle(HUB), [circle(HUB_BORE).reverse()]), thickness: 0.5, mark: [0, HUB - 0.06], markSize: 0.05 },
        ...Array.from({ length: 12 }, (_, i) => ({ kind: "box", size: [0.12, 0.03, 0.5], at: polar(HUB - 0.18, (i * TAU) / 12), angle: (i * TAU) / 12 })),
      ],
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 槽底(河床)
        { kind: "box", size: [6.4, BASE_TOP - BASE_BOTTOM, 2 * POST_Z + 0.4], at: [0, (BASE_TOP + BASE_BOTTOM) / 2, 0] },
        // 固定軸穿過空心軸,兩岸各一根軸承柱站在槽底上(推斷)
        { kind: "cylinder", radius: AXLE.radius, length: 2 * AXLE.half, at: [0, 0, 0] },
        ...[1, -1].map((k) => ({ kind: "box", size: [0.16, 0.1 - BASE_TOP + 0.05, 0.12], at: [0, (0.1 + BASE_TOP - 0.05) / 2, k * POST_Z] })),
        // 固定銷(由輪前面的支架伸出,只伸到水桶那一層)、支架與接水槽
        zCylinder(BUCKET_Z[0] + 0.01, 0.76, PIN_SIZE, PIN_AT),
        { kind: "box", size: [0.12, PIN_AT[1] + 0.05 - BASE_TOP + 0.05, 0.1], at: [BRACKET_X, (PIN_AT[1] + 0.05 + BASE_TOP - 0.05) / 2, POST_Z] },
        { kind: "box", size: [PIN_AT[0] - BRACKET_X + 0.06, 0.1, 0.1], at: [(PIN_AT[0] + BRACKET_X) / 2, PIN_AT[1], POST_Z] },
        { kind: "box", size: [1.0, 0.12, 0.6], at: [PIN_AT[0] - 1.0, PIN_AT[1] - 0.9, POST_Z + 0.1] }, // 接水槽在水桶那一層的前面(z 0.6 起),桶經過時擦不到
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (RIVER + BASE_TOP) / 2, 0], size: [6.2, RIVER - BASE_TOP, 1.1], level: 1 },
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `bucket${i}`, kind: "group", arrow: false, pieces: [
      // 吊耳:套在吊銷上的環,往下接吊條與桶身(桶身整個在浮板前面一層)
      { kind: "plate", shape: shape(circle(0.07), [circle(HANG_PIN.r + 0.01).reverse()]), thickness: EYE_Z[1] - EYE_Z[0], at: [0, 0, (EYE_Z[0] + EYE_Z[1]) / 2] },
      { kind: "box", size: [0.04, 0.27, 0.04], at: [0, -0.185, (EYE_Z[0] + EYE_Z[1]) / 2] },
      { kind: "plate", shape: shape(BUCKET, [[[-0.13, -0.33], [-0.11, -0.61], [0.11, -0.61], [0.13, -0.33]]]), thickness: BUCKET_Z[1] - BUCKET_Z[0], at: [0, 0, (BUCKET_Z[0] + BUCKET_Z[1]) / 2] },
    ] })),
    ...Array.from({ length: FLOATS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", size: [0.24, 0.26, 0.24] })),
  ],
  // 動力重演:輪照模型轉;水桶 0 掛在浮板外端的吊銷上、只受重力,經過頂端時被固定銷撥斜、過了再擺回垂直
  replay: {
    from: 0,
    to: 1,
    seconds: 24,
    // 吊銷有摩擦(hold):水桶擺回來時不會一直來回晃
    free: { bucket0: { pivot: [...FLOAT_END, (EYE_Z[0] + EYE_Z[1]) / 2], on: "wheel", hold: true } },
    expect: [
      { at: (deg(200 - 90) - SWEEP) / TAU, part: "bucket0", label: "水桶到頂端被固定銷撥斜、倒水", quote: "透過與設置於方便處的固定銷接觸使其傾斜,而將水倒出" },
      { at: (deg(320 - 90) - SWEEP) / TAU, part: "bucket0", label: "過了銷,水桶靠自重擺回垂直" },
    ],
  },
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.1 },
  target: "wheel",
  view: { direction: [0.08, 0.06, 1] },
  pose(progress) {
    const wheel = TAU * progress; // 逆時針
    const parts = { wheel: { angle: wheel } };
    const waterZ = (BUCKET_Z[0] + BUCKET_Z[1]) / 2;
    for (let i = 0; i < FLOATS; i++) {
      const a = wheel + (i * TAU) / FLOATS + SWEEP; // 浮板外端(吊銷)的方位
      const pin = polar(RIM, a, 0);
      const b = bucket(a);
      parts[`bucket${i}`] = { position: pin, angle: b.tilt };
      // 桶裡的水(隨桶傾斜)
      parts[`water${i}`] = { position: [pin[0] + 0.47 * Math.sin(b.tilt), pin[1] - 0.47 * Math.cos(b.tilt), waterZ], angle: b.tilt, level: b.level };
    }
    const travel = progress * SPEED;
    // 水:河水往右流;右側升起、轉過水平的浮板把舀起的水沿浮板導進空心軸(示意的位置固定,不隨輪轉);
    // 空心軸裡的水從前端的開口流出;頂端的水桶倒進水槽
    const riverPath = [[-3.1, RIVER - 0.4, 0.4], [3.1, RIVER - 0.4, 0.4]];
    const inward = [deg(65), deg(90), deg(110)].map((outer) => floatAt(outer).slice(1).reverse().map(([x, y]) => [x, y, FLOAT_T / 2 + 0.03]));
    const spout = [[0.2, -0.2, 0.3], [0.45, -0.45, 0.45], [0.55, -0.9, 0.5], [0.6, RIVER, 0.5]];
    const pour = [[PIN_AT[0] - 0.2, PIN_AT[1] + 0.1, 0.5], [PIN_AT[0] - 0.6, PIN_AT[1] - 0.4, 0.7], [PIN_AT[0] - 1.0, PIN_AT[1] - 0.82, 0.85]];
    return {
      parts,
      flows: [{ fluid: "water", points: [...stream(riverPath, travel, { spacing: 0.3 }), ...inward.flatMap((p) => stream(p, travel, { spacing: 0.2 })), ...stream(spout, travel, { spacing: 0.18 }), ...stream(pour, travel, { spacing: 0.18 })] }],
      readouts: [],
    };
  },
};
