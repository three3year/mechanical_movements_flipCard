// 第 478 種:另一種蒸汽疏水器(Ray 的專利)。閥門 a 隨廢水管的縱向伸縮開閉:廢水管 A 的末端在附屬的空心球 C 的中央,
// 管子有一段牢牢固定在支座 B 上。閥門是一根在球上的填料函裡作動的柱塞,對著管端,由加重的肘形槓桿 D 推向管端,
// 推進的程度受擋止螺絲 b 與擋止 c 限制。管裡充滿水時,管長縮短,閥門保持打開;充滿蒸汽時,管子膨脹使閥門關閉。
// 螺絲 b 用來調整閥門的作動。
// 主動件是虛擬的「管內溫度」(從水到蒸汽)。
// 推斷:管子的伸長與溫度成正比(放大顯示);管端碰到柱塞時把它頂回、封住。
// 槓桿 D 由接觸算:鉸在右上的支架上,重球在支點右邊,重量使下臂往左壓在柱塞的右端;柱塞往左最多推到
// 擋止螺絲 b(照原圖穿過下臂的下端、頭在右)的尖端頂上從底座立起的擋止 c(2026-10-20 改;原本把 b 鎖在 c 上)。
// 管子膨脹把柱塞往右頂時,下臂被柱塞推回、重球抬起。管端另畫一個管口(實體),跟著管子伸縮。
// 球 C 剖開:前面是剖面的環(在管子、柱塞與出口三處開孔),後面是半球殼;兩側照原圖各有填料函(凸台,推斷:
// 管子那側的原圖畫得出凸台,柱塞那側原文說「在球上的填料函裡作動」),凸台在剖面上是管子上下的兩塊。底座延伸到支架下面。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine, arcPoints, hubArms } from "./shapes.js";

const FIXED = -2.4; // 管子固定在支座 B 處
export const END0 = 0.75; // 冷(水)時的管端
export const GROW = 0.35; // 冷到熱的伸長(放大)
export const STOP = 0.95; // 擋止讓柱塞最多推到這裡
export const SHELL = { center: [0.85, 0, 0], r: 0.75, t: 0.07, depth: 0.3 }; // 空心球 C:內半徑、壁厚、剖面環的深度
const PIPE_R = 0.12;
const HOLE = { pipe: PIPE_R + 0.03, plunger: 0.12, outlet: 0.15 }; // 球殼上三個孔的半徑(管子、柱塞、出口)

export const PLUNGER = 1.2; // 柱塞長
export const PIVOT = [2.6, 0.55]; // 槓桿 D 的支點
export const ARM_W = 0.08; // 下臂寬
export const PLUNGER_R = 0.1;
const ARM = 1.0; // 下臂長
/** 柱塞右端在 x 時,壓在它上面的下臂的轉角(逆時針為正;下臂朝下往左斜,左側面貼著柱塞右端的下緣) */
export function leverAngle(x) {
  const dx = PIVOT[0] - x;
  const dy = PIVOT[1] + PLUNGER_R;
  return Math.atan2(dy, dx) - Math.acos(ARM_W / 2 / Math.hypot(dx, dy));
}

