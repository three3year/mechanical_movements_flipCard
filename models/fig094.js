// 第 94 種:可變曲柄。兩片同心的圓板:後板切有螺旋溝,前板切有六道放射狀的槽。
// 一根螺栓同時穿過螺旋溝與其中一道放射槽;轉動後板(前板不動)時,螺旋溝把螺栓沿放射槽推向中心或推離中心,
// 曲柄的長度(螺栓離中心的距離)因此改變。主動件是後板(螺旋板)。
import { TAU, deg } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";

const R = 2.2;
const SPIRAL = { r0: 0.55, pitch: 0.42 }; // 螺旋:半徑 = r0 + pitch·(角度/2π)
const SLOT = deg(-120); // 螺栓所在的那道放射槽(原圖左下)
const RANGE = { min: 0.75, max: 1.95 };

// 後板轉 t 時,螺旋溝經過放射槽處的局部角 φ = SLOT − t,螺栓就在那裡:半徑 = r0 + pitch·φ/2π。
// 主動量的範圍讓半徑留在放射槽之內。
const tOf = (r) => SLOT - ((r - SPIRAL.r0) / SPIRAL.pitch) * TAU;

/** 後板轉 t:螺栓離中心的距離(曲柄長) */
export function crankLength(t) {
  return SPIRAL.r0 + (SPIRAL.pitch * (SLOT - t)) / TAU;
}
export const spiralPitch = SPIRAL.pitch;

const spiralPoints = (() => {
  const pts = [];
  for (let phi = 0; phi <= TAU * 3.3; phi += 0.05) {
    const r = SPIRAL.r0 + (SPIRAL.pitch * phi) / TAU;
    if (r > R - 0.15) break;
    pts.push([r * Math.cos(phi), r * Math.sin(phi), 0]);
  }
  return pts;
})();

const slots = Array.from({ length: 6 }, (_, i) => {
  const a = (i * TAU) / 6 + SLOT;
  return stadium(1.2, 0.2).outline.map(([x, y]) => {
    const px = x + 0.75;
    return [px * Math.cos(a) - y * Math.sin(a), px * Math.sin(a) + y * Math.cos(a)];
  });
});

export default {
  figure: 94,
  parts: [
    {
      id: "spiralPlate",
      kind: "group",
      center: [0, 0, -0.18],
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.25).reverse()]), thickness: 0.14 },
        { kind: "tube", points: spiralPoints.map(([x, y]) => [x, y, 0.08]), radius: 0.045 },
        { kind: "tube", points: spiralPoints.map(([x, y]) => [x * 1.0 + 0.16 * Math.cos(Math.atan2(y, x)), y + 0.16 * Math.sin(Math.atan2(y, x)), 0.08]), radius: 0.045 },
        { kind: "cylinder", radius: 0.25, length: 0.6 },
      ],
    },
    {
      id: "slotPlate",
      kind: "plate",
      center: [0, 0, 0.05],
      shape: shape(circle(R), [circle(0.45).reverse(), ...slots.map((s) => s.reverse())]),
      thickness: 0.1,
      circles: [0.45],
      arrow: false,
    },
    { id: "bolt", kind: "cylinder", radius: 0.12, length: 0.6, center: [0, 0, 0] },
  ],
  driver: { part: "spiralPlate", type: "rotation", range: [tOf(RANGE.max), tOf(RANGE.min)], initial: tOf(1.6) },
  view: { direction: [0.06, 0.05, 1] },
  pose(t) {
    const r = crankLength(t);
    return {
      parts: { spiralPlate: { angle: t }, bolt: { position: [r * Math.cos(SLOT), r * Math.sin(SLOT), 0] } },
      readouts: [],
    };
  },
};

