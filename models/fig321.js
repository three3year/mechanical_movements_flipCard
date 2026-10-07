// 第 321 種:哈里森(Harrison)的維持動力。捲繩筒 B 上的小棘輪由制動爪 R 扣在較大的棘輪上,較大的棘輪再經
// 彈簧 S、S' 與主輪 G 相連。時鐘走時,重物經捲繩筒、棘輪與彈簧推動主輪 G;上發條時重物的拉力被移除,
// 裝在框架上的制動爪 T 擋住較大的棘輪不讓它被彈簧拉回,於是在上發條的這段時間裡,彈簧 S、S' 繼續推動主輪,
// 時鐘照走。上完之後重物再度拉緊彈簧,較大的棘輪追回原來的位置。
// 主動件是虛擬的「進程」:每一輪前段時鐘照走,中段上發條(捲繩筒倒轉、重物上升),後段重物重新拉緊彈簧。
// 兩個制動爪都由接觸算:T 鉸在框架的樁上、靠自重搭在較大的棘輪上;R 鉸在較大棘輪的輻條上、被彈簧(沒畫)壓向
// 捲繩筒的小棘輪。棘輪轉過時爪被齒背抬起、過了齒尖加速落回(ratchets.pawlTrack)。照走到上發條的那一刻,
// T 正好落在齒根、頂住齒的直面;上發條時多捲 0.4 個齒,R 落進齒根後放手,重物把筒拉回來靠上 R。
// 推斷:各段所佔的進程、彈簧的變形量;小棘輪 16 齒(一次上發條轉 4 個齒);彈簧掛在兩輪耳片的銷上;
// 心軸與 T 的樁裝在後面的夾板條上。轉向照原圖:T 的樁在右上方、爪往左伸,擋住較大棘輪順時針回落,
// 所以整組逆時針轉、繩從捲繩筒左側垂下(原文沒寫轉向)。
import { TAU, deg, smooth, clamp } from "./kit.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";
import { pawlRest, pawlTrack } from "./ratchets.js";
import { plateBar } from "./supports.js";

const RATE = TAU / 4; // 每一輪主輪轉過的角度
const P = { run: 0.7, wound: 0.85 }; // 0–0.7 照走、0.7–0.85 上發條、0.85–1 重新拉緊
const SPRING = deg(14); // 平時彈簧被拉開的角度(較大的棘輪領先主輪)
const DRUM = 0.45;
const BIG = { teeth: 24, outer: 1.55, inner: 1.38, dir: 1 }; // 只能逆時針轉(T 擋住順時針)
const SMALL = { teeth: 16, outer: 0.72, inner: 0.58, dir: -1 }; // 相對較大的棘輪只能順時針轉(上發條),逆時針被 R 擋住
const T_PIVOT = [2.3, 2.15, 0];
const T_LEN = 3.05; // 從右上方的樁伸到較大棘輪的左上方
const T_HOOK = 0.25; // 爪尖比長臂低多少
const SPOKE = deg(-140); // 較大棘輪的輻條方向
const R_PIVOT = [1.1 * Math.cos(SPOKE), 1.1 * Math.sin(SPOKE)]; // R 的樞軸(較大棘輪的局部座標,在輻條上)
const R_LEN = 0.53;
const Z_FRAME = -0.5;
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// 上發條的行程(0→1):多捲 0.4 個小棘齒,R 落進齒根後放手,重物把筒拉回來靠上 R
const OVER = (0.4 * TAU) / SMALL.teeth / RATE;
const winding = (x) => (x <= 0 ? 0 : x < 0.85 ? (1 + OVER) * smooth(x / 0.85) : 1 + OVER * (1 - smooth((Math.min(x, 1) - 0.85) / 0.15)));

