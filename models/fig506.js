// 第 506 種:另一種周轉輪系,第一個輪與最後一個輪都不固定。m、n 是一根軸,承載輪系的臂 k、l 牢牢固定在上面;臂上承載著
// 兩個互相固定、在臂上轉的輪 d、e。輪 b 與 c 結合在一起,一同在軸 m、n 上自由轉;f 與 g 也固定在一起,一同在軸上自由轉。
// c、d、e、f 構成一個周轉輪系,c 是第一個輪,f 是最後一個輪。軸 A 是主動軸,上面牢牢固定著 a 與 h:a 咬 b,把運動傳給
// 周轉輪系的第一個輪 c;h 帶動 g,把運動傳給最後一個輪 f。這樣傳給輪系兩端的運動,產生臂 k、l 與軸 m、n 的合成運動。
// 這個輪系可以改:把 g 與 f 分開,g 固定在軸 m、n 上,f 只在軸上鬆轉;A 照樣經 a、b 帶動 c,同時經 h 使 g、軸 m、n 與臂 k、l
// 轉動,合成的轉動就傳給鬆的 f。
// 主動件是軸 A(左邊的手柄);狀態按鈕切換原來的接法與改過的接法。
// 照 525 px 原圖重讀(2026-10-21):軸 A 上是兩個傘齒輪——外面大的 h 咬上面的 g、裡面的 a 咬下面的 b;臂上也是兩個——外面大的 d
// 咬 c、裡面小的 e 咬 f;b 與 c、f 與 g 各由一段套筒連成一件,d 與 e 由一段轂連成一件。
// 推斷:原文沒有齒數。各對傘齒輪的節錐頂都在兩軸的交點上(a、b 與 h、g 在軸 A 與軸 m 的交點;c、d 與 e、f 在臂與軸 m 的交點),
// 大小照原圖量出的比例取齒數:a 20、b 40、h 34、g 36、c 24、d 17、e 12、f 16(每一對自己的模數),
// 轉速照齒數:c → f 的輪系值 −(c/d)(e/f)。原圖的 a 畫得比這個大(照原圖的高度它咬不到 b),以兩軸交點的幾何為準。
// 這組齒數下臂(軸 m、n)以軸 A 約 1/5 的轉速轉(以前的模型照「很慢」推斷的齒數,原文沒有這句)。
// 改過的接法時 f、g 分成兩個零件:g 以套環與鍵固定在軸 m 上(推斷),f 帶一段短套筒在軸上鬆轉。
import { X, Y, quatFromZ, quatMul, quatRotate, planeAngle } from "./kit.js";
import { bevelGear, pitchCones, bevelContact, meshAngle } from "./gears.js";
import { planetRotation } from "./bevel-train.js";

export const TEETH = { a: 20, b: 40, h: 34, g: 36, c: 24, d: 17, e: 12, f: 16 };
/** c → f(經 d、e)的輪系值(以臂為參考):兩次傘齒嚙合 */
export const E_CF = -(TEETH.c / TEETH.d) * (TEETH.e / TEETH.f);
const W = 0.1; // 齒寬
const Y_K = 0.22; // 臂 k、l 的高度(軸 A 在 y 0)
const SHAFT_R = 0.07; // 軸 m
const ROD_R = 0.05; // 臂上的軸(d、e 套在上面)
const L_END = 0.67; // 臂端 l 的螺帽(緊貼 d 的輪轂);再長,臂轉到左邊時會碰到軸 A 上的 a
const R = { b: 0.85, g: 1.05, c: 0.58, f: 0.32 }; // 各對大輪的大端節圓半徑(依原圖量)
const r = (pinion, wheel) => (R[wheel] * TEETH[pinion]) / TEETH[wheel];
const cones = (p, w) => pitchCones(TEETH[p], TEETH[w]);
const [CA, CB] = cones("a", "b");
const [CH, CG] = cones("h", "g");
const [CD, CC] = cones("d", "c");
const [CE, CF] = cones("e", "f");
const APEX_A = [0, 0, 0]; // 軸 A 與軸 m 的交點
const APEX_K = [0, Y_K, 0]; // 臂與軸 m 的交點
// 世界座標的齒輪(臂轉 0 時):axis 由大端指向錐頂
export const GEARS = {
  a: bevelGear({ apex: APEX_A, axis: X, teeth: TEETH.a, radius: r("a", "b"), cone: CA, width: W }),
  b: bevelGear({ apex: APEX_A, axis: Y, teeth: TEETH.b, radius: R.b, cone: CB, width: W }),
  h: bevelGear({ apex: APEX_A, axis: X, teeth: TEETH.h, radius: r("h", "g"), cone: CH, width: W }),
  g: bevelGear({ apex: APEX_A, axis: [0, -1, 0], teeth: TEETH.g, radius: R.g, cone: CG, width: W }),
  c: bevelGear({ apex: APEX_K, axis: Y, teeth: TEETH.c, radius: R.c, cone: CC, width: W }),
  d: bevelGear({ apex: APEX_K, axis: [-1, 0, 0], teeth: TEETH.d, radius: r("d", "c"), cone: CD, width: W }),
  e: bevelGear({ apex: APEX_K, axis: [-1, 0, 0], teeth: TEETH.e, radius: r("e", "f"), cone: CE, width: W }),
  f: bevelGear({ apex: APEX_K, axis: [0, -1, 0], teeth: TEETH.f, radius: R.f, cone: CF, width: W }),
};
export const CONTACTS = {
  ab: bevelContact(GEARS.a, GEARS.b),
  hg: bevelContact(GEARS.h, GEARS.g),
  cd: bevelContact(GEARS.c, GEARS.d),
  ef: bevelContact(GEARS.e, GEARS.f),
};

