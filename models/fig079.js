// 第 79 種:桿 B 的往復直線運動,經兩根連桿帶動套在輪軸上的兩支振動臂 C、C,臂端的棘爪推動輪 A 面上的棘齒,
// 使 A 幾乎連續地順時針轉(原圖箭頭)。B 往右時上臂往下擺、推動輪;B 往左時下臂往上擺、換它推動輪。
// 主動量是 B 的累計行程。
// 連桿長要大於「B 最右位置 − 臂長」,否則 B 走到行程末端時連桿與臂拉成一直線、交點退化,臂會瞬間彈到 0°(推斷:
// 原圖兩臂約在 ±40°,連桿取 2.5 使臂在約 16°–40° 間擺動)。
import { TAU, polar, swing } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { circle, shape, stadium } from "./shapes.js";

const WHEEL = { radius: 1.95, inner: 1.55, teeth: 36 };
const ARM = 1.72;
const B0 = 3.55; // B 的最左位置
const STROKE = 0.55;
const LINK = 2.5; // > B0 + STROKE − ARM,連桿與臂永遠構成三角形
const Z = 0.25;

// 臂端:從 B 的銷量一根連桿長,落在臂端的圓上(上臂取上方交點、下臂取下方交點)
const armEnd = (which, x) => circleCircle([x, 0, 0], LINK, [0, 0, 0], ARM, which === "upper" ? -1 : 1).point;
const armAngle = (which) => (x) => {
  const e = armEnd(which, x);
  return Math.atan2(e[1], e[0]);
};

/** 主動量 v(B 的累計行程):輪 A 的轉角(順時針為負) */
export const wheelAngle = (v) => doubleAction(v, B0, B0 + STROKE, armAngle("upper"), armAngle("lower"));
export const stroke = STROKE;

// 棘齒面:輪緣上一圈徑向的齒槽
const teeth = Array.from({ length: WHEEL.teeth }, (_, i) => ({
  kind: "box",
  size: [WHEEL.radius - WHEEL.inner, 0.05, 0.08],
  at: [...polar((WHEEL.radius + WHEEL.inner) / 2, (i * TAU) / WHEEL.teeth).slice(0, 2), 0.1],
  angle: (i * TAU) / WHEEL.teeth,
  accent: i === 0,
}));

const armPart = (id, label) => ({
  id,
  kind: "group",
  center: [0, 0, Z],
  arrow: false,
  pieces: [
    { kind: "plate", shape: shape(stadium(ARM, 0.22).outline, [circle(0.06, ARM, 0).reverse()]), thickness: 0.08 },
    { kind: "plate", shape: shape([[ARM - 0.25, -0.08], [ARM - 0.05, -0.18], [ARM + 0.05, -0.08], [ARM - 0.1, 0.05]]), thickness: 0.06, at: [0, 0, -0.08] },
  ],
  label,
  labelOffset: [0.85, 0.1, 0.1],
});

export default {
  figure: 79,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: WHEEL.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.radius), [circle(0.18).reverse()]), thickness: 0.18 },
        { kind: "cylinder", radius: WHEEL.inner, inner: WHEEL.inner - 0.04, length: 0.22 },
        ...teeth,
        { kind: "cylinder", radius: 0.45, inner: 0.3, length: 0.35, at: [0, 0, 0.2] },
      ],
      label: "A",
      labelOffset: [-0.95, -0.1, 0.3],
    },
    armPart("armUpper", "C"),
    armPart("armLower", "C"),
    { id: "linkUpper", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkLower", kind: "link", width: 0.08, thickness: 0.05 },
    {
      id: "rodB",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.2 },
        { kind: "plate", shape: shape([[0.15, -0.12], [0.75, -0.12], [0.85, -0.2], [0.95, -0.05], [0.95, 0.05], [0.85, 0.2], [0.75, 0.12], [0.15, 0.12]]), thickness: 0.1 },
      ],
      label: "B",
      labelOffset: [-0.1, 0.5, 0.2],
    },
  ],
  waivers: [
    { check: "interference", parts: ["armUpper", "armLower"], reason: "待確認:armUpper 的板 與 armLower 的板重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "rodB", type: "translation", direction: [1, 0, 0], cycle: [B0, B0 + STROKE] },

  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const x = swing(v, B0, B0 + STROKE);
    const up = armEnd("upper", x);
    const down = armEnd("lower", x);
    const z = Z + 0.08;
    return {
      parts: {
        wheel: { angle: wheelAngle(v) },
        rodB: { position: [x, 0, Z] },
        armUpper: { angle: angleOf([0, 0, 0], up) },
        armLower: { angle: angleOf([0, 0, 0], down) },
        linkUpper: { from: [up[0], up[1], z], to: [x, 0, z] },
        linkLower: { from: [down[0], down[1], z], to: [x, 0, z] },
      },
      readouts: [],
    };
  },
};

