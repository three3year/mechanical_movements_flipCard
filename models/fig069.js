// 第 69 種:有單一齒的小輪 B 是驅動端(逆時針);B 每轉一圈,齒進到 A 的齒間、推著一個齒走,A 轉過一齒(順時針)。
// 小齒沒在作動的期間,B 的圓周嵌在 A 相鄰兩個齒尖之間(B 的圓周比 A 的齒尖圓深進去一點點),
// A 的齒尖頂著 B 的圓周轉不動——原文說 A 上齒與齒之間的圓周部分起到鎖定或擋止的作用。
// A 的轉角由接觸算:B 的齒是推 A 的障礙物,A 被推到剛好不與齒重疊的位置(查表,載入時算好)。
// 推斷:A 取 20 齒(原圖約 30 齒;齒再細,B 的齒沿弧線掃過時就會一次掃到兩個齒),齒根留平的齒槽。
import { TAU, deg, polar } from "./kit.js";
import { arcPoints, circle, polarOutline, shape } from "./shapes.js";
import { placeOutline, polygonsOverlap } from "./contact.js";

const A = { center: [0, 0, 0], tip: 2.0, root: 1.78, teeth: 20 };
const B_R = 0.5; // B 的圓周半徑
const NESTLE = 0.03; // B 的圓周嵌進 A 齒尖圓的深度(兩個齒尖之間放得下)
const TOWARD = deg(25); // B 在 A 的哪個方向
const D = A.tip + B_R - NESTLE;
const B = { center: [D * Math.cos(TOWARD), D * Math.sin(TOWARD), 0] };
const TOOTH_TIP = 0.59; // 齒尖到 B 中心的距離
const STEP = TAU / A.teeth;
export const toothStep = STEP;
const A0 = TOWARD - STEP; // 鎖住時 A 的相鄰兩個齒尖(局部角 ±半個齒距處)對稱地夾著 B 的圓周

// A 的齒:尖齒(齒尖沒有寬度),齒根之間留一段平的齒槽讓 B 的齒進去
const FLAT = 0.22; // 齒槽佔齒距的比例(兩側各)
const aOutline = polarOutline((a) => {
  const f = (((a / STEP) % 1) + 1) % 1;
  const t = Math.max(0, 1 - Math.abs(f - 0.5) / (0.5 - FLAT));
  return A.root + (A.tip - A.root) * t;
}, A.teeth * 10);
// B:圓盤加一個齒(局部 +x 方向);齒前方(B 轉向那一側)的圓周挖一個缺口,
// 推動時被推的那個 A 齒尖要從 B 的圓周這一段通過(原圖 B 在齒旁也是凹進去的)
const tooth = [[0.4, 0.11], [TOOTH_TIP - 0.03, 0.03], [TOOTH_TIP, 0], [TOOTH_TIP - 0.03, -0.03], [0.4, -0.11]];
const RECESS = { from: deg(6), to: deg(70), r: 0.36 };
const bOutline = [
  ...arcPoints(RECESS.r, RECESS.from, RECESS.to),
  ...arcPoints(B_R, RECESS.to, TAU - deg(10)),
  [B_R * Math.cos(deg(-10)), B_R * Math.sin(deg(-10))],
  ...tooth.slice().reverse(),
];

// 齒推 A 的視窗:B 的齒尖進到 A 的齒尖圓之內的那一段 B 轉角(齒朝向 A 的方向為中心)
const TOOTH_TOWARD_A = TOWARD + Math.PI;
const HALF = (() => {
  // 齒尖離 A 中心 = A.tip 時的偏角
  const cos = (D * D + TOOTH_TIP * TOOTH_TIP - A.tip * A.tip) / (2 * D * TOOTH_TIP);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
})();
const WINDOW = { from: TOOTH_TOWARD_A - HALF - deg(2), span: 2 * HALF + deg(4) };

