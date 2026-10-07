// 第 235 種:撥爪臂的擺動,產生棘輪(星形輪)的間歇轉動。長臂以右端為樞軸擺動,左端附近以銷裝著一個鉤形撥爪;
// 臂往上擺時,撥爪的鉤托住星形輪的一個角往上推,輪逆時針轉;臂往下回程時,撥爪的鉤碰到下一個角,
// 撥爪底部的小彈簧讓它讓開、滑過齒面,越過後彈回原位。左上方的彎彈簧(止回爪)扣住星形輪,讓它不倒轉。
// 主動量是臂的累計擺動量。
//
// 接觸(由接觸算,共用 pawl-drive.js):撥爪鉸在臂的銷上,小彈簧把它壓在臂上的擋銷上(原圖的位置);
// 推程中角壓在鉤裡,撥爪靠在擋銷上不動,輪被推到角從鉤裡滑出為止;回程中鉤背被下一個角頂開(撥爪繞銷轉、
// 離開擋銷),越過後彈簧把它壓回擋銷。止回爪鉸在左上方的銷上,彈簧把它的尖端壓在星形輪的邊上。
// 推多遠、何時讓開,都由外形相碰算出。
// 推斷:止回爪畫成鉸接的彎臂加彈簧(原圖是一片彎彈簧);擋銷的位置;輪軸、臂的樞軸裝在後面的機架上。
import { deg, polar, rot2, swingPhase } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";
import { bodyPoint } from "./linkage.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const STAR = { points: 6, outer: 1.0, inner: 0.5, phase: deg(-30) };
const STEP = (2 * Math.PI) / STAR.points;
const PIVOT = [4.56, -1.6];
const PIN = [-3.6, 0.0]; // 撥爪的銷(相對臂的樞軸,臂水平):在臂的左端
const SWING = deg(17);
const FROM = deg(4); // 臂的最低位置略往下斜:鉤回到下一個角的下緣底下
const TO = FROM - SWING; // 臂往上擺(左端上升 = 順時針)
const CLICK = { pivot: [-0.15, 1.45] };
const Z = { star: 0, pawl: 0, arm: 0.2, click: 0 };

const starOutline = (theta) =>
  Array.from({ length: 2 * STAR.points }, (_, i) => polar(i % 2 ? STAR.inner : STAR.outer, STAR.phase + theta + (i * Math.PI) / STAR.points).slice(0, 2));
// 星形輪拆成六個角(三角形)加中間的六邊形,接觸判斷時外框測試就能略過大部分
const starPieces = (theta) => {
  const o = starOutline(theta);
  const pieces = [];
  for (let i = 0; i < STAR.points; i++) pieces.push([o[(2 * i + 11) % 12], o[2 * i], o[2 * i + 1]]);
  pieces.push(Array.from({ length: STAR.points }, (_, i) => o[2 * i + 1]));
  return pieces;
};

// 撥爪(局部座標:原點在銷,桿身沿局部 +x):從臂的左端斜斜往左上伸到星形輪右下方那個角的底下,
// 末端是往左彎的爪,托住角的下緣。回程時爪背被下一個角頂開,撥爪繞銷往右讓(爪往右下滑過角尖),越過後彈簧把它壓回。
const CLAW = 0.95; // 銷到爪尖
const PAWL = [
  [-0.14, -0.1],
  [CLAW - 0.18, -0.09],
  [CLAW + 0.02, 0.0],
  [CLAW - 0.02, 0.17],
  [CLAW - 0.2, 0.1],
  [-0.14, 0.1],
];
const HOOK_AT = [0.5, -0.82]; // 臂水平時爪尖的位置:在角的下緣底下
const PAWL_REST = Math.atan2(HOOK_AT[1] - (PIVOT[1] + PIN[1]), HOOK_AT[0] - (PIVOT[0] + PIN[0])); // 撥爪靠在擋銷上時的轉角(臂水平)

// 止回爪(局部座標:原點在銷):從銷沿星形輪的左邊彎下,尖端頂在兩個角之間
const CLICK_ARM = [
  [0, 0],
  [-0.75, -0.25],
  [-1.15, -0.85],
  [-1.05, -1.3],
];
const CLICK_OUTLINE = (() => {
  const left = [];
  const right = [];
  for (let i = 0; i < CLICK_ARM.length; i++) {
    const [a, b] = [CLICK_ARM[Math.max(0, i - 1)], CLICK_ARM[Math.min(CLICK_ARM.length - 1, i + 1)]];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dy);
    const w = i === CLICK_ARM.length - 1 ? 0.03 : 0.07;
    left.push([CLICK_ARM[i][0] - (dy / l) * w, CLICK_ARM[i][1] + (dx / l) * w]);
    right.push([CLICK_ARM[i][0] + (dy / l) * w, CLICK_ARM[i][1] - (dx / l) * w]);
  }
  return [...left, ...right.reverse()];
})();

// 臂上的擋銷:撥爪的桿身下緣靠在它上面(彈簧把鉤往下壓),位置由撥爪的靜止轉角定
const STOP_PIN = (() => {
  const [x, y] = rot2([0.32, 0.1 + 0.07], PAWL_REST); // 桿身左側(逆時針那一側)
  return [PIN[0] + x, PIN[1] + y];
})();
const armAt = (v) => swingPhase(v, FROM, TO);
const pinAt = (psi) => bodyPoint([...PIVOT, 0], psi, PIN).slice(0, 2);
const stopAt = (psi) => bodyPoint([...PIVOT, 0], psi, STOP_PIN).slice(0, 2);
const stopPolygon = (psi) => circle(0.07, ...stopAt(psi));

