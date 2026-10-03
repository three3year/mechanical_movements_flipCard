// 第 87 種:能自動反向的運動。B、C 之間後方的大斜齒輪是驅動端,帶著鬆套在軸上的斜齒輪 B、C 反向轉;
// 離合器盒 D 在軸上的鍵條上滑動,與 C(或 B)嚙合時軸就隨它轉。軸經斜齒輪帶動右側的輪 E;
// E 上的凸柱轉到一端時撞上曲柄搖臂 G,經連桿把加重槓桿 F 推過垂直位置,F 便突然倒向另一側,
// 把 D 撥去與另一個齒輪嚙合,軸反轉;E 轉回另一端時再撞 G,再反轉一次。
// 主動件是驅動斜齒輪,連續轉動;軸因此來回往復。主動量 v 決定一切:軸角是 v 的三角波,
// F 在每一程的最後一段被推向垂直,過了就倒向另一側。倒下是加重槓桿憑自重落下的過程,演出來:
// 過垂直後從靜止起步、越來越快、倒到底停住(jumps.falling),佔下一程開頭驅動輪轉角的 10%(30°;推斷:
// 原文只說「突然向左倒下」)。
import { X, deg, smooth } from "./kit.js";
import { falling } from "./jumps.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { shape, circle, stadium } from "./shapes.js";
import { circleCircle } from "./linkage.js";

const M = 0.09;
const APEX = [-0.9, 0, 0];
const [CONE_DRIVE, CONE_SIDE] = pitchCones(26, 18);
const DRIVE = bevelGear({ apex: APEX, axis: [0, 0, 1], teeth: 26, radius: (26 * M) / 2, cone: CONE_DRIVE, width: 0.45 });
const B = bevelGear({ apex: APEX, axis: [1, 0, 0], teeth: 18, radius: (18 * M) / 2, cone: CONE_SIDE, width: 0.45 });
const C = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: 18, radius: (18 * M) / 2, cone: CONE_SIDE, width: 0.45 });
const E_APEX = [3.3, 0, 0];
const [CONE_SMALL, CONE_E] = pitchCones(10, 20);
const SHAFT_BEVEL = bevelGear({ apex: E_APEX, axis: [1, 0, 0], teeth: 10, radius: 0.4, cone: CONE_SMALL, width: 0.3 });
const E = bevelGear({ apex: E_APEX, axis: [0, 0, 1], teeth: 20, radius: 0.8, cone: CONE_E, width: 0.3 });
const CB = bevelContact(DRIVE, B);
const CC = bevelContact(DRIVE, C);
const CE = bevelContact(SHAFT_BEVEL, E);
// 驅動輪轉 1 時 C 的轉角變化;與 C 嚙合時軸(繞 +x)的轉速 = −C 的轉速(C 的軸朝 −x)
const RATE_C = -(meshAngle(DRIVE, C, 0.01, CC) - meshAngle(DRIVE, C, 0, CC)) / 0.01;
const JAW = { z: B.radius / Math.tan(B.cone) - B.width / 2 - 0.35, shift: 0.12 };
const SPAN = deg(300); // 每一程驅動輪轉的角度
const PUSH = 0.22; // 每一程最後這一段,凸柱推著 G、把 F 推向垂直
const FALL = 0.1; // F 倒下所佔的比例(下一程的開頭)
const F_REST = deg(28);
const F = { pivot: [-0.95, -2.05, 0.75], up: 1.55, arm: 1.0 };
const G = { pivot: [2.05, -1.35, 0.75], up: 1.0, down: 0.75 };
const LINK = Math.hypot(
  G.pivot[0] + G.down * Math.cos(deg(-40)) - (F.pivot[0] + F.arm * Math.cos(deg(20) - F_REST)),
  G.pivot[1] + G.down * Math.sin(deg(-40)) - (F.pivot[1] + F.arm * Math.sin(deg(20) - F_REST)),
);

/** 驅動輪轉 v:第 k 程、這一程的進度 f、方向 σ(+1:D 與 C 嚙合)、軸角 */
export function reverser(v) {
  const k = Math.floor(v / SPAN);
  const f = v / SPAN - k;
  const sigma = k % 2 === 0 ? 1 : -1;
  // 與 C 嚙合時軸隨 C 轉;與 B 嚙合時隨 B 轉(B、C 反向),所以軸角是三角波
  const tri = k % 2 === 0 ? f : 1 - f;
  const shaft = RATE_C * SPAN * tri;
  return { k, f, sigma, shaft };
}

/** 加重槓桿 F 的轉角(從直立量起,逆時針為正;負值為倒向右方) */
export function leverF(v) {
  const { f, sigma } = reverser(v);
  const rest = -sigma * F_REST; // σ = +1 時 F 倒向右方(D 被推到 C)
  if (f > 1 - PUSH) return rest * (1 - smooth((f - (1 - PUSH)) / PUSH));
  if (f < FALL) return rest * falling(f / FALL);
  return rest;
}

const bevel = (id, g, extra = {}) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  ...extra,
});

