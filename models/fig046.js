// 第 46 種:鏈索與發條盒,某些手錶的主要動力來源。左邊是發條盒,右邊是鏈索輪(fusee)。
// 上緊時鏈索纏在鏈索輪上、從頂端小直徑那層拉出(此時發條力量最大);手錶走動時發條盒轉動把鏈索收回,
// 鏈索在鏈索輪上的接觸點逐層移到底端大直徑那層,力臂變長,補償發條放鬆時的力量損失。
// 主動件是虛擬的「發條放鬆」:0 為剛上緊、1 為走完(原圖畫的是快走完時)。
// 鏈索的一端固定在鏈索輪底端,另一端固定在發條盒頂端。鏈索上每一節的高度固定:在鏈索輪上它沿所在那層
// 由下往上纏,被發條盒收回時也纏在同一高度,所以兩輪之間那段始終是水平的,接在鏈索輪目前那層上。
import { TAU, Y, Z, add, scale, dot, planeBasis, planeAngle } from "./kit.js";

const BARREL = { x: -1.75, radius: 1.12, height: 1.15, bottom: -0.55 };
const FUSEE = { x: 1.4, tiers: [1.25, 1.05, 0.85, 0.65, 0.47], tierHeight: 0.22, bottom: -0.55 };
const TURNS_PER_TIER = 1.5;
const TIERS = FUSEE.tiers.length;
const TOTAL = TIERS * TURNS_PER_TIER; // 上緊時鏈索在鏈索輪上的圈數
const LIFT = 0.04; // 鏈索中心離輪面的距離
const RB = BARREL.radius + LIFT;
const SEG = 48; // 每圈取樣點數

// 鏈索上的一節以 n 標記:上緊時它在鏈索輪上從底端固定點往上數第幾圈(0 到 TOTAL)
const tierOf = (n) => Math.min(TIERS - 1, Math.max(0, Math.floor(n / TURNS_PER_TIER)));
const fuseeRadius = (n) => FUSEE.tiers[tierOf(n)] + LIFT;
function height(n) {
  const k = tierOf(n);
  return FUSEE.bottom + FUSEE.tierHeight * (k + 0.2 + 0.6 * Math.min(1, n / TURNS_PER_TIER - k));
}
/** 從鏈索輪底端固定點到第 n 節的鏈長 */
function lengthTo(n) {
  let len = 0;
  for (let k = 0; k < TIERS; k++) len += Math.min(Math.max(n - k * TURNS_PER_TIER, 0), TURNS_PER_TIER) * TAU * (FUSEE.tiers[k] + LIFT);
  return len;
}

// 兩輪都繞 +Y;角度 ψ 在輪的平面上量(planeBasis),鏈索走輪的前方(+z)
const [U, V] = planeBasis(Y);
const FRONT = planeAngle(Y, Z);
// 手錶走動時鏈索在前方往左(−x)收進發條盒;SPIN 是讓前方輪面往左走的轉向
const SPIN = Math.sign(dot(add(scale(U, -Math.sin(FRONT)), scale(V, Math.cos(FRONT))), [-1, 0, 0]));
const around = (cx, r, psi, y) => add([cx, y, 0], add(scale(U, r * Math.cos(psi)), scale(V, r * Math.sin(psi))));

/** 放鬆進度 u 時:離開鏈索輪的那一節、兩輪轉角、鏈索輪上目前接觸那層的半徑 */
export function fusee(u) {
  const contact = TOTAL * (1 - u);
  return {
    contact,
    fuseeAngle: SPIN * TAU * (TOTAL - contact), // 鏈索輪每放出一圈轉一圈
    barrelAngle: (SPIN * (lengthTo(TOTAL) - lengthTo(contact))) / RB, // 發條盒收回多長就轉多少
    radius: FUSEE.tiers[tierOf(contact)],
  };
}

function chainPath(u) {
  const { contact } = fusee(u);
  const pts = [];
  // 發條盒上:從頂端的固定端沿收回的順序繞到離開處(在前方)
  const lc = lengthTo(contact);
  const nb = Math.ceil((TOTAL - contact) * SEG);
  for (let i = 0; i <= nb; i++) {
    const n = i === nb ? contact : TOTAL - ((TOTAL - contact) * i) / nb; // 離開處直接用 contact:剛好換層時,浮點誤差才不會讓它落到另一層
    pts.push(around(BARREL.x, RB, FRONT + (SPIN * (lengthTo(n) - lc)) / RB, height(n)));
  }
  // 鏈索輪上:從前方的接觸處逐層往下繞到底端固定點
  const nf = Math.ceil(contact * SEG);
  for (let i = 0; i <= nf; i++) {
    const n = contact - (contact * i) / Math.max(1, nf);
    pts.push(around(FUSEE.x, fuseeRadius(n), FRONT - SPIN * TAU * (contact - n), height(n)));
  }
  return pts;
}

export const centers = { barrel: [BARREL.x, BARREL.bottom + BARREL.height / 2, 0], fusee: [FUSEE.x, 0, 0] };

export default {
  figure: 46,
  parts: [
    {
      id: "barrel",
      kind: "cylinder",
      axis: Y,
      center: centers.barrel,
      radius: BARREL.radius,
      length: BARREL.height,
      mark: true,
      spin: BARREL.radius,
      pieces: [
        { kind: "cylinder", radius: 0.1, length: BARREL.height + 0.9, at: [0, 0, 0.3] },
        ...[0.3, 0.5, 0.7, 0.9].map((r) => ({ kind: "cylinder", radius: r, inner: r - 0.03, length: 0.02, at: [0, 0, BARREL.height / 2 + 0.01] })),
      ],
    },
    {
      id: "fusee",
      kind: "group",
      axis: Y,
      center: centers.fusee,
      spin: 1.3,
      pieces: [
        ...FUSEE.tiers.map((r, k) => ({ kind: "cylinder", radius: r, length: FUSEE.tierHeight, at: [0, 0, FUSEE.bottom + FUSEE.tierHeight * (k + 0.5)], mark: k === 0 })),
        { kind: "cylinder", radius: 0.1, length: 2.6, at: [0, 0, 0] },
      ],
    },
    { id: "chain", kind: "chain", style: "plate", pitch: 0.1, width: 0.07, offset: 0.012, normal: [0, 1, 0] },
  ],
  driver: { type: "virtual", label: "發條放鬆", mode: "balance", range: [0, 1], format: (u) => Math.round(u * 100) + "%" },
  view: { direction: [0.05, 0.45, 1] },
  pose(u) {
    const v = Math.min(1, Math.max(0, u));
    const { fuseeAngle, barrelAngle } = fusee(v);
    return {
      parts: { barrel: { angle: barrelAngle }, fusee: { angle: fuseeAngle } },
      paths: { chain: { points: chainPath(v), closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
