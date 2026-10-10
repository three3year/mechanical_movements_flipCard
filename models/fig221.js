// 第 221 種:賦予輪 A 不規則的圓周運動。C 是繞中心 D 轉動的橢圓形正齒輪,是主動件;B 是與它咬合、齒距相同的小齒輪。
// 小齒輪的軸心不固定,由一支繞 A 的中心擺動的搖臂(框架)承載,C 轉動時框架上下起伏,讓小齒輪不論 C 的接觸半徑
// 怎麼變都保持咬合。小齒輪軸上另有一個大齒輪(也標 B)與 A 咬合,把運動傳給 A。為了讓齒維持適當的咬合深度、
// 不彼此滑過,C 上附有一片超出邊緣的板,板上有相似的橢圓形溝槽 g、h,容納搖臂上與 B 同心的銷。
// 推斷:D 是橢圓的焦點;各輪齒數;溝槽就是小齒輪軸心相對 C 走過的路線。
// 層次(維護者 2026-10-10 決定):大齒輪 B、A 與搖臂在 C 前面一層;溝槽板一整片貼在 C 背面,溝只開半個厚度
// (英文原文「a plate … furnished with a groove, g, h」是一片板上的一道溝,g、h 是它的兩邊),
// 搖臂上與 B 同心的銷往後穿過大齒輪 B 與小齒輪的軸孔伸進溝裡。小齒輪 b 要和 C 同一層才咬得到,所以被大齒輪 B
// 擋在後面;B 做成齒圈加四支輻條(推斷,原圖 B 是實心),從前面看得到小齒輪咬著 C。
import { TAU, Z, rot2 } from "./kit.js";
import { swingMesh } from "./swing-mesh.js";
import { meshAngle } from "./gears.js";
import { noncircularOutline, samplePitch, arcAt } from "./noncircular.js";
import { circle, gearProfile, gearSize, offsetLoop } from "./shapes.js";

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
const POST_X = -3.4; // 前方軸承架的立柱(在 A 的左邊)
const FOOT_Y = -3.09; // 立柱腳座的高度(前後兩根立柱同高)
const mesh = swingMesh({ r, fixed: D, rp: b.radius, pivot: A.center, arm: LINK, side: -1 });

// 各層的 z(往前為正):C 與小齒輪 b 在 0 附近;溝槽板貼在 C 背面;大齒輪 B 與 A 在前一層,搖臂再前一層
const Z_C = [-0.1, 0.1]; // C 的齒板
const PLATE = 0.1; // 溝槽板每一層的厚度:開溝的前層與底層一樣厚,溝只開半個厚度
const Z_PINION = 0.02; // 小齒輪 b 比 C 薄,背面離溝槽板留一點空隙
const Z_B = 0.25; // 大齒輪 B 與 A 的中心面
const Z_ARM = 0.45; // 搖臂
const Z_FRONT = 0.65; // A 的前方軸承座
const Z_REAR = -0.7; // D 的後方軸承座

const S0 = mesh.byGear(0);
const gammaOf = (p) => Math.atan2(p[1] - A.center[1], p[0] - A.center[0]);
const aRaw = (s) => {
  const g = gammaOf(s.center);
  return g - (BIG.radius / A.radius) * (s.pinion - g);
};

/** C 轉 theta(逆時針為正;原文中 C 以固定方向轉):小齒輪軸心、小齒輪與 A 的轉角(相對原圖)、與 C 的接觸點 */
export function train(theta) {
  const s = mesh.byGear(theta);
  return { center: s.center, pinion: s.pinion - S0.pinion, a: aRaw(s) - aRaw(S0), contact: s.contact, phi: s.phi };
}
export const geometry = { r, rb: b.radius, rBig: BIG.radius, rA: A.radius, LINK, A: A.center };

// 原圖的齒相位:C 在接觸點是一齒的中心,小齒輪 b 以齒槽對著它;大齒輪 B 與 A 依咬合排好
const B_PHASE = S0.gamma + Math.PI / b.teeth;
const A_PHASE = meshAngle({ ...BIG, center: S0.center, axis: Z }, { ...A, axis: Z }, B_PHASE);
const outline = noncircularOutline(r, { teeth: NC, addendum: PITCH / Math.PI, dedendum: (1.2 * PITCH) / Math.PI, start: arcAt(r, S0.phi) });