// 查表:視窗內 B 每個轉角對應 A 被推到的轉角(A 順時針,為負;從鎖住的 0 開始)
const SAMPLES = 160;
const TABLE = (() => {
  const aPoly = (angle) => placeOutline(aOutline, [0, 0], A0 + angle);
  const overlap = (theta, aAngle) => polygonsOverlap(placeOutline(tooth, B.center, theta), aPoly(aAngle));
  const out = [];
  let a = 0;
  for (let i = 0; i <= SAMPLES; i++) {
    const theta = WINDOW.from + (WINDOW.span * i) / SAMPLES;
    // A 只被往順時針推:從目前位置往負的方向找第一個不重疊的轉角
    if (overlap(theta, a)) {
      // 從目前位置往前(順時針)一小步一小步找到第一個不重疊的轉角,再二分逼近
      let hi = a;
      let lo = a;
      const stepA = STEP / 60;
      let found = false;
      for (let g = 1; g <= 90; g++) {
        lo = a - g * stepA;
        if (!overlap(theta, lo)) {
          found = true;
          break;
        }
        hi = lo;
      }
      if (!found) throw new Error("第 69 種:B 的齒卡在 A 裡,幾何有誤");
      for (let k = 0; k < 25; k++) {
        const mid = (lo + hi) / 2;
        if (overlap(theta, mid)) hi = mid;
        else lo = mid;
      }
      a = lo;
    }
    out.push(a);
  }
  return out;
})();
// 一次推過的量應是一齒;B 的齒沿弧線掃過,離開 A 時幾何上還差一點,把查表的量等比放大到剛好一齒,
// 讓鎖住的位置每圈一致(A 比推它的齒略早一點到位)
export const PUSHED = TABLE[SAMPLES];
const SCALE = -STEP / PUSHED;

/** B 逆時針轉 v:A 的轉角(順時針,為負) */
export function aAngle(v) {
  const t = v - WINDOW.from;
  const k = Math.floor(t / TAU);
  const u = t - k * TAU;
  let within = -STEP;
  if (u < WINDOW.span) {
    const x = (u / WINDOW.span) * SAMPLES;
    const i = Math.min(SAMPLES - 1, Math.floor(x));
    const f = x - i;
    within = (TABLE[i] + (TABLE[i + 1] - TABLE[i]) * f) * SCALE;
  }
  return A0 - STEP * k + within;
}

export default {
  figure: 69,
  parts: [
    {
      id: "a",
      kind: "plate",
      center: A.center,
      shape: shape(aOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      mark: [1.2, 0],
      markSize: 0.1,
      spin: A.tip,
      label: "A",
      labelOffset: [-0.15, 0.75, 0.3],
    },
    {
      id: "b",
      kind: "plate",
      center: B.center,
      shape: shape(bOutline, [circle(0.08).reverse()]),
      thickness: 0.22,
      hub: 0.14,
      spin: 0.75,
      label: "B",
      labelOffset: [-0.3, 0.55, 0.3],
    },
  ],
  // 動力重演:只推小輪 B;輪 A 靠摩擦定位,由 B 的單齒推動
  replay: { to: 2.446372073156856 + 2 * Math.PI, free: { a: { hold: true } }, expect: [{ part: "a", label: "B 轉一圈,單齒把 A 推過一齒", quote: "A 轉過一齒" }] },
  driver: { part: "b", type: "rotation", initial: WINDOW.from - deg(30), speed: 1.4 },
  target: "a",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { b: { angle: v }, a: { angle: aAngle(v) } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["a"], reason: "未修:動力重演不成立——「B 轉一圈,單齒把 A 推過一齒」預期 a 在主動量 8.73 時已轉 -18°,實際沒動()。重演中 A 的齒尖一直被 B 的圓周卡住,單齒進來時推不動;B 的圓周在單齒兩側要有讓 A 的齒尖通過的缺口,模型沒有畫(列入待確認清單)" },
  ],
};
