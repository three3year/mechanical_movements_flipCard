// 活塞泵(第 448–454、465、466 種)共用:手柄槓桿與連桿、瓣閥、汽缸(泵筒)的剖面、隨活塞升降的水。
// 閥門開合由活塞的走向決定,水流以流體示意的點表示(ADR-0002)。
// 剖面上管子接進泵筒、閥室、水道的地方都真的開口(barrel 的 openings、pipeWalls 的 breaks;2026-10-20 決定),
// 接進來的管壁一直畫到壁的內面,和壁連成一件。
import { Y, swingPhase } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, rect, circle, thickLine } from "./shapes.js";

/**
 * 手柄槓桿:繞 pivot 轉 theta(0 是水平;正為逆時針),經長 link 的連桿接到泵筒軸線 x 上的活塞桿頂。
 * side = -1(預設,第 448、466 種):短臂端 E 在支點左邊 short,手柄往下壓(theta 變小)時短臂往上,把活塞提起。
 * side = +1(第 451 種):支點在活塞桿左邊,E 在支點右邊 short,手柄往下壓時 E 往下,把活塞壓下去。
 */
export function lever({ pivot, short, link, x, side = -1 }) {
  return (theta) => {
    const E = [pivot[0] + side * short * Math.cos(theta), pivot[1] + side * short * Math.sin(theta), 0];
    const dy = Math.sqrt(link * link - (E[0] - x) ** 2);
    return { E, top: [x, E[1] - dy, 0] };
  };
}

/**
 * 吊環(或吊桿、搖桿)接手柄:手柄一端的銷 F 掛在繞固定銷 anchor 擺的吊環(長 length)的另一端,離 F short 的銷 P
 * (活塞桿頂)走在直線 line(origin + s·dir,dir 是單位向量)上。手柄角 theta → 吊環銷 F、直線上的銷 P 與它的里程 s;
 * 兩個解取 P 在直線上較遠(s 較大、活塞在上面)的那一個。第 450 種的吊環、第 466 種的吊桿、第 467 種的搖桿都是這一組。
 */
export const hangerLever = ({ anchor, length, short, line }) => (theta) => {
  const u = [Math.cos(theta), Math.sin(theta)];
  const { origin, dir } = line;
  // P = origin + s·dir,F = P − short·u,|F − anchor| = length:解 s
  const C = [origin[0] - short * u[0] - anchor[0], origin[1] - short * u[1] - anchor[1]];
  const b = C[0] * dir[0] + C[1] * dir[1];
  const c = C[0] ** 2 + C[1] ** 2 - length ** 2;
  const s = -b + Math.sqrt(Math.max(0, b * b - c));
  const P = [origin[0] + s * dir[0], origin[1] + s * dir[1]];
  return { s, P, F: [P[0] - short * u[0], P[1] - short * u[1]] };
};

// 手柄的彎折處與握端(局部座標;把手長 long):支點在左(side = +1)的手柄直段長一點、彎得緩一點,
// 壓到底時才不碰到泵筒的頂角與活塞桿頂的銷
const handleBend = (long, side) => (side < 0 ? [long * 0.45, -0.3] : [long * 0.6, -0.1]);
const handleGrip = (long, side) => (side < 0 ? [long, -1.0] : [long, -0.9]);

/**
 * 手柄槓桿的零件(局部:支點在原點,把手往右下彎)。side = -1:短臂往左、銷孔在 (-short, 0);
 * side = +1:銷孔在支點右邊 (short, 0),把手從那裡再往右伸。兩端都比銷孔多留 0.1,孔才整個在外形裡。
 * bend、grip:把手彎折處與握端(局部座標),預設見 handleBend、handleGrip。
 */
export const leverPart = (id, { short, long, side = -1, bend = handleBend(long, side), grip = handleGrip(long, side) }) => ({
  id,
  kind: "plate",
  shape: shape(
    thickLine(side < 0 ? [[-short - 0.1, 0], [0, 0], bend, grip] : [[-0.1, 0], [0, 0], [short, 0], bend, grip], 0.1),
    [circle(0.04).reverse(), circle(0.04, side * short, 0).reverse()],
  ),
  thickness: 0.08,
  arrow: false,
  pieces: [{ kind: "sphere", radius: 0.11, at: [grip[0], grip[1], 0] }],
});

