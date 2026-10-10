// 第 203 種:曲面開槽臂(左下,繞下方的軸心擺動)的規則擺動,給直臂(右上,繞右邊的軸心擺動)變速的擺動。
// 直臂左端的銷往前伸進開槽臂上的彎曲長槽(原圖直臂伸進開槽臂輪廓的那段畫成虛線:直臂在開槽臂後面)。
// 開槽臂等速擺動時,銷在槽的不同部位被推動的比例不同,直臂的擺動就時快時慢:兩端慢、中間快。
// 主動件是開槽臂(往復擺動)。
// 推斷:槽與兩軸的比例照 507movements.com 的動畫(槽是半圓,圓心離開槽臂軸心半個槽半徑;兩軸距離與直臂長度見下),
// 原圖的槽比半圓扁一些;開槽臂的擺幅取到銷從槽的一端走到另一端(約 219°),直臂擺約 34°。
import { swing, rot2 } from "./kit.js";
import { pedestal } from "./supports.js";
import { shape, arcPoints } from "./shapes.js";

const { PI } = Math;
// 開槽臂的局部座標(軸心在原點):槽的中心線是以 C 為心、半徑 R 的左半圓,兩端在 C 的正上方與正下方
const C = [0, 1];
const R = 2;
const SLOT_W = 0.12; // 槽寬的一半
const PIN_R = 0.11;
const BAND = 0.4; // 槽兩側的臂寬
const HUB = 1.4; // 下方軸轂一塊的半徑(和臂的外緣在正下方相接)
const FILLET = 0.4;
// 直臂:軸心離開槽臂軸心約 4.96、臂長 4(507movements 的 14.9 與 12 縮成 1/3),整組轉 −10° 對到原圖直臂軸心的方向
const TILT = (-10 * PI) / 180;
const PIVOT = rot2([11.842928 / 3, 8.998629 / 3], TILT);
const ARM = 4;

/** 開槽臂轉 alpha 時:銷的位置(槽的圓與直臂的銷所走圓的交點)、銷在槽上的局部角、直臂的轉角 */
export function arms(alpha) {
  const c = rot2(C, alpha);
  const [dx, dy] = [PIVOT[0] - c[0], PIVOT[1] - c[1]];
  const d = Math.hypot(dx, dy);
  const a = (d * d + R * R - ARM * ARM) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const [ux, uy] = [dx / d, dy / d];
  // 兩個交點取這一支(擺動的全程連續,銷在槽的上端到下端之間)
  const pin = [c[0] + a * ux - h * uy, c[1] + a * uy + h * ux];
  const [lx, ly] = rot2([pin[0] - c[0], pin[1] - c[1]], -alpha);
  const phi = (Math.atan2(ly, lx) + 2 * PI) % (2 * PI);
  // 直臂朝左(約 170°–204°),取 0–2π 不在 ±π 繞回
  const straight = (Math.atan2(pin[1] - PIVOT[1], pin[0] - PIVOT[0]) + 2 * PI) % (2 * PI);
  return { pin, phi, straight };
}

/** 開槽臂轉到哪裡時銷正好在槽上的局部角 phi(在 lo、hi 之間二分;這一段 phi 隨開槽臂轉角單調) */
function reach(phi, lo, hi) {
  const f = (a) => arms(a).phi - phi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(f(mid)) === Math.sign(f(lo))) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
// 開槽臂的擺幅:原圖的姿勢(銷在槽的上端)為一端,往順時針擺約 219° 到銷在槽的下端
const TO = reach(PI / 2, TILT - 0.3, TILT + 0.3);
const FROM = reach((3 * PI) / 2, TILT - 4, TILT - 3.5);
export const range = [FROM, TO];

