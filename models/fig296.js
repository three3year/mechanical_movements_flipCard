// 第 296 種:槓桿式擒縱(錶用)。承載擒縱叉瓦的錨形件 B 與槓桿 E–C 連成一體,槓桿一端有凹槽 E;擺輪心軸上的圓盤
// 固定著一根小銷,每次擺動的中途進入凹槽,把槓桿撥到另一邊,使叉瓦在擒縱輪 A 的齒之間進出;
// 叉瓦脫離一齒時,擒縱輪給叉瓦一個衝擊,槓桿再以交替的方向把衝量傳給擺輪。
// 擺輪每擺一次,擒縱輪轉過半個齒(原圖箭頭:順時針)。主動件是擺輪(累計擺動);目標件是擒縱輪 A
// (擒縱讓輪系一齒一齒地放行)。
//
// 由接觸算:槓桿是鉸接在 B 的零件,只被擺輪的銷推動——銷在每次擺動的中途進到凹槽、推側壁把槓桿撥到另一邊,
// 其餘時間槓桿停在擋銷上(鎖面略往裡斜,齒壓在鎖面上時把槓桿拉向擋銷,所以銷不在凹槽裡時槓桿不會晃開;
// models/escapement.js 的 periodic)。擒縱輪受發條的固定力矩順時針轉,被叉瓦擋住就停;叉瓦被帶開時,
// 齒推著叉瓦的斜面跟上(衝擊經槓桿傳給銷),脫開後加速落到另一個叉瓦的鎖面上(escapeByContact)。
// 推斷:齒數、擺幅、叉瓦的衝擊角與拉入角、擋銷的位置(原圖沒畫擋銷);擺輪只畫出帶銷的圓盤(原圖只畫到凹槽旁的圓盤),
// 輪軸、槓桿軸、擺輪軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, placePoly, toothedWheel, periodic, anyOverlap, clearance, escapeByContact } from "./escapement.js";
import { shape, circle, thickLine, rect } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(150);
export const LIFT = deg(6);
export const BANK = deg(5); // 槓桿靠在擋銷上的角度(±):銷離開凹槽時槓桿正好轉到這裡
const R = 1.62;
const ROOT = 1.3;
const A = [0.1, -0.75];
const SPAN = 1.75 * PITCH; // 兩叉瓦相隔 3.5 齒
const B = [A[0], A[1] + R / Math.cos(SPAN)];
const FORK = 2.15; // B 到凹槽 E
const PIN = { r: 0.32, size: 0.05 }; // 擺輪上的銷:離擺輪軸的距離、半徑
const BAL = [B[0] - FORK + 0.06 - PIN.r, B[1]]; // 擺輪軸:銷在擺輪居中時伸進凹槽 0.06

// 擒縱輪:細尖齒(順時針轉,前面往前傾;齒間留出叉瓦伸進去的空間)
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.5], [R, 0.3], [R, 0.37], [ROOT, 0.72]] });
// 叉瓦:鎖面帶一點拉入(recoil 取負號:叉瓦越伸進去,齒可以再往前一點,齒的壓力把槓桿拉向擋銷)
const pallet = (at) => anchorPallet({ P: B, O: A, R, at, dir: -1, width: 0.2, lift: LIFT, recoil: -0.12, lock: deg(1), back: 0.16 });
const ENTRY = pallet(Math.PI / 2 + SPAN);
const EXIT = pallet(Math.PI / 2 - SPAN);
// 凹槽 E(相對 B):槓桿左端的叉口,開口朝擺輪
const SLOT = PIN.size + 0.012; // 凹槽的半寬(銷與側壁之間的空隙)
const FORK_PRONGS = [rect(0.22, 0.06, -FORK + 0.11, SLOT + 0.03), rect(0.22, 0.06, -FORK + 0.11, -SLOT - 0.03)];

/** 擺輪累計擺動 v → 擺輪角(居中時銷指向槓桿) */
export const balanceAngle = (v) => swing(v, -SWING, SWING);
const pinAt = (beta) => [circlePolygon([BAL[0] + PIN.r * Math.cos(beta), BAL[1] + PIN.r * Math.sin(beta)], PIN.size, 16)];
const forkAt = (alpha) => FORK_PRONGS.map((p) => placePoly(p, B, alpha));
const palletsAt = (alpha) => [ENTRY.poly, EXIT.poly].map((p) => placePoly(p, B, alpha));
const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, A, w));

// 槓桿只被擺輪的銷推動(銷在凹槽裡時推側壁),其餘時間停在原處——由擋銷與鎖面的拉入擋住
function leverStep(s, v) {
  const pin = pinAt(balanceAngle(v));
  const hit = (a) => anyOverlap(pin, forkAt(a));
  if (!hit(s.alpha)) return s;
  const up = clearance(hit, s.alpha, 1, Math.max(0, BANK - s.alpha));
  const down = clearance(hit, s.alpha, -1, Math.max(0, BANK + s.alpha));
  if (!Number.isFinite(up) && !Number.isFinite(down)) throw new Error(`槓桿在主動量 ${v.toFixed(4)} 被銷與擋銷夾死`);
  return { alpha: up <= down ? s.alpha + up : s.alpha - down };
}
// 起始:擺輪在一端(先往逆時針擺),槓桿靠在凹槽朝下(迎著銷)的那一側擋銷上
const leverRun = periodic({ period: 4 * SWING, init: { alpha: BANK }, step: leverStep, samples: 1440 });
export const leverAngle = (v) => leverRun.at(v).alpha;