/** 往復的主動量 v → 擺動位置、是否往 to 那一端走、這一程走了多少(f:0–1)、第幾程(n,從 0 起) */
export const stroke = (v, from, to) => {
  const { at, forward, f } = swingPhase(v, from, to);
  return { at, forward, f, n: Math.floor(v / (Math.abs(to - from) || 1)) };
};

/** 到目前為止壓了幾程(往 to 走的第一程、第三程…是壓;正在壓的這一程算走了多少):液壓機、千斤頂每壓一程送一次水 */
export const strokeCount = ({ n, forward, f }) => Math.floor((n + 1) / 2) + (forward ? f : 0);

/** 活塞桿頂的銷(活塞零件的附件;活塞沿 y,局部 z 是世界的 y):在局部高度 z,往後伸 0.22、穿過手柄的銷孔 */
export const rodPin = (z) => ({ kind: "cylinder", radius: 0.03, length: 0.22, axis: [0, 1, 0], at: [0, 0.11, z] });

const VALVE_RISE = 0.2; // 一程的前 20%:閥瓣被水頂到開足
const VALVE_FALL = 0.2; // 回程的前 20%:閥瓣落回閥座

/**
 * 瓣閥開的程度(0 關、1 開足)。open:這一程水把它推開;phase:stroke() 的結果。
 * 被推開的閥由快到慢頂到開足;上一程開著、這一程要關的閥靠自重與倒流加速落回閥座、撞停(不瞬間闔上)。
 * 第一程之前沒有上一程,要關的閥一開始就關著。
 */
export function valveOpening(open, { f, n }) {
  if (open) {
    const t = Math.min(1, f / VALVE_RISE);
    return 1 - (1 - t) ** 2;
  }
  if (n === 0) return 0;
  const t = Math.min(1, f / VALVE_FALL);
  return 1 - t * t;
}

/** 瓣閥:鉸在局部原點,沿 +x 伸出 length;姿勢以 angle 開合 */
export const flap = (id, length, extra = {}) => ({ id, kind: "plate", shape: shape(rect(length, 0.05, length / 2, 0)), thickness: 0.3, arrow: false, ...extra });

/** 剖面多邊形 profile([[r, h], …])夾在高度 h0..h1 之間的那一段(對兩條水平線各裁一次) */
export function clipBand(profile, h0, h1) {
  const clip = (poly, keep) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = keep(a);
      const db = keep(b);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  };
  const out = clip(clip(profile, ([, h]) => h - h0), ([, h]) => h1 - h);
  // 裁切線正好過頂點時會多出重複的點,去掉
  return out.filter((p, i) => Math.hypot(p[0] - out[(i + 1) % out.length][0], p[1] - out[(i + 1) % out.length][1]) > 1e-9);
}

/**
 * 開了口的旋轉體(繞 y、剖開前半):軸線在 x、底在 y0,剖面 profile([[r, h], …],h 從 0 起算)。
 * openings:[{ y0, y1, side, depth }]——世界高度 y0..y1 之間、side 那一側(-1 左、+1 右)的壁拿掉,
 * 口的寬度(往後的深度)是接進來的管的深度 depth(預設 0.4),再留一點餘裕;開口以外的弧照畫。
 * 開口給 angle(後半上的角:0 是 +x、π 是 −x)與 width 時,是壁上四周有壁的孔:拿掉以 angle 為中心、內壁上寬 width 的弧。
 * 回傳一組 lathe 附件(沒開口的高度段是整個後半),可以展進 group 的 pieces。
 */
