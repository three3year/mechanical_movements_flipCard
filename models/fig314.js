// 第 314 種:槓桿式天文台計時器擒縱。擒縱叉瓦 A、B 與槓桿看起來和第 296 種的槓桿式擒縱相同,但叉瓦只用來鎖住
// 擒縱輪,本身不傳遞衝量;衝量由擒縱輪的齒直接傳給擺輪上的叉瓦 C(每來回一次一次衝量)。
// 擺輪的銷每擺一次撥動槓桿,叉瓦 A、B 輪流放開、鎖住;擺輪每來回一次,擒縱輪轉過一齒。
// 主動件是擺輪;目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算:槓桿只被擺輪的銷推動(銷在每次擺動的中途進到叉口、推側壁把槓桿撥到另一邊,其餘時間槓桿停在擋銷上;
// models/escapement.js 的 periodic)。叉瓦只有鎖面(與槓桿的軸同心再偏一個拉力角,鎖住的齒把槓桿拉在擋銷上;
// 沒有衝擊斜面)。擺輪逆時針擺時槓桿換邊、A 放開,輪轉過 16°,途中一齒追上擺輪滾子上的凹槽(叉瓦 C)的側邊、
// 推著它走(衝量),再被 B 擋住;順時針擺時 B 放開,輪再轉 8° 被 A 擋住,這一段不經過滾子(escapeByContact)。
// A 鎖得比 B 深:槓桿快換完邊、B 已經擋在齒的去路上時 A 才放開齒。
// 只有逆時針擺時滾子在接觸點的走向和輪齒相同,所以衝量排在這一擺;滾子只伸進齒尖圓 0.02,
// 外緣只掃過兩種鎖住狀態的齒尖之間,停著的齒碰不到它。
// 推斷:齒數、擺幅、叉瓦的位置、凹槽 C 的大小與方位、擋銷;輪軸、槓桿軸、擺輪軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { placePoly, toothedWheel, periodic, anyOverlap, clearance, escapeByContact } from "./escapement.js";
import { shape, circle, thickLine, rect, arcPoints } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(140);
export const BANK = deg(5);
const W = [-0.7, 0.15];
const R = 1.65;
const ROOT = 1.3;
// 擺輪軸:在輪心 38° 方向、距離 2.43(滾子半徑 0.8,伸進齒尖圓 0.02)
const BAL = [W[0] + 2.43 * Math.cos(deg(38)), W[1] + 2.43 * Math.sin(deg(38))];
const L = [BAL[0], BAL[1] - 2.65]; // 槓桿樞軸,在擺輪軸正下方
const PIN = { r: 0.35, size: 0.05 }; // 擺輪上撥槓桿的銷(擺輪居中時朝正下方)
const ROLLER = { r: 0.8, notch: deg(165), width: deg(26), depth: 0.2 }; // 衝擊滾子與凹槽 C

const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.35], [R, 0.05], [R, 0.1], [ROOT, 0.9]] });
// 叉口(相對槓桿樞軸):在槓桿上端,開口朝擺輪;擺輪居中時銷伸進叉口 0.06
const FORK_END = BAL[1] - PIN.r - L[1] + 0.06;
const SLOT = PIN.size + 0.012;
const FORK = [rect(0.06, 0.2, SLOT + 0.03, FORK_END - 0.1), rect(0.06, 0.2, -SLOT - 0.03, FORK_END - 0.1)];
const rollerOutline = (() => {
  const a0 = ROLLER.notch - ROLLER.width / 2;
  const a1 = ROLLER.notch + ROLLER.width / 2;
  const inner = ROLLER.r - ROLLER.depth;
  return [...arcPoints(ROLLER.r, a1, a0 + TAU), [inner * Math.cos(a0), inner * Math.sin(a0)], [inner * Math.cos(a1), inner * Math.sin(a1)]];
})();

/** 擺輪累計擺動 v → 擺輪角 */
export const balanceAngle = (v) => swing(v, -SWING, SWING);
const pinAt = (b) => [circlePolygon([BAL[0] + PIN.r * Math.cos(b - Math.PI / 2), BAL[1] + PIN.r * Math.sin(b - Math.PI / 2)], PIN.size, 12)];
const forkAt = (a) => FORK.map((p) => placePoly(p, L, a));
const rollerAt = (b) => [placePoly(rollerOutline, BAL, b)];

