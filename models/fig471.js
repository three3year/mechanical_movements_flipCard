// 第 471 種:Hotchkiss 的大氣錘,打擊的力量來自壓縮空氣。錘頭 C 接在汽缸 B 裡的活塞上,汽缸經桿 D 接到旋轉驅動軸上的
// 曲柄 A。汽缸上升時,從進氣孔 e 進來的空氣在活塞下方被壓縮,把錘抬起;汽缸下降時,從進氣孔 e 進來的空氣在上方被壓縮
// 並儲存起來,等曲柄與連桿越過下死點後,靠它的瞬間膨脹打擊。
// 主動件是曲柄 A。
// 照原圖重排(2026-10-20 決定 (a)):汽缸 B 在機架窗口的頂端,下面是填滿窗口寬度的錘身(原圖標 A 的那一大塊)、底下接錘頭 C;
// 曲柄 A 在窗口底、砧的上方,曲柄軸穿過機架背後的軸承(窗口後面橫跨的軸承橋,推斷)與錘身上的長槽(推斷:原圖曲柄是
// 藏在錘身後面的虛線);桿 D 從曲柄銷往上接到汽缸頂的銷。原圖的曲柄與桿 D 藏在錘身後面(虛線),模型把曲柄臂、曲柄銷與
// 桿 D 放在錘身前面那一層:主動件要看得到、抓得到。汽缸兩端的凸緣與錘身都貼著窗口的兩側滑(導引)。
// 推斷:錘的運動落後汽缸,當作汽缸運動延遲一段相位再放大(空氣墊的彈性),碰到砧時停住。
// 進氣孔只有 e 一個,照原圖開在汽缸壁的中段(汽缸壁上的小圓記號):活塞在孔的上方時空氣從它進到活塞下方,在孔的下方時進到上方。
import { Y, X, deg, clamp } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, rect, circle, arcPoints } from "./shapes.js";

const CRANK = [0, -0.2, 0]; // 曲柄軸(窗口底、砧的上方)
const R = 0.28;
const ROD = 2.7; // 桿 D:曲柄銷到汽缸頂的銷
export const CYL_LEN = 1.3; // 汽缸外高(含兩個蓋)
export const CAP = 0.08;
const CYL_R = 0.32;
const FLANGE = 0.44; // 汽缸兩端凸緣的半徑:貼著窗口兩側
export const ANVIL_TOP = -1.6;
const PISTON_ROD = 1.5; // 活塞中心到錘身頂
const BODY = { w: 0.88, h: 1.3 }; // 錘身:填滿窗口寬度
const HEAD = { w: 0.6, h: 0.35 };
const SHAFT_R = 0.08;
const SLOT = [0.2, 1.18]; // 錘身上讓曲柄軸穿過的長槽(錘身局部,從錘身底起算)
const WINDOW = 0.45; // 窗口的半寬
const LAG = deg(55);
const PLATE_Z = [-0.45, 0.3]; // 機架板(窗口是穿透的)
const CRANK_Z = 0.34; // 曲柄臂那一層(錘身前面)
const ROD_Z = 0.45; // 桿 D 那一層

const TOP_PIN = 0.04; // 汽缸頂的銷在外頂下多少
/** 曲柄轉 theta → 曲柄銷、汽缸外頂的高度(桿 D 上端的銷在外頂下 TOP_PIN) */
const cylTop = (theta) => {
  const pin = [CRANK[0] + R * Math.cos(theta), CRANK[1] + R * Math.sin(theta)];
  return { pin, top: pin[1] + Math.sqrt(ROD * ROD - (pin[0] - CRANK[0]) ** 2) + TOP_PIN };
};

/** 曲柄轉 theta → 汽缸頂的高度、錘頭(活塞)的高度;free 是空氣墊給的位置(沒碰砧時 piston = free) */
export function hammer(theta) {
  const { pin, top } = cylTop(theta);
  const lagged = cylTop(theta - LAG).top;
  const mid = CRANK[1] + ROD + TOP_PIN; // 汽缸頂的中間位置
  // 活塞相對汽缸的位置:落後並放大
  const free = mid - CYL_LEN / 2 + (lagged - mid) * 1.6;
  const headBottom = (p) => p - PISTON_ROD - BODY.h - HEAD.h;
  let piston = free;
  if (headBottom(piston) < ANVIL_TOP) piston = ANVIL_TOP + PISTON_ROD + BODY.h + HEAD.h;
  // 活塞留在汽缸裡(測試確認這道夾住從沒生效)
  piston = clamp(piston, top - CYL_LEN + CAP + 0.12, top - CAP - 0.12);
  return { cyl: top, piston, free, pin, strike: headBottom(piston) <= ANVIL_TOP + 1e-6 };
}

// 錘身的長槽(兩端半圓)
const slot = (y0, y1, r) => [...arcPoints(r, 0, Math.PI, 0, y1), ...arcPoints(r, Math.PI, 2 * Math.PI, 0, y0)];
const column = shape(
  [[-1.5, -2.7], [1.5, -2.7], [1.0, -1.6], [0.6, -1.0], [0.55, 2.9], [0.75, 2.9], [0.75, 3.15], [-0.75, 3.15], [-0.75, 2.9], [-0.55, 2.9], [-0.6, -1.0], [-1.0, -1.6]],
  [[[-WINDOW, 2.85], [WINDOW, 2.85], [WINDOW, ANVIL_TOP - HEAD.h], [-WINDOW, ANVIL_TOP - HEAD.h]].reverse()],
);