// 擒縱輪:受發條的固定力矩順時針轉,被叉瓦擋住就停;衝擊時齒推著叉瓦的斜面,跟著被銷帶開的叉瓦前進
const wheelRun = escapeByContact({ center: A, teeth: WHEEL.teeth, dir: -1, period: 4 * SWING, samples: 1440, stops: (v) => palletsAt(leverAngle(v)) });

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角(順時針為負) */
export function lever(v) {
  return { balance: balanceAngle(v), lever: leverAngle(v), wheel: wheelRun.angle(v) };
}
export const escapement = {
  period: 4 * SWING,
  step: wheelRun.step,
  angle: wheelRun.angle,
  at: (v) => ({ ...wheelRun.at(v), fork: forkAt(leverAngle(v)), pin: pinAt(balanceAngle(v)) }),
};
export const geometry = { BANK, FORK, BAL, B };

// 槓桿(相對 B):左臂到凹槽 E、右臂到 C;兩叉瓦從槓桿往下伸進輪齒之間
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.1), p.L * Math.sin(p.psi - p.s * 0.1)];
const C = [1.75, 0];
// 擋銷:槓桿右臂在 ±BANK 時碰到(臂寬 0.16、銷半徑 0.05)
const BANK_PINS = [1, -1].map((side) => {
  const d = 1.35;
  const off = 0.08 + 0.05;
  const a = side * BANK + side * Math.atan(off / d);
  return [B[0] + Math.hypot(d, off) * Math.cos(a), B[1] + Math.hypot(d, off) * Math.sin(a)];
});

export default {
  figure: 296,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: [...A, 0],
      spin: R,
      label: "A",
      labelOffset: [0, 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: { outline: WHEEL.outline, holes: [circle(1.12).reverse()] }, thickness: 0.12 },
        ...[0, 1, 2].map((i) => ({ kind: "plate", shape: shape(thickLine([[0, 0], [0.55, 0.45], [1.15, 0.2]].map(([x, y]) => [x * Math.cos((i * TAU) / 3) - y * Math.sin((i * TAU) / 3), x * Math.sin((i * TAU) / 3) + y * Math.cos((i * TAU) / 3)]), 0.12)), thickness: 0.1 })),
        { kind: "cylinder", radius: 0.16, length: 0.25 },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
        { kind: "box", size: [0.14, 0.14, 0.14], at: [1.2, 0, 0.08], accent: true },
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...B, 0],
      arrow: false,
      label: "B",
      labelOffset: [0.35, 0.25, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-FORK + 0.22, 0], [-0.6, 0.08], [0, 0.1], [0.9, 0], C], 0.16), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.14] }, // 槓桿:左端接凹槽的底
        { kind: "plate", shape: shape(thickLine([[0, 0], tail(ENTRY)], 0.14)), thickness: 0.1, at: [0, 0, 0.14] },
        { kind: "plate", shape: shape(thickLine([[0, 0], tail(EXIT)], 0.14)), thickness: 0.1, at: [0, 0, 0.14] },
        { kind: "plate", shape: shape(ENTRY.poly), thickness: 0.26, at: [0, 0, 0.06] },
        { kind: "plate", shape: shape(EXIT.poly), thickness: 0.26, at: [0, 0, 0.06] },
        ...FORK_PRONGS.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.1, at: [0, 0, 0.14] })), // 凹槽 E
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, -0.1] }, // 槓桿軸,往後伸進夾板條
      ],
    },
    {
      id: "roller",
      kind: "group",
      center: [...BAL, 0],
      spin: 0.42,
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(0.06).reverse()]), thickness: 0.06, at: [0, 0, -0.02] },
        { kind: "cylinder", radius: PIN.size, length: 0.22, at: [PIN.r, 0, 0.1], accent: true }, // 銷,伸到凹槽那一層
        { kind: "cylinder", radius: 0.06, length: 0.7, at: [0, 0, -0.2] }, // 擺輪軸,往後伸進夾板條
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [A, B, BAL], z: -0.5, width: 0.24, boss: 0.16 }),
        ...BANK_PINS.map(([x, y]) => ({ kind: "cylinder", radius: 0.05, length: 0.55, at: [x, y, -0.13] })), // 擋銷,從夾板條立起
      ],
    },
    { id: "labelC", kind: "group", center: [B[0] + C[0], B[1] + C[1], 0], label: "C", labelOffset: [0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [B[0] - FORK, B[1], 0], label: "E", labelOffset: [0.2, 0.32, 0.3] },
  ],
  // 動力重演:只推擺輪;擒縱輪受固定的力矩(發條)順時針轉;槓桿鉸在 B、自由轉動,被銷與齒推動、靠在擋銷上
  replay: {
    to: 8 * SWING,
    seconds: 24,
    free: {
      wheelA: { pivot: [...A, 0], spring: -1, gravity: false },
      anchor: { pivot: [...B, 0], gravity: false }, // 槓桿:被銷推、靠在擋銷上
    },
    ignore: [["wheelA", "frame"], ["anchor", "frame"], ["roller", "frame"]],
    expect: [
      { at: 2 * SWING, part: "wheelA", label: "擺輪擺過一次,輪轉過半個齒", quote: "該銷在每次擺動的中途進入凹槽中,並使叉瓦於擒縱輪的齒之間進入與退出" },
      { at: 2 * SWING, part: "anchor", label: "擺輪擺過一次,槓桿換到另一邊的擋銷上" },
      { at: 4 * SWING, part: "wheelA", label: "擺輪來回一次,輪轉過一齒" },
      { part: "wheelA", label: "擺輪來回兩次,輪轉過兩齒" },
    ],
  },
  driver: { part: "roller", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelA", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const l = lever(v);
    return { parts: { roller: { angle: l.balance }, anchor: { angle: l.lever }, wheelA: { angle: l.wheel } }, readouts: [] };
  },
};
