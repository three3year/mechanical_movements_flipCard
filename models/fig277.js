// 第 277 種:柯特上校的發明:扳動擊錘,轉輪跟著轉。把擊錘往後扳起時,擊錘關節(tumbler)上的爪 a 往上推
// 轉輪背面的棘齒 b,轉輪轉過一個膛室;爪 a 由彈簧 c 頂住棘齒。擊錘落下時爪往下滑過棘齒,轉輪不動。
// 主動件是擊錘:扳起、落下(累計行程,見 kit.swing)。
//
// 接觸(由接觸算,共用 pawl-drive.js):棘齒 b 是轉輪背面一圈往後凸出的鋸齒(原圖側面看到的鋸齒輪廓),
// 爪 a 鉸在擊錘關節的銷上,在轉輪靠讀者那一側(棘齒圈最前面的地方)上下動,彈簧 c 把爪尖往轉輪背面壓。
// 在那個平面上算:扳起時爪尖頂著齒的直面往上推,轉輪轉多少由爪尖與齒相碰算出;落下時爪尖被齒背頂開、滑過齒尖,
// 越過後被彈簧加速壓回下一格。
// 推斷:六個膛室、扳起一次轉一格;棘齒圈的半徑與齒高;爪在棘齒上的接觸位置(原圖只畫側面);
// 擊錘樞軸與轉輪軸的支架(原圖只畫零件本身)。
import { X, TAU, deg, swingPhase, rot2 } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";
import { sawCrown } from "./escapement.js";
import { pawlDrive } from "./pawl-drive.js";

export const COCK = deg(32);
export const CHAMBERS = 6;
const STEP = TAU / CHAMBERS;
const PIVOT = [-0.55, -0.75, 0];
const PIN = [-1.1, -0.3]; // 爪的樞銷(擊錘關節上,相對擊錘樞軸)
const CYL = { center: [-2.85, 0.3, 0], radius: 1.25, length: 1.5 };
const BACK = CYL.center[0] + CYL.length / 2; // 轉輪背面
const TEETH = { r: 0.5, h: 0.2 }; // 棘齒圈的半徑與齒高(往後凸出)
const HAND_Z = 0.4; // 爪所在的平面(z 固定):棘齒轉過 ±30° 時,齒的直面在這一層都還在(齒在徑向 0.28–0.58)
const HAND = 1.02; // 銷到爪尖:推程的中段,爪尖在棘齒圈最前面(和轉輪軸一樣高)

// 轉輪轉 θ(繞 +x,扳起時往負的方向轉)時,棘齒和爪所在的平面 z = HAND_Z 相交的剖面,畫在 (x, y) 平面上。
// 棘齒是 sawCrown 的平板:齒 k 的中心方位 c = (k + ½)·齒距,板沿弦(切線 t)從 −len/2 到 len/2、齒高沿弦升到 len/2 那端直落,
// 板厚沿 c 方向(out)±厚/2。轉輪局部 (X, Y) 對到世界 (−z, y);轉 θ 後,弦上 u 處、板厚方向 w 處的點:
// X = (rc + w)·cos c′ − u·sin c′、Y = (rc + w)·sin c′ + u·cos c′(c′ = c + θ,rc = 半徑·cos(齒距/2))。
// 取 X = −HAND_Z 解出 w,|w| 在板厚以內的那一段 u 就是剖面
const CROWN = { thick: 0.3 };
const RC = TEETH.r * Math.cos(STEP / 2);
const LEN = 2 * TEETH.r * Math.sin(STEP / 2);
const PAWL_T = 0.08; // 爪的厚度:在爪的厚度內取五個剖面,齒與爪在整個厚度內都不相碰
const teethAt = (s) => [-0.5, -0.25, 0, 0.25, 0.5].flatMap((k) => sectionAt(s, HAND_Z + k * PAWL_T));
function sectionAt(s, z) {
  const theta = -s;
  const out = [];
  const first = Math.floor((Math.PI - theta) / STEP) - 1;
  for (let k = first - 1; k <= first + 3; k++) {
    const c = (k + 0.5) * STEP + theta;
    if (Math.cos(c) > -0.2) continue; // 只取轉到爪那一面(±78° 以內)的齒;齒板斜著穿過爪的平面,邊上的齒也算
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const u = -LEN / 2 + (LEN * i) / 12;
      const w = (-z + u * Math.sin(c)) / Math.cos(c) - RC;
      if (Math.abs(w) > CROWN.thick / 2) continue;
      pts.push([BACK + (TEETH.h * i) / 12, CYL.center[1] + (RC + w) * Math.sin(c) + u * Math.cos(c), u]);
    }
    if (pts.length < 2) continue;
    const last = pts[pts.length - 1];
    const poly = pts.map(([x, y]) => [x, y]);
    if (last[2] >= LEN / 2 - 1e-9) poly.push([BACK, last[1]]); // 直面
    poly.push([BACK - 0.3, poly[poly.length - 1][1]], [BACK - 0.3, poly[0][1]]);
    out.push(poly);
  }
  return out;
}