export function openedLathe({ x, y0, profile, openings = [] }) {
  const hs = profile.map(([, h]) => h);
  const bottom = Math.min(...hs);
  const top = Math.max(...hs);
  const levels = new Set([bottom, top]);
  for (const o of openings) for (const h of [o.y0 - y0, o.y1 - y0]) if (h > bottom && h < top) levels.add(h);
  const sorted = [...levels].sort((a, b) => a - b);
  const pieces = [];
  for (let i = 0; i + 1 < sorted.length; i++) {
    const band = clipBand(profile, sorted[i], sorted[i + 1]);
    if (band.length < 3) continue;
    const mid = y0 + (sorted[i] + sorted[i + 1]) / 2;
    const inner = Math.min(...band.map(([r]) => r));
    // 後半從 +x(角 0)經背面到 -x(角 π);開口那一側的弧從邊上截掉管的深度對應的角,孔則從弧中間挖掉一段
    let arcs = [[0, Math.PI]];
    for (const o of openings) {
      if (mid <= o.y0 || mid >= o.y1) continue;
      let gap;
      if (o.angle !== undefined) {
        const half = Math.atan2(o.width / 2, inner);
        gap = [o.angle - half, o.angle + half];
      } else {
        const half = Math.atan2((o.depth ?? 0.4) / 2, inner) + 0.03;
        gap = o.side > 0 ? [-Infinity, half] : [Math.PI - half, Infinity];
      }
      arcs = arcs.flatMap(([s, e]) => [[s, Math.min(e, gap[0])], [Math.max(s, gap[1]), e]]).filter(([s, e]) => e - s >= 1e-6);
    }
    for (const [s, e] of arcs) pieces.push({ kind: "lathe", axis: Y, profile: band, at: [x, y0, 0], cut: s, sweep: e - s });
  }
  return pieces;
}

/**
 * 泵筒(繞 y 的管,剖開前半):內半徑 r,從 y0 到 y1,壁厚 wall。
 * openings(見 openedLathe)在接管處開口,這時零件是一組 lathe 的群組;pieces 是裝在泵筒上的附件(耳、支柱)。
 */
export const barrel = (id, { x = 0, r, y0, y1, wall = 0.07, extra = {}, openings, pieces = [] }) => {
  const profile = [[r, 0], [r + wall, 0], [r + wall, y1 - y0], [r, y1 - y0]];
  if (!openings?.length && !pieces.length) return { id, kind: "lathe", axis: Y, center: [x, y0, 0], profile, ...backHalf(Y), ...extra };
  return { id, kind: "group", pieces: [...openedLathe({ x, y0, profile, openings: openings ?? [] }), ...pieces], ...extra };
};

/**
 * 圓頂的閥室(第 450、454 種出水閥的閥室;繞 y、剖開前半):座在 (x, y) 的閥座環(孔半徑 seat、厚 wall)上,
 * 內半徑 r 的直壁到 shoulder 高,再收到半徑 neck 的頸、頸口在 h 高(出水管從頸口接出)。閥瓣鉸在閥座環上、在閥室裡張開。
 */
export const valveDome = (x, y, { seat, r = 0.32, wall = 0.06, shoulder = 0.3, neck = 0.07, h = 0.55 } = {}) =>
  openedLathe({
    x,
    y0: y,
    profile: [[seat, 0], [r + wall, 0], [r + wall, shoulder], [neck + wall, h], [neck + wall, h + 0.05], [neck, h + 0.05], [neck, h - 0.04], [r, shoulder - 0.02], [r, wall], [seat, wall]],
  });

/**
 * 一段管的剖面(兩道壁):沿折線 pts,兩道壁的中心線各離折線 w/2、壁厚 t(內寬 w - t、外寬 w + t);轉角處斜接。
 * breaks:[{ at, width, side }]——side 那一道壁(+1 是前進方向的左側,-1 右側,0 兩側)在離 at 最近處斷開 width
 * (接進來的管從這裡穿過,管壁畫到這道壁的內面,和它連成一件)。caps:{ start, end } 把那一端封住。
 * back:補上管的背面(剖開的管留下後半:兩道壁加背面的板,貼在壁的後面),斷開的壁經背面仍連成一件。
 */