/** 管內溫度 t(0 水、1 蒸汽)→ 管端、柱塞位置、槓桿轉角、閥門是否打開 */
export function trap(t0) {
  const t = clamp(t0, 0, 1);
  const end = END0 + GROW * t;
  const plunger = Math.max(STOP, end);
  return { end, plunger, lever: leverAngle(plunger + PLUNGER), open: end < STOP - 1e-9, gap: Math.max(0, STOP - end) };
}
// 擋止螺絲 b(槓桿的附件,局部座標):穿過下臂下端、尖端在左、頭在右;擋止 c:柱塞在 STOP 時尖端剛好頂著 c 的右側面
const SCREW = { at: [0.03, -ARM + 0.04], length: 0.3, r: 0.025 }; // 在柱塞下方,擋止 c 的頂也在柱塞下方
const REST = leverAngle(STOP + PLUNGER);
const TIP = [SCREW.at[0] - SCREW.length / 2, SCREW.at[1]]; // 尖端(局部)
const STOP_X = PIVOT[0] + TIP[0] * Math.cos(REST) - TIP[1] * Math.sin(REST); // 尖端在 REST 時的世界座標 = c 的右側面
const STOP_Y = PIVOT[1] + TIP[0] * Math.sin(REST) + TIP[1] * Math.cos(REST);
const BASE_TOP = -0.49;
// 球殼剖面的環:在管子(左)、柱塞(右)、出口(下)三處斷開
const shellArcs = () => {
  const rm = SHELL.r + SHELL.t / 2;
  const [aL, aR, aB] = [HOLE.pipe, HOLE.plunger, HOLE.outlet].map((h) => Math.asin(h / rm));
  return [[aR, Math.PI - aL], [Math.PI + aL, 1.5 * Math.PI - aB], [1.5 * Math.PI + aB, 2 * Math.PI - aR]].map(([a0, a1]) => ({ kind: "plate", role: "shell", shape: shape(thickLine(arcPoints(rm, a0, a1, SHELL.center[0], 0), SHELL.t)), thickness: SHELL.depth }));
};
// 後半的球殼(繞 z 的旋轉體,只畫剖面環後面的那一段)
const shellBack = () => {
  const z0 = -SHELL.depth / 2;
  const [ro, ri] = [SHELL.r + SHELL.t, SHELL.r];
  const arc = (r, from, to, n = 16) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n).map((z) => [Math.sqrt(Math.max(0, r * r - z * z)), z]);
  return { kind: "lathe", axis: [0, 0, 1], profile: [...arc(ro, -ro, z0), ...arc(ri, z0, -ri)], at: [SHELL.center[0], 0, 0] };
};

