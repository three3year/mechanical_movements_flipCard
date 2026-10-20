// 第 427 種:另一種旋轉式引擎。軸 B 在與汽缸偏心的固定軸承裡轉;活塞 A、A 可以在與軸同心的輪轂 C 的溝槽裡滑進滑出,
// 但始終對汽缸保持徑向,這是靠嵌在汽缸端蓋軸轂上的環(虛線)維持的。活塞穿過輪轂 C 上的滾動填料 a、a 滑動。
// 主動件是軸 B。
// 推斷:輪轂在汽缸頂端與汽缸相切,頂端兩邊是進汽與排汽口(原圖左邊的管子箭頭朝上,是排汽);
// 活塞的內端貼著環(與汽缸同心)、外端貼著汽缸內壁,所以活塞長度不變;蒸汽在進汽口與前面的活塞之間推它。
// 2026-10-20 複查 #427-1–#427-4,照實物重排(原圖是剖面,把輪轂裡的東西都畫出來;模型把輪轂的前面在活塞掃過的範圍開成窗,
// 讀者看得到活塞歪著滑、看得到後面的環):
// - 滾動填料 a 是嵌在輪轂邊上圓座裡的圓柱(外緣和輪轂齊平,不露出輪轂外),中間開一道槽讓活塞穿過,跟著活塞的歪斜在座裡轉;
//   兩個半塊靠前面的蓋連成一件(推斷)。
// - 輪轂的前板在每個填料處開一個窗:填料的座加上活塞(本體)在輪轂座標裡掃過的範圍(由活塞的位置掃出來,外加 0.03 的間隙),
//   活塞對輪轂半徑最多歪約 17°,直溝槽套不住它。
// - 環立在汽缸後蓋上(環就是蓋上的軸轂,推斷),活塞內端在後面伸出一隻楔形的腳,腳貼著環的外面、在深度上和環重疊;
//   活塞本體的內端也貼著環。
// - 汽道改成兩壁的管子,從頂端直下到汽缸外緣,經汽缸壁中層的開口進缸膛,端頭不再伸進缸膛。
import { TAU, deg, rot2 } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

export const BORE = 1.6; // 汽缸內半徑(圓心在原點)
export const ECC = 0.35; // 軸 B 偏離汽缸中心
export const HUB = BORE - ECC; // 輪轂半徑:在頂端碰到汽缸
export const SHAFT = [0, ECC, 0];
export const RING = 0.58; // 引導活塞內端的環(外半徑;內半徑 0.54,軸離它最近 0.03)
export const PISTON = BORE - RING; // 活塞本體長:外端貼汽缸、內端貼環
export const PACK_R = 0.12; // 填料的半徑
export const PACK = HUB - PACK_R - 0.01; // 填料中心離軸心(外緣離輪轂外圓 0.01)
const SEAT = PACK_R + 0.01; // 輪轂上填料座的半徑
const HALF = 0.07; // 活塞半寬
const SLOT = HALF + 0.01; // 填料上槽的半寬
const MARGIN = 0.03; // 輪轂的窗留給活塞的間隙
const FOOT = { length: 0.1, half: 0.16 }; // 楔形的腳:沿半徑的長、寬的一半
const OUTER = BORE + 0.18;
// 深度(z)的配置:後蓋 → 環(立在後蓋上) → 腳(在輪轂前板後面,貼著環) → 活塞本體 / 輪轂前板 / 填料半塊 → 填料的蓋
const Z = { cover: [-0.34, -0.3], ring: [-0.3, -0.12], foot: [-0.29, -0.14], body: [-0.14, 0.31], hub: [-0.1, 0.34], cap: [0.34, 0.4], port: 0.15, wall: 0.3 };
const plate = (outline, [z0, z1], extra = {}) => ({ kind: "plate", shape: Array.isArray(outline) ? shape(outline) : outline, thickness: z1 - z0, at: [0, 0, (z0 + z1) / 2], ...extra });