export const pipeWalls = (pts, w, t = 0.06, depth = 0.4, { breaks = [], caps = {}, back = false } = {}) => {
  const normal = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  const off = (s) =>
    pts.map(([x, y], i) => {
      const n0 = i > 0 ? normal(pts[i - 1], pts[i]) : normal(pts[i], pts[i + 1]);
      const n1 = i < pts.length - 1 ? normal(pts[i], pts[i + 1]) : n0;
      const n = [n0[0] + n1[0], n0[1] + n1[1]];
      const l = Math.hypot(...n) || 1;
      const k = (s * w) / 2 / ((n[0] / l) * n0[0] + (n[1] / l) * n0[1]);
      return [x + (n[0] / l) * k, y + (n[1] / l) * k];
    });
  const plate = (line) => ({ kind: "plate", shape: shape(thickLine(line, t)), thickness: depth });
  const pieces = [];
  for (const s of [1, -1]) {
    const line = off(s);
    const gaps = breaks.filter((b) => !b.side || b.side === s).map((b) => gapOn(line, b.at, b.width));
    for (const piece of splitPolyline(line, gaps)) pieces.push(plate(piece));
  }
  const cap = (i, j) => {
    const [p, q] = [pts[i], pts[j]];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const d = [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
    const n = [-d[1], d[0]];
    const c = [p[0] + (d[0] * t) / 2, p[1] + (d[1] * t) / 2];
    const e = w / 2 + t;
    return plate([[c[0] + n[0] * e, c[1] + n[1] * e], [c[0] - n[0] * e, c[1] - n[1] * e]]);
  };
  if (back) pieces.push({ kind: "plate", shape: shape(thickLine(pts, w + t)), thickness: t, at: [0, 0, -depth / 2 - t / 2] });
  if (caps.start) pieces.push(cap(0, 1));
  if (caps.end) pieces.push(cap(pts.length - 1, pts.length - 2));
  return pieces;
};

// 折線上離 at 最近的點的里程,前後各 width/2 的區間
// (和 flow.js 的 distanceToPath、pointAlong 不能互換:這裡要的是最近點的「里程」,splitPolyline 還要知道它落在第幾段才能切折線)
function gapOn(line, at, width) {
  let best = { d: Infinity, s: 0 };
  let s = 0;
  for (let i = 0; i + 1 < line.length; i++) {
    const [a, b] = [line[i], line[i + 1]];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < 1e-12) continue;
    const t = Math.max(0, Math.min(1, ((at[0] - a[0]) * (b[0] - a[0]) + (at[1] - a[1]) * (b[1] - a[1])) / (l * l)));
    const d = Math.hypot(a[0] + (b[0] - a[0]) * t - at[0], a[1] + (b[1] - a[1]) * t - at[1]);
    if (d < best.d) best = { d, s: s + l * t };
    s += l;
  }
  return [best.s - width / 2, best.s + width / 2];
}

// 折線扣掉幾段里程區間,剩下的各段折線
function splitPolyline(line, gaps) {
  const total = line.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) : 0), 0);
  const kept = [];
  let from = 0;
  for (const [lo, hi] of [...gaps].sort((a, b) => a[0] - b[0])) {
    if (lo > from) kept.push([from, Math.min(lo, total)]);
    from = Math.max(from, hi);
  }
  if (from < total) kept.push([from, total]);
  const at = (s) => {
    let acc = 0;
    for (let i = 0; i + 1 < line.length; i++) {
      const l = Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]);
      if (s <= acc + l || i + 2 === line.length) {
        const t = l < 1e-12 ? 0 : Math.max(0, Math.min(1, (s - acc) / l));
        return { point: [line[i][0] + (line[i + 1][0] - line[i][0]) * t, line[i][1] + (line[i + 1][1] - line[i][1]) * t], index: i };
      }
      acc += l;
    }
    return { point: line[line.length - 1], index: line.length - 2 };
  };
  return kept
    .filter(([lo, hi]) => hi - lo > 1e-6)
    .map(([lo, hi]) => {
      const a = at(lo);
      const b = at(hi);
      return [a.point, ...line.slice(a.index + 1, b.index + 1), b.point];
    });
}

/** 從 bottom 開始往上長到 top 的水(fill 零件的姿勢);maxH 是零件定義的高度 */
export const water = (x, bottom, top, maxH, z = 0) => ({ position: [x, bottom + maxH / 2, z], level: Math.max(0, top - bottom) / maxH });
