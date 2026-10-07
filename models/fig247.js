// 第 247 種:釋放測深錘的方式。測深錘(剖面)套在桿上,由桿下端的卡榫從下方托住;桿底伸出一根可以滑動的
// 頂桿。頂桿撞到海底時被推得相對於桿往上,把卡榫從錘的下方抽開,錘便脫落,桿不帶錘被拉上來。
// 主動件是虛擬的「進程」:放下 → 頂桿觸底、被推上 → 錘脫落 → 收回桿;每一輪換一個新錘。
//
// 接觸(由接觸算):頂桿被推上多少,由它的腳底碰到海底決定;頂桿上的推銷頂著卡榫的上臂,卡榫轉開多少,
// 由推銷與上臂相碰算出;卡榫的托腳轉到錘孔以內(托不住錘)的那一刻錘才脫落,從那時起加速落到海底。
// 推斷:卡榫與頂桿的連動方式(原圖只畫剖面:頂桿從桿底伸進桿的空腔,卡榫以銷裝在空腔裡,下端從槽口伸出托住錘);
// 各階段所佔的進程。卡榫與頂桿畫在桿的前面(實物在空心桿裡)。
// 動力重演做不出來(宣告了,寫成豁免):原圖是剖面,錘只畫後半、卡榫與頂桿畫在桿的前面,立體裡卡榫的托腳托不到錘;
// 錘從托腳退進錘孔那一刻起加速落到海底,由測試驗。
import { Y, clamp, smooth } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, rect, thickLine, circle } from "./shapes.js";
import { placeOutline, polygonsOverlap, circlePolygon } from "./contact.js";
import { falling } from "./jumps.js";

const SEA = -2.5; // 海底
const TOP = 0.7; // 錘心起始高度
const BALL = 1.0;
const HOLE = 0.22;
export const PUSH = 0.32; // 頂桿被推上的行程上限(頂到桿的空腔頂)
const CATCH = [0.0, -0.52]; // 卡榫樞軸(相對錘心,在桿上)
const PLUNGER_X = -0.05;
const PLUNGER_TOP = -0.75; // 頂桿沒被推時,頂端相對錘心的高度
const FOOT_BOTTOM = PLUNGER_TOP - 1.36; // 頂桿腳底(底板下緣)相對錘心的高度
const CONTACT = SEA - FOOT_BOTTOM; // 腳底碰到海底時的錘心高度
const REST = SEA + BALL; // 錘落在海底時的錘心高度
const P = { touch: 0.33, pushed: 0.43, lift: 0.58, back: 0.9, gone: 0.94 };
const DROP = 0.06; // 錘落到海底所佔的進程

// 卡榫(局部座標:原點在樞軸):上臂往左上斜伸,下臂往右下伸出槽口,末端的托腳托住錘的下緣
const UPPER = [[0, 0], [-0.25, 0.55]];
const LOWER = [[0, 0], [0.14, -0.3], [0.2, -0.48]];
const CATCH_UPPER = thickLine(UPPER, 0.09);
const FOOT = rect(0.24, 0.08, 0.22, -0.5);
// 頂桿上的推銷(頂桿局部座標):在上臂的左下方,頂桿被推上時頂著上臂的左緣
const PIN = { at: [-0.13, 0.45], r: 0.045 }; // 卡榫平時靠在推銷上(上臂的左緣貼著推銷)

/** 頂桿被推上 push 時卡榫的轉角:推銷頂著上臂,卡榫順時針轉開到剛好不碰(由接觸算) */
function catchAngleFor(push) {
  // 推銷在卡榫座標裡的位置(兩者都裝在桿上,相對位置只差頂桿的推上量)
  const pin = circlePolygon([PLUNGER_X + PIN.at[0] - CATCH[0], PLUNGER_TOP + PIN.at[1] + push - CATCH[1]], PIN.r, 12);
  const hits = (a) => polygonsOverlap(placeOutline(CATCH_UPPER, [0, 0], a), pin);
  if (!hits(0)) return 0;
  let [lo, hi] = [0, 1.2];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (hits(-mid)) lo = mid;
    else hi = mid;
  }
  return -hi;
}
// 托腳最外側離錘心軸線的距離:小於錘孔半徑就托不住錘
const footReach = (angle) => Math.max(...placeOutline(FOOT, [CATCH[0], 0], angle).map(([x]) => x));

