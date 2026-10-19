// 第 396 種:G. P. Reed 的錶用錨形件與槓桿式擒縱的專利,把槓桿與天文台計時器擒縱結合:擺輪往一個方向擺時得到的衝量
// 全部經槓桿傳來,往另一個方向擺時的衝量直接給計時器的衝量叉瓦;鎖住與放開擒縱輪,只在擒縱輪每次給衝量時各一次。
// 主動件是擺輪(累計擺動);目標件是擒縱輪。
//
// 照 Robin 擒縱的配置重排(維護者 2026-10-14 決定 (b)、10-16 維持;偏離插圖):Reed 1865 年的專利 US 49155 寫「滾子上帶
// 衝量叉瓦,下一個前進的齒抓住它給擺輪衝量」,Bonhams 拍品說明說他的擒縱以 Robert Robin 的設計為本——擒縱輪的齒要碰得到
// 擺輪的滾子。原圖擺輪中心離擒縱輪中心約 158 px、齒尖半徑約 75 px,滾子碰不到齒,所以照原文(與實物可行)把擒縱輪移到
// 擺輪滾子旁邊:擺輪在左、擒縱輪緊貼滾子的右邊、槓桿樞軸在輪的右邊,槓桿從樞軸往左越過擒縱輪(在輪前面一層)到擺輪的
// 圓盤銷;原圖擒縱輪在槓桿中段、擺輪輪緣離輪很遠的配置不照做。
//
// 動作(由接觸算,`models/escapement.js` 的 fall、periodic;叉瓦外形借用 `models/dead-beat-anchor.js` 的靜擊式叉瓦,
// 這張圖自己算接觸,沒有改共用模組):擒縱輪受重錘的固定力矩往順時針轉,碰到叉瓦或衝量叉瓦就停、被推就退。
// - 擺輪逆時針擺(滾子右緣往上,和擒縱輪左緣的齒同向):圓盤銷進叉口、撥槓桿,上叉瓦放開一齒;下一齒追上擺輪滾子上的
//   衝量叉瓦,推著它走一大段(直接給衝量叉瓦的衝量,這時槓桿的叉瓦都沒碰齒),叉瓦尖轉出齒尖圓後齒落到下叉瓦上鎖住。
// - 擺輪順時針擺回:衝量叉瓦先從兩齒之間通過、不碰齒(輪鎖在下叉瓦上);圓盤銷再撥槓桿,下叉瓦放開,齒沿下叉瓦的斜衝擊面
//   推著槓桿走(衝量經槓桿、叉口傳到圓盤銷),之後落到上叉瓦上鎖住。
// - 一個來回:放開、鎖住各兩次,每次衝量各一次;擒縱輪轉過一齒。上叉瓦的衝擊面很短(放開時只滑過一點),下叉瓦的長。
// 順時針擺回落到上叉瓦時,齒先碰到衝擊面的尾端,槓桿再擺深時把輪往回推約 0.2°(和第 402 種同樣的「不是完全的靜擊」)。
//
// 推斷:齒數(12 齒:衝量叉瓦要從兩齒之間通過,齒距比原圖約 15 齒大)、擺幅、各部尺寸;叉瓦的張角、衝擊面與衝量叉瓦的方位
// (由逐步模擬調到兩路衝量都做得出);擺輪只畫輪緣、兩根橫臂、滾子、衝量叉瓦、圓盤與圓盤銷,不畫游絲;夾板條、各軸與兩根
// 擋銷(原圖只畫輪與槓桿)。
// 立體化(推斷):擒縱輪、錨形件與兩個叉瓦、擺輪滾子與衝量叉瓦在同一層;槓桿身、叉口在輪前面一層,從樞軸處的套筒
// (套在夾板條上伸出來的樞軸上)接到錨形件;帶圓盤銷的圓盤在槓桿身前面,圓盤銷往後伸到叉口那一層。擺輪(輪緣與橫臂)
// 固定在擺輪軸的後端、夾板條後面(照原圖擺輪在輪後面;擺輪中心離擒縱輪只有約 1.1,橫臂放在夾板條前面會掃過擒縱輪軸)。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,照第 291、313 種):擒縱輪軸往後伸,輪與夾板之間有一個鼓,繩從
// 鼓的右側垂下吊著重錘,重錘的重量就是讓輪順時針轉的固定力矩;輪轉多少重錘降多少,被叉瓦擋住時重錘也停。重錘每降一段
// (擺輪來回八次)捲回最高處一次(上鍊,畫面上一下子回到上面)。錶實際上用發條經輪系帶動,這裡用重錘只是示意。
// 繩不經滑輪、直接從鼓上垂下(和同樣是錶的第 291、313、314 種一樣):鼓在輪與夾板條之間,鼓的右側往下沒有東西擋
// (擒縱輪在前面一層,夾板條與擺輪在後面)。全書加滑輪的(第 288、309 種等)是繩要繞到輪緣外,或鼓軸直立、要把繩轉成往下。
import { TAU, deg, swing, Y, Z as ZAXIS } from "./kit.js";
import { shape, circle, rect, thickLine, zCylinder } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { escapeWheel, deadBeatPallet, palletRoot } from "./dead-beat-anchor.js";
import { placePoly, fall, anyOverlap, periodic } from "./escapement.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { plateBar } from "./supports.js";