const pinAt = (hammer) => {
  const [px, py] = rot2(PIN, hammer);
  return [PIVOT[0] + px, PIVOT[1] + py];
};
const hammerAt = (v) => -swingPhase(v, 0, COCK).at;
// 爪(局部座標:原點在銷,爪身沿 +x 往上):爪尖往局部 +y(世界 −x,朝轉輪背面)伸出一個鉤,鉤比齒高還長,
// 爪身留在齒尖外面、只有鉤伸進齒間,頂在齒的直面底下
const HAND_OUTLINE = [
  [-0.06, -0.06],
  [HAND + 0.02, -0.05],
  [HAND + 0.04, 0.27],
  [HAND - 0.04, 0.27],
  [HAND - 0.07, 0.05],
  [-0.06, 0.06],
];
const BACK_FACE = [[BACK - 0.6, -2], [BACK, -2], [BACK, 2.5], [BACK - 0.6, 2.5]];
const HAND_REST = deg(103); // 爪大致的方向(由銷往上、略往轉輪那邊斜)
const drive = pawlDrive({
  period: 2 * COCK,
  pins: (v) => ({ hand: pinAt(hammerAt(v)) }),
  // 轉輪的「轉角」用 s = −θ(扳起時增加)
  wheel: { obstacles: teethAt, dir: 1, pitch: STEP },
  // 彈簧 c 把爪尖往轉輪背面壓:爪朝上時,往 −x 是逆時針
  // 轉輪的背面(齒根所在的平面)擋住爪尖,爪尖最深只到這裡
  pawls: { hand: { outline: HAND_OUTLINE, into: 1, angle: HAND_REST, limits: [deg(80), deg(125)], pushes: (v) => swingPhase(v, 0, COCK).forward, stops: () => [BACK_FACE] } },
});
const S0 = drive.at(0).wheel;

/** 主動量 v(累計行程)→ 擊錘轉角、轉輪轉角(自起點)、爪樞銷位置與爪的轉角 */
export function colt(v) {
  const s = drive.at(v);
  const pin = pinAt(hammerAt(v));
  return { hammer: hammerAt(v), cylinder: -(s.wheel - S0), pin: [...pin, HAND_Z], hand: s.angles.hand };
}
/** 檢查用:主動量 v 時爪與棘齒在爪所在平面(z = HAND_Z 附近)的剖面,畫在 x–y 平面 */
export const contactAt = (v) => {
  const s = drive.shapes(v);
  return { hand: s.pawls.hand, teeth: s.wheel };
};

const hammer = shape(
  [[-0.35, -0.55], [0.45, -0.6], [0.95, -0.1], [1.05, 0.9], [1.6, 1.85], [2.05, 2.45], [1.25, 2.0], [0.55, 1.55], [-0.15, 1.75], [-0.62, 1.45], [-0.4, 0.75], [-0.8, 0.1], [-0.85, -0.3]],
  [circle(0.12).reverse()],
);
const flutes = Array.from({ length: CHAMBERS }, (_, i) => {
  const a = (i + 0.5) * (TAU / CHAMBERS);
  return { kind: "box", size: [0.12, 0.12, CYL.length * 0.8], at: [CYL.radius * Math.cos(a), CYL.radius * Math.sin(a), 0], angle: a };
});
const SPRING_SEAT = [BACK + 0.75, 1.1]; // 彈簧 c 的固定端(在機架上)
const SPRING_ON = [0.75, -0.15]; // 彈簧端圈的中心(爪的局部座標):端圈貼著爪身的側面

