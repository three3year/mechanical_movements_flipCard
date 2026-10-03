// 第 226 種:用相同直徑、相同齒數的齒輪得到「雙倍速度」的裝置,共用六個斜齒輪(傘齒輪)。上方軸 B 的齒輪同時與兩個齒輪
// 咬合:右邊一個在軸 F 上,左邊一個與 C 同在一根套在 F 上、可鬆動旋轉的空心軸上。框架 A 固定在 F 上,承載齒輪 D
// 跟著繞 F 轉;E 在 F 上鬆動旋轉,與 D 咬合;D 另一邊與空心軸左端的齒輪 C 咬合。
// 狀態「移除 C 的齒輪」:空心軸上的兩個齒輪拿掉、D 不能自轉,B 轉一圈 → A 轉一圈 → E 被帶著轉一圈。
// 狀態「裝上 C 的齒輪」:空心軸反向轉,D 在框架裡自轉,E 在被帶著轉之外又多轉。主動件是軸 B。
// 依原圖的配置(三組等大的傘齒輪,差速器的關係 E = 2A − C),B 轉一圈時 E 轉三圈;原文說兩圈(見票的 Comments)。
import { X, Z, TAU, quatAxisAngle, quatMul, quatFromZ, quatRotate } from "./kit.js";
import { meshAngle, bevelGear, bevelContact } from "./gears.js";

const M = 0.1;
const CONE = Math.PI / 4;
const DIFF = [-1.0, 0, 0]; // 差速組(E、D、C 左齒輪)的錐頂
const DRIVE = [2.0, 0, 0]; // B 與兩個大齒輪的錐頂
const nd = 16;
const nb = 20;
const rd = (nd * M) / 2;
const rb = (nb * M) / 2;
const bevel = (apex, axis, n) => bevelGear({ apex, axis, teeth: n, radius: (n * M) / 2, cone: CONE, width: 0.35 });
export const gears = {
  E: bevel(DIFF, X, nd),
  G: bevel(DIFF, [-1, 0, 0], nd), // 空心軸 C 左端的齒輪
  D: bevel(DIFF, [0, 0, -1], nd),
  H: bevel(DRIVE, X, nb), // 空心軸 C 右端的大齒輪
  J: bevel(DRIVE, [-1, 0, 0], nb), // 軸 F 上的大齒輪
  B: bevel(DRIVE, [0, -1, 0], nb),
};
const { E, G, D, H, J, B } = gears;

/** B 轉 beta、狀態:F(與框架 A)、空心軸 C、D 自轉(相對框架)與 E 的轉角(都以繞 +x 為正,D 繞自己的軸) */
export function train(beta, state) {
  const a = -meshAngle(B, J, beta, bevelContact(B, J)); // J 的軸朝 −x
  if (state === "removed") return { a, c: 0, d: 0, e: a };
  const c = meshAngle(B, H, beta, bevelContact(B, H));
  // 在框架中看:C 相對框架轉 c − a(繞 +x),G 的軸朝 −x
  const d = meshAngle(G, D, -(c - a), bevelContact(G, D));
  const e = a + meshAngle(D, E, d, bevelContact(D, E));
  return { a, c, d, e };
}
const ZERO = train(0, "installed");

const gearPart = (id, g, extra = {}) => ({ id, kind: "gear", center: g.center, axis: g.axis, teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, ...extra });
const qx = (a) => quatAxisAngle(X, a);

export default {
  figure: 226,
  parts: [
    gearPart("gearB", B, { label: "B", labelOffset: [0, 1.15, 0], pieces: [{ kind: "cylinder", radius: 0.1, length: 1.4, at: [0, 0, -0.7] }, { kind: "cylinder", radius: 0.55, length: 0.25, at: [0, 0, -0.9] }] }),
    gearPart("gearJ", J, { arrow: false }),
    gearPart("gearH", H, { arrow: false, posed: true }),
    gearPart("gearG", G, { arrow: false, posed: true }),
    gearPart("gearE", E, { label: "E", labelOffset: [0, 0.95, 0.4] }),
    { id: "gearD", kind: "gear", teeth: D.teeth, radius: D.radius, cone: D.cone, width: D.width, posed: true, label: "D", labelOffset: [0, 0.4, 0.5] },
    // 空心軸 C(在 F 外面,G 與 H 之間)
    { id: "sleeveC", kind: "cylinder", center: [(G.center[0] + H.center[0]) / 2, 0, 0], axis: X, radius: 0.2, length: H.center[0] - G.center[0], posed: true, label: "C", labelOffset: [-0.6, 0.35, 0.3] },
    {
      id: "frameA",
      kind: "group",
      center: [DIFF[0], 0, 0],
      axis: X,
      arrow: false,
      label: "A",
      labelOffset: [0, 1.5, 0],
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 7.0, at: [0, 0, 1.2] }, // 軸 F(局部 z = 世界 x)
        // 框架的四邊在含 F 的平面上(局部 z = 世界 x、局部 y = 世界 y);局部 −x 朝世界 +z(D 那一側)
        { kind: "box", size: [0.12, 2.5, 0.12], at: [0, 0, -1.05] },
        { kind: "box", size: [0.12, 2.5, 0.12], at: [0, 0, 1.05] },
        { kind: "box", size: [0.12, 0.12, 2.2], at: [0, 1.25, 0] },
        { kind: "box", size: [0.12, 0.12, 2.2], at: [0, -1.25, 0] },
        { kind: "cylinder", axis: X, radius: 0.07, length: 1.2, at: [-0.6, 0, 0] }, // D 的軸
      ],
    },
  ],
  driver: { part: "gearB", type: "rotation" },
  target: "gearE",
  states: {
    options: [
      { id: "installed", label: "裝上 C 的齒輪" },
      { id: "removed", label: "移除 C 的齒輪(D 不自轉)" },
    ],
    initial: "installed",
  },
  view: { direction: [0.12, 0.25, 1] },
  pose(beta, state = "installed") {
    const t = train(beta, state);
    // D:跟著框架繞 x 轉 a,自己再繞自己的軸轉 d
    const dRot = quatMul(qx(t.a), quatMul(quatFromZ(D.axis), quatAxisAngle(Z, t.d)));
    const dPos = quatRotate(qx(t.a), [D.center[0] - DIFF[0], D.center[1], D.center[2]]);
    const removed = state === "removed";
    return {
      parts: {
        gearB: { angle: beta },
        gearJ: { angle: -t.a },
        gearH: { angle: t.c, visible: !removed },
        gearG: { angle: -t.c, visible: !removed },
        sleeveC: { angle: t.c, visible: !removed },
        gearE: { angle: t.e },
        gearD: { position: [dPos[0] + DIFF[0], dPos[1], dPos[2]], rotation: dRot },
        frameA: { angle: t.a },
      },
      readouts: [
        { label: "B 轉了", value: `${(beta / TAU).toFixed(2)} 圈` },
        { label: "E 轉了", value: `${((t.e - (removed ? 0 : ZERO.e)) / TAU).toFixed(2)} 圈` },
      ],
    };
  },
};

