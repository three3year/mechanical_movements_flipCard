// 第 376 種:馬匹驅動的踏輪馬力裝置。馬在大輪裡面,試著沿輪的內側往上走,牠的重量讓輪一直轉;曾用來驅動渡輪的槳輪等。
// 古時候也有讓「烤肉叉犬」在這種輪裡走、轉動烤肉叉的。主動件是虛擬的「進程」:馬已走了多遠(輪轉了幾圈)。
// 馬留在輪的低處原地踏步(腿交替擺動),輪在牠腳下往回轉。
// 推斷:馬的步伐與輪轉的對應;輪的輪輻依原圖畫成格子。
import { TAU, deg } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const R = 2.1;
const STEP = 0.55; // 馬每一步走過的輪面弧長

/** 進程 p(輪轉的圈數)→ 輪轉角、腿的擺角 */
export function treadWheel(p) {
  const wheel = TAU * p; // 馬往左上走,輪逆時針轉
  const stride = Math.sin(((wheel * R) / STEP) * Math.PI);
  return { wheel, stride };
}

// 輪:外圈、內圈、格子狀的輪輻
const grid = [];
for (const v of [-1.2, -0.4, 0.4, 1.2]) {
  const h = Math.sqrt(R * R - v * v) - 0.1;
  grid.push({ kind: "box", size: [0.12, 2 * h, 0.12], at: [v, 0, 0] });
  grid.push({ kind: "box", size: [2 * h, 0.12, 0.12], at: [0, v, 0] });
}
// 馬:側面輪廓(身體與頭頸),四條腿另外擺動
// 馬面向左(往輪的內側左上方走)
const body = shape(
  [
    [-0.55, -0.15], [0.45, -0.15], [0.6, 0.0], [0.75, 0.35], [0.95, 0.55], [1.05, 0.5], [0.95, 0.3], [0.8, 0.05], [0.5, 0.18], [-0.4, 0.2], [-0.62, 0.1], [-0.8, -0.1],
  ].map(([x, y]) => [-x, y]).reverse(),
);

export default {
  figure: 376,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.15), [circle(R - 0.1).reverse()]), thickness: 0.6 },
        ...Array.from({ length: 16 }, (_, i) => ({ kind: "sphere", radius: 0.05, at: [(R + 0.03) * Math.cos((i * TAU) / 16), (R + 0.03) * Math.sin((i * TAU) / 16), 0.31] })),
        ...grid,
        { kind: "cylinder", radius: 0.32, length: 0.8, mark: true },
      ],
    },
    {
      id: "horse",
      kind: "group",
      center: [0.35, -1.0, 0.45],
      arrow: false,
      pieces: [{ kind: "plate", shape: body, thickness: 0.3 }],
    },
    ...["legFF", "legFB", "legHF", "legHB"].map((id) => ({ id, kind: "link", width: 0.09, thickness: 0.08 })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "unsupported", parts: ["legFF"], reason: "待確認(未修):legFF 在動,但離帶動(或支撐)它的零件還有 0.19 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["legFB"], reason: "待確認(未修):legFB 在動,但離帶動(或支撐)它的零件還有 0.11 的空隙,少了相連的軸、銷或連桿,尚未補上" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.08 },
  target: "wheel", // 被馬踩著轉的輪
  view: { direction: [0.04, 0.05, 1] },
  pose(p) {
    const t = treadWheel(p);
    const H = [0.35, -1.0, 0.45];
    const leg = (x, phase) => {
      const top = [H[0] + x, H[1] - 0.1, 0.45 + (phase > 0 ? 0.08 : -0.08)];
      const swing = deg(22) * t.stride * (phase > 0 ? 1 : -1);
      const len = 0.75;
      return { from: top, to: [top[0] + len * Math.sin(swing), top[1] - len * Math.cos(swing), top[2]] };
    };
    return {
      parts: {
        wheel: { angle: t.wheel },
        legFF: leg(-0.4, 1),
        legFB: leg(-0.4, -1),
        legHF: leg(0.45, -1),
        legHB: leg(0.45, 1),
      },
      readouts: [],
    };
  },
};
