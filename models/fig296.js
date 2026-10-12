// 第 296 種:槓桿式擒縱(錶用)。承載擒縱叉瓦的錨形件 B 與槓桿 E–C 連成一體,槓桿一端有凹槽 E;擺輪心軸上的圓盤
// 固定著一根小銷,每次擺動的中途進入凹槽,把槓桿撥到另一邊,使叉瓦在擒縱輪 A 的齒之間進出;
// 叉瓦脫離一齒時,擒縱輪給叉瓦一個衝擊,槓桿再以交替的方向把衝量傳給擺輪。
// 擺輪每擺一次,擒縱輪轉過半個齒(原圖箭頭:順時針)。主動件是擺輪(累計擺動);目標件是擒縱輪 A
// (擒縱讓輪系一齒一齒地放行)。
//
// 由接觸算:槓桿是鉸接在 B 的零件,只被擺輪的銷推動——銷在每次擺動的中途進到凹槽、推側壁把槓桿撥到另一邊,
// 其餘時間槓桿停在擋銷上(鎖面略往裡斜,齒壓在鎖面上時把槓桿拉向擋銷,所以銷不在凹槽裡時槓桿不會晃開;
// models/escapement.js 的 periodic)。擒縱輪受重錘的固定力矩順時針轉,被叉瓦擋住就停;叉瓦被帶開時,
// 齒推著叉瓦的斜面跟上(衝擊經槓桿傳給銷),脫開後加速落到另一個叉瓦的鎖面上(escapeByContact)。
// 推斷:齒數、擺幅、叉瓦的衝擊角與拉入角、擋銷的位置(原圖沒畫擋銷);
// 輪軸、槓桿軸、擺輪軸裝在後面的夾板條上(原圖沒畫);夾板條從槓桿軸 B 再往右分一支到槓桿右臂底下,
// 末端一塊小橋板,兩根擋銷從橋板立起(擋銷與橋板都是推斷)。
// 推斷的擺輪(原圖只畫到凹槽旁帶銷的圓盤 D;原文「擺輪心軸上的圓盤」):擺輪軸往後穿過夾板條,擺輪(輪緣、三根輪輻與輪轂)
// 固定在軸的後端、夾板條後面——和圓盤 D、銷是同一件(主動件);放在前面會蓋住銷與凹槽 E。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,照第 234、238 種):輪軸往後伸,輪與夾板條之間有一個鼓,
// 繩從鼓的右側垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪轉多少重錘降多少,被叉瓦擋住時重錘也停。
// 輪每轉一圈重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。錶實際上是用發條經輪系帶動,這裡用重錘只是示意。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { anchorPallet, placePoly, toothedWheel, periodic, anyOverlap, clearance, escapeByContact } from "./escapement.js";
import { shape, circle, thickLine, rect } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";
import { weightDrive, rewound } from "./weight-drive.js";

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
const BALANCE = { radius: 1.0, rim: 0.1, z: -0.75 }; // 擺輪(推斷):在夾板條(z −0.58 起)後面

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

// 推斷的重錘驅動:鼓在輪軸上、輪與夾板條之間,繩從鼓的右側垂下吊著重錘
const ROPE_R = 0.04;
const DRUM_R = 0.15;
const DRUM = { center: [...A, -0.29], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const WEIGHT = { radius: 0.17, height: 0.4 };
const REWIND = N * 4 * SWING; // 輪轉一圈(擺輪擺十五個來回)上鍊一次
const hang = weightDrive({
  drum: DRUM,
  eye: [A[0] + DRUM.radius, -2.8, DRUM.center[2]],
  reserve: DRUM.radius * TAU,
  spare: 0.8 * TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -wheelRun.angle(v), REWIND); // 輪往前(順時針)轉的角度

export const geometry = { BANK, FORK, BAL, B, DRUM, REWIND, BALANCE };

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
// 擋銷底下的小橋板:夾板條從 B 往右分一支到兩根擋銷之間,橋板橫跨兩根擋銷
const BRIDGE = [BANK_PINS[0][0], B[1]];
const BRIDGE_SPAN = Math.abs(BANK_PINS[0][1] - BANK_PINS[1][1]) + 0.24;
const PIN_Z = { from: -0.5, to: 0.145 }; // 擋銷從夾板條那一層立起,到槓桿那一層

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
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷)
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
        { kind: "cylinder", radius: 0.06, length: 0.97, at: [0, 0, -0.335] }, // 擺輪軸,往後穿過夾板條到擺輪
        // 擺輪(推斷):輪緣、三根輪輻與輪轂,固定在擺輪軸的後端
        { kind: "plate", shape: shape(circle(BALANCE.radius), [circle(BALANCE.radius - BALANCE.rim).reverse()]), thickness: 0.06, at: [0, 0, BALANCE.z] },
        ...[0, 1, 2].map((k) => {
          const a = deg(90) + (k * TAU) / 3;
          return { kind: "plate", shape: shape(thickLine([[0, 0], [(BALANCE.radius - 0.05) * Math.cos(a), (BALANCE.radius - 0.05) * Math.sin(a)]], 0.08)), thickness: 0.05, at: [0, 0, BALANCE.z] };
        }),
        { kind: "cylinder", radius: 0.12, length: 0.1, at: [0, 0, BALANCE.z] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [A, B, BAL], z: -0.5, width: 0.24, boss: 0.16 }),
        { kind: "box", size: [BRIDGE[0] - B[0], 0.24, 0.1], at: [(B[0] + BRIDGE[0]) / 2, B[1], -0.5] }, // 夾板條往右分出的一支
        { kind: "box", size: [0.24, BRIDGE_SPAN, 0.1], at: [...BRIDGE, -0.5] }, // 擋銷底下的小橋板
        ...BANK_PINS.map(([x, y]) => ({ kind: "cylinder", radius: 0.05, length: PIN_Z.to - PIN_Z.from, at: [x, y, (PIN_Z.from + PIN_Z.to) / 2] })), // 擋銷,從橋板立起
      ],
    },
    { id: "labelC", kind: "group", center: [B[0] + C[0], B[1] + C[1], 0], label: "C", labelOffset: [0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [B[0] - FORK, B[1], 0], label: "E", labelOffset: [0.2, 0.32, 0.3] },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推擺輪;擒縱輪受重錘的固定力矩順時針轉(以彈簧代替;重錘照模型的姿勢走);槓桿鉸在 B、自由轉動,被銷與齒推動、靠在擋銷上
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
    const w = weightAt(v);
    const eye = w.eye;
    return {
      parts: {
        roller: { angle: l.balance },
        anchor: { angle: l.lever },
        wheelA: { angle: l.wheel },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
