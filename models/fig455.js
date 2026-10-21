// 第 455 種:舊式旋轉泵。下方的開口進水,上方的開口出水。中央部分連同它的閥門一起旋轉,閥門恰好貼合外側泵缸的內面。
// 泵缸下側畫出的凸出部分是一個擋板,閥門轉到那裡時被它闔上。
// 主動件是中央的轉鼓(順時針,依原圖的進出水箭頭)。
// 推斷:兩片閥門鉸在轉鼓上,平常張開、外緣貼著泵缸,把左側與上方的水從進水口推向出水口;
// 經過右下的擋板時被壓平貼著轉鼓,過了擋板再張開——閥門的角度由它與泵缸內壁、擋板的接觸算;
// 離開擋板後閥門被水往外推,加速擺開到外緣碰到泵缸為止(不是一下子張開)。
// 閥門拖在鉸點後面約 60°–110°:鉸點進到擋板底下時閥身還在斜面下、只壓下一部分(鉸點 −70° 時開度 0.61),
// 鉸點走到 −110°~−120°、閥身整個在擋板的平面段底下時才壓到最平(開度 0.23、閥身最遠點貼著擋板內面 0.99)。
// 擋板照原圖做成長斜面的楔形(原圖的頂面從泵缸壁約 −27° 斜到轉鼓約 −74°);偏離插圖:斜面的起點從 −27° 提前到 −8°,
// 斜面短的話閥根一碰到就整片瞬間被壓下,實物做不出來。
import { TAU, deg, clamp, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine, arcPoints } from "./shapes.js";

export const BORE = 1.6;
export const DRUM = 0.95;
export const VALVE = 0.85;
export const ABUT = [deg(-82), deg(-8)]; // 擋板所佔的角度
const INLET = deg(-115);
const OUTLET = deg(35);

/** 閥門鉸在轉鼓上角度 phi 處 → 張開的程度(0 闔上、1 貼著泵缸) */
export const opening = (phi) => clamp((CLOSED_REL - valveRelActual(phi)) / (CLOSED_REL - OPEN_REL), 0, 1);
// 張開的閥門相對鉸點方向的角度:外端剛好碰到泵缸(落後鉸點 delta)。只與幾何有關,先算好,
// 閥門的世界角才能寫成 phi 加一個固定的偏角——不能用 atan2 繞回的角度去跟 phi + 130° 內插,
// 轉鼓多轉幾圈後兩者差了好幾個 2π,閥門闔上、張開時會像螺旋槳一樣多轉好幾圈。
// (外緣的中心線離內壁半個閥門厚)
const OPEN_REL = (() => {
  const R = BORE - 0.03;
  const delta = Math.acos((R * R + DRUM * DRUM - VALVE * VALVE) / (2 * R * DRUM));
  const hinge = polar(DRUM, 0);
  const tip = polar(R, delta);
  return Math.atan2(tip[1] - hinge[1], tip[0] - hinge[0]);
})();
const CLOSED_REL = deg(130); // 闔上時往後收進轉鼓上的凹槽

// 擋板:迎著閥門的那一端(右上,ABUT[1])是一段長斜面(原圖的楔形本來就是長斜面,這裡把起點提前到 −8°)——
// 閥門拖在鉸點後面,斜面要從閥根往閥尖慢慢把它壓平(推斷:斜面若短,閥根一碰到就整片瞬間被壓下);離開的那一端(ABUT[0])是短斜面。
export const RAMP_IN = deg(50);
const RAMP_OUT = deg(6);
const HALF = 0.03; // 閥門厚度的一半
const INNER = DRUM + 0.07; // 擋板內面離軸心:讓出閥門鉸銷的空隙
/** 角度 a 處擋板內面(或泵缸內壁)離軸心多遠;擋板兩端是斜面 */
function surfaceAt(a0) {
  const a = Math.atan2(Math.sin(a0), Math.cos(a0));
  if (a <= ABUT[0] || a >= ABUT[1]) return BORE;
  const t = Math.min((a - ABUT[0]) / RAMP_OUT, (ABUT[1] - a) / RAMP_IN, 1);
  return BORE + (INNER - BORE) * t;
}
/** 角度 a 處閥門的中心線最多能到多遠 */
export const reachAt = (a) => surfaceAt(a) - HALF;
// 擋板的外形就是這條內面(畫的與接觸算的是同一條輪廓)
const abutment = shape([
  ...arcPoints(BORE + 0.01, ABUT[0], ABUT[1]),
  ...Array.from({ length: 75 }, (_, i) => {
    const a = ABUT[1] - ((ABUT[1] - ABUT[0]) * i) / 74;
    return polar(surfaceAt(a), a).slice(0, 2);
  }),
]);
const SAMPLES = Array.from({ length: 10 }, (_, i) => 0.05 + ((VALVE - 0.05) * i) / 9);