// 零件的群組:軸 A(沿 X,中心 x −1.15)、b–c 與 f–g(沿 Y,中心在原點)、行星 d–e(局部 z 朝錐頂;原點在臂上 x 0.4)
const A_CENTER = [-1.15, 0, 0];
const P_AT = 0.4;
const Q_A = quatFromZ(X);
const Q_Y = quatFromZ(Y);
const Q_P = quatFromZ([-1, 0, 0]);
/** 群組裡的齒輪附件:局部 axis(朝錐頂)、at;bore 是孔 */
const piece = (g, groupQuat, groupCenter, bore) => {
  const inv = [-groupQuat[0], -groupQuat[1], -groupQuat[2], groupQuat[3]];
  const axis = quatRotate(inv, g.axis).map((v) => Math.round(v * 1e9) / 1e9);
  const at = quatRotate(inv, [0, 1, 2].map((i) => g.center[i] - groupCenter[i])).map((v) => Math.round(v * 1e9) / 1e9);
  return { kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, bore, axis, at };
};
/** 附件的齒 0 在 meshAngle 的角度裡的位置(群組與附件都轉 0 時) */
const offsetOf = (g, groupQuat, groupCenter) => planeAngle(g.axis, quatRotate(quatMul(groupQuat, quatFromZ(piece(g, groupQuat, groupCenter).axis)), X));
const P_CENTER = [P_AT, Y_K, 0];
const OFF = {
  a: offsetOf(GEARS.a, Q_A, A_CENTER),
  h: offsetOf(GEARS.h, Q_A, A_CENTER),
  b: offsetOf(GEARS.b, Q_Y, [0, 0, 0]),
  c: offsetOf(GEARS.c, Q_Y, [0, 0, 0]),
  f: offsetOf(GEARS.f, Q_Y, [0, 0, 0]),
  g: offsetOf(GEARS.g, Q_Y, [0, 0, 0]),
  d: offsetOf(GEARS.d, Q_P, P_CENTER),
  e: offsetOf(GEARS.e, Q_P, P_CENTER),
};

/** 在臂上看:c 相對臂轉 cRel 時,行星 d–e 的自轉與 f 相對臂的轉角(都繞 +Y 量,f 的軸朝 −Y) */
function onArm(cRel) {
  const spin = meshAngle(GEARS.c, GEARS.d, OFF.c + cRel, CONTACTS.cd) - OFF.d;
  const fRel = OFF.f - meshAngle(GEARS.e, GEARS.f, OFF.e + spin, CONTACTS.ef);
  return { spin, fRel };
}
const F0 = onArm(0).fRel; // f − 臂 = E_CF(c − 臂) + F0

/** 主動軸 A 轉 α、接法 → b(c)、g、f 與臂(軸 m、n)繞 +Y 的轉角,與行星的自轉 */
export function train(alpha, state = "original") {
  const c = meshAngle(GEARS.a, GEARS.b, OFF.a + alpha, CONTACTS.ab) - OFF.b; // a 咬 b
  const g = OFF.g - meshAngle(GEARS.h, GEARS.g, OFF.h + alpha, CONTACTS.hg); // h 咬 g(g 的軸朝 −Y)
  if (state === "original") {
    const arm = (g - E_CF * c - F0) / (1 - E_CF); // f 與 g 一起:f − 臂 = E_CF(c − 臂) + F0
    return { c, g, f: g, arm, spin: onArm(c - arm).spin };
  }
  // 改過的接法:g 固定在軸上,臂跟著 g 轉;f 是合成的結果
  const o = onArm(c - g);
  return { c, g, arm: g, f: g + o.fRel, spin: o.spin };
}