// 槓桿只被銷推動,其餘時間停在擋銷上
const leverRun = periodic({
  period: 4 * SWING,
  init: { alpha: BANK },
  samples: 720,
  step: (s, v) => {
    const pin = pinAt(balanceAngle(v));
    const hit = (a) => anyOverlap(pin, forkAt(a));
    if (!hit(s.alpha)) return s;
    const up = clearance(hit, s.alpha, 1, Math.max(0, BANK - s.alpha));
    const down = clearance(hit, s.alpha, -1, Math.max(0, BANK + s.alpha));
    if (!Number.isFinite(up) && !Number.isFinite(down)) throw new Error(`槓桿在主動量 ${v.toFixed(4)} 被銷與擋銷夾死`);
    return { alpha: up <= down ? s.alpha + up : s.alpha - down };
  },
});
export const leverAngle = (v) => leverRun.at(v).alpha;

/**
 * 鎖瓦:鎖面橫在齒尖的去路上、帶拉力角 draw——齒尖壓在鎖面上的力把槓桿往鎖住的方向拉(靠在擋銷上)。
 * at:齒尖鎖住時在齒尖圓上的方位;depth:鎖面伸進齒尖圓多深;lockAngle:槓桿鎖住這個叉瓦時的角度。
 * 回傳槓桿局部座標(原點在樞軸 L、槓桿角 0)的多邊形,外加接槓桿臂的點 tail。
 */
function lockPallet({ at, depth, ext = 0.12, width, draw, lockAngle }) {
  const u = [Math.cos(at), Math.sin(at)];
  const t = [Math.sin(at), -Math.cos(at)]; // 齒尖的走向(輪順時針轉)
  const C = [W[0] + R * u[0], W[1] + R * u[1]];
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  // 鎖面與槓桿樞軸同心(法線沿樞軸到鎖點的方向,齒推它不產生力矩),再偏 draw,
  // 偏向使齒推它的力矩和槓桿鎖住的轉向同號(拉力)
  const r = [C[0] - L[0], C[1] - L[1]];
  const rl = Math.hypot(...r);
  const n0 = (t[0] * r[0] + t[1] * r[1] > 0 ? 1 : -1) / rl;
  let n = rot([r[0] * n0, r[1] * n0], draw);
  if (Math.sign(cross(r, n)) !== Math.sign(lockAngle)) n = rot([r[0] * n0, r[1] * n0], -draw);
  let f = [-n[1], n[0]]; // 鎖面方向,朝輪外
  if (f[0] * u[0] + f[1] * u[1] < 0) f = [-f[0], -f[1]];
  const k = f[0] * u[0] + f[1] * u[1];
  const tip = [C[0] - (depth / k) * f[0], C[1] - (depth / k) * f[1]];
  const end = [C[0] + (ext / k) * f[0], C[1] + (ext / k) * f[1]];
  const along = (p) => [p[0] + width * n[0], p[1] + width * n[1]];
  const local = (p) => rot([p[0] - L[0], p[1] - L[1]], -lockAngle);
  const poly = [tip, end, along(end), along(tip)].map(local);
  const area = poly.reduce((sum, p, i) => sum + cross(p, poly[(i + 1) % poly.length]), 0);
  const e = local(end);
  const e2 = local(along(end));
  return { poly: area < 0 ? poly.reverse() : poly, tail: [(e[0] + e2[0]) / 2, (e[1] + e2[1]) / 2] };
}
// 槓桿停在擋銷上的角度(銷離開叉口時的角度):A 在 +REST 鎖住,B 在 −REST 鎖住
const REST = Math.abs(leverAngle(0));
const pallet = (at, lockAngle, depth) => lockPallet({ at, depth, width: 0.07, draw: deg(12), lockAngle });
const PALLET_A = pallet(deg(-2), REST, 0.13);
const PALLET_B = pallet(deg(-66), -REST, 0.05);
const palletsAt = (a) => [PALLET_A.poly, PALLET_B.poly].map((p) => placePoly(p, L, a));
const wheelRun = escapeByContact({ center: W, teeth: WHEEL.teeth, dir: -1, period: 4 * SWING, samples: 720, drop: 0.03, stops: (v) => [...palletsAt(leverAngle(v)), ...rollerAt(balanceAngle(v))] });

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角(順時針為負) */
export function leverChrono(v) {
  return { balance: balanceAngle(v), lever: leverAngle(v), wheel: wheelRun.angle(v) };
}
export const escapement = { center: W, balanceCenter: BAL, period: 4 * SWING, step: wheelRun.step, angle: wheelRun.angle, at: (v) => ({ ...wheelRun.at(v), fork: forkAt(leverAngle(v)), pin: pinAt(balanceAngle(v)) }) };

const tail = (p) => p.tail;
// 擋銷:槓桿上段在銷離開叉口時的角度(±REST)碰到(臂寬 0.16、銷半徑 0.04)
const BANK_PINS = [1, -1].map((side) => {
  const d = 1.2;
  const off = 0.08 + 0.04;
  const a = Math.PI / 2 + side * REST + side * Math.atan(off / d);
  return [L[0] + Math.hypot(d, off) * Math.cos(a), L[1] + Math.hypot(d, off) * Math.sin(a)];
});