/**
 * 閥門相對鉸點方向的角度(鉸在轉鼓上角度 phi 處),由接觸算:閥門被水往外推開,張到外緣碰到泵缸內壁為止;
 * 轉到擋板時,閥門上任何一點都不能超出擋板的內面,於是被擋板的斜面推回去、貼著轉鼓通過,過了擋板再張開。
 * 從張開往闔上找第一個不超出的角度。
 */
export function valveRel(phi) {
  const [hx, hy] = polar(DRUM, phi);
  const fits = (rel) => {
    const [dx, dy] = [Math.cos(phi + rel), Math.sin(phi + rel)];
    return SAMPLES.every((s) => Math.hypot(hx + s * dx, hy + s * dy) <= reachAt(Math.atan2(hy + s * dy, hx + s * dx)));
  };
  // 越闔上,閥門上每一點離軸心越近:可行的角度是一段連續的區間,二分找它的起點
  let [lo, hi] = [OPEN_REL - deg(5), CLOSED_REL];
  if (fits(lo)) return lo;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}
const RELEASE = deg(40); // 閥門離開擋板後,轉鼓再轉這麼多,閥門才從闔上擺到張開

/**
 * 閥門實際的相對角:離開擋板後,閥門被水往外推,加速擺開、外緣碰到泵缸內壁為止,不會一下子張開。
 * 轉鼓順時針轉(phi 遞減),所以「稍早」是 phi + d;閥門最快只能照「從稍早的位置加速擺開」那樣張開。
 */
export function valveRelActual(phi) {
  let rel = contactRel(phi);
  for (let k = 1; k <= 20; k++) {
    const d = (RELEASE * k) / 20;
    rel = Math.max(rel, contactRel(phi + d) - (CLOSED_REL - OPEN_REL) * (d / RELEASE) ** 2);
  }
  return rel;
}
// valveRel 只與幾何有關:第一次用到時算好一圈的表(每 1°),之後內插
let table = null;
function contactRel(phi) {
  const N = 360;
  table ??= Array.from({ length: N }, (_, i) => valveRel((i * TAU) / N));
  const u = ((((phi / TAU) * N) % N) + N) % N;
  const i = Math.floor(u);
  return table[i] + (table[(i + 1) % N] - table[i]) * (u - i);
}
/** 閥門的世界角 */
export const valveAngle = (phi) => phi + valveRelActual(phi);