export const N = 12;
export const PITCH = TAU / N;
export const SWING = deg(140);
/** 擺輪一個來回的主動量 */
export const PERIOD = 4 * SWING;
const OUTER = 0.85;
const INNER = 0.55;
const RP = 0.27; // 衝量叉瓦尖離擺輪軸
const DIP = 0.035; // 衝量叉瓦尖伸進齒尖圓多深
const ROLLER = 0.2; // 擺輪滾子半徑(離齒尖 0.035)
const D = RP + OUTER - DIP; // 擺輪軸到擒縱輪心
const WHEEL = [0.25, 0, 0];
const BAL = [WHEEL[0] - D, 0, 0];
const LEVER = [WHEEL[0] + 1.0, 0, 0];
const LEV = deg(8); // 槓桿擺到擋銷的角度
const PIN_R = 0.65; // 圓盤銷離擺輪中心的距離
const PIN = 0.045; // 圓盤銷半徑
const PIN_X = BAL[0] + PIN_R - LEVER[0]; // 擺輪居中時圓盤銷在槓桿局部 x 的位置
// 叉口(槓桿局部 x 的範圍、半寬):口很淺,只伸過擺輪居中時的圓盤銷中心一點——槓桿擺到擋銷時銷剛好從口退出,
// 之後銷沿圓走的路徑在口的兩角外面(口再深,銷出叉口時會從側面掃過叉口的一片)
const FORK = { from: PIN_X - 0.025, to: PIN_X + 0.1, half: PIN + 0.012 };
const TAIL = 0.42; // 槓桿樞軸另一邊的短尾,靠在兩根擋銷上
const Z = 0.15; // 擒縱輪、錨形件與叉瓦、擺輪滾子那一層
const ZF = 0.3; // 槓桿身與叉口那一層(在輪前面)
const ZP = 0.4; // 圓盤(帶圓盤銷的臂)那一層,在槓桿身前面
const PLATE_Z = -0.6; // 夾板條
const ZB = -0.8; // 擺輪的輪緣與橫臂(在夾板條後面)

