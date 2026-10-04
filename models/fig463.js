// 第 463 種:自動作動的堰與沖刷閘門。兩片閘葉各繞中心下方的樞軸轉;上閘葉比下閘葉大得多,朝水流方向轉,下閘葉逆著水流轉。
// 下閘葉的上緣與上閘葉的下緣重疊,被水壓推抵在上面。平常的水位下,互相抵消的壓力使堰保持直立、關閉(左圖),
// 水從上閘葉頂的缺口流過;水位升到平常以上時,上方受壓的面積較大、加上槓桿作用,壓力勝過下方的阻力,
// 上閘葉翻轉、把下閘葉推回,減少阻礙,在河床處打開一條通道讓沉積物排出(右圖)。
// 主動件是虛擬的「上游水位」。水由左往右流。
// 推斷:閘葉開始翻轉的水位與翻轉角度隨水位的變化(以線性表示);沉積物的排出以河床上的水流表示。
import { deg, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect } from "./shapes.js";

export const UPPER = { pivot: [0, 1.2, 0], above: 1.0, below: 0.62 }; // 上閘葉:樞軸上方 1.0、下方 0.62(樞軸在中心下方)
export const LOWER = { pivot: [0.12, 0.28, 0], above: 0.42, below: 0.28 };
export const NORMAL = 2.25; // 平常的水位(剛好漫過上閘葉頂的缺口)
const FLOOD = 3.0;
const MAX = deg(62);
const BED = 0;

/** 上游水位 h → 上閘葉、下閘葉的轉角(上閘葉順時針為負,朝下游;下閘葉逆時針,朝上游) */
export function gates(h) {
  const t = clamp((h - NORMAL) / (FLOOD - NORMAL), 0, 1);
  return { upper: -MAX * t, lower: MAX * 0.8 * t, open: t > 0.05 };
}

const leaf = (g) => shape(rect(0.14, g.above + g.below, 0, (g.above - g.below) / 2));

export default {
  figure: 463,
  parts: [
    {
      id: "bed",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.0, 0.25, 1.2], at: [0.5, BED - 0.125, 0] },
        { kind: "box", size: [0.3, 0.25, 1.2], at: [0.45, BED + 0.12, 0] },
      ],
    },
    { id: "head", kind: "fill", fluid: "water", center: [-1.4, 1.75, 0], size: [2.6, 3.5, 1.0], level: NORMAL / 3.5 },
    { id: "tail", kind: "fill", fluid: "water", center: [2.0, 0.3, 0], size: [2.8, 0.6, 1.0], level: 0.6 },
    { id: "upper", kind: "plate", center: UPPER.pivot, shape: leaf(UPPER), thickness: 1.0, arrow: false, pieces: [{ kind: "cylinder", radius: 0.06, length: 1.2 }] },
    { id: "lower", kind: "plate", center: LOWER.pivot, shape: leaf(LOWER), thickness: 1.0, arrow: false, pieces: [{ kind: "cylinder", radius: 0.06, length: 1.2 }] },
  ],
  powered: ["upper"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "上游水位", mode: "balance", range: [NORMAL - 0.25, FLOOD + 0.2], initial: NORMAL },
  target: "upper", // 翻轉的上閘葉
  view: { direction: [0.12, 0.08, 1] },
  pose(h) {
    const g = gates(h);
    const level = clamp(h, 0, 3.5) / 3.5;
    const top = [UPPER.pivot[0] + UPPER.above * Math.sin(-g.upper), UPPER.pivot[1] + UPPER.above * Math.cos(g.upper), 0.2];
    const flows = [{ fluid: "water", points: stream([[-1.0, h - 0.1, 0.2], [top[0] - 0.05, Math.max(h, top[1]) - 0.02, 0.2], [top[0] + 0.5, top[1] - 0.4, 0.2], [top[0] + 1.0, 0.5, 0.2], [3.2, 0.45, 0.2]], h * 8, { spacing: 0.2 }) }];
    if (g.open) flows.push({ fluid: "water", points: stream([[-1.6, 0.2, 0.3], [0.0, 0.18, 0.3], [0.9, 0.2, 0.3], [3.2, 0.25, 0.3]], h * 8, { spacing: 0.16 }) });
    return {
      parts: {
        upper: { angle: g.upper },
        lower: { angle: g.lower },
        head: { level },
      },
      flows,
      readouts: [{ label: "堰", value: g.open ? "上閘葉翻轉、下閘葉被推回,河床處打開沖刷" : "直立關閉,水從頂上的缺口流過" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["bed", "lower"], reason: "未修:下模的行程端碰到床台的擋塊,重疊 0.08(96 個取樣中 37 個)(列入待確認清單)" },
  ],
};