export default {
  figure: 277,
  parts: [
    {
      id: "cylinder",
      kind: "cylinder",
      axis: X,
      center: CYL.center,
      radius: CYL.radius,
      length: CYL.length,
      mark: true,
      spin: CYL.radius,
      label: "b",
      labelOffset: [CYL.length / 2 + 0.5, -0.55, 0.6],
      pieces: [
        ...flutes,
        // 棘齒 b:轉輪背面一圈往後凸出的鋸齒,齒的直面朝下(被爪往上推);軸往後伸
        ...sawCrown({ teeth: CHAMBERS, radius: TEETH.r, height: TEETH.h, base: CYL.length / 2, thick: CROWN.thick }),
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [0, 0, CYL.length / 2 + 0.45] },
      ],
    },
    {
      id: "hammer",
      kind: "plate",
      center: PIVOT,
      shape: hammer,
      thickness: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.2, length: 0.4 },
        // 擊錘關節(tumbler):從樞軸伸向爪的短臂,銷往前伸到爪那一層
        { kind: "plate", shape: shape(thickLine([[0, 0], PIN], 0.22)), thickness: 0.12, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.06, length: HAND_Z + 0.1, at: [...PIN, HAND_Z / 2 + 0.05] },
      ],
    },
    {
      id: "pawl",
      kind: "plate",
      center: [...pinAt(0), HAND_Z],
      shape: shape(HAND_OUTLINE, [circle(0.04).reverse()]),
      thickness: PAWL_T,
      arrow: false,
      label: "a",
      labelOffset: [0.3, -0.1, 0.3],
    },
    { id: "springC", kind: "spring", coils: 6, radius: 0.08, wire: 0.02, label: "c", labelOffset: [0.15, 0.25, 0.3] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, 3.4, 0.2], at: [BACK + 1.0, 0.1, -0.4] }, // 機架:托著轉輪軸與擊錘樞軸(在零件後面)
        { kind: "box", size: [0.35, 0.2, 0.2], at: [BACK + 0.925, CYL.center[1], -0.4] }, // 轉輪軸的軸承(在棘齒後面,不碰到齒)
        { kind: "cylinder", axis: X, radius: 0.2, inner: 0.12, length: 0.2, at: [BACK + 0.85, CYL.center[1], 0] },
        { kind: "box", size: [0.15, 0.2, 0.4], at: [BACK + 0.85, CYL.center[1], -0.2] },
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [PIVOT[0], PIVOT[1], -0.2] }, // 擊錘的樞軸
        { kind: "box", size: [1.65, 0.2, 0.2], at: [(PIVOT[0] + BACK + 1.0) / 2, PIVOT[1], -0.5] },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [...SPRING_SEAT, HAND_Z - 0.2] }, // 彈簧 c 的固定座
        { kind: "box", size: [0.12, SPRING_SEAT[1] - 0.1, 0.12], at: [SPRING_SEAT[0], (SPRING_SEAT[1] + 0.1) / 2, -0.1] },
      ],
    },
  ],
  // 動力重演:只推擊錘;爪掛在擊錘關節的銷上,彈簧 c 把爪尖往棘齒壓;轉輪靠摩擦定位,由爪推動
  replay: {
    to: 4 * COCK,
    seconds: 16,
    free: { cylinder: { hold: true, gravity: false }, pawl: { on: "hammer", spring: 1, gravity: false } },
    // 轉輪的軸在機架的軸承裡;彈簧 c 只是畫出來的示意(它的力由 spring 給),不算碰撞
    ignore: [["cylinder", "frame"], ["pawl", "springC"], ["cylinder", "springC"]],
    expect: [
      { at: COCK, part: "cylinder", label: "扳起擊錘:爪 a 推棘齒 b,轉輪轉一格", quote: "當將擊錘向後拉以扳起時，連接於擊錘關節（tumbler）上的爪 a 會作動於轉輪背面的棘齒 b 上" },
      { at: 2 * COCK, part: "cylinder", label: "擊錘落下:爪滑過棘齒,轉輪不動" },
      { at: 4 * COCK, part: "cylinder", label: "扳起兩次,轉兩格" },
    ],
  },
  driver: { part: "hammer", type: "rotation", cycle: [0, COCK] },
  target: "cylinder", // 每扳一次轉一格的轉輪
  waivers: [
    {
      check: "replay",
      parts: ["cylinder"],
      reason:
        "重演引擎的限制:轉輪是實心的大圓柱,質量約是爪的一千倍,重演的摩擦定位阻尼又和質量成正比,鉸在擊錘上的細爪頂著棘齒推時,鉸接的約束先被擠開,轉輪幾乎不動。重演的質量、摩擦一律用全書一致的預設值(原書沒有重量資料);試過把轉輪的密度降到百分之一,爪就推得動一整格;照實物畫出六個膛孔、做成空心,質量也只減到三成左右,遠不到推得動所需的百分之一。模型的轉動由爪與棘齒的平面剖面接觸算(測試驗:每扳一次轉一格、落下不動、爪不穿進齒)",
    },
  ],
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { hammer: h, cylinder, pin, hand } = colt(v);
    const [sx, sy] = rot2(SPRING_ON, hand);
    return {
      parts: {
        hammer: { angle: h },
        cylinder: { angle: cylinder - S0 }, // colt 的轉角是自起點算的;零件要的是絕對轉角(和 teethAt 的 θ = −s 一致)
        pawl: { position: pin, angle: hand },
        springC: { from: [...SPRING_SEAT, HAND_Z], to: [pin[0] + sx, pin[1] + sy, HAND_Z] },
      },
      readouts: [],
    };
  },
};
