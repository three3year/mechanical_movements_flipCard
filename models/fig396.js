// 第 396 種:G. P. Reed 的錶用錨形件與槓桿式擒縱的專利,把槓桿與天文台計時器擒縱結合:擺輪往一個方向擺時得到的衝量
// 全部經槓桿傳來,往另一個方向擺時的衝量直接給計時器的衝量叉瓦;鎖住與放開擒縱輪,只在擒縱輪每次給衝量時各一次。
// 主動件是擺輪(累計擺動)。
// 推斷:齒數、擺幅;擺輪只畫出輪緣、圓盤與圓盤銷;夾板與各軸(原圖只畫出輪與槓桿)。
//
// 2026-10-07 複查(原本擒縱輪照「擺一次轉半齒」的進度表轉、槓桿角照擺輪角的比例給,都是演出的動作):
// - 擺輪圓盤上的圓盤銷在擺過中間時進到槓桿左端的叉口裡,把槓桿撥過去;槓桿的轉角由「叉口的中線通過圓盤銷」決定
//   (銷在叉口裡是套住的接合),銷離開叉口後槓桿靠在擋銷上。
// - 槓桿右端是錨形件,兩個叉瓦的鎖面以槓桿樞軸為圓心(靜擊式),尖端是斜的衝擊面;擒縱輪受發條的固定力矩往順時針轉,
//   碰到叉瓦就停,槓桿換邊時被放行、加速轉到另一個叉瓦擋住(由接觸算,`models/dead-beat-anchor.js`)。擺輪擺一個來回,
//   擒縱輪放走一齒。
// - 原文「往另一個方向擺時,衝量直接給天文台計時器的衝量叉瓦」這一路沒有做出來:原圖看不出衝量叉瓦裝在哪、怎麼碰到擒縱輪,
//   模型兩個方向都是經槓桿鎖放(列入待確認清單)。
import { TAU, deg, swing } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";
import { escapeWheel, deadBeatPallet, palletRoot, escapeByAnchor } from "./dead-beat-anchor.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(140);
const BAL = [-1.4, 0, 0];
const WHEEL = [0.95, 0, 0];
const LEVER = [1.95, 0, 0];
const OUTER = 0.85;
const INNER = 0.55;
const LEV = deg(8); // 槓桿擺到擋銷的角度
const PIN_R = 0.65; // 圓盤銷離擺輪中心的距離
const PIN = 0.045; // 圓盤銷半徑
const FORK = { from: -2.8, to: -2.6, half: PIN + 0.012 }; // 叉口(槓桿局部 x 的範圍、半寬);口在銷擺出叉口時的位置
const TAIL = 0.42; // 槓桿樞軸另一邊的短尾,靠在兩根擋銷上
const Z = 0.15; // 槓桿、叉瓦、擒縱輪那一層

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

const WHEEL_SHAPE = escapeWheel({ teeth: N, outer: OUTER, inner: INNER });
// 叉瓦:放在輪的齒尖圓上,兩個相隔 3.5 個齒距(槓桿換邊一次放走半齒)
const BASE = Math.atan2(LEVER[1] - WHEEL[1], LEVER[0] - WHEEL[0]);
const PALLETS = [BASE + deg(42), BASE - deg(42)].map((a) => deadBeatPallet({ P: LEVER, O: WHEEL, outer: OUTER, at: a, lift: deg(5) }));
const PERIOD = 4 * SWING; // 擺輪一個來回
const ESCAPE = escapeByAnchor({ P: LEVER, O: WHEEL, wheel: WHEEL_SHAPE, pallets: PALLETS, lever: (v) => leverAngle(swing(v, -SWING, SWING)), period: PERIOD });
/** 擺輪一個來回,擒縱輪轉過的角度(整數個齒,由接觸算) */
export const perCycle = ESCAPE.perCycle;
/** 檢查用:叉瓦與輪齒(世界座標 2D) */
export const contactAt = ESCAPE.at;

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角(絕對) */
export function reed(v) {
  const b = swing(v, -SWING, SWING);
  return { balance: b, lever: leverAngle(b), wheel: ESCAPE.angle(v) };
}

const root = PALLETS.map(palletRoot);