const jaw = (z, facing) => ({ kind: "gear", crown: true, teeth: 5, radius: 0.32, width: 0.3, toothDepth: 0.16, faceWidth: 0.2, at: [0, 0, z], axis: [0, 0, facing] });

export default {
  figure: 87,
  parts: [
    bevel("drive", DRIVE, { pieces: [{ kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, -0.75] }] }),
    bevel("b", B, { pieces: [{ kind: "cylinder", radius: 0.2, length: JAW.z, at: [0, 0, JAW.z / 2] }, jaw(JAW.z, 1)], label: "B", labelOffset: [-0.3, 1.05, 0] }),
    bevel("c", C, { pieces: [{ kind: "cylinder", radius: 0.2, length: JAW.z, at: [0, 0, JAW.z / 2] }, jaw(JAW.z, 1)], label: "C", labelOffset: [0.3, 1.05, 0] }),
    { id: "shaft", kind: "cylinder", axis: X, center: [0.9, 0, 0], radius: 0.08, length: 6.0, arrow: false },
    {
      id: "clutch",
      kind: "group",
      axis: X,
      center: [APEX[0], 0, 0],
      posed: true,
      spin: 0.4,
      pieces: [jaw(-0.12, -1), jaw(0.12, 1), { kind: "cylinder", radius: 0.2, length: 0.3 }],
      label: "D",
      labelOffset: [0, -0.5, 0.4],
    },
    bevel("shaftBevel", SHAFT_BEVEL, { arrow: false }),
    bevel("e", E, {
      pieces: [
        { kind: "cylinder", radius: 1.05, inner: 0.9, length: 0.15, at: [0, 0, -0.3] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [0.85, 0.08, 0.08], at: [0.42 * Math.cos((i * Math.PI) / 2), 0.42 * Math.sin((i * Math.PI) / 2), -0.3], angle: (i * Math.PI) / 2 })),
        { kind: "cylinder", radius: 0.09, length: 0.4, at: [-0.75, -0.35, -0.05], accent: true },
      ],
      label: "E",
      labelOffset: [0, 1.2, 0],
    }),
    {
      id: "leverF",
      kind: "group",
      center: F.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(F.up, 0.14).outline.map(([x, y]) => [y, x])), thickness: 0.08 },
        { kind: "plate", shape: shape(stadium(F.arm, 0.12).outline), thickness: 0.08, angle: deg(20) },
        { kind: "sphere", radius: 0.22, at: [F.arm * Math.cos(deg(20)), F.arm * Math.sin(deg(20)), 0] },
        { kind: "cylinder", radius: 0.16, length: 0.2 },
      ],
      label: "F",
      labelOffset: [1.25, 0.6, 0],
    },
    {
      id: "crankG",
      kind: "group",
      center: G.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(G.up, 0.14).outline), thickness: 0.08, angle: deg(35) },
        { kind: "plate", shape: shape(stadium(G.down, 0.14).outline), thickness: 0.08, angle: deg(-40) },
        { kind: "cylinder", radius: 0.12, length: 0.2 },
      ],
      label: "G",
      labelOffset: [-0.3, 0, 0],
    },
    { id: "rod", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "frame", kind: "group", pieces: [{ kind: "plate", shape: shape(circle(0.24), []), thickness: 0.3, at: [F.pivot[0], F.pivot[1], 0.6] }] },
  ],
  driver: { part: "drive", type: "rotation", speed: 1.2 },
  target: "rod",
  view: { direction: [0.04, 0.12, 1], fov: 22 },
  pose(v) {
    const { shaft, sigma, f } = reverser(v);
    const phiF = leverF(v);
    // F 的直臂頂端撥動 D:F 倒向右方時 D 被推向 C,倒向左方時推向 B
    const clutchX = APEX[0] - (JAW.shift * Math.sin(phiF)) / Math.sin(F_REST);
    // 連桿長度不變:G 的下臂端點落在「以 F 臂端為圓心、連桿長為半徑」的圓上
    const fEnd = [F.pivot[0] + F.arm * Math.cos(deg(20) + phiF), F.pivot[1] + F.arm * Math.sin(deg(20) + phiF), 0.85];
    const gEnd = [...circleCircle(G.pivot, G.down, fEnd, LINK, 1).point.slice(0, 2), 0.85];
    const g = Math.atan2(gEnd[1] - G.pivot[1], gEnd[0] - G.pivot[0]) - deg(-40);
    return {
      parts: {
        drive: { angle: v },
        b: { angle: meshAngle(DRIVE, B, v, CB) },
        c: { angle: meshAngle(DRIVE, C, v, CC) },
        shaft: { angle: shaft },
        clutch: { position: [clutchX, 0, 0], angle: shaft },
        shaftBevel: { angle: shaft },
        e: { angle: meshAngle(SHAFT_BEVEL, E, shaft, CE) },
        leverF: { angle: phiF },
        crankG: { angle: g },
        rod: { from: fEnd, to: gEnd },
      },
      readouts: [],
    };
  },
};

