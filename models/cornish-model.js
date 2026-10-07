// 第 181–184 種的模型定義:同一套手動齒輪(見 cornish-gear.js),鎖住手柄的零件有兩種——
// "catch":中間樞軸上的斜向卡榫與兩軸上的凸輪(第 181、182 種;接觸見 diagonal-catch.js);
// "quadrants":兩根軸上各一個互相擋住的象限器(第 183、184 種)。
// 象限器:各是一個以自己軸心為圓心的扇形。A 位置時下方象限器的圓弧擋住上方象限器的一角(上方手柄被鎖住,下方可轉);
// 下方手柄被頂到 B 時,它的圓弧剛好轉離那一角,上方被放開;B 位置時上方的圓弧反過來擋住下方的一角。
import { deg, polar, add, rot2 } from "./kit.js";
import { shape, arcPoints, thickLine as thick } from "./shapes.js";
import { ROD, TAPPET, SHAFTS, HANDLE, ANGLES, SPAN, cornish, valves } from "./cornish-gear.js";
import { catchState, CAMS, TIPS, TIP, PIVOT } from "./diagonal-catch.js";

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

// 斜向卡榫:樞軸的轂、往兩根指頭伸的彎臂;指頭沿半徑對著各自的軸,端頭是圓的(接觸只算端頭的圓)。
// 指頭和凸輪同一層;轂與彎臂往前加厚(大型引擎的鑄鐵卡榫,夠重才擋得住配重)
const CATCH_Z = 0.34;
const BODY = { z: 0.43, thickness: 0.3 };
const finger = (which, length) => {
  const c = SHAFTS[which];
  const t = TIPS[which];
  const r = Math.hypot(t[0] - c[0], t[1] - c[1]);
  return [c[0] + ((t[0] - c[0]) * (r + length)) / r, c[1] + ((t[1] - c[1]) * (r + length)) / r];
};
const CATCH_ARMS = ["upper", "lower"].map((which) => {
  const base = finger(which, 0.22);
  return { arm: thick([[0, 0], base], 0.26), finger: thick([base, TIPS[which]], 2 * TIP), tip: TIPS[which], base };
});
// 閥臂(相對手柄的角度)與閥桿長
const ARMS = {
  upper: { angle: deg(28.7) - ANGLES.upper.A, length: 1.75, rod: -4.5 },
  lower: { angle: deg(206) - ANGLES.lower.A, length: 1.9, rod: -1.6 },
};

const ARM_Z = -0.6; // 閥桿臂在活塞桿的後面(撥爪從它前方通過)

// 撥爪的剖面(活塞桿右緣是 x = ROD.right):分成兩層,下方手柄那一層(後)用上面推、上方手柄那一層(前)用下面推。
// 不推手柄的那個右角做成斜角(推斷):手柄停在 A / B 時端點剛好在撥爪的路徑邊上,稍微偏進來時,斜角把它往鎖住的方向撥開,
// 不會被撥爪帶走
const BEVEL = [0.07, 0.12];
function tappet(layer) {
  const [l, r, h] = [ROD.right - 0.23, ROD.right, TAPPET.half];
  return layer === "lower"
    ? [[l, -h], [r - BEVEL[0], -h], [r, -h + BEVEL[1]], [r, h], [l, h]]
    : [[l, -h], [r, -h], [r, h - BEVEL[1]], [r - BEVEL[0], h], [l, h]];
}

