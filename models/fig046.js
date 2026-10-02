// 第 46 種:鏈索與發條盒,某些手錶的主要動力來源。左邊是發條盒,右邊是鏈索輪(fusee)。
// 上緊時鏈索纏在鏈索輪上、從小直徑的一端拉出(此時發條力量最大);手錶走動時發條盒轉動把鏈索收回,
// 鏈索在鏈索輪上的接觸點逐漸移到大直徑的一端,力臂變長,補償發條放鬆時的力量損失。
// 主動件是虛擬的「發條放鬆」:0 為剛上緊、1 為走完。鏈索兩端固定,長度不變。
import { TAU, Y } from "./kit.js";

const BARREL = { x: -1.75, radius: 1.12, height: 1.15, bottom: -0.55 };
const FUSEE = { x: 1.4, tiers: [1.25, 1.05, 0.85, 0.65, 0.47], tierHeight: 0.22, bottom: -0.55 };
const TURNS_PER_TIER = 1.5;
const TIERS = FUSEE.tiers.length;
const TOTAL = TIERS * TURNS_PER_TIER; // 鏈索在鏈索輪上的圈數
const GAP = 0.11; // 鏈索在發條盒上每圈的上下間距
const SEG = 40; // 每圈取樣點數

// 鏈索輪上第 k 層(由下往上)的半徑與高度
const tier = (k) => ({ r: FUSEE.tiers[k] + 0.06, y: FUSEE.bottom + FUSEE.tierHeight * (k + 0.5) });

/** 放鬆進度 u 時,鏈索輪上還剩幾圈(從頂端小直徑那一層開始放出) */
const fuseeTurnsLeft = (u) => TOTAL * (1 - u);

// 鏈索在鏈索輪上從底端(固定點)往上第 n 圈處的位置(層 = n ÷ 每層圈數)
function fuseePoint(n, phase) {
  const k = Math.min(TIERS - 1, Math.floor(n / TURNS_PER_TIER));
  const { r, y } = tier(k);
  const a = phase - n * TAU;
  return [FUSEE.x + r * Math.cos(a), y, r * Math.sin(a)];
}

// 鏈索從鏈索輪放出的長度:從頂端那圈往下累加各層周長
function released(u) {
  let len = 0;
  const done = TOTAL * u;
  for (let n = 0; n < done; n += 0.01) {
    const k = Math.max(0, Math.min(TIERS - 1, Math.floor((TOTAL - n - 1e-9) / TURNS_PER_TIER)));
    len += tier(k).r * TAU * Math.min(0.01, done - n);
  }
  return len;
}

/** 放鬆進度 u 時:鏈索輪轉角、發條盒轉角、目前接觸層的半徑 */
export function fusee(u) {
  const fuseeAngle = TAU * TOTAL * u; // 鏈索輪每放出一圈轉一圈
  const len = released(u);
  const barrelAngle = len / (BARREL.radius + 0.06);
  const k = Math.min(TIERS - 1, Math.floor(fuseeTurnsLeft(u) / TURNS_PER_TIER - 1e-9));
  return { fuseeAngle, barrelAngle, radius: tier(Math.max(0, k)).r, released: len };
}

function chainPath(u) {
  const { fuseeAngle, barrelAngle } = fusee(u);
  const pts = [];
  // 發條盒上:從固定端(盒底)繞 barrelAngle 圈往上
  const rb = BARREL.radius + 0.06;
  const steps = Math.max(2, Math.ceil((barrelAngle / TAU) * SEG));
  for (let i = 0; i <= steps; i++) {
    const a = -(barrelAngle * i) / steps; // 以盒心看,鏈索從盒的前方繞過去
    const y = BARREL.bottom + 0.12 + (GAP * barrelAngle * i) / steps / TAU;
    pts.push([BARREL.x + rb * Math.cos(a - Math.PI / 2 + barrelAngle), y, rb * Math.sin(a - Math.PI / 2 + barrelAngle)]);
  }
  // 鏈索輪上:從目前接觸處沿螺旋往下到底端固定點
  const left = fuseeTurnsLeft(u);
  const phase = Math.PI / 2 - fuseeAngle;
  const n = Math.ceil(left * SEG);
  for (let i = n; i >= 0; i--) pts.push(fuseePoint((left * i) / Math.max(1, n), phase + left * TAU));
  return pts;
}

export default {
  figure: 46,
  parts: [
    {
      id: "barrel",
      kind: "cylinder",
      axis: Y,
      center: [BARREL.x, BARREL.bottom + BARREL.height / 2, 0],
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
      center: [FUSEE.x, 0, 0],
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
      parts: { barrel: { angle: barrelAngle }, fusee: { angle: -fuseeAngle } },
      paths: { chain: { points: chainPath(v), closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
