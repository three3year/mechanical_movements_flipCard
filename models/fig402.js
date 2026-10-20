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
// 2026-10-20 複查(model-audit-fixes-4 票 04;#402-1):扇形段的齒原本是方塊、齒距和小齒輪差 15%,整程都穿進小齒輪。
//   改成和各自的小齒輪同模數的齒形(gearProfile),轉角用 meshAngle 咬合。外齒段與內齒段不能在同一個節圓上
//   (兩邊的齒在半徑方向會重疊),所以外齒段的節圓在弧形桿外側(2.25)、內齒段在內側(1.875);兩個擺輪的擺幅要相同,
//   兩個小齒輪都 14 齒、半徑依各自的節圓取(0.3 與 0.25,推斷),轉速比都是 7.5。
//   槓桿的樞軸孔原本開在板的端頭上(一半在外形外),板往樞軸後面多伸一段。
import { TAU, deg, swing } from "./kit.js";
import { shape, circle, thickLine, arcPoints, gearProfile, internalSectorShape } from "./shapes.js";
import { meshAngle } from "./gears.js";
import { escapeWheel, deadBeatPallet, palletRoot, escapeByAnchor } from "./dead-beat-anchor.js";

const P = [0.55, -0.35, 0]; // 槓桿 B(與錨形件 A)的樞軸
export const SWING = deg(9);
const RATIO = 7.5; // 扇形段節圓半徑 / 小齒輪節圓半徑(兩個擺輪相同)
const PINION_TEETH = 14; // 梯形齒的近似:小齒輪齒數少時齒頂會擦進扇形段的齒(8 齒擦 0.011、14 齒 0.001)
const SECTOR_TEETH = RATIO * PINION_TEETH;
const OUTER_R = 2.25; // 外齒段的節圓半徑(模數 0.043)
const INNER_R = 1.875; // 內齒段的節圓半徑(模數 0.036)
const module = (r) => (2 * r) / SECTOR_TEETH;
const at = (r, a) => [P[0] + r * Math.cos(a), P[1] + r * Math.sin(a), 0];
const BAL1 = at(OUTER_R + OUTER_R / RATIO, deg(143)); // 外齒咬著這個擺輪的小齒輪(在扇形段外側)
const BAL2 = at(INNER_R - INNER_R / RATIO, deg(105)); // 內齒咬著這個擺輪的小齒輪(在扇形段內側)
const BAL2_Z = -0.35; // 擺輪 2 在擺輪 1 後面一層
const WHEEL = [1.45, -1.2, 0];
export const N = 15;
export const PITCH = TAU / N;
const OUTER = 0.7;
const INNER = 0.42; // 齒要夠深:叉瓦擺到盡頭時伸進齒圈的深度不能超過齒深
const Z = 0.15; // 槓桿、叉瓦、擒縱輪那一層

// 兩組咬合:扇形段(齒 0 在槓桿局部 +X,和完整齒輪相同)與小齒輪
const OUTER_GEAR = { center: P, teeth: SECTOR_TEETH, radius: OUTER_R };
const INNER_GEAR = { center: P, teeth: SECTOR_TEETH, radius: INNER_R, internal: true };
const PINION1 = { center: BAL1, teeth: PINION_TEETH, radius: OUTER_R / RATIO };
const PINION2 = { center: BAL2, teeth: PINION_TEETH, radius: INNER_R / RATIO };
// 弧形桿:在內齒段的齒根與外齒段的齒根之間
const BAND = { inner: INNER_R + 1.2 * module(INNER_R), outer: OUTER_R - 1.2 * module(OUTER_R), span: [deg(76), deg(160)] };
// 有齒的範圍:小齒輪的中心線 ± 擺幅 ± 約兩個齒距,邊界取在齒間的中點
const SECTOR_PITCH = TAU / SECTOR_TEETH;
const midGap = (a) => (Math.round(a / SECTOR_PITCH - 0.5) + 0.5) * SECTOR_PITCH;
const OUTER_SPAN = [midGap(deg(129)), midGap(deg(159))];
const INNER_SPAN = [midGap(deg(87)), midGap(deg(123))];
const ang = (a0, [x, y]) => {
  let a = Math.atan2(y, x);
  while (a < a0) a += TAU;
  return a;
};
/** 外齒扇形段:span 範圍內的外齒,內緣是半徑 back 的弧(伸進弧形桿裡) */
function externalSectorShape({ teeth, radius, span, back }) {
  const [a0, a1] = span;
  const pts = gearProfile({ teeth, radius }).filter((p) => ang(a0, p) <= a1);
  pts.sort((p, q) => ang(a0, p) - ang(a0, q));
  return { outline: [...pts, ...arcPoints(back, a1, a0)], holes: [] };
}
const OUTER_SECTOR = externalSectorShape({ teeth: SECTOR_TEETH, radius: OUTER_R, span: OUTER_SPAN, back: BAND.outer - 0.06 });
const INNER_SECTOR = internalSectorShape({ teeth: SECTOR_TEETH, radius: INNER_R, span: INNER_SPAN, rim: BAND.inner + 0.06 });
/** 檢查用:兩組咬合(扇形段的輪廓在槓桿局部座標) */
export const MESHES = [
  { id: "bal1", sector: OUTER_GEAR, outline: OUTER_SECTOR.outline, pinion: PINION1 },
  { id: "bal2", sector: INNER_GEAR, outline: INNER_SECTOR.outline, pinion: PINION2 },
];

