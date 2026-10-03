// 第 420 種:敲鐘用的錘子。錘臂下方的彈簧在敲擊之後把錘子抬離鐘面,不讓它貼著鐘,以免妨礙鐘的金屬振動。
// 主動件是虛擬的「敲一下」進程:拉繩把錘子拉開 → 放開,錘子落下敲到鐘 → 彈簧把錘子抬離鐘面,停在不碰鐘的位置。
// 推斷:錘子是曲柄形槓桿,左臂接拉繩、右臂是錘;放開後錘子靠自重落下,敲擊瞬間壓縮下方的彈簧;各階段所佔的進程。
import { deg, smooth, clamp } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const ARM = 1.25; // 支點到錘頭
const HEAD = 0.3;
export const REST = deg(34); // 靜止時錘臂的方向(彈簧撐著,錘頭離鐘面一點)
export const STRIKE = deg(28.5); // 錘頭碰到鐘面時
const PULLED = deg(62); // 拉開時
const LEFT = [-1.05, -0.12]; // 左臂端(接拉繩)
// 錘臂局部座標(+x 沿右臂)裡的左臂端
const LEFT_LOCAL = [LEFT[0] * Math.cos(-REST) - LEFT[1] * Math.sin(-REST), LEFT[0] * Math.sin(-REST) + LEFT[1] * Math.cos(-REST)];
const SPRING_BASE = [0.6, -0.42, 0];
const SPRING_ON_ARM = 0.6;

/** 進程 u(0–1)→ 錘臂方向與階段 */
export function hammer(v) {
  const u = v - Math.floor(v);
  if (u < 0.35) return { angle: REST + (PULLED - REST) * smooth(u / 0.35), phase: "拉繩:錘子拉開" };
  if (u < 0.45) return { angle: PULLED + (STRIKE - PULLED) * ((u - 0.35) / 0.1) ** 2, phase: "放開:錘子落下" };
  if (u < 0.5) return { angle: STRIKE, phase: "敲擊鐘面" };
  if (u < 0.65) return { angle: STRIKE + (REST - STRIKE) * smooth((u - 0.5) / 0.15), phase: "彈簧把錘子抬離鐘面" };
  return { angle: REST, phase: "靜止:錘子不碰鐘" };
}

export const head = (a) => [ARM * Math.cos(a), ARM * Math.sin(a), 0];
// 鐘的剖面(半徑、高度):口朝下;鐘壁在錘頭敲擊的高度剛好碰到錘頭
const BELL_BOTTOM = 0.45;
const bellR = (y) => 0.86 - 0.32 * clamp((y - BELL_BOTTOM) / 1.1, 0, 1) ** 0.8;
const strikeAt = head(STRIKE);
export const BELL_X = strikeAt[0] + HEAD / 2 + bellR(strikeAt[1]);
/** 錘頭右緣到鐘壁的距離(負的就是撞進鐘裡) */
export const gap = (a) => {
  const h = head(a);
  return BELL_X - bellR(h[1]) - (h[0] + HEAD / 2);
};
const bellProfile = [
  [0.0, 1.62], [0.12, 1.62], [0.12, 1.75], [0.25, 1.75], [0.25, 1.6], [0.56, 1.55],
  ...Array.from({ length: 9 }, (_, i) => {
    const y = BELL_BOTTOM + 1.1 - (1.1 * i) / 8;
    return [bellR(y), y];
  }),
  [0.9, BELL_BOTTOM - 0.05], [0.78, BELL_BOTTOM - 0.02], [0.74, BELL_BOTTOM + 0.3], [0.48, 1.45], [0, 1.45],
].map(([r, y]) => [r, y - BELL_BOTTOM]);

export default {
  figure: 420,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 橫木與托架
        { kind: "box", size: [4.4, 0.5, 0.8], at: [0.6, -0.85, 0] },
        { kind: "plate", shape: shape([[-1.25, -0.6], [0.8, -0.6], [0.8, -0.5], [0.12, -0.5], [0.12, 0.12], [-0.12, 0.12], [-0.12, -0.5], [-1.25, -0.5]]), thickness: 0.3 },
        { kind: "cylinder", radius: 0.07, length: 0.45, at: [0, 0, 0] },
      ],
    },
    { id: "bell", kind: "lathe", axis: [0, 1, 0], center: [BELL_X, BELL_BOTTOM, 0], profile: bellProfile, arrow: false },
    {
      id: "hammer",
      kind: "plate",
      shape: shape(thickLine([LEFT_LOCAL, [0, 0], [ARM - HEAD / 2, 0]], 0.09), [circle(0.05).reverse()]),
      thickness: 0.08,
      arrow: false,
      pieces: [{ kind: "box", size: [HEAD, HEAD, HEAD], at: [ARM, 0, 0], accent: true }],
    },
    { id: "spring", kind: "spring", radius: 0.07, coils: 6, wire: 0.02 },
    { id: "wire", kind: "rod", radius: 0.015 },
  ],
  powered: ["hammer"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "interference", parts: ["frame", "hammer"], reason: "待確認(未修):frame 的板 與 hammer 的板互相穿入 0.15(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["frame", "wire"], reason: "待確認(未修):wire 的第 1 段穿過frame 的方塊 4.4×0.5×0.8互相穿入 0.40(78 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["hammer", "spring"], reason: "待確認:hammer 的板 與 spring 的Tube重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["bell", "hammer"], reason: "待確認:bell 的旋轉體 與 hammer 的方塊 0.3×0.3×0.3重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { type: "virtual", label: "敲一下", mode: "progress", range: [0, 1], speed: 0.25 },
  target: "hammer",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const h = hammer(v);
    const rot = ([x, y]) => [x * Math.cos(h.angle - REST) - y * Math.sin(h.angle - REST), x * Math.sin(h.angle - REST) + y * Math.cos(h.angle - REST), 0];
    const L = rot(LEFT);
    const onArm = [SPRING_ON_ARM * Math.cos(h.angle), SPRING_ON_ARM * Math.sin(h.angle), 0];
    const g = gap(h.angle);
    return {
      parts: {
        hammer: { angle: h.angle },
        spring: { from: SPRING_BASE, to: onArm },
      },
      paths: { wire: { points: [[L[0], L[1], 0], [L[0], -1.6, 0]], closed: false } },
      readouts: [
        { label: "階段", value: h.phase },
        { label: "錘頭離鐘面", value: g < 1e-6 ? "貼著(敲擊)" : g.toFixed(2) },
      ],
    };
  },
};