// 轉鼓外緣收閥門的凹槽:閥門繞鉸點從張開擺到最平(整圈實際到得了的最大相對角)掃過的範圍,
// 在轉鼓的局部座標(鉸點在 0°)每 0.5° 取閥門離軸心最近的一點,凹槽底再往內留 GAP。
// 凹槽橫跨閥門的整個寬度(閥門要貼滿泵缸才推得動水),只挖環的外側:環從內孔 RING_IN 到凹槽底仍是完整的一圈。
// 鉸銷那一圈不算:那是鉸接處的軸眼,銷座開在轉鼓上。
const GAP = 0.02;
const PIN = 0.05; // 鉸銷半徑
const RING_IN = DRUM - 0.25; // 轉鼓環的內孔(加厚到凹槽底下還留一圈完整的環)
const STEP = deg(0.5);
const rim = (a) => DRUM / Math.cos(((((a + Math.PI / 8) % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4)) - Math.PI / 8); // 八角形外緣(邊的中點在 0°、45°…)
const groove = (() => {
  const most = Math.max(...Array.from({ length: 720 }, (_, i) => valveRelActual((i * TAU) / 720)));
  const floor = new Map(); // 角度格 → 閥門離軸心最近的距離
  for (let i = 0; i <= 240; i++) {
    const rel = OPEN_REL + ((most - OPEN_REL) * i) / 240;
    const [c, s] = [Math.cos(rel), Math.sin(rel)];
    for (let j = 0; j <= 170; j++) {
      const u = (VALVE * j) / 170;
      for (const w of [-HALF, 0, HALF]) {
        if (Math.hypot(u, w) <= PIN) continue;
        const [x, y] = [DRUM + u * c - w * s, u * s + w * c];
        const k = Math.round(Math.atan2(y, x) / STEP);
        floor.set(k, Math.min(floor.get(k) ?? Infinity, Math.hypot(x, y)));
      }
    }
  }
  // 比外緣還深的那些角度格才是凹槽;每格的凹槽底取那格和兩旁格的最小值(格與格之間的直邊不切到閥門)
  const ks = [...floor.keys()].sort((a, b) => a - b);
  const depth = (k) => Math.min(...[k - 1, k, k + 1].map((j) => floor.get(j) ?? Infinity)) - GAP;
  return ks.filter((k) => depth(k) < rim(k * STEP)).map((k) => [k * STEP, depth(k)]);
})();
/** 轉鼓外緣:八角形,在兩個鉸點(局部 0°、180°)後方挖出收閥門的凹槽;凹槽兩端用外緣上的一點收口 */
const drumOutline = [0, Math.PI].flatMap((base) => {
  const [g0, g1] = [groove[0][0] - STEP / 2, groove[groove.length - 1][0] + STEP / 2];
  const corners = Array.from({ length: 8 }, (_, v) => Math.PI / 8 + (v * Math.PI) / 4)
    .flatMap((a) => [a, a + TAU])
    .filter((a) => a > base + g1 && a < base + Math.PI + g0)
    .sort((a, b) => a - b);
  return [g0, ...groove, g1, ...corners.map((a) => a - base)].map((q) =>
    Array.isArray(q) ? polar(q[1], q[0] + base).slice(0, 2) : polar(rim(q + base), q + base).slice(0, 2),
  );
});

export default {
  figure: 455,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.15), [circle(BORE).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.15)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "plate", shape: abutment, thickness: 0.6 },
        // 下方的進水管、右上的出水管
        { kind: "plate", shape: shape(thickLine([polar(BORE, INLET - deg(8)), [polar(BORE, INLET - deg(8))[0], -2.6]], 0.08)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([polar(BORE, INLET + deg(12)), [polar(BORE, INLET + deg(12))[0], -2.6]], 0.08)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([polar(BORE, OUTLET + deg(9)), polar(BORE + 0.9, OUTLET + deg(9))], 0.08)), thickness: 0.5 },
        { kind: "plate", shape: shape(thickLine([polar(BORE, OUTLET - deg(9)), polar(BORE + 0.9, OUTLET - deg(9))], 0.08)), thickness: 0.5 },
      ],
    },
    {
      id: "drum",
      kind: "group",
      spin: DRUM - 0.15,
      pieces: [
        { kind: "plate", shape: shape(drumOutline, [circle(RING_IN).reverse()]), thickness: 0.56, mark: [0, DRUM - 0.06], markSize: 0.05 },
        { kind: "plate", shape: shape(rect(2 * DRUM - 0.2, 0.08)), thickness: 0.3 },
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [0, 0, -0.2] },
      ],
    },
    ...[0, 1].map((k) => ({ id: `valve${k}`, kind: "plate", shape: shape(rect(VALVE, 0.06, VALVE / 2, 0)), thickness: 0.54, arrow: false, pieces: [{ kind: "cylinder", radius: 0.05, length: 0.6 }] })),
  ],
  // 動力重演:閥門鉸在轉鼓上,水壓以彈簧代替(把閥門往張開的方向推);擋板的斜面把它壓下、離開後再張開
  replay: {
    free: { valve0: { on: "drum", spring: -1, gravity: false }, valve1: { on: "drum", spring: -1, gravity: false } },
    expect: [
      { at: deg(-55), part: "valve1", label: "閥尖進到擋板的長斜面底下,閥門被壓下一部分(開度約 0.77)" },
      { at: deg(-115), part: "valve1", label: "閥身整個在擋板的平面段底下,被壓到最平(開度約 0.23)", quote: "當閥門抵達該點時會將閥門關閉" },
      { at: deg(-160), part: "valve1", label: "過了擋板,閥門再張開、外緣貼著泵缸" },
      { at: deg(-295), part: "valve0", label: "另一片閥門的閥身在擋板底下時同樣被壓到最平" },
      { part: "valve0", label: "轉完一圈,兩片閥門都張開" },
    ],
  },
  driver: { part: "drum", type: "rotation", speed: -0.5, initial: deg(10) },
  targets: ["valve0", "valve1"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const parts = { drum: { angle: theta } };
    for (const k of [0, 1]) {
      const phi = theta + Math.PI + k * Math.PI; // 兩片閥門鉸在轉鼓的左右兩端
      parts[`valve${k}`] = { position: polar(DRUM, phi, 0), angle: valveAngle(phi) };
    }
    const travel = -theta * 1.2;
    // 水:從下方的進水口進來,沿左側與上方被閥門推到右上的出水口
    const mid = (BORE + DRUM) / 2;
    const path = [[polar(BORE, INLET)[0] + 0.05, -2.5, 0.2], polar(mid, INLET, 0.2), ...arcPoints(mid, INLET, OUTLET - TAU).map(([x, y]) => [x, y, 0.2]), polar(BORE + 0.85, OUTLET, 0.2)];
    return {
      parts,
      flows: [{ fluid: "water", points: stream(path, travel, { spacing: 0.2 }) }],
      readouts: [],
    };
  },
};