export default {
  figure: 396,
  parts: [
    {
      id: "plate",
      kind: "group",
      pieces: [
        // 後夾板、各軸與擋住槓桿的兩根擋銷(推斷)
        { kind: "plate", shape: shape(circle(3.4, 0.1, 0)), thickness: 0.06, at: [0, 0, -0.6] },
        { kind: "cylinder", radius: 0.05, length: 0.75, at: [BAL[0], BAL[1], -0.25] },
        { kind: "cylinder", radius: 0.06, length: 0.8, at: [WHEEL[0], WHEEL[1], -0.2] },
        { kind: "cylinder", radius: 0.05, length: 0.8, at: [LEVER[0], LEVER[1], -0.2] },
        ...[1, -1].map((s) => ({ kind: "cylinder", radius: 0.035, length: 0.87, at: [LEVER[0] + TAIL - 0.06, s * ((TAIL - 0.06) * Math.tan(LEV) + 0.04 / Math.cos(LEV) + 0.038), -0.135] })),
      ],
    },
    {
      id: "balance",
      kind: "group",
      center: BAL,
      spin: 1.75,
      pieces: [
        { kind: "plate", shape: shape(circle(1.75), [circle(1.62).reverse()]), thickness: 0.1 },
        { kind: "box", size: [3.3, 0.06, 0.06] },
        // 圓盤與往前伸的圓盤銷(在叉口那一層)
        { kind: "plate", shape: shape(thickLine([[0, 0], [PIN_R, 0]], 0.16), [circle(0.06).reverse()]), thickness: 0.06, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: PIN, length: 0.16, at: [PIN_R, 0, Z], accent: true },
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
        { kind: "cylinder", radius: 0.1, length: 0.16, at: [0, 0, Z] }, // 輪轂不碰到從上方掠過的槓桿身
        { kind: "box", size: [0.12, 0.12, 0.12], at: [0.3, 0.12, Z + 0.06], accent: true },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER,
      arrow: false,
      pieces: [
        // 槓桿身(在擒縱輪前面一層,樞軸另一邊有短尾靠擋銷)、左端的叉口(上下兩片夾著圓盤銷)、右端接兩個叉瓦的錨形件
        { kind: "plate", shape: shape(thickLine([[FORK.to, 0], [-0.9, 0], [0, 0], [TAIL, 0]], 0.08), [circle(0.06).reverse()]), thickness: 0.06, at: [0, 0, Z + 0.12] },
        { kind: "box", size: [0.05, 2 * FORK.half + 0.1, 0.06], at: [FORK.to - 0.025, 0, Z] },
        { kind: "box", size: [FORK.to - FORK.from, 0.05, 0.06], at: [(FORK.from + FORK.to) / 2, FORK.half + 0.025, Z] },
        { kind: "box", size: [FORK.to - FORK.from, 0.05, 0.06], at: [(FORK.from + FORK.to) / 2, -FORK.half - 0.025, Z] },
        { kind: "box", size: [0.06, 0.06, 0.18], at: [FORK.to + 0.01, 0, Z + 0.06] },
        { kind: "plate", shape: shape(thickLine([root[0], [0, 0], root[1]], 0.08)), thickness: 0.08, at: [0, 0, Z] },
        ...PALLETS.map((poly) => ({ kind: "plate", shape: shape(poly), thickness: 0.1, at: [0, 0, Z] })),
      ],
    },
  ],
  // 動力重演:只推擺輪(槓桿照模型走,叉口套住圓盤銷);擒縱輪受發條的固定力矩往順時針轉,只被叉瓦擋住、放行
  replay: {
    to: 3 * PERIOD,
    seconds: 18,
    free: { wheel: { spring: -1, gravity: false } },
    ignore: [["wheel", "plate"]],
    expect: [
      { at: PERIOD / 2, part: "wheel", label: "擺輪擺過去撥動槓桿,一個叉瓦放開、另一個擋住", quote: "鎖定與解鎖擒縱輪的動作,則僅在該輪每次傳遞衝量時各進行一次" },
      { at: PERIOD, part: "wheel", label: "擺回來再撥一次,一個來回放走一齒" },
      { part: "wheel", label: "三個來回,放走三齒" },
    ],
  },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const r = reed(v);
    return { parts: { balance: { angle: r.balance }, lever: { angle: r.lever }, wheel: { angle: r.wheel } }, readouts: [] };
  },
};
