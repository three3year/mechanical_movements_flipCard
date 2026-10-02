// 第 45 種:摩擦式溝槽傳動。兩輪的輪面車成一圈圈 V 形溝,彼此嵌合,靠溝面摩擦傳動;
// 兩輪反向轉,轉角比為(節處)半徑反比。右側的放大剖面就是這兩輪嵌合的溝形。
import { X } from "./kit.js";

const RIDGES = 5;
const WIDTH = 1.45;
const DEPTH = 0.16;
const TOP = { radius: 1.05 };
const BOTTOM = { radius: 1.5 };

// V 形溝的剖面:沿軸(局部 Z)鋸齒;phase 讓上下兩輪的峰谷互相嵌合
function grooved(radius, phase) {
  const n = RIDGES * 2;
  const pts = [[0, -WIDTH / 2]];
  for (let i = 0; i <= n; i++) {
    const peak = (i + phase) % 2 === 0;
    pts.push([radius + (peak ? DEPTH / 2 : -DEPTH / 2), -WIDTH / 2 + (WIDTH * i) / n]);
  }
  pts.push([0, WIDTH / 2]);
  return pts;
}

const roller = (id, r, y, phase) => ({
  id,
  kind: "lathe",
  axis: X,
  center: [0, y, 0],
  profile: grooved(r, phase),
  mark: true,
  spin: r,
  pieces: [{ kind: "cylinder", radius: 0.1, length: WIDTH + 1.7 }],
});

export const radii = [TOP.radius, BOTTOM.radius];

export default {
  figure: 45,
  parts: [roller("top", TOP.radius, TOP.radius, 0), roller("bottom", BOTTOM.radius, -BOTTOM.radius, 1)],
  driver: { part: "top", type: "rotation" },
  view: { direction: [0.04, 0.03, 1] },
  pose(angle) {
    return { parts: { top: { angle }, bottom: { angle: (-angle * TOP.radius) / BOTTOM.radius } }, readouts: [] };
  },
};