/** 進程 p → 主輪 G、較大的棘輪、捲繩筒的轉角(逆時針為正,不含齒的相位),與重物的高度 */
export function harrison(p) {
  const k = Math.floor(p);
  const f = p - k;
  const g = RATE * p; // 主輪一直轉
  // 較大的棘輪:照走時領先主輪 SPRING;上發條時被 T 擋住不動;之後由重物拉緊彈簧、追回原來的位置
  const held = RATE * (k + P.run) + SPRING;
  let big;
  if (f < P.run) big = g + SPRING;
  else if (f < P.wound) big = held;
  else big = held + (g + SPRING - held) * smooth((f - P.wound) / (1 - P.wound));
  // 捲繩筒:照走時跟著較大的棘輪;上發條時倒轉(順時針),把一輪走掉的繩捲回來
  const wind = -RATE * (k + winding(clamp((f - P.run) / (P.wound - P.run), 0, 1)));
  const drum = big + wind;
  const spring = big - g; // 彈簧拉開的角度(越大越緊)
  return { g, big, drum, wind, spring, weight: -1.8 - DRUM * (drum - SPRING) };
}
export const geometry = { SPRING, RATE, P };

// T:較大棘輪轉到 a 時能落到的角度;R:小棘輪相對較大棘輪轉到 r 時能落到的角度(較大棘輪的局部座標)
const restT = (a) => pawlRest({ pivot: T_PIVOT, length: T_LEN, from: deg(185), into: 1, sweep: 0.5 }, { center: [0, 0], angle: a, ...BIG });
const restR = (r) => pawlRest({ pivot: R_PIVOT, length: R_LEN, from: deg(85), into: -1, sweep: 1.0 }, { center: [0, 0], angle: r, ...SMALL });
// 齒的相位:照走到上發條的那一刻 T 落在齒根;照走時 R 落在小棘輪的齒根(重物經它推著較大的棘輪)
const seat = (rest, pitch) => {
  let best = 0;
  let deepest = Infinity;
  for (let i = 0; i < 240; i++) {
    const phase = (pitch * i) / 240;
    const [x, y] = rest(phase).tip;
    const r = Math.hypot(x, y);
    if (r < deepest - 1e-9) [deepest, best] = [r, phase];
  }
  return best;
};
const PHASE_T = seat((a) => restT(harrison(P.run).big + a), TAU / BIG.teeth);
const PHASE_R = seat(restR, TAU / SMALL.teeth);
const bigAngle = (p) => harrison(p).big + PHASE_T;
const relAngle = (p) => harrison(p).wind + PHASE_R;
// 兩個爪逐步跟著走(從上發條開始的那一刻算一整輪)
const ACC = 8000;
const trackT = pawlTrack({ rest: (x) => restT(bigAngle(x)).angle, x0: P.run, x1: P.run + 1, acc: ACC, samples: 3000 });
const trackR = pawlTrack({ rest: (x) => restR(relAngle(x)).angle, x0: P.run, x1: P.run + 1, into: -1, acc: ACC, samples: 3000 });
const inCycle = (p) => {
  const f = p - Math.floor(p);
  return f < P.run ? f + 1 : f;
};
/** 進程 p → 制動爪 T(繞框架上的樁)、R(繞較大棘輪上的樞軸,較大棘輪的局部座標)爪尖的方位 */
export const clicks = (p) => ({ T: trackT(inCycle(p)), R: trackR(inCycle(p)) });
/** 進程 p → 兩個爪最深能落到的角度(爪尖碰到棘輪面;T 不會比它大、R 不會比它小) */
export const clickLimits = (p) => ({ T: restT(bigAngle(p)).angle, R: restR(relAngle(p)).angle });
export const phases = { bigAngle, relAngle };

// 彈簧掛在兩輪的銷上:較大棘輪內側耳片的銷(半徑 1.0)與主輪內側耳片的銷(半徑 1.45),在兩輪之間那一層
const PIN = 0.02;
const Z_SPRING = -0.1;
const SPRINGS = [deg(70), deg(-20)];
const G_LEAD = deg(-28); // 主輪的銷落後較大棘輪的銷(較大的棘輪逆時針領先)