// 溝槽 g、h 的中心線:小齒輪軸心相對 C 走過的路線——節曲線沿外法線偏一個小齒輪節圓半徑(與 swing-mesh 的咬合條件相同)
const groovePath = Array.from({ length: 360 }, (_, i) => {
  const phi = (i / 360) * TAU;
  const rr = r(phi);
  const d = (r(phi + 1e-4) - r(phi - 1e-4)) / 2e-4;
  const t = [d * Math.cos(phi) - rr * Math.sin(phi), d * Math.sin(phi) + rr * Math.cos(phi)]; // 切線
  const l = Math.hypot(t[0], t[1]);
  return [rr * Math.cos(phi) + (b.radius * t[1]) / l, rr * Math.sin(phi) - (b.radius * t[0]) / l];
});
const PIN_R = 0.05; // 搖臂上的銷
const GROOVE = PIN_R + 0.012; // 溝寬的一半(銷兩側各留一點間隙)
const RIM = 0.16; // 溝外側留的板邊
const D_BORE = () => circle(0.1).reverse(); // D 的軸穿過的孔
const plateEdge = offsetLoop(groovePath, GROOVE + RIM);
const TAGS = { g: [1.55, -0.9], h: [-2.05, -0.95] };
const PIN_BACK = Z_C[0] - PLATE + 0.01; // 銷的後端:伸進溝裡,離溝底留一點

/** C 的齒板、溝槽板三塊(底層一整片;前層被溝分成內外兩塊),與搖臂上的銷(測試用來量層次與溝) */
export const pieces = {
  tooth: { kind: "plate", shape: { outline, holes: [D_BORE()] }, thickness: Z_C[1] - Z_C[0], mark: [-0.3, -1.3], markSize: 0.08 },
  plateBack: { kind: "plate", shape: { outline: plateEdge, holes: [D_BORE()] }, thickness: PLATE, at: [0, 0, Z_C[0] - 1.5 * PLATE] },
  plateInner: { kind: "plate", shape: { outline: offsetLoop(groovePath, -GROOVE), holes: [D_BORE()] }, thickness: PLATE, at: [0, 0, Z_C[0] - 0.5 * PLATE] },
  plateOuter: { kind: "plate", shape: { outline: plateEdge, holes: [offsetLoop(groovePath, GROOVE).reverse()] }, thickness: PLATE, at: [0, 0, Z_C[0] - 0.5 * PLATE] },
  // 銷固定在搖臂的小齒輪那一端,往後穿過大齒輪 B 與小齒輪的軸孔(兩輪套在銷上轉),伸進溝裡
  pin: { kind: "cylinder", radius: PIN_R, length: Z_ARM - PIN_BACK, at: [LINK, 0, (PIN_BACK - Z_ARM) / 2] },
};