function shaftPart(which, lock) {
  const arm = ARMS[which];
  const pieces = [
    { kind: "cylinder", radius: 0.36, inner: 0.2, length: 0.3 },
    { kind: "cylinder", radius: 0.2, length: 1.25, at: [0, 0, -0.325], accent: true }, // 軸往後伸過閥桿臂,進到機架板的軸承
    // 手柄:直臂與端點的圓頭
    // 手柄是薄的直條、端頭不加球:撥爪是以手柄中心線與活塞桿邊緣的交點算的,有厚度的端頭會陷進撥爪。
    // 上下兩支手柄前後錯開一層,交叉時互不相碰
    { kind: "box", size: [HANDLE - 0.3, 0.04, 0.1], at: [(HANDLE + 0.3) / 2, 0, which === "upper" ? 0.22 : 0.1] },
    // 閥臂
    { kind: "plate", shape: shape(thick([[0, 0], polar(arm.length, arm.angle).slice(0, 2)], 0.2)), thickness: 0.1, at: [0, 0, ARM_Z] },
    { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.15, at: [...polar(arm.length, arm.angle).slice(0, 2), ARM_Z] },
  ];
  if (lock === "quadrants") pieces.push({ kind: "plate", shape: localSector(which), thickness: 0.12, at: [0, 0, 0.3] });
  if (lock === "catch")
    pieces.push(
      { kind: "cylinder", radius: 0.25, length: 0.13, at: [0, 0, 0.215] }, // 軸頭到凸輪之間的軸套
      { kind: "plate", shape: shape(CAMS[which].map((p) => rot2(p, -ANGLES[which].A))), thickness: 0.12, at: [0, 0, CATCH_Z] },
    );
  return { id: which, kind: "group", center: SHAFTS[which], arrow: false, pieces };
}

const FRAME_Z = -0.85; // 機架板(在閥桿臂的後面)
// 機架板:兩根軸的軸承與卡榫的樞軸銷都在它上面(推斷,原圖只畫出軸頭)
const framePart = (lock) => ({
  id: "frame",
  kind: "group",
  pieces: [
    { kind: "box", size: [0.8, SHAFTS.upper[1] - SHAFTS.lower[1] + 1.0, 0.1], at: [SHAFTS.upper[0], (SHAFTS.upper[1] + SHAFTS.lower[1]) / 2, FRAME_Z] },
    ...[SHAFTS.upper, SHAFTS.lower].map((c) => ({ kind: "cylinder", radius: 0.32, inner: 0.2, length: 0.15, at: [c[0], c[1], FRAME_Z + 0.1] })),
    ...(lock === "catch" ? [{ kind: "cylinder", radius: 0.13, length: 1.45, at: [0, 0, FRAME_Z + 0.725] }] : []), // 卡榫的樞軸銷
  ],
});
// 動力重演:兩支手柄裝在各自的軸上自由轉動。上方手柄被配重往上拉(彈簧往順時針)、下方手柄靠自重落下
// (彈簧往逆時針代表);各自的兩個極限位置由機架上的擋止決定(原圖沒畫,推斷)。誰被擋住、何時放開,
// 全靠兩個象限器的圓弧(第 183、184 種),或卡榫的兩根指頭與兩片凸輪(第 181、182 種;卡榫只靠兩片凸輪擺動,不受重力)
const lockReplay = (initial, lock) => {
  const atB = initial > 0; // 第 184 種從 B 位置開始
  const range = (which) => {
    const d = ANGLES[which].A - ANGLES[which].B;
    return atB ? [0, d] : [-d, 0];
  };
  const [first, second] = atB ? ["下降", "上升"] : ["上升", "下降"];
  const holder = lock === "catch" ? ["被卡榫鎖住", "被卡榫鎖住"] : ["被上方象限器擋住", "被下方象限器擋住"];
  return {
    free: {
      upper: { pivot: SHAFTS.upper, spring: -1, gravity: false, limits: range("upper") },
      lower: { pivot: SHAFTS.lower, spring: 1, gravity: false, limits: range("lower") },
      ...(lock === "catch" ? { catch: { pivot: [...PIVOT, 0], gravity: false } } : {}),
    },
    ignore: [["upper", "upperRod"], ["lower", "lowerRod"], ["upper", "frame"], ["lower", "frame"], ...(lock === "catch" ? [["catch", "frame"]] : [])],
    expect: [
      { at: initial + SPAN / 2, part: atB ? "upper" : "lower", label: `活塞${first}到一半,撥爪推著${atB ? "上方" : "下方"}手柄轉` },
      { at: initial + SPAN / 2, part: atB ? "lower" : "upper", label: `同時${atB ? "下方" : "上方"}手柄仍${atB ? holder[0] : holder[1]}、不動` },
      { at: initial + (3 * SPAN) / 2, part: atB ? "lower" : "upper", label: `活塞${second}到一半,撥爪推著${atB ? "下方" : "上方"}手柄轉` },
      { at: initial + (3 * SPAN) / 2, part: atB ? "upper" : "lower", label: `同時${atB ? "上方" : "下方"}手柄仍${atB ? holder[1] : holder[0]}、不動` },
      { at: initial + SPAN, part: "lower", label: `活塞${first}到底,下方手柄${atB ? "被放開、落回原處" : `被抬起、${holder[0]}`}`, quote: "下方的手柄會被凸出的撥爪撞擊,並在被抬起後與卡榫嚙合" },
      { at: initial + SPAN, part: "upper", label: `同時上方手柄${atB ? `被壓回、${holder[1]}` : "脫離、被配重拉起"}`, quote: "上方的手柄由於脫離了卡榫,其後方的配重會將手柄向上拉" },
      { at: initial + 2 * SPAN, part: "lower", label: `活塞${second}到底,下方手柄回到起點` },
      { at: initial + 2 * SPAN, part: "upper", label: `上方手柄回到起點` },
      ...(lock === "catch"
        ? [
            { at: initial + SPAN, part: "catch", label: `活塞${first}到底,卡榫被${atB ? "下方手柄經凸輪推回" : "上方手柄經凸輪推過去"}` },
            { at: initial + 2 * SPAN, part: "catch", label: "卡榫回到起點" },
          ]
        : []),
    ],
  };
};