const WHEEL_SHAPE = escapeWheel({ teeth: N, outer: OUTER, inner: INNER });
// 叉瓦:放在輪的齒尖圓上,兩個相隔 3.5 個齒距(一擺放走半齒)
const BASE = Math.atan2(P[1] - WHEEL[1], P[0] - WHEEL[0]);
const PALLETS = [BASE + deg(42), BASE - deg(42)].map((a) => deadBeatPallet({ P, O: WHEEL, outer: OUTER, at: a, lift: deg(6) }));
const PALLET_ROOT = PALLETS.map(palletRoot);
const PERIOD = 4 * SWING; // 槓桿一個來回
const ESCAPE = escapeByAnchor({ P, O: WHEEL, wheel: WHEEL_SHAPE, pallets: PALLETS, lever: (v) => swing(v, -SWING, SWING), period: PERIOD });
/** 槓桿一個來回,擒縱輪轉過的角度(整數個齒,由接觸算) */
export const perCycle = ESCAPE.perCycle;

/** 槓桿累計擺動 v → 槓桿角、兩個擺輪的轉角(由咬合算)、擒縱輪的轉角(絕對) */
export function guernsey(v) {
  const b = swing(v, -SWING, SWING);
  return { lever: b, bal1: meshAngle(OUTER_GEAR, PINION1, b), bal2: meshAngle(INNER_GEAR, PINION2, b), wheel: ESCAPE.angle(v) };
}
/** 檢查用:叉瓦與輪齒(世界座標 2D) */
export const contactAt = ESCAPE.at;

const balance = (r, pinion, pinionZ) => [
  { kind: "plate", shape: shape(circle(r), [circle(r - 0.12).reverse()]), thickness: 0.08 },
  { kind: "box", size: [2 * r - 0.2, 0.06, 0.06], mark: true },
  { kind: "gear", teeth: pinion.teeth, radius: pinion.radius, width: 0.12, at: [0, 0, pinionZ] },
  { kind: "cylinder", radius: 0.05, length: Math.abs(pinionZ) + 0.75, at: [0, 0, (pinionZ - 0.75) / 2] }, // 擺輪的軸,插在後夾板上
];
// 槓桿的直臂:從樞軸後面一小段起(樞軸孔要整個在板裡)直直伸到弧形桿的起點(偏離原圖的彎臂:槓桿擺 9° 時,
// 彎向左的臂會掃到擺輪 2 的小齒輪;直臂離小齒輪的齒尖 0.2 以上)
const ARM_R = (BAND.inner + BAND.outer) / 2;
const ARM = [[-0.12 * Math.cos(BAND.span[0]), -0.12 * Math.sin(BAND.span[0])], [0, 0], [ARM_R * Math.cos(BAND.span[0]), ARM_R * Math.sin(BAND.span[0])]];

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
    { id: "bal1", kind: "group", center: BAL1, spin: 1.15, pieces: balance(1.15, PINION1, Z - 0.05) },
    { id: "bal2", kind: "group", center: [BAL2[0], BAL2[1], BAL2_Z], spin: 1.15, pieces: balance(1.15, PINION2, Z - 0.05 - BAL2_Z) },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      label: "B",
      labelOffset: [-0.45, 0.85, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine(ARM, 0.14), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, Z] },
        // 弧形桿:外側一段外齒(咬擺輪 1 的小齒輪)、內側一段內齒(咬擺輪 2 的小齒輪),齒形和小齒輪同模數
        { kind: "plate", shape: shape([...arcPoints(BAND.outer, BAND.span[0], BAND.span[1]), ...arcPoints(BAND.inner, BAND.span[1], BAND.span[0])]), thickness: 0.08, at: [0, 0, Z] },
        { kind: "plate", shape: OUTER_SECTOR, thickness: 0.08, at: [0, 0, Z] },
        { kind: "plate", shape: INNER_SECTOR, thickness: 0.08, at: [0, 0, Z] },
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
  targets: ["bal1", "bal2"], // 一正一反的兩個擺輪(這組結構的目的是讓兩個擺輪反向擺動、抵消晃動)
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const g = guernsey(v);
    return { parts: { lever: { angle: g.lever }, bal1: { angle: g.bal1 }, bal2: { angle: g.bal2 }, wheel: { angle: g.wheel } }, readouts: [] };
  },
};
