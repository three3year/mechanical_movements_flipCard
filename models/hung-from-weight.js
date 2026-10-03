// 第 19–21 種共用的配置:每條繩一端接在重物上,越過一個皮帶輪後吊住下一個皮帶輪,
// 最後一條繩的另一端是繩端。最上面的輪固定在天花板,其餘的輪隨繩升降。
// 因為繩端接在重物上而不是定點,原文 2 的 n 次方規則不適用:n 個輪的省力比是 2ⁿ − 1。
import { Z, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const CEILING = 2.95;
const W = { y: -1.45, height: 0.5, depth: 0.6 };

/**
 * radii:由上到下各輪半徑;ys:各輪起始高度;top:最上方定滑輪的 x。
 * 第 i 個輪掛在第 i−1 條繩的左端,所以 x 依序往左錯開一個半徑。
 */
export function hungFromWeight({ figure, radii, ys, top, range }) {
  const n = radii.length;
  const xs = [top];
  for (let i = 1; i < n; i++) xs.push(xs[i - 1] - radii[i - 1]);
  const hookX = xs.map((x, i) => x + radii[i]); // 各繩接在重物上的位置
  // 繩端從最下方輪的左側垂直垂下;重物從它右邊開始,繩端拉到底也碰不到
  const endX = xs[n - 1] - radii[n - 1];
  const left = endX + 0.35;
  const right = Math.max(...hookX) + 0.2;
  const weightX = (left + right) / 2;
  const ratio = 2 ** n - 1;

  function layout(pull) {
    const rise = pull / ratio;
    const weightY = W.y + rise;
    const weightTop = weightY + W.height / 2;
    // 繩長守恆:第 i 個輪下降量 = 2 × 上一個輪的下降量 + 重物上升量
    const drops = [0];
    for (let i = 1; i < n; i++) drops.push(2 * drops[i - 1] + rise);
    const circles = xs.map((x, i) => ({ center: [x, ys[i] - drops[i], 0], axis: Z, radius: radii[i], sense: 1 }));
    // 最後一條繩:繩端下降 = 2 × 最下方輪的下降量 + 重物上升量 = pull
    const ropeEnd = [endX, ys[n - 1] - 0.2 - pull, 0];
    const ropes = circles.map((c, i) => {
      const end = i < n - 1 ? [circles[i + 1].center[0], circles[i + 1].center[1] + radii[i + 1] + 0.14, 0] : ropeEnd;
      return routeRope([{ point: [hookX[i], weightTop, 0] }, { circle: c }, { point: end }]);
    });
    return { rise, weightY, circles, ropeEnd, ropes };
  }

  const rest = layout(range[0]);
  const ropeIds = radii.map((_, i) => `rope${i + 1}`);
  const pulleyIds = radii.map((_, i) => `pulley${i + 1}`);

  return {
    figure,
    parts: [
      { id: "ceiling", kind: "box", center: [top, CEILING + 0.08, 0], size: [1.2, 0.16, 0.6] },
      ...rest.circles.map((c, i) => ({
        id: pulleyIds[i],
        kind: "pulley",
        style: "disc",
        center: c.center,
        axis: Z,
        radius: c.radius,
        width: 0.2,
        movable: i > 0,
      })),
      { id: "hanger", kind: "rod" },
      ...rest.circles.slice(1).map((_, i) => ({ id: `hook${i + 2}`, kind: "rod" })),
      { id: "weight", kind: "box", center: [weightX, W.y, 0], size: [right - left, W.height, W.depth] },
      ...ropeIds.map((id) => ({ id, kind: "rope" })),
      { id: "ropeEnd", kind: "ropeEnd", center: rest.ropeEnd },
    ],
    driver: { part: "ropeEnd", type: "translation", range, direction: [0, -1, 0] },
    target: "weight", // 被吊起的重物
    pose(value) {
      const pull = clamp(value, ...range);
      const { rise, weightY, circles, ropeEnd, ropes } = layout(pull);
      const parts = { weight: { position: [weightX, weightY, 0] }, ropeEnd: { position: ropeEnd } };
      const paths = { hanger: rod([top, CEILING, 0], circles[0].center) };
      circles.forEach((c, i) => {
        parts[pulleyIds[i]] = { position: c.center, angle: sheaveAngle(ropes[i], rest.ropes[i], 0, c) };
        paths[ropeIds[i]] = { points: ropes[i].points, closed: false };
        if (i > 0) paths[`hook${i + 1}`] = rod(c.center, [c.center[0], c.center[1] + c.radius + 0.14, 0]);
      });
      return { parts, paths, readouts: hoistReadouts(pull, rise, ratio) };
    },
  };
}