/** 擺輪轉 b → 圓盤銷的位置 */
export const pinAt = (b) => [BAL[0] + PIN_R * Math.cos(b), BAL[1] + PIN_R * Math.sin(b)];
const follow = (b) => {
  const [x, y] = pinAt(b);
  const a = Math.atan2(y - LEVER[1], x - LEVER[0]) - Math.PI;
  return Math.atan2(Math.sin(a), Math.cos(a));
};
// 圓盤銷離開叉口的擺輪角:叉口中線通過圓盤銷時,槓桿剛好轉到擋銷
const EXIT = (() => {
  let [lo, hi] = [0, Math.PI / 2];
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (Math.abs(follow(m)) < LEV) lo = m;
    else hi = m;
  }
  return lo;
})();
/** 擺輪轉 b → 槓桿的轉角:圓盤銷在叉口裡時,叉口的中線通過圓盤銷;擺出叉口(|b| > EXIT)後槓桿靠在擋銷上 */
export const leverAngle = (b) => (Math.abs(b) <= EXIT ? follow(b) : -Math.sign(b) * LEV);
/** 擺輪累計擺動 v → 擺輪角(先逆時針擺) */
const balanceAngle = (v) => swing(v, -SWING, SWING);

const WHEEL_SHAPE = escapeWheel({ teeth: N, outer: OUTER, inner: INNER });
// 槓桿的兩個叉瓦(局部座標,原點在樞軸):上叉瓦(槓桿逆時針擺到擋銷時鎖住輪,衝擊面短)、下叉瓦(衝擊面長,齒推它就是
// 經槓桿的衝量);張角由逐步模擬調到「擺回時衝量叉瓦從兩齒之間通過、擺過去時齒追得上衝量叉瓦」
const PALLETS = [
  deadBeatPallet({ P: LEVER, O: WHEEL, outer: OUTER, at: deg(35.5), lift: deg(2) }),
  deadBeatPallet({ P: LEVER, O: WHEEL, outer: OUTER, at: -deg(44), lift: deg(8) }),
];
// 擺輪滾子上的衝量叉瓦(擺輪局部座標,擺輪居中時在滾子右下方 26°):從滾子裡伸出到半徑 RP,
// 順時針那一面(下面)是齒推的面
const IMPULSE_AT = -deg(26);
const IMPULSE = [[ROLLER - 0.05, -0.025], [RP, -0.025], [RP, 0.025], [ROLLER - 0.05, 0.025]].map(([x, y]) => [x * Math.cos(IMPULSE_AT) - y * Math.sin(IMPULSE_AT), x * Math.sin(IMPULSE_AT) + y * Math.cos(IMPULSE_AT)]);

const teethAt = (w) => WHEEL_SHAPE.teeth.map((t) => placePoly(t, WHEEL, w));
const stopsAt = (v) => {
  const b = balanceAngle(v);
  const lam = leverAngle(b);
  return { pallets: PALLETS.map((p) => placePoly(p, LEVER, lam)), impulse: placePoly(IMPULSE, BAL, b) };
};
const ACC = (2 * PITCH) / (0.04 * PERIOD) ** 2; // 放開後自靜止落過一個齒距花 0.04 個來回
function step(s, v, dv) {
  const st = stopsAt(v);
  const all = [...st.pallets, st.impulse];
  return (({ q, w }) => ({ w: q, ww: w }))(fall((x) => anyOverlap(all, teethAt(x)), { q: s.w, w: s.ww }, { sign: -1, acc: ACC, dt: dv, max: PITCH }));
}
// 起始齒位:擺輪在逆時針那一端時不碰叉瓦的位置
const W0 = (() => {
  const st = stopsAt(0);
  for (let i = 0; i < 400; i++) if (!anyOverlap([...st.pallets, st.impulse], teethAt((-PITCH * i) / 400))) return (-PITCH * i) / 400;
  throw new Error("找不到起始齒位");
})();
const RUN = periodic({ period: PERIOD, init: { w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH } });
/** 擺輪一個來回,擒縱輪轉過的角度(整數個齒,由接觸算) */
export const perCycle = RUN.advance.w;

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角(絕對) */
export function reed(v) {
  const b = balanceAngle(v);
  return { balance: b, lever: leverAngle(b), wheel: RUN.at(v).w };
}
// 叉口的上下兩片(槓桿局部座標)
const PRONGS = [1, -1].map((s) => rect(FORK.to - FORK.from, 0.05, (FORK.from + FORK.to) / 2, s * (FORK.half + 0.025)));
/** 檢查用:兩個叉瓦、衝量叉瓦與輪齒;圓盤銷與叉口的兩片(世界座標 2D) */
export const contactAt = (v) => {
  const b = balanceAngle(v);
  return { ...stopsAt(v), teeth: teethAt(RUN.at(v).w), pin: circlePolygon(pinAt(b), PIN, 24), prongs: PRONGS.map((p) => placePoly(p, LEVER, leverAngle(b))) };
};

