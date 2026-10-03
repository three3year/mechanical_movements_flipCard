// 第 40、41、44 種共用:兩個軸平行、上下咬合的齒輪,從側面看齒面。齒沿軸切成幾片,
// 每片轉一點:斜齒(第 41 種)、人字齒(第 40 種)、階梯錯齒(第 44 種),讓齒面接觸更連續。
import { X } from "./kit.js";
import { meshAngle } from "./gears.js";

export function slicedPair({ figure, teeth, radius, width, slices, twist, twistMode, sliceGap = 0, view }) {
  const top = { center: [0, radius, 0], axis: X, teeth, radius };
  const bottom = { center: [0, -radius, 0], axis: X, teeth, radius };
  const gear = (id, g, t) => ({
    id,
    kind: "gear",
    center: g.center,
    axis: X,
    teeth,
    radius,
    width,
    slices,
    twist: t,
    twistMode,
    sliceGap,
    web: false,
    pieces: [
      { kind: "cylinder", radius: radius * 0.1, length: width + 1.6 },
      { kind: "cylinder", radius: radius * 0.24, length: width + 0.3 },
    ],
  });
  return {
    figure,
    parts: [gear("top", top, twist), gear("bottom", bottom, -twist)],
    driver: { part: "top", type: "rotation" },
    target: "bottom", // 被帶動的下輪
    view: { direction: view ?? [0.04, 0.03, 1], fov: 14 },
    pose(angle) {
      return { parts: { top: { angle }, bottom: { angle: meshAngle(top, bottom, angle) } }, readouts: [] };
    },
  };
}