const gearRing = { kind: "gear", teeth: 48, radius: 2.05, width: 0.12 };

export default {
  figure: 321,
  parts: [
    {
      id: "arbor",
      kind: "cylinder",
      radius: 0.06,
      length: 0.9, // 各輪共用的固定心軸(推斷),後端裝在夾板條上
    },
    {
      id: "wheelG",
      kind: "group",
      spin: 2.15,
      label: "G",
      labelOffset: [1.6, -1.2, 0.3],
      pieces: [
        { ...gearRing, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape(circle(1.85), [circle(1.65).reverse()]), thickness: 0.1, at: [0, 0, -0.2] },
        { kind: "box", size: [3.4, 0.1, 0.06], at: [0, 0, -0.2], angle: deg(-30) },
        // 掛彈簧的耳片與銷
        ...SPRINGS.flatMap((a) => {
          const c = rot([1.55, 0], a + G_LEAD);
          const pin = rot([1.45, 0], a + G_LEAD);
          return [
            { kind: "box", size: [0.3, 0.1, 0.1], at: [c[0], c[1], -0.2], angle: a + G_LEAD },
            { kind: "cylinder", radius: PIN, length: 0.09, at: [pin[0], pin[1], -0.105] },
          ];
        }),
      ],
    },
    {
      id: "bigRatchet",
      kind: "group",
      spin: 1.55,
      pieces: [
        { kind: "plate", shape: { ...ratchetShape(BIG), holes: [circle(1.25).reverse()] }, thickness: 0.1 },
        { kind: "box", size: [2.6, 0.1, 0.06], angle: SPOKE },
        { kind: "cylinder", radius: 0.025, length: 0.12, at: [R_PIVOT[0], R_PIVOT[1], 0.09] }, // R 的樞軸銷
        // 掛彈簧的耳片與銷
        ...SPRINGS.flatMap((a) => {
          const c = rot([1.12, 0], a);
          const pin = rot([1.0, 0], a);
          return [
            { kind: "box", size: [0.3, 0.1, 0.1], at: [c[0], c[1], 0], angle: a },
            { kind: "cylinder", radius: PIN, length: 0.11, at: [pin[0], pin[1], -0.105] },
          ];
        }),
      ],
    },
    {
      id: "clickR",
      kind: "group",
      arrow: false,
      label: "R",
      labelOffset: [-0.25, -0.2, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [R_LEN - 0.1, 0]], 0.07), [circle(0.03).reverse()]), thickness: 0.06, at: [0, 0, 0.12] },
        { kind: "plate", shape: { outline: [[R_LEN - 0.12, 0.035], [R_LEN - 0.12, -0.035], [R_LEN, 0]], holes: [] }, thickness: 0.06, at: [0, 0, 0.12] }, // 爪尖
      ],
    },
    {
      id: "drumB",
      kind: "group",
      spin: SMALL.outer,
      label: "B",
      labelOffset: [0, 0.3, 0.4],
      pieces: [
        { kind: "plate", shape: ratchetShape({ ...SMALL, bore: 0.08 }), thickness: 0.12, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: DRUM, length: 0.4, at: [0, 0, 0.35] },
        { kind: "box", size: [0.18, 0.18, 0.06], at: [0, 0, 0.58] },
      ],
    },
    { id: "springS", kind: "spring", coils: 6, radius: 0.04, wire: 0.012, label: "S", labelOffset: [0, 0.3, 0.2] },
    { id: "springS2", kind: "spring", coils: 6, radius: 0.04, wire: 0.012, label: "S'", labelOffset: [-0.3, 0, 0.2] },
    {
      id: "clickT",
      kind: "group",
      center: T_PIVOT,
      arrow: false,
      label: "T",
      labelOffset: [0.3, 0.15, 0.2],
      pieces: [
        // 長臂從齒的上方伸過去,末端彎下來成爪尖(局部 −y 朝上)
        { kind: "plate", shape: shape(thickLine([[0, 0], [T_LEN - 0.4, -T_HOOK]], 0.08), [circle(0.085).reverse()]), thickness: 0.06 },
        { kind: "plate", shape: { outline: [[T_LEN - 0.42, -T_HOOK + 0.04], [T_LEN - 0.38, -T_HOOK - 0.04], [T_LEN, 0]], holes: [] }, thickness: 0.06 }, // 爪尖
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [[0, 0], [T_PIVOT[0], T_PIVOT[1]]], z: Z_FRAME, width: 0.24, boss: 0.16 }),
        { kind: "cylinder", radius: 0.08, length: 0.55, at: [T_PIVOT[0], T_PIVOT[1], -0.2] }, // T 的樁
      ],
    },
    { id: "rope", kind: "rope" },
    { id: "weight", kind: "box", size: [0.9, 0.6, 0.5] },
  ],
  // 動力重演:T 鉸在樁上靠自重搭在較大的棘輪上;R 鉸在較大棘輪上、被彈簧壓向小棘輪;各輪照模型轉
  replay: {
    from: P.run - 0.05,
    to: 1 + P.run,
    seconds: 30,
    free: {
      clickT: { pivot: T_PIVOT, gravity: true },
      clickR: { pivot: [...rot(R_PIVOT, bigAngle(P.run - 0.05)), 0], on: "bigRatchet", spring: -1, gravity: false },
    },
    ignore: [["clickT", "frame"]],
    expect: [
      { at: P.wound, part: "clickT", label: "上發條:T 擋住較大的棘輪,不讓它被彈簧拉回", quote: "制動爪 T(其樞軸設置於框架中)會阻止較大的棘輪因彈簧 S、S' 的作用而回落" },
      { at: P.wound, part: "clickR", label: "上發條:捲繩筒倒轉,小棘輪從 R 底下轉過" },
      { at: 1 + P.run, part: "clickT", label: "照走一段後:T 被齒背抬起又落下,回到齒根" },
    ],
  },
  powered: ["weight"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.08 },
  target: "wheelG", // 上發條時照走的主輪
  view: { direction: [0.03, 0.04, 1] },
  pose(p) {
    const h = harrison(p);
    const big = bigAngle(p);
    const c = clicks(p);
    const pinBig = (a) => rot([1.0, 0], a + big);
    const pinG = (a) => rot([1.45, 0], a + G_LEAD + h.g);
    // 彈簧的兩端停在銷的表面上(端圈勾著銷)
    const ends = (a) => {
      const [x0, y0] = pinBig(a);
      const [x1, y1] = pinG(a);
      const d = Math.hypot(x1 - x0, y1 - y0);
      const u = [(x1 - x0) / d, (y1 - y0) / d];
      return { from: [x0 + u[0] * PIN, y0 + u[1] * PIN, Z_SPRING], to: [x1 - u[0] * PIN, y1 - u[1] * PIN, Z_SPRING] };
    };
    const rPivot = rot(R_PIVOT, big);
    const ropeX = -DRUM; // 繩從捲繩筒左側垂下:筒逆時針轉時重物下降
    return {
      parts: {
        wheelG: { angle: h.g },
        bigRatchet: { angle: big },
        drumB: { angle: big + relAngle(p) },
        springS: ends(SPRINGS[0]),
        springS2: ends(SPRINGS[1]),
        clickT: { angle: c.T },
        clickR: { position: [rPivot[0], rPivot[1], 0], angle: c.R + big },
        weight: { position: [ropeX, h.weight - 0.3, 0.35] },
      },
      paths: { rope: { points: [[ropeX, 0, 0.35], [ropeX, h.weight, 0.35]], closed: false, phase: -h.weight } },
      readouts: [],
    };
  },
};