const polar = (r, a, z = 0) => [r * Math.cos(a), r * Math.sin(a), z];
/** 軸轉 theta → 兩個填料 a 的位置與兩個活塞(沿汽缸半徑、穿過填料中心)的方向 */
export function pistons(theta) {
  return [0, 1].map((k) => {
    const a = theta + k * Math.PI;
    const packing = [SHAFT[0] + PACK * Math.cos(a), SHAFT[1] + PACK * Math.sin(a), 0];
    return { packing, angle: Math.atan2(packing[1], packing[0]) };
  });
}

// 活塞(局部:外端在原點、沿 −x 往內):本體是長條,外端修成貼著缸膛的圓弧(平頭的角會切進缸膛 0.0015);
// 內端的腳是楔形、內面是貼著環的圓弧(環心、缸心都在局部 (−BORE, 0))
const END_ARC = Math.asin(HALF / BORE);
export const BODY = [[-PISTON, -HALF], ...arcPoints(BORE, -END_ARC, END_ARC, -BORE, 0), [-PISTON, HALF]];
const FOOT_ARC = Math.asin(FOOT.half / RING);
export const FOOT_OUTLINE = [
  [-PISTON + FOOT.length, HALF],
  [-BORE + RING * Math.cos(FOOT_ARC), FOOT.half],
  ...arcPoints(RING, FOOT_ARC, -FOOT_ARC, -BORE, 0).slice(1, -1),
  [-BORE + RING * Math.cos(FOOT_ARC), -FOOT.half],
  [-PISTON + FOOT.length, -HALF],
];
// 填料(局部:槽沿 x):槽兩側的半塊,前面一個蓋把兩個半塊連成一件
const SLOT_ARC = Math.asin(SLOT / PACK_R);
const packingHalf = (s) => (s > 0 ? arcPoints(PACK_R, SLOT_ARC, Math.PI - SLOT_ARC) : arcPoints(PACK_R, Math.PI + SLOT_ARC, TAU - SLOT_ARC));

// ── 輪轂前板的窗:填料的座,加上活塞本體在輪轂座標裡掃過的範圍 ──
/** 從 origin 沿 dir 的射線穿過多邊形 poly 最遠的距離(沒碰到是 0) */
function rayFar(origin, dir, poly) {
  let far = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const den = dir[0] * ey - dir[1] * ex;
    if (Math.abs(den) < 1e-12) continue;
    const wx = p[0] - origin[0];
    const wy = p[1] - origin[1];
    const t = (wx * ey - wy * ex) / den;
    const s = (wx * dir[1] - wy * dir[0]) / den;
    if (t >= 0 && s >= -1e-9 && s <= 1 + 1e-9) far = Math.max(far, t);
  }
  return far;
}
const RAYS = 180;
/** 活塞 1 的本體在輪轂座標裡掃過的範圍(以填料座為中心、每 2° 一條射線),外加間隙;至少到座的半徑 */
function windowAround() {
  const far = new Array(RAYS).fill(SEAT);
  for (let i = 0; i < 360; i++) {
    const a = (TAU * i) / 360;
    const { angle } = pistons(a)[0];
    const at = polar(BORE, angle);
    const local = BODY.map((p) => rot2([rot2(p, angle)[0] + at[0] - SHAFT[0], rot2(p, angle)[1] + at[1] - SHAFT[1]], -a));
    for (let j = 0; j < RAYS; j++) {
      const psi = (TAU * j) / RAYS;
      const t = rayFar([PACK, 0], [Math.cos(psi), Math.sin(psi)], local);
      if (t > 0) far[j] = Math.max(far[j], t + MARGIN);
    }
  }
  return far.map((d, j) => [PACK + d * Math.cos((TAU * j) / RAYS), d * Math.sin((TAU * j) / RAYS)]);
}
/** 輪轂前板的外形:圓,減掉兩個窗(窗伸出外圓的部分截掉) */
function hubOutline() {
  const win = windowAround();
  const inside = win.map((p) => Math.hypot(p[0], p[1]) < HUB);
  const iA = win.findIndex((_, i) => inside[i] && !inside[(i - 1 + RAYS) % RAYS]); // 進外圓
  const iB = win.findIndex((_, i) => inside[i] && !inside[(i + 1) % RAYS]); // 出外圓
  const crossing = (p, q) => {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 40; k++) {
      const m = (lo + hi) / 2;
      const r = Math.hypot(p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m);
      if (r < HUB) hi = m;
      else lo = m;
    }
    return [p[0] + (q[0] - p[0]) * hi, p[1] + (q[1] - p[1]) * hi];
  };
  const cA = crossing(win[(iA - 1 + RAYS) % RAYS], win[iA]);
  const cB = crossing(win[(iB + 1) % RAYS], win[iB]);
  const arc = iA <= iB ? win.slice(iA, iB + 1) : [...win.slice(iA), ...win.slice(0, iB + 1)];
  const notch = [cB, ...arc.reverse(), cA]; // 沿窗的邊走(窗是凹進去的,順時針繞它)
  const ang = (p) => Math.atan2(p[1], p[0]);
  const flip = (p) => [-p[0], -p[1]]; // 填料 2 的窗:轉 180°
  return [...notch, ...arcPoints(HUB, ang(cA), ang(cB) + Math.PI).slice(1, -1), ...notch.map(flip), ...arcPoints(HUB, ang(cA) + Math.PI, ang(cB) + TAU).slice(1, -1)];
}
export const HUB_OUTLINE = hubOutline();

