// 第 221 種:賦予輪 A 不規則的圓周運動。C 是繞中心 D 轉動的橢圓形正齒輪,是主動件;B 是與它咬合、齒距相同的小齒輪。
// 小齒輪的軸心不固定,由一支繞 A 的中心擺動的搖臂(框架)承載,C 轉動時框架上下起伏,讓小齒輪不論 C 的接觸半徑
// 怎麼變都保持咬合。小齒輪軸上另有一個大齒輪(也標 B)與 A 咬合,把運動傳給 A。為了讓齒維持適當的咬合深度、
// 不彼此滑過,C 上附有一片超出邊緣的板,板上有相似的橢圓形溝槽 g、h,容納搖臂上與 B 同心的銷。
// 推斷:D 是橢圓的焦點;各輪齒數;溝槽就是小齒輪軸心相對 C 走過的路線。
import { TAU, Z, rot2 } from "./kit.js";
import { swingMesh } from "./swing-mesh.js";
import { meshAngle } from "./gears.js";
import { noncircularOutline, samplePitch, arcAt } from "./noncircular.js";
import { circle } from "./shapes.js";

const ELLIPSE = { a: 1.4, c: 0.8, far: Math.atan2(-1.0, -0.35) }; // 從焦點 D 看,遠端頂點的方向
const E = ELLIPSE.c / ELLIPSE.a;
const P = ELLIPSE.a * (1 - E * E);
const r = (phi) => P / (1 - E * Math.cos(phi - ELLIPSE.far));
const NC = 30;
const PITCH = samplePitch(r).length / NC;
const gearOf = (teeth) => ({ teeth, radius: (teeth * PITCH) / TAU });
const b = gearOf(11);
const BIG = gearOf(26);
const A = { ...gearOf(28), center: [-1.95, 1.5, 0] };
const LINK = A.radius + BIG.radius;
const D = [0, 0, 0];
const mesh = swingMesh({ r, fixed: D, rp: b.radius, pivot: A.center, arm: LINK, side: -1 });

const S0 = mesh.byGear(0);
const gammaOf = (p) => Math.atan2(p[1] - A.center[1], p[0] - A.center[0]);
const aRaw = (s) => {
  const g = gammaOf(s.center);
  return g - (BIG.radius / A.radius) * (s.pinion - g);
};

/** C 轉 theta(逆時針為正;原文中 C 以固定方向轉):小齒輪軸心、小齒輪與 A 的轉角(相對原圖) */
export function train(theta) {
  const s = mesh.byGear(theta);
  return { center: s.center, pinion: s.pinion - S0.pinion, a: aRaw(s) - aRaw(S0), contact: r(s.phi) + b.radius };
}
export const geometry = { r, rb: b.radius, rBig: BIG.radius, rA: A.radius, LINK, A: A.center };

// 原圖的齒相位:C 在接觸點是一齒的中心,小齒輪 b 以齒槽對著它;大齒輪 B 與 A 依咬合排好
const B_PHASE = S0.beta + Math.PI + Math.PI / b.teeth;
const A_PHASE = meshAngle({ ...BIG, center: S0.center, axis: Z }, { ...A, axis: Z }, B_PHASE);
const outline = noncircularOutline(r, { teeth: NC, addendum: PITCH / Math.PI, dedendum: (1.2 * PITCH) / Math.PI, start: arcAt(r, S0.phi) });
// 溝槽 g、h:小齒輪軸心相對 C 的路線(節曲線往外偏 rb)
// 板上的溝槽以兩條細環表示(原圖的雙虛線)
const offset = (d) => Array.from({ length: 180 }, (_, i) => {
  const phi = (i / 180) * TAU;
  const k = r(phi) + b.radius + d;
  return [k * Math.cos(phi), k * Math.sin(phi)];
});
const ring = (d) => ({ outline: offset(d + 0.03), holes: [offset(d - 0.03).reverse()] });
const TAGS = { g: [1.55, -0.9], h: [-2.05, -0.95] };
const gear = (id, g, extra = {}) => ({ id, kind: "gear", teeth: g.teeth, radius: g.radius, width: 0.2, ...extra });

export default {
  figure: 221,
  parts: [
    {
      id: "gearC",
      kind: "group",
      spin: 2.4,
      label: "C",
      labelOffset: [-0.35, -1.0, 0.4],
      pieces: [
        { kind: "plate", shape: { outline, holes: [circle(0.1).reverse()] }, thickness: 0.2, mark: [-0.3, -1.3], markSize: 0.08 },
        { kind: "plate", shape: ring(0.1), thickness: 0.04, at: [0, 0, -0.6] },
        { kind: "plate", shape: ring(-0.1), thickness: 0.04, at: [0, 0, -0.6] },
        { kind: "cylinder", radius: 0.14, inner: 0.06, length: 0.5 },
      ],
    },
    gear("pinionB", b, { label: "B", labelOffset: [0, 0.75, 0.3], pieces: [{ kind: "cylinder", radius: 0.07, length: 0.9, at: [0, 0, -0.1] }] }),
    gear("gearB", BIG, { center: [0, 0, -0.32], arrow: false }),
    gear("gearA", A, { center: [A.center[0], A.center[1], -0.32], label: "A", labelOffset: [0, 0.55, 0], pieces: [{ kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.4 }] }),
    { id: "frame", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "tagG", kind: "group", pieces: [], arrow: false, label: "g" },
    { id: "tagH", kind: "group", pieces: [], arrow: false, label: "h" },
    { id: "pivotD", kind: "group", label: "D", labelOffset: [-0.3, 0, 0.3], pieces: [{ kind: "cylinder", radius: 0.1, length: 0.7 }] },
  ],
  driver: { part: "gearC", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const t = train(theta);
    const tag = (p) => [...rot2(p, theta), 0.1];
    return {
      parts: {
        gearC: { angle: theta },
        pinionB: { position: t.center, angle: B_PHASE + t.pinion },
        gearB: { position: [t.center[0], t.center[1], -0.32], angle: B_PHASE + t.pinion },
        gearA: { angle: A_PHASE + t.a },
        frame: { from: [A.center[0], A.center[1], 0.3], to: [t.center[0], t.center[1], 0.3] },
        tagG: { position: tag(TAGS.g) },
        tagH: { position: tag(TAGS.h) },
      },
      readouts: [],
    };
  },
};