export function cornishModel({ figure, lock, initial }) {
  const parts = [
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [ROD.right - ROD.left, 9, 0.3], at: [(ROD.left + ROD.right) / 2, 0, -0.35] },
        { kind: "plate", shape: shape(tappet("lower")), thickness: 0.51, at: [0, 0, -0.095], accent: true },
        { kind: "plate", shape: shape(tappet("upper")), thickness: 0.09, at: [0, 0, 0.205], accent: true },
      ],
    },
    shaftPart("upper", lock),
    shaftPart("lower", lock),
    { id: "upperRod", kind: "link", width: 0.1, thickness: 0.08 },
    { id: "lowerRod", kind: "link", width: 0.1, thickness: 0.08 },
    framePart(lock),
  ];
  if (lock === "catch")
    parts.push({
      id: "catch",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.3, inner: 0.14, length: BODY.thickness, at: [0, 0, BODY.z] },
        ...CATCH_ARMS.flatMap(({ arm, finger: fingerShape, tip, base }) => [
          { kind: "plate", shape: shape(arm), thickness: BODY.thickness, at: [0, 0, BODY.z] },
          { kind: "cylinder", radius: 0.16, length: BODY.thickness, at: [...base, BODY.z] },
          { kind: "plate", shape: shape(fingerShape), thickness: 0.12, at: [0, 0, CATCH_Z] },
          { kind: "cylinder", radius: TIP, length: 0.12, at: [...tip, CATCH_Z] },
        ]),
      ],
    });
  return {
    figure,
    parts,
    // 大型引擎的活塞走得慢(一程約 2.4 秒),手柄甩到位的過程(約 0.4 秒)才看得清楚
    replay: lockReplay(initial, lock),
    driver: { part: "rod", type: "translation", direction: [0, 1, 0], cycle: [0, SPAN], initial, speed: 1.2 },
    targets: ["upper", "lower"],
    view: { direction: [0.06, 0.05, 1] },
    pose(v) {
      const state = lock === "catch" ? catchState(v) : cornish(v);
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
      if (lock === "catch") parts.catch = { angle: state.phi };
      return { parts, readouts: valves(state) };
    },
  };
}