// 大齒輪 B:齒圈、四支輻條與輪轂(推斷,見檔頭)
const BIG_RIM = BIG.radius - gearSize(BIG.radius, BIG.teeth).dedendum - 0.12;
const HUB_B = 0.16;
const spokes = [0, 1, 2, 3].map((k) => {
  const a = (k * TAU) / 4 + TAU / 8;
  const mid = (BIG_RIM + HUB_B) / 2;
  return { kind: "box", size: [BIG_RIM - HUB_B + 0.08, 0.1, 0.12], at: [mid * Math.cos(a), mid * Math.sin(a), 0], angle: a };
});
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
        pieces.tooth,
        pieces.plateBack,
        pieces.plateInner,
        pieces.plateOuter,
        // 輪轂往後穿過溝槽板;前面與 C 齊平(大齒輪 B 從 D 前面掃過)
        { kind: "cylinder", radius: 0.18, inner: 0.1, length: 0.45, at: [0, 0, Z_C[1] - 0.225] },
      ],
    },
    // 小齒輪 b 與大齒輪 B 由一節套筒連成一件,一起套在搖臂的銷上轉(轉向箭頭畫在前面的大齒輪上)
    gear("pinionB", b, {
      center: [0, 0, Z_PINION],
      width: 0.16,
      arrow: false,
      label: "B",
      labelOffset: [0, 0.75, 0.3],
      pieces: [{ kind: "cylinder", radius: 0.12, inner: PIN_R, length: Z_B - Z_PINION, at: [0, 0, (Z_B - Z_PINION) / 2] }],
    }),
    {
      id: "gearB",
      kind: "group",
      center: [0, 0, Z_B],
      spin: BIG.radius + 0.12,
      pieces: [
        { kind: "plate", shape: { outline: gearProfile(BIG), holes: [circle(BIG_RIM).reverse()] }, thickness: 0.2 },
        ...spokes,
        { kind: "cylinder", radius: HUB_B, inner: PIN_R, length: 0.26 },
      ],
    },
    gear("gearA", A, { center: [A.center[0], A.center[1], Z_B], label: "A", labelOffset: [0, 0.55, 0], pieces: [{ kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.26 }] }),
    { id: "frame", kind: "link", width: 0.18, thickness: 0.06, pieces: [pieces.pin] },
    { id: "tagG", kind: "group", pieces: [], arrow: false, label: "g" },
    { id: "tagH", kind: "group", pieces: [], arrow: false, label: "h" },
    // D 的軸:前端與 C 的前面齊平,往後穿過溝槽板伸進後方的軸承座
    { id: "pivotD", kind: "group", label: "D", labelOffset: [-0.3, 0, 0.3], pieces: [{ kind: "cylinder", radius: 0.1, length: Z_C[1] - (Z_REAR - 0.1), at: [0, 0, (Z_C[1] + Z_REAR - 0.1) / 2] }] },
    {
      id: "bearingD",
      kind: "group",
      // 推斷(原圖只畫出軸頭):D 的軸承座在溝槽板後面,立柱從軸承往下落到腳座
      pieces: [
        { kind: "cylinder", radius: 0.24, inner: 0.1, length: 0.2, at: [D[0], D[1], Z_REAR] },
        { kind: "box", size: [0.25, -0.2 - FOOT_Y - 0.09, 0.2], at: [D[0], (-0.2 + FOOT_Y + 0.09) / 2, Z_REAR] },
        { kind: "box", size: [1.0, 0.18, 0.6], at: [D[0], FOOT_Y, Z_REAR] },
      ],
    },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出軸頭):C 的溝槽板掃過 A 的後方,所以 A 的軸往前伸進前方的軸承座(A 的軸同時是搖臂的樞軸);
      // 軸承座不從輪前面直立下來(會擋住 A):以一條橫條往左接到輪外側的立柱
      pieces: [
        { kind: "cylinder", radius: 0.06, length: Z_FRONT + 0.1 - (Z_B - 0.13), at: [A.center[0], A.center[1], (Z_FRONT + 0.1 + Z_B - 0.13) / 2] },
        { kind: "cylinder", radius: 0.2, inner: 0.06, length: 0.2, at: [A.center[0], A.center[1], Z_FRONT] },
        { kind: "box", size: [A.center[0] - POST_X - 0.18, 0.2, 0.2], at: [(A.center[0] - 0.18 + POST_X) / 2, A.center[1], Z_FRONT] },
        { kind: "box", size: [0.25, A.center[1] + 0.1 - FOOT_Y - 0.09, 0.2], at: [POST_X, (A.center[1] + 0.1 + FOOT_Y + 0.09) / 2, Z_FRONT] },
        { kind: "box", size: [1.0, 0.18, 0.6], at: [POST_X, FOOT_Y, Z_FRONT] },
      ],
    },
  ],
  driver: { part: "gearC", type: "rotation" },
  target: "gearA",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const t = train(theta);
    const tag = (p) => [...rot2(p, theta), Z_C[0]];
    return {
      parts: {
        gearC: { angle: theta },
        pinionB: { position: [t.center[0], t.center[1], Z_PINION], angle: B_PHASE + t.pinion },
        gearB: { position: [t.center[0], t.center[1], Z_B], angle: B_PHASE + t.pinion },
        gearA: { angle: A_PHASE + t.a },
        frame: { from: [A.center[0], A.center[1], Z_ARM], to: [t.center[0], t.center[1], Z_ARM] },
        tagG: { position: tag(TAGS.g) },
        tagH: { position: tag(TAGS.h) },
      },
      readouts: [],
    };
  },
};