const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const yCyl = (radius, inner, y0, y1) => ({ kind: "cylinder", radius, inner, length: y1 - y0, at: [0, 0, (y0 + y1) / 2] }); // 沿 Y 的群組:局部 z = 世界 y
const heelY = (g) => g.heel[1];
const toeY = (g) => g.heel[1] + g.axis[1] * g.width;

export default {
  figure: 506,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, 3.2, 0.6], at: [-2.1, 0, 0] },
        { kind: "box", size: [2.4, 0.2, 0.6], at: [-1.0, 1.55, 0] },
        { kind: "box", size: [2.6, 0.2, 1.0], at: [-0.9, -1.7, 0] },
        { kind: "box", size: [0.4, 0.3, 0.4], at: [0, -1.45, 0] },
      ],
    },
    // 主動軸 A(水平,在左)與固定在上面的 h(外、大)、a(裡、小)
    {
      id: "shaftA",
      kind: "group",
      axis: X,
      center: A_CENTER,
      label: "A",
      labelOffset: [-1.0, 0.4, 0.3],
      spin: 0.9,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -0.6] },
        piece(GEARS.h, Q_A, A_CENTER, 0.07),
        piece(GEARS.a, Q_A, A_CENTER, 0.07),
        { kind: "box", size: [0.08, 0.5, 0.08], at: [0, -0.25, -1.55] },
        { kind: "cylinder", radius: 0.06, length: 0.3, axis: [1, 0, 0], at: [0.12, -0.5, -1.55], accent: true },
      ],
    },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [-0.62, -0.15, 0.45] },
    { id: "labelh", kind: "group", pieces: [], label: "h", labelOffset: [-1.15, 0.55, 0.5] },
    // b 與 c:中間一段套筒連成一件,鬆套在軸 m 上
    {
      id: "wheelBC",
      kind: "group",
      axis: Y,
      label: "b",
      labelOffset: [0.6, -0.5, 0.45],
      spin: R.b + 0.1,
      spinOffset: heelY(GEARS.b),
      pieces: [piece(GEARS.b, Q_Y, [0, 0, 0], SHAFT_R), yCyl(0.15, SHAFT_R, toeY(GEARS.b) - 0.01, heelY(GEARS.c) + 0.01), piece(GEARS.c, Q_Y, [0, 0, 0], SHAFT_R)],
    },
    { id: "labelc", kind: "group", pieces: [], label: "c", labelOffset: [-0.5, -0.12, 0.5] },
    // f 與 g(原來的接法):中間一段套筒連成一件,鬆套在軸 m 上
    {
      id: "wheelFG",
      kind: "group",
      axis: Y,
      label: "g",
      labelOffset: [0.7, 1.15, 0.45],
      spin: R.g + 0.1,
      spinOffset: heelY(GEARS.g),
      pieces: [piece(GEARS.f, Q_Y, [0, 0, 0], SHAFT_R), yCyl(0.13, SHAFT_R, heelY(GEARS.f) - 0.01, toeY(GEARS.g) + 0.01), piece(GEARS.g, Q_Y, [0, 0, 0], SHAFT_R)],
    },
    { id: "labelf", kind: "group", pieces: [], label: "f", labelOffset: [-0.45, 0.5, 0.5] },
    // 改過的接法:f 帶一段短套筒在軸上鬆轉;g 以套環與鍵固定在軸 m 上(推斷)
    {
      id: "wheelF",
      kind: "group",
      axis: Y,
      label: "f",
      labelOffset: [-0.45, 0.5, 0.5],
      spin: R.f + 0.12,
      spinOffset: heelY(GEARS.f),
      pieces: [piece(GEARS.f, Q_Y, [0, 0, 0], SHAFT_R), yCyl(0.13, SHAFT_R, heelY(GEARS.f) - 0.01, heelY(GEARS.f) + 0.25)],
    },
    {
      id: "wheelG",
      kind: "group",
      axis: Y,
      label: "g",
      labelOffset: [0.7, 1.15, 0.45],
      spin: R.g + 0.1,
      spinOffset: heelY(GEARS.g),
      pieces: [piece(GEARS.g, Q_Y, [0, 0, 0], SHAFT_R), yCyl(0.16, SHAFT_R, heelY(GEARS.g) - 0.01, heelY(GEARS.g) + 0.2), { kind: "box", size: [0.06, 0.06, 0.15], at: [SHAFT_R + 0.03, 0, heelY(GEARS.g) + 0.125], accent: true }],
    },
    // 軸 m、n 與牢牢固定在上面的臂 k、l(臂上的軸穿過 d、e)
    {
      id: "shaftMN",
      kind: "group",
      axis: Y,
      label: "m",
      labelOffset: [0.25, -1.4, 0.4],
      spin: 0.3,
      spinOffset: -1.0,
      pieces: [
        { kind: "cylinder", radius: SHAFT_R, length: 3.0 },
        { kind: "box", size: [0.04, 0.04, 0.15], at: [SHAFT_R, 0, 1.3], accent: true }, // 軸上的記號(在 g 與上方軸承之間)
        { kind: "box", size: [0.24, 0.24, 0.2], at: [0, 0, Y_K] }, // k:臂固定在軸上的轂
        { kind: "cylinder", radius: ROD_R, length: L_END + 0.025 + 0.12, axis: [1, 0, 0], at: [(L_END + 0.025 - 0.12) / 2, 0, Y_K] }, // 臂(到 l)
        { kind: "cylinder", radius: 0.1, length: 0.05, axis: [1, 0, 0], at: [L_END, 0, Y_K] }, // l:臂端的螺帽(臂轉到左邊時離 a 的小端 0.05)
      ],
    },
    { id: "labeln", kind: "group", pieces: [], label: "n", labelOffset: [0.25, 1.4, 0.4] },
    { id: "labelk", kind: "group", pieces: [], label: "k", labelOffset: [0, 0.3, 0.5] },
    { id: "labell", kind: "group", pieces: [], label: "l", labelOffset: [0, 0.25, 0.4] },
    // 行星 d(外、大)與 e(裡、小):中間一段轂連成一件,套在臂上的軸上轉
    {
      id: "planetDE",
      kind: "group",
      center: P_CENTER,
      axis: [-1, 0, 0],
      label: "d",
      labelOffset: [0.3, -0.35, 0.4],
      arrow: false,
      pieces: [
        piece(GEARS.d, Q_P, P_CENTER, ROD_R),
        { kind: "cylinder", radius: 0.1, inner: ROD_R, length: GEARS.d.heel[0] - W - GEARS.e.heel[0] + 0.04, at: [0, 0, P_AT - (GEARS.e.heel[0] + GEARS.d.heel[0] - W) / 2] },
        piece(GEARS.e, Q_P, P_CENTER, ROD_R),
      ],
    },
    { id: "labele", kind: "group", pieces: [], label: "e", labelOffset: [0, 0.35, 0.4] },
  ],
  states: {
    initial: "original",
    options: [
      { id: "original", label: "原來的接法(f、g 一起)" },
      { id: "modified", label: "改過的接法(g 固定在軸上)" },
    ],
  },
  driver: { part: "shaftA", type: "rotation", speed: 1.0 },
  targets: ["shaftMN", "wheelF"], // 原來的接法:臂 k、l 與軸 m、n;改過的接法:鬆的 f
  view: { direction: [0.35, 0.3, 1] },
  pose(alpha, state = "original") {
    const t = train(alpha, state);
    const original = state === "original";
    return {
      parts: {
        shaftA: { angle: alpha },
        wheelBC: { angle: t.c },
        wheelFG: { angle: t.g, visible: original },
        wheelF: { angle: t.f, visible: !original },
        wheelG: { angle: t.g, visible: !original },
        shaftMN: { angle: t.arm },
        planetDE: { position: rotY(P_CENTER, t.arm), rotation: planetRotation(Y, t.arm, [-1, 0, 0], t.spin) },
        labelk: { position: [0, Y_K, 0] },
        labell: { position: rotY([L_END, Y_K, 0], t.arm) },
        labele: { position: rotY([GEARS.e.heel[0] - W / 2, Y_K + GEARS.e.radius, 0], t.arm) },
      },
      readouts: [
        { label: "臂 k、l 的轉速 / 軸 A", value: (train(1, state).arm - train(0, state).arm).toFixed(4) },
        ...(original ? [] : [{ label: "f 的轉速 / 軸 A", value: (train(1, state).f - train(0, state).f).toFixed(4) }]),
      ],
    };
  },
};