function rodAt(t) {
  if (t < P.touch) return TOP + (CONTACT - TOP) * (t / P.touch);
  if (t < P.pushed) return CONTACT - PUSH * ((t - P.touch) / (P.pushed - P.touch));
  if (t < P.lift) return CONTACT - PUSH;
  if (t < P.back) return CONTACT - PUSH + (TOP - CONTACT + PUSH) * smooth((t - P.lift) / (P.back - P.lift));
  return TOP;
}
const pushAt = (rod) => clamp(SEA - (rod + FOOT_BOTTOM), 0, PUSH);
// 錘脫落的那一刻:頂桿推著卡榫轉開,托腳退進錘孔以內(逐步往前找,再以二分法逼近)
const T_RELEASE = (() => {
  const free = (t) => footReach(catchAngleFor(pushAt(rodAt(t)))) < HOLE;
  let lo = P.touch;
  let hi = P.pushed;
  if (!free(hi)) throw new Error("第 247 種:頂桿推到底,卡榫仍托著錘");
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (free(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
})();
const RELEASED_AT = rodAt(T_RELEASE);

/** 進程 p → 桿(錘心原位)的高度、頂桿被推上的量、卡榫轉角、錘心高度與錘是否還在 */
export function sounding(p) {
  const t = ((p % 1) + 1) % 1;
  const rod = rodAt(t);
  const push = pushAt(rod);
  let weight = rod;
  if (t >= T_RELEASE) weight = RELEASED_AT + (REST - RELEASED_AT) * falling((t - T_RELEASE) / DROP);
  return { rod, push, catchAngle: catchAngleFor(push), weight, attached: t < T_RELEASE, shown: t < P.gone };
}
export const geometry = { SEA, BALL, REST, HOLE, T_RELEASE, footReach };

const ballProfile = [
  [HOLE, -Math.sqrt(BALL * BALL - HOLE * HOLE)],
  ...Array.from({ length: 19 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 18) * Math.PI;
    return [Math.max(HOLE, BALL * Math.cos(a)), BALL * Math.sin(a)];
  }).slice(1, -1),
  [HOLE, Math.sqrt(BALL * BALL - HOLE * HOLE)],
];

export default {
  figure: 247,
  parts: [
    { id: "seabed", kind: "box", center: [0, SEA - 0.15, 0], size: [3.6, 0.3, 1.6] },
    { id: "rod", kind: "box", size: [0.3, 3.4, 0.3] },
    { id: "weight", kind: "lathe", axis: Y, profile: ballProfile, ...backHalf(Y) },
    {
      id: "catch",
      kind: "plate",
      shape: shape(thickLine(LOWER, 0.09), [circle(0.03).reverse()]),
      thickness: 0.12,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(FOOT), thickness: 0.12 },
        { kind: "plate", shape: shape(CATCH_UPPER), thickness: 0.12 },
      ],
    },
    {
      id: "plunger",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 0.6, 0.12], at: [0, -1.0, 0] }, // 頂桿本體(頂端停在卡榫托腳的下面)
        { kind: "box", size: [0.36, 0.12, 0.36], at: [0, -1.3, 0] },
        { kind: "box", size: [0.05, 1.17, 0.06], at: [-0.21, -0.115, 0] }, // 從頂桿伸上去的細桿(在卡榫的左邊),頂上橫伸一小段托著推銷
        { kind: "box", size: [0.09, 0.05, 0.06], at: [-0.18, PIN.at[1], 0] },
        { kind: "cylinder", radius: PIN.r, length: 0.12, at: [...PIN.at, 0] },
      ],
    },
  ],
  powered: ["weight"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  // 動力重演:只推進程(桿與頂桿照進程走);錘沿桿上下、受重力,由卡榫的托腳托著,托腳轉開後自己落到海底
  replay: {
    to: 0.7,
    seconds: 14,
    free: { weight: { slide: [0, 1, 0] } },
    ignore: [["weight", "rod"], ["weight", "plunger"]], // 錘套在桿上;頂桿的腳在錘孔裡
    expect: [
      { at: T_RELEASE - 0.03, part: "weight", label: "頂桿觸底前,錘由卡榫托著隨桿下降" },
      { at: T_RELEASE + DROP + 0.04, part: "weight", label: "卡榫被抽開,錘脫落到海底", quote: "將卡榫從錘的下方抽出，錘便會脫落" },
      { at: 0.7, part: "weight", label: "桿被拉起,錘留在海底", quote: "讓桿在不帶錘的情況下被拉起" },
    ],
  },
  waivers: [
    {
      check: "replay",
      parts: ["weight"],
      reason:
        "重演做不出來:原圖是剖面,錘只畫後半(半個旋轉殼),卡榫與頂桿畫在桿的前面(實物在空心桿裡),立體裡卡榫的托腳托不到錘;半殼的碰撞形狀在重演裡也近乎沒有質量,錘一開始就不動。錘從托腳退進錘孔那一刻起加速落到海底,由測試驗",
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },
  target: "weight", // 被釋放的測深錘
  view: { direction: [0.05, 0.08, 1] },
  pose(p) {
    const s = sounding(p);
    return {
      parts: {
        rod: { position: [0, s.rod + 0.6, 0] },
        weight: { position: [0, s.weight, 0], visible: s.shown },
        catch: { position: [CATCH[0], s.rod + CATCH[1], 0.22], angle: s.catchAngle }, // 卡榫與頂桿畫在桿的前面(實物是在空心桿裡)
        plunger: { position: [PLUNGER_X, s.rod + PLUNGER_TOP + s.push, 0.22] },
      },
      readouts: [],
    };
  },
};
