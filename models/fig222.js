// 第 222 種:把第 221 種的橢圓輪換成一個繞偏心點轉動的普通正齒輪 C(虛線是它的外緣掃過的圓)。
// 中間的齒輪 B 同時與 C 和左上的輪 A 咬合;B 的軸心由兩根簡單的連桿定位:一根接到 A 的中心(繞 A 擺動的框架),
// 一根接到 C 的中心——比用溝槽更簡單地維持齒間的適當節距。C 等速轉動時它的中心繞偏心點走圓,
// B 被連桿帶著來回擺,A 因此得到不規則的轉動。主動件是 C。
// 推斷:齒數;偏心距依原圖量得。
// A 與 C 不咬合(原圖兩輪之間留有空隙):A 的軸心離偏心點要大於 偏心距 + 兩輪齒頂圓半徑和,
// 否則 C 的中心繞到最靠近 A 時兩輪的齒會互相穿透(原本 [-1.8, 2.2] 離 E 只有 2.84,不夠)。
import { TAU, Z } from "./kit.js";
import { pedestal } from "./supports.js";
import { circleCircle } from "./linkage.js";
import { meshAngle } from "./gears.js";
import { circle } from "./shapes.js";

const PITCH = 0.27;
const gearOf = (teeth) => ({ teeth, radius: (teeth * PITCH) / TAU });
const A = { ...gearOf(28), center: [-2.0, 2.45, 0] };
const B = gearOf(20);
const C = gearOf(27);
const E = [0, 0, 0]; // C 轉動的偏心點
const ECC = 0.5;
const AB = A.radius + B.radius;
const BC = B.radius + C.radius;

/** C 轉 theta(逆時針為正):C 的中心、B 的中心、三輪轉角(相對原圖) */
export function train(theta) {
  const cc = [E[0] + ECC * Math.cos(theta), E[1] + ECC * Math.sin(theta), 0];
  const b = circleCircle(A.center, AB, cc, BC, 1).point;
  const beta = Math.atan2(b[1] - cc[1], b[0] - cc[0]); // C → B
  const gamma = Math.atan2(b[1] - A.center[1], b[0] - A.center[0]); // A → B
  // 相對連心線純滾動(外咬合):r_C·(θC − β) = −r_B·(θB − β);r_A·(θA − γ) = −r_B·(θB − γ)
  const thetaB = beta - (C.radius / B.radius) * (theta - beta);
  const thetaA = gamma - (B.radius / A.radius) * (thetaB - gamma);
  return { cc, b, beta, gamma, thetaB, thetaA };
}
const T0 = train(0);
// 原圖的齒相位:C 的一齒正對 B,B、A 依咬合排好
const C0 = T0.beta;
const B0 = meshAngle({ ...C, center: T0.cc, axis: Z }, { ...B, center: T0.b, axis: Z }, C0);
const A0 = meshAngle({ ...B, center: T0.b, axis: Z }, { ...A, axis: Z }, B0);
export const radii = { A: A.radius, B: B.radius, C: C.radius, ECC };
export const centerA = A.center;

const gear = (id, g, extra = {}) => ({ id, kind: "gear", teeth: g.teeth, radius: g.radius, width: 0.22, ...extra });

export default {
  figure: 222,
  parts: [
    gear("gearA", A, { center: A.center, pieces: [{ kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.5 }] }),
    gear("gearB", B, { pieces: [{ kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.5 }] }),
    // C 的偏心軸孔:在 C 自己的座標裡是固定的一點
    gear("gearC", C, { pieces: [{ kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.5, at: [-ECC * Math.cos(C0), ECC * Math.sin(C0), 0] }, { kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.4 }] }),
    { id: "link", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "frame", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "envelope", kind: "plate", shape: { outline: circle(ECC + C.radius + 0.1), holes: [circle(ECC + C.radius + 0.085).reverse()] }, thickness: 0.01, center: [0, 0, -0.3] },
    { id: "pivot", kind: "cylinder", center: [...E.slice(0, 2), 0.08], radius: 0.12, length: 0.26 }, // 樞軸不伸到連桿那一層
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出軸頭):A 的軸與 C 的偏心樞軸往後伸進軸承座
      pieces: [A.center, E].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [x, y, -0.35] },
        ...pedestal({ at: [x, y], z: -0.65, bore: 0.06, floor: -3.4, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "gearC", type: "rotation" },
  target: "gearA", // 得到不規則轉動的那一輪
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const t = train(theta);
    // C 繞偏心點轉 theta:中心走到 cc,本體同樣轉了 theta
    return {
      parts: {
        gearC: { position: t.cc, angle: C0 + theta },
        gearB: { position: t.b, angle: B0 + t.thetaB - T0.thetaB },
        gearA: { angle: A0 + t.thetaA - T0.thetaA },
        link: { from: [t.b[0], t.b[1], 0.29], to: [t.cc[0], t.cc[1], 0.29] },
        frame: { from: [A.center[0], A.center[1], 0.29], to: [t.b[0], t.b[1], 0.29] },
      },
      readouts: [],
    };
  },
};