export default {
  figure: 478,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [5.4, 0.12, 0.8], at: [0.3, -0.55, 0] }, // 底座一直延伸到槓桿支架與擋止 c 的下面(原圖的底座延伸到 b 的右邊)
        { kind: "box", size: [0.5, 0.45, 0.6], at: [FIXED, -0.3, 0] },
        // 空心球 C:剖面的環(三處開孔)、後半的球殼、下面的出口(兩道壁,夾著環上的出口孔)
        ...shellArcs(),
        shellBack(),
        ...[-1, 1].map((s) => ({ kind: "plate", shape: shape(thickLine([[SHELL.center[0] + s * (HOLE.outlet + 0.03), -0.72], [SHELL.center[0] + s * (HOLE.outlet + 0.03), -1.1]], 0.06)), thickness: SHELL.depth })),
        // 兩側的填料函(凸台;剖面上是管子 / 柱塞上下的兩塊)
        ...[-1, 1].map((s) => ({ kind: "box", role: "gland", size: [0.3, 0.1, SHELL.depth], at: [SHELL.center[0] - SHELL.r - 0.1, s * (HOLE.pipe + 0.05), 0] })),
        ...[-1, 1].map((s) => ({ kind: "box", role: "gland", size: [0.35, 0.1, SHELL.depth], at: [SHELL.center[0] + SHELL.r + 0.12, s * (HOLE.plunger + 0.05), 0] })),
        // 擋止 c(從底座立起,在槓桿下端的左邊):右側面在螺絲尖端頂到的地方
        { kind: "box", role: "stop", size: [0.1, STOP_Y + 0.06 - BASE_TOP, 0.2], at: [STOP_X - 0.05, (STOP_Y + 0.06 + BASE_TOP) / 2, 0] },
        // 槓桿 D 的支架與樞軸銷
        { kind: "box", size: [0.12, PIVOT[1] - BASE_TOP, 0.12], at: [PIVOT[0] + 0.12, (PIVOT[1] + BASE_TOP) / 2, -0.12] },
        { kind: "box", size: [0.24, 0.1, 0.12], at: [PIVOT[0] + 0.06, PIVOT[1], -0.12] },
        { kind: "cylinder", radius: 0.03, length: 0.3, at: [PIVOT[0], PIVOT[1], -0.05] },
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [FIXED, 0.15, 0.5] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [SHELL.center[0], SHELL.r + 0.2, 0.4] },
    { id: "labelb", kind: "group", pieces: [], label: "b", labelOffset: [STOP_X + 0.45, STOP_Y - 0.12, 0.4] },
    { id: "labelc", kind: "group", pieces: [], label: "c", labelOffset: [STOP_X - 0.2, STOP_Y + 0.12, 0.4] },
    { id: "pipe", kind: "rod", radius: PIPE_R, stretch: "廢水管 A 受熱伸長、遇水縮短是原理(原文「管子膨脹使閥門關閉」),伸縮量放大顯示", label: "A", labelOffset: [-1.2, 0.3, 0.3] }, // 路徑零件的標籤從原點量起
    { id: "plunger", kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 1.2, arrow: false, label: "a", labelOffset: [-0.35, 0.25, 0.3] },
    // 槓桿 D:支點在局部原點(有圓形輪轂,樞軸孔整個在外形裡),下臂往下 ARM,重球的臂往右上;擋止螺絲 b 穿過下臂的下端
    {
      id: "lever",
      kind: "plate",
      shape: shape(hubArms(0.09, ARM_W, [{ angle: -Math.PI / 2, length: ARM }, { angle: Math.atan2(0.3, 0.35), length: Math.hypot(0.35, 0.3) }]), [circle(0.035, 0, 0).reverse()]),
      thickness: 0.08,
      arrow: false,
      label: "D",
      labelOffset: [0.45, 0.55, 0.3],
      pieces: [
        { kind: "sphere", radius: 0.18, at: [0.42, 0.36, 0] },
        { kind: "cylinder", role: "screw", radius: SCREW.r, length: SCREW.length, axis: [1, 0, 0], at: [SCREW.at[0], SCREW.at[1], 0] },
        { kind: "cylinder", radius: 0.045, length: 0.03, axis: [1, 0, 0], at: [SCREW.at[0] + SCREW.length / 2 + 0.015, SCREW.at[1], 0] }, // 頭(在右)
      ],
    },
    { id: "nozzle", kind: "cylinder", axis: [1, 0, 0], radius: PIPE_R + 0.03, length: 0.08, arrow: false }, // 管口(跟著管子伸縮)
  ],
  // 動力重演:柱塞在填料函裡沿 x 滑,只受管口與槓桿 D 的推;槓桿只受重力與柱塞、擋止(經螺絲 b)的碰撞
  replay: {
    free: { plunger: { slide: [1, 0, 0], gravity: false }, lever: { pivot: [PIVOT[0], PIVOT[1], 0] } },
    expect: [
      { at: 0.4, part: "plunger", label: "管裡是水:槓桿把柱塞推到擋止為止,閥門開著", quote: "當管內充滿水時,其長度縮短到閥門保持開啟" },
      { at: 0.4, part: "lever", label: "槓桿的擋止螺絲 b 頂在擋止 c 上" },
      { part: "plunger", label: "管裡是蒸汽:管子膨脹把柱塞頂回、閥門關閉", quote: "當充滿蒸汽時,管子膨脹使閥門關閉" },
      { part: "lever", label: "槓桿被柱塞推回、重球抬起" },
    ],
  },
  powered: ["pipe", "nozzle"], // 外力來源:管子受熱伸縮(管口跟著管子走)
  driver: { type: "virtual", label: "管內溫度", mode: "balance", range: [0, 1], initial: 0.2, format: (t) => (t < 0.5 ? "水" : "蒸汽") },
  target: "plunger",
  view: { direction: [0.08, 0.1, 1] },
  pose(t) {
    const s = trap(t);
    const flows = s.open ? [{ fluid: "water", points: stream([[FIXED + 0.3, 0, 0.3], [s.end, 0, 0.3], [SHELL.center[0], -0.3, 0.3], [SHELL.center[0], -1.2, 0.3]], t * 30, { spacing: 0.18 }) }] : [];
    return {
      parts: {
        plunger: { position: [s.plunger + PLUNGER / 2, 0, 0] },
        lever: { position: [PIVOT[0], PIVOT[1], 0], angle: s.lever },
        nozzle: { position: [s.end - 0.04, 0, 0] },
      },
      paths: { pipe: { points: [[FIXED - 0.3, 0, 0], [s.end, 0, 0]], closed: false } }, // 管子從固定處伸到管端(隨溫度伸縮)
      flows,
      readouts: [{ label: "閥門 a", value: s.open ? `打開(間隙 ${s.gap.toFixed(2)}),水排出` : "管子膨脹頂住柱塞,關閉" }],
    };
  },
};