// 開槽臂的外形:槽外側的半圓帶,正下方接軸轂一塊,軸轂上方以圓角接回半圓帶的內緣,上端是圓頭
const around = (r, a0, a1) => arcPoints(r, a0, a1, ...C);
const fc = (() => {
  // 圓角的圓心:離軸心 HUB + FILLET、離 C 為 (R − BAND) − FILLET,在左邊
  const [p, q] = [HUB + FILLET, R - BAND - FILLET];
  const y = (p * p - q * q + C[1] * C[1]) / (2 * C[1]);
  return [-Math.sqrt(p * p - y * y), y];
})();
const hubEnd = Math.atan2(fc[1], fc[0]);
const filletFrom = Math.atan2(-fc[1], -fc[0]);
const innerEnd = Math.atan2(fc[1] - C[1], fc[0] - C[0]);
const filletTo = innerEnd - 2 * PI;
const outline = [
  ...around(R + BAND, PI / 2, (3 * PI) / 2).slice(0, -1),
  ...arcPoints(HUB, -PI / 2, hubEnd).slice(0, -1),
  ...arcPoints(FILLET, filletFrom, filletTo, ...fc).slice(0, -1),
  ...around(R - BAND, innerEnd, PI / 2).slice(0, -1),
  ...arcPoints(BAND, -PI / 2, PI / 2, C[0], C[1] + R).slice(0, -1),
];
// 槽:兩側是以 C 為心的半圓,兩端是半圓頭
const slot = [
  ...around(R + SLOT_W, PI / 2, (3 * PI) / 2).slice(0, -1),
  ...arcPoints(SLOT_W, -PI / 2, PI / 2, C[0], C[1] - R).slice(0, -1),
  ...around(R - SLOT_W, (3 * PI) / 2, PI / 2).slice(0, -1),
  ...arcPoints(SLOT_W, -PI / 2, PI / 2, C[0], C[1] + R).slice(0, -1),
].reverse();

const Z_ARM = -0.2; // 直臂的板在開槽臂(z 0)後面

export default {
  figure: 203,
  parts: [
    {
      id: "slotted",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(outline, [slot]), thickness: 0.15 },
        { kind: "cylinder", radius: 0.5, inner: 0.25, length: 0.25 },
        { kind: "cylinder", radius: 0.25, length: 0.45, accent: true },
      ],
    },
    {
      id: "straight",
      kind: "group",
      center: [...PIVOT, Z_ARM],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[0, -0.36], ...arcPoints(0.2, -PI / 2, PI / 2, ARM, 0), [0, 0.36]]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.55, inner: 0.3, length: 0.2 },
        { kind: "cylinder", radius: 0.3, length: 0.4 },
        // 銷:從直臂往前穿過開槽臂的槽,前端一個墊圈擋在槽外
        { kind: "cylinder", radius: PIN_R, length: 0.32, at: [ARM, 0, 0.16] },
        { kind: "cylinder", radius: 0.17, length: 0.04, at: [ARM, 0, 0.31] },
        { kind: "cylinder", radius: 0.12, length: 0.6, at: [0, 0, -0.3] }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推斷(原圖只畫出兩個軸轂):兩根軸的軸承座與共用的底板;開槽臂往下擺到軸心下方約 3.4,底板放在它下面
        { kind: "cylinder", radius: 0.12, length: 0.5, at: [0, 0, -0.4] },
        ...pedestal({ at: [0, 0], z: -0.55, bore: 0.12, floor: -3.9 }),
        ...pedestal({ at: PIVOT, z: -0.55, bore: 0.12, floor: -3.9 }),
        { kind: "box", size: [PIVOT[0] + 1, 0.18, 0.6], at: [PIVOT[0] / 2, -3.99, -0.55] }, // 兩座共用的底板
      ],
    },
  ],
  driver: { part: "slotted", type: "rotation", cycle: [FROM, TO], initial: TO - FROM },
  target: "straight",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const alpha = swing(v, FROM, TO);
    const { straight } = arms(alpha);
    return { parts: { slotted: { angle: alpha }, straight: { angle: straight } }, readouts: [] };
  },
};