export default {
  figure: 314,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(WHEEL.outline, [circle(1.12).reverse()]), thickness: 0.12 },
        { kind: "box", size: [2.3, 0.12, 0.08] },
        { kind: "box", size: [0.12, 2.3, 0.08] },
        { kind: "plate", shape: shape(circle(0.22)), thickness: 0.16 },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
        { kind: "box", size: [0.14, 0.14, 0.14], at: [1.2, 0, 0.08], accent: true },
      ],
    },
    {
      id: "balance",
      kind: "group",
      center: [...BAL, 0],
      spin: ROLLER.r,
      pieces: [
        { kind: "plate", shape: shape(rollerOutline, [circle(0.07).reverse()]), thickness: 0.12 }, // 衝擊滾子,凹槽是叉瓦 C(擒縱輪那一層)
        { kind: "plate", shape: shape(circle(0.42)), thickness: 0.05, at: [0, 0, 0.36] }, // 帶銷的小圓盤
        { kind: "cylinder", radius: PIN.size, length: 0.22, at: [0, -PIN.r, 0.24], accent: true }, // 撥槓桿的銷(槓桿那一層)
        { kind: "cylinder", radius: 0.07, length: 1.1, at: [0, 0, 0.0] }, // 擺輪軸,往後伸進夾板條
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: [...L, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, -0.2], [0, FORK_END - 0.18]], 0.16), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, 0.24] },
        ...FORK.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.08, at: [0, 0, 0.24] })), // 叉口
        { kind: "plate", shape: shape(thickLine([[0, 0], tail(PALLET_A)], 0.14)), thickness: 0.08, at: [0, 0, 0.24] },
        { kind: "plate", shape: shape(thickLine([[0, -0.15], tail(PALLET_B)], 0.14)), thickness: 0.08, at: [0, 0, 0.24] },
        { kind: "plate", shape: shape(PALLET_A.poly), thickness: 0.3, at: [0, 0, 0.1] }, // 叉瓦 A
        { kind: "plate", shape: shape(PALLET_B.poly), thickness: 0.3, at: [0, 0, 0.1] }, // 叉瓦 B
        { kind: "cylinder", radius: 0.06, length: 0.7, at: [0, 0, -0.05] }, // 槓桿軸,往後伸進夾板條
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [W, L, [L[0] + 0.5, L[1]], [L[0] + 0.5, BAL[1]], BAL], z: -0.5, width: 0.22, boss: 0.16 }),
      ],
    },
    {
      id: "banking",
      kind: "group",
      pieces: BANK_PINS.map(([x, y]) => ({ kind: "cylinder", radius: 0.04, length: 0.8, at: [x, y, -0.1] })), // 擋銷,從夾板條立起、高過槓桿那一層
    },
    { id: "labelA", kind: "group", center: [...L, 0], label: "A", labelOffset: [tail(PALLET_A)[0] + 0.25, tail(PALLET_A)[1], 0.4] },
    { id: "labelB", kind: "group", center: [...L, 0], label: "B", labelOffset: [tail(PALLET_B)[0] - 0.2, tail(PALLET_B)[1] - 0.25, 0.4] },
    { id: "labelC", kind: "group", center: [BAL[0] + ROLLER.r * Math.cos(ROLLER.notch), BAL[1] + ROLLER.r * Math.sin(ROLLER.notch), 0], label: "C", labelOffset: [-0.25, -0.15, 0.3] },
  ],
  // 動力重演:只推擺輪;擒縱輪受固定的力矩(發條)順時針轉;槓桿鉸在樞軸上、自由轉動,被銷推、靠在擋銷上
  replay: {
    to: 8 * SWING,
    seconds: 24,
    free: {
      wheel: { pivot: [...W, 0], spring: -1, gravity: false },
      lever: { pivot: [...L, 0], gravity: false },
    },
    ignore: [["wheel", "frame"], ["lever", "frame"], ["balance", "frame"]],
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺輪逆時針擺:放開 A,輪的齒推叉瓦 C(衝量),再被 B 擋住", quote: "衝量是由擒縱輪的齒直接傳遞給連接在擺輪上的叉瓦 C" },
      { at: 4 * SWING, part: "wheel", label: "擺輪順時針擺:放開 B,輪轉到 A 擋住,轉滿一齒" },
      { part: "wheel", label: "擺輪來回兩次,輪轉過兩齒" },
    ],
  },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const l = leverChrono(v);
    return { parts: { balance: { angle: l.balance }, lever: { angle: l.lever }, wheel: { angle: l.wheel } }, readouts: [] };
  },
};
