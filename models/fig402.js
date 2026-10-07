// 第 402 種:G. O. Guernsey 的專利錶用擒縱。用兩個擺輪,由同一個動力帶動、但朝相反方向擺動,用來抵消晃動的影響:會讓一個擺輪
// 變快的晃動,會讓另一個變慢。錨形件 A 固定在槓桿 B 上,槓桿末端有一段內齒扇形段與一段外齒扇形段,分別與兩個擺輪的
// 小齒輪咬合,所以兩個擺輪一正一反。錨形件 A 的叉瓦輪流放走擒縱輪的齒。主動件是槓桿 B(累計擺動)。
// 推斷:擺幅與齒數;扇形段的半徑;夾板與各軸(原圖只畫出輪)。
//
// 2026-10-07 複查:
// - 擒縱輪原本照「每擺一次放走半齒」的進度表轉(演出的動作),叉瓦和輪齒沒有真的相碰。改成由接觸算:擒縱輪受發條的
//   固定力矩往順時針轉,碰到叉瓦就停;叉瓦的鎖面是以槓桿樞軸為圓心的弧(擺過頭時滑過齒尖、不推輪),尖端是斜的衝擊面;
//   槓桿擺開、鎖面離開齒尖,輪就加速轉到另一個叉瓦擋住為止。輪齒做成窄齒、寬齒間(叉瓦才伸得進去)。
//   放開的齒先落在另一個叉瓦的斜衝擊面上(還沒到鎖面),槓桿再擺深時把輪往回推約 1°(每個來回共約 4°),之後才坐上鎖面;
//   試過叉瓦的張角 38°–46°、衝擊面 3°–8°,都去不掉(槓桿是照擺動強制走的,不像實物由輪齒推著過衝擊面)。
// - 兩個擺輪的小齒輪原本都不在扇形段的範圍裡;改成一條從 B 彎出去的長扇形段,外側的齒咬擺輪 1 的小齒輪、
//   內側的齒咬擺輪 2 的小齒輪。兩個擺輪原本畫在同一層、輪緣互相穿過,改成前後錯開。
// - 補上後夾板與各軸(擺輪、槓桿、擒縱輪的軸都插在夾板上,推斷)。
import { TAU, deg, swing } from "./kit.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";
import { escapeWheel, deadBeatPallet, palletRoot, escapeByAnchor } from "./dead-beat-anchor.js";

const P = [0.55, -0.35, 0]; // 槓桿 B(與錨形件 A)的樞軸
export const SWING = deg(9);
const SECTOR_R = 2.0; // 扇形段的節圓半徑
const PINION = 0.3;
const at = (r, a) => [P[0] + r * Math.cos(a), P[1] + r * Math.sin(a), 0];
const BAL1 = at(SECTOR_R + PINION, deg(143)); // 外齒咬著這個擺輪的小齒輪(在扇形段外側)
const BAL2 = at(SECTOR_R - PINION, deg(105)); // 內齒咬著這個擺輪的小齒輪(在扇形段內側)
const BAL2_Z = -0.35; // 擺輪 2 在擺輪 1 後面一層
const WHEEL = [1.45, -1.2, 0];
export const N = 15;
export const PITCH = TAU / N;
const OUTER = 0.7;
const INNER = 0.42; // 齒要夠深:叉瓦擺到盡頭時伸進齒圈的深度不能超過齒深
const Z = 0.15; // 槓桿、叉瓦、擒縱輪那一層

const WHEEL_SHAPE = escapeWheel({ teeth: N, outer: OUTER, inner: INNER });
// 叉瓦:放在輪的齒尖圓上,兩個相隔 3.5 個齒距(一擺放走半齒)
const BASE = Math.atan2(P[1] - WHEEL[1], P[0] - WHEEL[0]);
const PALLETS = [BASE + deg(42), BASE - deg(42)].map((a) => deadBeatPallet({ P, O: WHEEL, outer: OUTER, at: a, lift: deg(6) }));
const PALLET_ROOT = PALLETS.map(palletRoot);
const PERIOD = 4 * SWING; // 槓桿一個來回
const ESCAPE = escapeByAnchor({ P, O: WHEEL, wheel: WHEEL_SHAPE, pallets: PALLETS, lever: (v) => swing(v, -SWING, SWING), period: PERIOD });
/** 槓桿一個來回,擒縱輪轉過的角度(整數個齒,由接觸算) */
export const perCycle = ESCAPE.perCycle;

/** 槓桿累計擺動 v → 槓桿角、兩個擺輪的轉角、擒縱輪的轉角(絕對) */
export function guernsey(v) {
  const b = swing(v, -SWING, SWING);
  return { lever: b, bal1: (-b * SECTOR_R) / PINION, bal2: (b * SECTOR_R) / PINION, wheel: ESCAPE.angle(v) };
}
/** 檢查用:叉瓦與輪齒(世界座標 2D) */
export const contactAt = ESCAPE.at;

