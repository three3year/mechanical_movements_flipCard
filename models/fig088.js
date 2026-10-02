// 第 88 種:連續旋轉轉換為間歇旋轉。凸輪 A 是一片有一處台階的蝸牛形板,連續逆時針轉;
// 碟形輪 B 繞偏離 A 中心的軸轉,輪上有兩個擋止 C、D(相隔半圈)。A 的台階推著一個擋止,帶 B 同轉半圈;
// 此時擋止離開了 A 的凸出部分,B 就停住,直到 A 轉完一圈、台階再推下一個擋止。
// 這裡把 B 畫成與 A 同心(偏心量很小,原圖也幾乎看不出),時序依原文:A 每圈帶 B 轉半圈、停半圈。
import { TAU, deg } from "./kit.js";
import { shape, circle } from "./shapes.js";

const A = { r0: 1.05, r1: 1.55 };
const B = { outer: 2.25, inner: 1.95 };
const STEP = Math.PI; // 每次帶動 B 轉半圈

/** A 轉 c(逆時針):B 的轉角 */
export function wheelB(c) {
  const k = Math.floor(c / TAU);
  const u = c - k * TAU;
  return k * STEP + Math.min(u, STEP);
}

// 凸輪 A:半徑從 r0 慢慢增大到 r1(局部角 0 → 2π),在局部角 0 處有台階;台階朝逆時針方向推
const camOutline = [
  ...Array.from({ length: 180 }, (_, i) => {
    const a = (i / 180) * (TAU - deg(4)) + deg(2);
    const r = A.r1 - ((A.r1 - A.r0) * (a - deg(2))) / (TAU - deg(4));
    return [r * Math.cos(a), r * Math.sin(a)];
  }),
];

const stop = (angle) => ({ kind: "box", size: [0.3, 0.3, 0.3], at: [1.7 * Math.cos(angle), 1.7 * Math.sin(angle), 0.1] });

export default {
  figure: 88,
  parts: [
    {
      id: "cam",
      kind: "plate",
      shape: shape(camOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.28,
      circles: [0.36],
      mark: [0.6, -0.3],
      markSize: 0.07,
      spin: A.r1,
      label: "A",
      labelOffset: [-0.6, 0.05, 0.3],
    },
    {
      id: "wheel",
      kind: "group",
      center: [0, 0, -0.15],
      spin: B.outer,
      pieces: [
        { kind: "plate", shape: shape(circle(B.outer), [circle(0.2).reverse()]), thickness: 0.1, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: B.outer, inner: B.inner, length: 0.32, at: [0, 0, 0.05] },
        stop(Math.PI),
        stop(0),
      ],
      label: "B",
      labelOffset: [0, 1.75, 0.4],
    },
    { id: "labelC", kind: "group", label: "C", labelOffset: [0, 0.38, 0.3] },
    { id: "labelD", kind: "group", label: "D", labelOffset: [0, 0.38, 0.3] },
  ],
  driver: { part: "cam", type: "rotation", speed: 0.9 },
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const b = wheelB(c);
    const at = (a) => [1.7 * Math.cos(a), 1.7 * Math.sin(a), 0.1];
    return {
      parts: {
        cam: { angle: c + Math.PI },
        wheel: { angle: b },
        labelC: { position: at(Math.PI + b) },
        labelD: { position: at(b) },
      },
      readouts: [],
    };
  },
};