const drive = pawlDrive({
  period: 2 * SWING,
  pins: (v) => ({ pawl: pinAt(armAt(v).at), click: CLICK.pivot }),
  wheel: { obstacles: starPieces, dir: 1, pitch: STEP },
  pawls: {
    // 小彈簧把撥爪往逆時針(鉤往下)壓,靠在臂的擋銷上
    pawl: { outline: PAWL, into: 1, angle: PAWL_REST + FROM, pushes: (v) => armAt(v).forward, stops: (v) => [stopPolygon(armAt(v).at)] },
    // 止回爪的彈簧把尖端往星形輪壓(逆時針)
    click: { outline: CLICK_OUTLINE, into: 1, angle: deg(-8), limits: [deg(-40), deg(30)] },
  },
});
const W0 = drive.at(0).wheel;

/** 臂的累計擺動 v:臂的轉角、星形輪轉角(自起點)、撥爪相對臂讓開的角度 */
export function motion(v) {
  const s = drive.at(v);
  const arm = armAt(v).at;
  return { arm, star: s.wheel - W0, yieldAngle: s.angles.pawl - arm - PAWL_REST, pawl: s.angles.pawl, click: s.angles.click };
}
export const step = STEP;
export const swing = SWING;
/** 檢查用:主動量 v 時撥爪、止回爪與星形輪(世界座標 2D) */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { pawl: s.pawls.pawl, click: s.pawls.click, star: s.wheel };
};

export default {
  figure: 235,
  parts: [
    { id: "star", kind: "plate", shape: { outline: starOutline(0), holes: [circle(0.1).reverse()] }, thickness: 0.16, hub: 0.2, mark: [0.6, 0], markSize: 0.07, spin: STAR.outer },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.25] }, // 星形輪的軸
        ...pedestal({ at: [0, 0], z: -0.4, bore: 0.1, floor: -2.4 }),
        { kind: "cylinder", radius: 0.07, length: 0.7, at: [...PIVOT, 0] }, // 臂的樞軸
        ...pedestal({ at: PIVOT, z: -0.4, bore: 0.07, floor: -2.4 }),
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [...CLICK.pivot, -0.1] }, // 止回爪的樞軸
        { kind: "box", size: [0.3, 3.9, 0.12], at: [-1.6, -0.45, -0.4] }, // 托住止回爪樞軸的立柱(推斷)
        { kind: "box", size: [1.6, 0.25, 0.12], at: [-0.85, CLICK.pivot[1], -0.4] },
      ],
    },
    {
      id: "click",
      kind: "group",
      center: [...CLICK.pivot, Z.click],
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(CLICK_OUTLINE, [circle(0.06).reverse()]), thickness: 0.1 }, { kind: "cylinder", radius: 0.12, inner: 0.06, length: 0.12 }],
    },
    {
      id: "arm",
      kind: "group",
      center: [...PIVOT, Z.arm],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [-3.75, 0]], 0.3), [circle(0.08).reverse()]), thickness: 0.1 },
        { kind: "cylinder", radius: 0.055, length: 0.32, at: [...PIN, -0.12] }, // 掛撥爪的銷往後伸
      ],
    },
    // 臂上的擋銷(和臂一起擺;另列一個零件,動力重演裡撥爪才碰得到它——撥爪和它鉸接的臂之間不算碰撞)
    { id: "stopPin", kind: "group", center: [...PIVOT, Z.arm], arrow: false, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.32, at: [...STOP_PIN, -0.12] }] },
    {
      id: "pawl",
      kind: "group",
      center: [...pinAt(0), Z.pawl],
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(PAWL, [circle(0.06).reverse()]), thickness: 0.12 }],
    },
    { id: "spring", kind: "rod", radius: 0.025 },
  ],
  // 動力重演:只推臂;撥爪掛在臂的銷上,彈簧把它往擋銷壓;止回爪的彈簧把它往輪壓;星形輪靠摩擦定位,由撥爪推動
  replay: {
    to: 4 * SWING,
    seconds: 24,
    free: {
      star: { hold: true, gravity: false },
      pawl: { on: "arm", spring: 1, gravity: false },
      click: { spring: 1, gravity: false },
    },
    // 星形輪套在軸上:輪轂與軸的貼合面不算碰撞
    ignore: [["star", "frame"]],
    expect: [
      { at: SWING, part: "star", label: "臂往上:撥爪推星形輪轉一格", quote: "撥爪臂的擺動運動,會產生棘輪的間歇性旋轉運動" },
      { at: 2 * SWING, part: "star", label: "臂往下:撥爪讓開、滑過齒面,輪不動", quote: "允許它在回程運動時通過齒的表面" },
      { at: 4 * SWING, part: "star", label: "兩個來回後轉兩格" },
    ],
  },
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO] },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const s = drive.at(v);
    const arm = armAt(v).at;
    const pin = pinAt(arm);
    // 小彈簧:從臂上(撥爪銷的右邊)接到撥爪桿身的右側,把撥爪往擋銷壓(畫成一段彎的鋼絲,隨撥爪讓開而伸長)
    const a = bodyPoint([...PIVOT, 0], arm, [PIN[0] + 0.45, 0.12]);
    const b = bodyPoint([...pin, 0], s.angles.pawl, [0.4, -0.1]);
    const mid = [(a[0] + b[0]) / 2 + 0.12, (a[1] + b[1]) / 2 + 0.05, Z.arm - 0.1];
    return {
      parts: {
        arm: { angle: arm },
        stopPin: { angle: arm },
        star: { angle: s.wheel },
        pawl: { position: [pin[0], pin[1], Z.pawl], angle: s.angles.pawl },
        click: { angle: s.angles.click },
      },
      paths: { spring: { points: [[a[0], a[1], Z.arm - 0.1], mid, [b[0], b[1], Z.arm - 0.1]], closed: false } },
      readouts: [],
    };
  },
};