const TOP = Math.PI / 2;
// 汽道:兩壁的管子從頂端直下到汽缸外緣,汽道在兩壁之間、經汽缸壁中層的開口進缸膛
const PIPE = [0.32, 0.47]; // 汽道的內、外側 x
const CH = (PIPE[0] + PIPE[1]) / 2;
const yOn = (r, x) => Math.sqrt(r * r - x * x);
const pipeWall = (x) => thickLine([[x, BORE + 0.9], [x, yOn(OUTER, Math.abs(x)) - 0.01]], 0.06);
const pipeWalls = (s) => [PIPE[0] - 0.03, PIPE[1] + 0.03].map((x) => plate(pipeWall(s * x), [-Z.port, Z.port]));
export const inlet = [[CH, BORE + 0.9, 0.2], [CH, BORE + 0.3, 0.2], [CH, yOn(BORE, CH), 0.2]];
export const exhaust = [[-CH, yOn(BORE, CH), 0.2], [-CH, BORE + 0.3, 0.2], [-CH, BORE + 0.9, 0.2]];
/** 環在 x0 < x < x1 之間(上半)的一段:兩側是垂直的切口 */
const band = (x0, x1) => [...arcPoints(OUTER, Math.acos(x1 / OUTER), Math.acos(x0 / OUTER)), ...arcPoints(BORE, Math.acos(x0 / BORE), Math.acos(x1 / BORE))];
/** 環缺掉頂端 |x| < g 那一段(垂直的切口),其餘整圈 */
const cRing = (g) => [...arcPoints(OUTER, Math.PI - Math.acos(g / OUTER), TAU + Math.acos(g / OUTER)), ...arcPoints(BORE, TAU + Math.acos(g / BORE), Math.PI - Math.acos(g / BORE))];

/** 輪轂與汽缸之間、從 a0 順時針到 a1 的蒸汽 */
function crescent(a0, a1, travel) {
  const dots = [];
  const n = Math.max(1, Math.round((a0 - a1) / deg(7)));
  for (let i = 0; i < n; i++) {
    const a = a0 - ((a0 - a1) * (i + 0.5 + 0.3 * Math.sin(travel * 2 + i))) / n;
    const u = [Math.cos(a), Math.sin(a)];
    const su = SHAFT[0] * u[0] + SHAFT[1] * u[1];
    const inner = su + Math.sqrt(HUB * HUB - ECC * ECC + su * su);
    const gap = BORE - inner;
    if (gap < 0.1) continue;
    for (const f of gap > 0.4 ? [0.3, 0.7] : [0.5]) dots.push(polar(inner + gap * f, a, 0.05));
  }
  return dots;
}