export default {
  figure: 471,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: column, thickness: PLATE_Z[1] - PLATE_Z[0], at: [0, 0, (PLATE_Z[0] + PLATE_Z[1]) / 2], role: "column" },
        // 砧:在窗口的底,填滿窗口寬度
        { kind: "box", size: [2 * WINDOW, HEAD.h, PLATE_Z[1] - PLATE_Z[0]], at: [0, ANVIL_TOP - HEAD.h / 2, (PLATE_Z[0] + PLATE_Z[1]) / 2] },
        // 曲柄軸的軸承橋(推斷):橫跨在窗口背後的一塊板,開軸孔,孔上一圈軸承環
        { kind: "plate", shape: shape(rect(1.4, 0.5, CRANK[0], CRANK[1]), [circle(SHAFT_R + 0.005, CRANK[0], CRANK[1]).reverse()]), thickness: 0.15, at: [0, 0, PLATE_Z[0] - 0.075] },
        { kind: "cylinder", radius: 0.16, inner: SHAFT_R + 0.005, length: 0.15, at: [CRANK[0], CRANK[1], PLATE_Z[0] - 0.075] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      label: "A",
      labelOffset: [-0.25, -0.4, 0.5],
      spin: R + 0.12,
      pieces: [
        { kind: "plate", shape: shape([[-0.1, -0.12], [R, -0.08], [R, 0.08], [-0.1, 0.12]]), thickness: 0.08, at: [0, 0, CRANK_Z], mark: [R * 0.55, 0], markSize: 0.05 },
        // 曲柄軸:從背後的軸承橋穿過錘身的長槽到前面的曲柄臂
        { kind: "cylinder", radius: SHAFT_R, length: CRANK_Z + 0.04 - (PLATE_Z[0] - 0.17), at: [0, 0, (CRANK_Z + 0.04 + PLATE_Z[0] - 0.17) / 2], role: "shaft" },
        { kind: "cylinder", radius: 0.05, length: 0.24, at: [R, 0, CRANK_Z + 0.08], role: "pin" }, // 曲柄銷:往前伸到桿 D 那一層
      ],
    },
    { id: "rodD", kind: "link", width: 0.1, thickness: 0.06, label: "D", labelOffset: [0.3, 0, 0.3] },
    {
      id: "cylinder",
      kind: "group",
      label: "B",
      labelOffset: [-0.05, 0.85, 0.5],
      arrow: false,
      pieces: [
        // 汽缸(剖開前半):兩端有貼著窗口的凸緣,底蓋留活塞桿的孔
        { kind: "lathe", axis: Y, profile: [[0.08, 0], [FLANGE, 0], [FLANGE, 0.1], [CYL_R + 0.07, 0.1], [CYL_R + 0.07, CYL_LEN - 0.1], [FLANGE, CYL_LEN - 0.1], [FLANGE, CYL_LEN], [0, CYL_LEN], [0, CYL_LEN - CAP], [CYL_R, CYL_LEN - CAP], [CYL_R, CAP], [0.08, CAP]], ...backHalf(Y) },
        { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, CYL_LEN - TOP_PIN, 0.2], role: "pin" }, // 頂蓋上接桿 D 的銷(往前伸到桿 D 那一層)
        { kind: "cylinder", axis: X, radius: 0.045, length: 0.1, at: [-(CYL_R + 0.07) + 0.02, CYL_LEN / 2, -0.12], accent: true }, // 進氣孔 e(原圖壁上的小圓)
      ],
    },
    { id: "holeE", kind: "group", pieces: [], label: "e", labelOffset: [-0.55, 0, 0.4] },
    {
      id: "hammer",
      kind: "group",
      arrow: false,
      label: "C",
      labelOffset: [0.5, -PISTON_ROD - BODY.h - 0.2, 0.4],
      pieces: [
        { kind: "cylinder", axis: Y, radius: CYL_R - 0.02, length: 0.14, role: "piston" },
        { kind: "cylinder", axis: Y, radius: 0.06, length: PISTON_ROD, at: [0, -PISTON_ROD / 2, 0] },
        // 錘身:填滿窗口寬度的大塊,開一道長槽讓曲柄軸穿過
        { kind: "plate", shape: shape(rect(BODY.w, BODY.h), [slot(SLOT[0] - BODY.h / 2, SLOT[1] - BODY.h / 2, SHAFT_R + 0.01).reverse()]), thickness: 0.5, at: [0, -PISTON_ROD - BODY.h / 2, 0], role: "body" },
        { kind: "box", size: [HEAD.w, HEAD.h, 0.5], at: [0, -PISTON_ROD - BODY.h - HEAD.h / 2, 0] },
      ],
    },
  ],
  powered: ["hammer"], // 外力來源:錘(活塞)是被汽缸裡的空氣墊帶動的,和汽缸之間沒有實體相連
  driver: { part: "crank", type: "rotation" },
  target: "hammer",
  view: { direction: [0.1, 0.08, 1] },
  pose(theta) {
    const h = hammer(theta);
    const gapBelow = h.piston - (h.cyl - CYL_LEN);
    return {
      parts: {
        crank: { angle: theta },
        rodD: { from: [h.pin[0], h.pin[1], ROD_Z], to: [0, h.cyl - TOP_PIN, ROD_Z] },
        cylinder: { position: [0, h.cyl - CYL_LEN, 0] },
        holeE: { position: [0, h.cyl - CYL_LEN / 2, 0] },
        hammer: { position: [0, h.piston, 0] },
      },
      readouts: [
        { label: "活塞下方的空氣", value: gapBelow < CYL_LEN * 0.35 ? "被壓縮(抬錘)" : "—" },
        { label: "錘", value: h.strike ? "打在砧上" : "—" },
      ],
    };
  },
};