const balance = (r, pinionZ) => [
  { kind: "plate", shape: shape(circle(r), [circle(r - 0.12).reverse()]), thickness: 0.08 },
  { kind: "box", size: [2 * r - 0.2, 0.06, 0.06], mark: true },
  { kind: "gear", teeth: 8, radius: PINION, width: 0.12, at: [0, 0, pinionZ] },
  { kind: "cylinder", radius: 0.05, length: Math.abs(pinionZ) + 0.75, at: [0, 0, (pinionZ - 0.75) / 2] }, // 擺輪的軸,插在後夾板上
];
// 扇形段:從 B 彎出去的弧形桿,外側一段齒(咬擺輪 1)、內側一段齒(咬擺輪 2)
const SECTOR = [deg(95), deg(155)];
const sectorTeeth = (r, from, to, out) =>
  Array.from({ length: Math.round(((to - from) * SECTOR_R) / 0.21) }, (_, i) => {
    const a = from + ((i + 0.5) * (to - from)) / Math.round(((to - from) * SECTOR_R) / 0.21);
    return { kind: "box", size: [0.12, 0.08, 0.1], at: [r * Math.cos(a), r * Math.sin(a), Z], angle: a + (out ? 0 : Math.PI) };
  });

export default {
  figure: 402,
  parts: [
    {
      id: "plate",
      kind: "group",
      pieces: [
        // 後夾板與擒縱輪、槓桿的軸(推斷)
        { kind: "plate", shape: shape(circle(3.0, -0.2, 0.35)), thickness: 0.06, at: [0, 0, -0.8] },
        { kind: "cylinder", radius: 0.05, length: 0.95, at: [P[0], P[1], -0.3] },
        { kind: "cylinder", radius: 0.06, length: 0.95, at: [WHEEL[0], WHEEL[1], -0.3] },
      ],
    },
    { id: "bal1", kind: "group", center: BAL1, spin: 1.15, pieces: balance(1.15, Z - 0.05) },
    { id: "bal2", kind: "group", center: [BAL2[0], BAL2[1], BAL2_Z], spin: 1.15, pieces: balance(1.15, Z - 0.05 - BAL2_Z) },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      label: "B",
      labelOffset: [-0.45, 0.85, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.5, 0.9], [SECTOR_R * Math.cos(deg(80)), SECTOR_R * Math.sin(deg(80))]], 0.14), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, Z] },
        { kind: "plate", shape: shape([...arcPoints(SECTOR_R + 0.09, SECTOR[0] - deg(15), SECTOR[1]), ...arcPoints(SECTOR_R - 0.09, SECTOR[1], SECTOR[0] - deg(15))]), thickness: 0.08, at: [0, 0, Z] },
        ...sectorTeeth(SECTOR_R + 0.13, deg(132), SECTOR[1], true),
        ...sectorTeeth(SECTOR_R - 0.13, SECTOR[0], deg(118), false),
        // 錨形件 A:兩臂伸到擒縱輪,末端是兩個叉瓦
        { kind: "plate", shape: shape(thickLine([PALLET_ROOT[0], [0, 0], PALLET_ROOT[1]], 0.08)), thickness: 0.08, at: [0, 0, Z] },
        ...PALLETS.map((poly) => ({ kind: "plate", shape: shape(poly), thickness: 0.1, at: [0, 0, Z] })),
      ],
    },
    { id: "labelA", kind: "group", center: P, label: "A", labelOffset: [0.65, -0.05, 0.3] },
    { id: "wheel", kind: "group", center: WHEEL, spin: OUTER, pieces: [{ kind: "plate", shape: { outline: WHEEL_SHAPE.outline, holes: [circle(0.08).reverse()] }, thickness: 0.1, at: [0, 0, Z] }, { kind: "box", size: [0.12, 0.12, 0.12], at: [0.42, 0, Z], accent: true }] },
  ],
  // 動力重演:只推槓桿(擺輪照模型走);擒縱輪受發條的固定力矩往順時針轉,只被叉瓦擋住、放行
  replay: {
    to: 3 * PERIOD,
    seconds: 18,
    free: { wheel: { spring: -1, gravity: false } },
    ignore: [["wheel", "plate"]],
    expect: [
      { at: PERIOD / 2, part: "wheel", label: "槓桿擺過去,一個叉瓦放開、另一個擋住,輪轉了半齒左右", quote: "錨形件 A 固定於槓桿 B 上" },
      { at: PERIOD, part: "wheel", label: "擺回來,輪再轉,一個來回放走一齒" },
      { part: "wheel", label: "三個來回,放走三齒" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [-SWING, SWING] },
  waivers: [
    { check: "interference", parts: ["bal1", "lever"], reason: "簡化齒形:扇形段的齒畫成方塊,與擺輪 1 小齒輪的梯形齒重疊 0.06" },
    { check: "interference", parts: ["bal2", "lever"], reason: "簡化齒形:扇形段的齒畫成方塊,與擺輪 2 小齒輪的梯形齒重疊 0.06" },
  ],
  targets: ["bal1", "bal2"], // 一正一反的兩個擺輪(這組結構的目的是讓兩個擺輪反向擺動、抵消晃動)
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const g = guernsey(v);
    return { parts: { lever: { angle: g.lever }, bal1: { angle: g.bal1 }, bal2: { angle: g.bal2 }, wheel: { angle: g.wheel } }, readouts: [] };
  },
};