export default {
  figure: 427,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      pieces: [
        // 汽缸壁:前、後層整圈;中層在兩條汽道處開口(頂端兩條汽道之間那一段補上)
        plate(shape(circle(OUTER), [circle(BORE).reverse()]), [Z.port, Z.wall]),
        plate(shape(circle(OUTER), [circle(BORE).reverse()]), [-Z.wall, -Z.port]),
        plate(cRing(PIPE[1]), [-Z.port, Z.port]),
        plate(band(-PIPE[0], PIPE[0]), [-Z.port, Z.port]),
        plate(circle(OUTER), Z.cover),
        { kind: "box", size: [2.4, 0.25, 0.9], at: [0, -BORE - 0.3, 0] },
        ...pipeWalls(1),
        ...pipeWalls(-1),
        // 端蓋上的環(原圖虛線):立在後蓋上、與汽缸同心,引導活塞內端;軸從它中間穿過
        plate(shape(circle(RING), [circle(RING - 0.04).reverse()]), Z.ring),
      ],
    },
    {
      id: "hub",
      kind: "group",
      center: SHAFT,
      label: "C",
      labelOffset: [0.3, 0.85, 0.4],
      spin: HUB + 0.1,
      pieces: [
        plate(HUB_OUTLINE, Z.hub, { mark: [0, HUB - 0.15], markSize: 0.08 }),
        { kind: "cylinder", radius: 0.16, length: 1.0, at: [0, 0, -0.2] },
      ],
    },
    { id: "shaftB", kind: "group", center: SHAFT, label: "B", labelOffset: [0.25, 0.15, 0.4], pieces: [] },
    ...[0, 1].map((k) => ({
      id: `packing${k + 1}`,
      kind: "group",
      label: "a",
      labelOffset: [0.2, 0.2, 0.3],
      arrow: false,
      pieces: [plate(packingHalf(1), Z.hub), plate(packingHalf(-1), Z.hub), plate(circle(PACK_R), Z.cap)],
    })),
    ...[0, 1].map((k) => ({
      id: `piston${k + 1}`,
      kind: "group",
      label: "A",
      labelOffset: [-0.5, 0.2, 0.4],
      arrow: false,
      pieces: [plate(BODY, Z.body), plate(FOOT_OUTLINE, Z.foot)],
    })),
  ],
  driver: { part: "hub", type: "rotation", speed: -0.6, initial: deg(150) },
  targets: ["piston1", "piston2"], // 軸 B 就是主動件(輪轂);標受蒸汽推、在輪轂裡滑進滑出的兩個活塞 A
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const ps = pistons(theta);
    const travel = -theta;
    // 進汽口(頂端右邊)順時針到前面的那個活塞之間是蒸汽
    const ahead = Math.max(...ps.map((p) => p.angle).map((a) => (a < TOP - deg(6) ? a : a - TAU)));
    const parts = { hub: { angle: theta } };
    ps.forEach((p, k) => {
      parts[`packing${k + 1}`] = { position: [p.packing[0], p.packing[1], 0], angle: p.angle }; // 填料跟著活塞的歪斜轉
      parts[`piston${k + 1}`] = { position: polar(BORE, p.angle), angle: p.angle };
    });
    return {
      parts,
      flows: [
        { fluid: "steam", points: [...crescent(TOP - deg(8), ahead + deg(5), travel), ...stream(inlet, travel, { spacing: 0.18 })] },
        { fluid: "steam", points: stream(exhaust, travel, { spacing: 0.18 }) },
      ],
      readouts: [],
    };
  },
};