// 推斷的重錘驅動:鼓在擒縱輪軸上、輪與夾板之間,繩從鼓的右側直接垂下吊著重錘(不經滑輪,理由見檔頭)
const ROPE_R = 0.035;
const DRUM_R = 0.15;
const DRUM_Z = -0.3;
const DRUM = { center: [WHEEL[0], WHEEL[1], DRUM_Z], axis: ZAXIS, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const REWIND = 8 * PERIOD; // 擺輪來回八次(輪轉過八齒)上鍊一次
const WEIGHT = { radius: 0.14, height: 0.38 };
const hang = weightDrive({
  drum: DRUM,
  eye: [WHEEL[0] + DRUM.radius, WHEEL[1] - OUTER - 0.3, DRUM_Z], // 最高處在輪的下緣下方
  reserve: DRUM.radius * 8 * PITCH,
  spare: 2 * Math.PI * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -reed(v).wheel, REWIND); // 輪往前(順時針)轉的角度
/** 重錘驅動的鼓與上鍊間隔(檢查用) */
export const WEIGHT_DRIVE = { drum: DRUM, every: REWIND };

const root = PALLETS.map(palletRoot);

export default {
  figure: 396,
  parts: [
    {
      id: "plate",
      kind: "group",
      pieces: [
        // 夾板條(各軸往後插進凸台)、槓桿的樞軸(伸到槓桿身那一層)與擋住槓桿短尾的兩根擋銷(推斷)
        ...plateBar({ points: [BAL, WHEEL, LEVER, [LEVER[0] + TAIL + 0.05, LEVER[1]]], z: PLATE_Z, width: 0.32, boss: 0.2 }),
        zCylinder(PLATE_Z, ZF + 0.04, 0.05, LEVER),
        ...[1, -1].map((s) => zCylinder(PLATE_Z, ZF + 0.04, 0.035, [LEVER[0] + TAIL - 0.06, s * ((TAIL - 0.06) * Math.tan(LEV) + 0.04 / Math.cos(LEV) + 0.038)])),
      ],
    },
    {
      id: "balance",
      kind: "group",
      center: BAL,
      spin: 1.75,
      pieces: [
        // 擺輪(推斷的輪緣與兩根橫臂,在夾板條後面)、擺輪軸(穿過夾板條)
        { kind: "plate", shape: shape(circle(1.75), [circle(1.62).reverse()]), thickness: 0.08, at: [0, 0, ZB] },
        { kind: "box", size: [3.3, 0.06, 0.06], at: [0, 0, ZB] },
        { kind: "cylinder", radius: 0.1, length: 0.1, at: [0, 0, ZB] },
        zCylinder(ZB - 0.05, ZP + 0.03, 0.05),
        // 滾子與衝量叉瓦(和擒縱輪同一層)
        { kind: "plate", shape: shape(circle(ROLLER)), thickness: 0.1, at: [0, 0, Z] },
        { kind: "plate", shape: shape(IMPULSE), thickness: 0.12, at: [0, 0, Z], accent: true },
        // 圓盤(從擺輪軸伸到圓盤銷的臂,在槓桿身前面)與圓盤銷:從圓盤往後伸到叉口那一層
        { kind: "plate", shape: shape(thickLine([[0, 0], [PIN_R, 0]], 0.08)), thickness: 0.05, at: [0, 0, ZP] },
        { ...zCylinder(ZF - 0.06, ZP, PIN, [PIN_R, 0]), accent: true },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL,
      spin: OUTER,
      pieces: [
        { kind: "plate", shape: { outline: WHEEL_SHAPE.outline, holes: [circle(0.36).reverse()] }, thickness: 0.1, at: [0, 0, Z] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [0.5, 0.08, 0.08], at: [0.18 * Math.cos((i * TAU) / 3), 0.18 * Math.sin((i * TAU) / 3), Z], angle: (i * TAU) / 3 })),
        { kind: "cylinder", radius: 0.1, length: 0.16, at: [0, 0, Z] }, // 輪轂不碰到從前面掠過的槓桿身
        { kind: "box", size: [0.12, 0.12, 0.12], at: [0.3, 0.12, Z + 0.06], accent: true },
        zCylinder(PLATE_Z, Z, 0.05), // 輪軸,往後插進夾板
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM_Z] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER,
      arrow: false,
      pieces: [
        // 槓桿身(在擒縱輪前面一層,樞軸另一邊有短尾靠擋銷)、左端的叉口(上下兩片夾著圓盤銷)
        { kind: "plate", shape: shape(thickLine([[FORK.to, 0], [0, 0], [TAIL, 0]], 0.08), [circle(0.06).reverse()]), thickness: 0.06, at: [0, 0, ZF] },
        { kind: "box", size: [0.05, 2 * FORK.half + 0.1, 0.06], at: [FORK.to - 0.025, 0, ZF] },
        { kind: "box", size: [FORK.to - FORK.from, 0.05, 0.06], at: [(FORK.from + FORK.to) / 2, FORK.half + 0.025, ZF] },
        { kind: "box", size: [FORK.to - FORK.from, 0.05, 0.06], at: [(FORK.from + FORK.to) / 2, -FORK.half - 0.025, ZF] },
        // 樞軸處的套筒:從錨形件那一層貫穿到槓桿身,套在夾板的樞軸上
        { ...zCylinder(Z - 0.05, ZF + 0.03, 0.09), inner: 0.055 },
        // 錨形件與兩個叉瓦(和擒縱輪同一層)
        { kind: "plate", shape: shape(thickLine([root[0], [0, 0], root[1]], 0.08), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, Z] },
        ...PALLETS.map((poly) => ({ kind: "plate", shape: shape(poly), thickness: 0.1, at: [0, 0, Z] })),
      ],
    },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推擺輪(槓桿照模型走,叉口套住圓盤銷);擒縱輪受固定的力矩往順時針轉,只被叉瓦與衝量叉瓦擋住、放行
  replay: {
    to: 3 * PERIOD,
    seconds: 18,
    free: { wheel: { spring: -1, gravity: false } },
    ignore: [["wheel", "plate"]], // 輪軸插在夾板的孔裡(孔沒畫出來)
    expect: [
      { at: PERIOD / 2, part: "wheel", label: "擺輪逆時針擺過去:上叉瓦放開一齒,齒直接推擺輪滾子上的衝量叉瓦,再落到下叉瓦上鎖住", quote: "而朝相反方向擺動時所獲得的全部衝量，則直接傳遞給天文台計時器的衝量叉瓦" },
      { at: PERIOD, part: "wheel", label: "擺輪擺回來:下叉瓦放開,齒推槓桿叉瓦的衝擊面(衝量經槓桿),落到上叉瓦上鎖住;一個來回放走一齒", quote: "擺輪朝某一方向擺動時所獲得的全部衝量，是透過槓桿傳遞" },
      { part: "wheel", label: "三個來回,放走三齒", quote: "鎖定與解鎖擒縱輪的動作，則僅在該輪每次傳遞衝量時各進行一次" },
    ],
  },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const r = reed(v);
    const w = weightAt(v);
    return {
      parts: {
        balance: { angle: r.balance },
        lever: { angle: r.lever },
        wheel: { angle: r.wheel },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
