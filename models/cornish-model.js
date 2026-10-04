// 第 181–184 種的模型定義:同一套手動齒輪(見 cornish-gear.js),鎖住手柄的零件有兩種——
// "catch":中間樞軸上的 S 形斜向卡榫(第 181、182 種);"quadrants":兩根軸上各一個互相擋住的象限器(第 183、184 種)。
// 象限器:各是一個以自己軸心為圓心的扇形。A 位置時下方象限器的圓弧擋住上方象限器的一角(上方手柄被鎖住,下方可轉);
// 下方手柄被頂到 B 時,它的圓弧剛好轉離那一角,上方被放開;B 位置時上方的圓弧反過來擋住下方的一角。
import { deg, polar, add, rot2 } from "./kit.js";
import { shape, arcPoints, thickLine as thick } from "./shapes.js";
import { ROD, TAPPET, SHAFTS, HANDLE, ANGLES, SPAN, cornish, valves } from "./cornish-gear.js";

const QUADRANT = 1.6; // 象限器半徑
const D = SHAFTS.upper[1] - SHAFTS.lower[1];
const P = [SHAFTS.lower[0] + Math.sqrt(QUADRANT ** 2 - (D / 2) ** 2), (SHAFTS.upper[1] + SHAFTS.lower[1]) / 2]; // 兩圓弧的交點
const angleFrom = (c) => Math.atan2(P[1] - c[1], P[0] - c[0]);
const SPREAD = deg(85);
// 象限器在 A 位置時的角度範圍(世界座標)
const LOWER_HI = angleFrom(SHAFTS.lower) + (ANGLES.lower.A - ANGLES.lower.B);
const UPPER_LO = angleFrom(SHAFTS.upper);
const SECTORS = {
  lower: { lo: LOWER_HI - SPREAD, hi: LOWER_HI },
  upper: { lo: UPPER_LO, hi: UPPER_LO + SPREAD },
};

/** 扇形外框(局部座標,相對手柄的角度):外圓弧加兩條半徑邊,中間鏤空 */
function sector(lo, hi, r) {
  const outline = [[0, 0], ...arcPoints(r, lo, hi)];
  const w = 0.2;
  const inner = [...arcPoints(r - w, lo + w / (r - w) + 0.12, hi - w / (r - w) - 0.12), ...arcPoints(0.55, hi - 0.25, lo + 0.25)];
  return shape(outline, [inner.reverse()]);
}
const localSector = (which) => sector(SECTORS[which].lo - ANGLES[which].A, SECTORS[which].hi - ANGLES[which].A, QUADRANT);

/** 某個姿態下兩個象限器在世界中的輪廓(測試用:兩者不互相穿透) */
export function quadrantOutlines(state) {
  const out = {};
  for (const which of ["upper", "lower"]) {
    const rot = state[which] - ANGLES[which].A;
    const c = SHAFTS[which];
    out[which] = [[0, 0], ...arcPoints(QUADRANT, SECTORS[which].lo, SECTORS[which].hi)].map((p) => {
      const [x, y] = rot2(p, rot);
      return [x + c[0], y + c[1]];
    });
  }
  return out;
}
export const contactPoint = P;

const CATCH = thick([[-0.75, 1.15], [-0.5, 0.95], [-0.32, 0.6], [-0.18, 0.25], [0, 0], [0.3, -0.3], [0.62, -0.52], [0.85, -0.85], [0.92, -1.2]], 0.22);
const CATCH_SWING = deg(-14);
// 閥臂(相對手柄的角度)與閥桿長
const ARMS = {
  upper: { angle: deg(28.7) - ANGLES.upper.A, length: 1.75, rod: -4.5 },
  lower: { angle: deg(206) - ANGLES.lower.A, length: 1.9, rod: -1.6 },
};

const ARM_Z = -0.6; // 閥桿臂在活塞桿的後面(撥爪從它前方通過)

function shaftPart(which, lock) {
  const arm = ARMS[which];
  const pieces = [
    { kind: "cylinder", radius: 0.36, inner: 0.2, length: 0.3 },
    { kind: "cylinder", radius: 0.2, length: 1.0, at: [0, 0, -0.2], accent: true }, // 軸往後伸到活塞桿後面的閥桿臂
    // 手柄:直臂與端點的圓頭
    // 手柄是薄的直條、端頭不加球:撥爪是以手柄中心線與活塞桿邊緣的交點算的,有厚度的端頭會陷進撥爪。
    // 上下兩支手柄前後錯開一層,交叉時互不相碰
    { kind: "box", size: [HANDLE - 0.3, 0.04, 0.1], at: [(HANDLE + 0.3) / 2, 0, which === "upper" ? 0.22 : 0.1] },
    // 閥臂
    { kind: "plate", shape: shape(thick([[0, 0], polar(arm.length, arm.angle).slice(0, 2)], 0.2)), thickness: 0.1, at: [0, 0, ARM_Z] },
    { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.15, at: [...polar(arm.length, arm.angle).slice(0, 2), ARM_Z] },
  ];
  if (lock === "quadrants") pieces.push({ kind: "plate", shape: localSector(which), thickness: 0.12, at: [0, 0, 0.3] });
  return { id: which, kind: "group", center: SHAFTS[which], arrow: false, pieces };
}

export function cornishModel({ figure, lock, initial }) {
  const parts = [
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [ROD.right - ROD.left, 9, 0.3], at: [(ROD.left + ROD.right) / 2, 0, -0.35] },
        { kind: "box", size: [0.23, 2 * TAPPET.half, 0.6], at: [ROD.right - 0.115, 0, -0.05], accent: true },
      ],
    },
    shaftPart("upper", lock),
    shaftPart("lower", lock),
    { id: "upperRod", kind: "link", width: 0.1, thickness: 0.08 },
    { id: "lowerRod", kind: "link", width: 0.1, thickness: 0.08 },
  ];
  if (lock === "catch")
    parts.push({
      id: "catch",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(CATCH), thickness: 0.12, at: [0, 0, 0.34] },
        { kind: "cylinder", radius: 0.3, inner: 0.14, length: 0.12, at: [0, 0, 0.34] },
      ],
    });
  return {
    figure,
    parts,
    // 大型引擎的活塞走得慢(一程約 2.4 秒),手柄甩到位的過程(約 0.4 秒)才看得清楚
    driver: { part: "rod", type: "translation", direction: [0, 1, 0], cycle: [0, SPAN], initial, speed: 1.2 },
    targets: ["upper", "lower"],
    view: { direction: [0.06, 0.05, 1] },
    pose(v) {
      const state = cornish(v);
      const pin = (which) => {
        const a = state[which] + ARMS[which].angle;
        return add(SHAFTS[which], polar(ARMS[which].length, a, ARM_Z));
      };
      const up = pin("upper");
      const low = pin("lower");
      const parts = {
        rod: { position: [0, state.y, 0] },
        upper: { angle: state.upper },
        lower: { angle: state.lower },
        upperRod: { from: up, to: add(up, [0, ARMS.upper.rod, 0]) },
        lowerRod: { from: low, to: add(low, [0, ARMS.lower.rod, 0]) },
      };
      if (lock === "catch") parts.catch = { angle: CATCH_SWING * state.latch };
      return { parts, readouts: valves(state) };
    },
  };
}
