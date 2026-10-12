// 第 278 種:C. R. Otis 的吊升平台安全擋止。A 是兩根靜止的立柱,內側固定著棘齒;平台(上部為橫樑 B)在兩柱之間升降。
// 吊繩 a 繫在拉桿 b 上端的眼上;b 穿過橫樑 B 的孔(原圖的虛線),下端是一個方塊。彈簧 c 是橫樑下的弓形板彈簧,
// 外端頂著橫樑底面、中段壓在 b 的方塊頂上,把 b 往下壓。兩支 L 形的肘形槓桿各以轉角的銷裝在平台上(每支只有這一個樞軸):
// 橫臂的內端是圓頭,卡在 b 的方塊的橫槽裡;下臂的下端有銷,插在棘爪 d 內端的直槽裡。棘爪是一根水平的栓,
// 穿過側柱上的導座(原圖斜線剖面),伸進立柱 A 的棘齒。
// 吊升或降下時,平台的重量經彈簧 c 吊在 b 上、繩把 b 往上拉:槓桿的內端被抬起,下臂往內擺,棘爪縮在導座裡、不碰棘齒;
// 繩索斷裂時,彈簧 c 把 b 往下壓,b 的方塊壓下槓桿相連的兩端,槓桿繞樞軸轉,下臂把棘爪推進棘齒,擋住平台不再下降。
// 主動件是虛擬的「進程」(規則 9:斷繩後棘爪撐出、擋住平台,播放時自己呈現,不靠按鈕):吊起平台 → 放下一段 →
// 繩索斷裂:彈簧 c 把 b 往下壓(加速),槓桿把棘爪推出;平台憑自重加速落下,棘爪撐出棘齒尖之後,落到下方最近一個棘齒的
// 平面上停住。棘爪撐出多少由它和棘齒的外形相碰算(推到不重疊);撐不出去時槓桿與 b 也停在那裡(由槓桿的幾何反推)。
// 之後換上新繩:繩一拉緊就把 b 拉上、棘爪縮回,再把平台放回最低處,接著下一輪(整段連續,沒有跳回)。
// 推斷:肘形槓桿兩臂的長度、樞軸裝在側柱內側伸出的耳上(原圖只畫樞軸的圓,沒畫裝在什麼上面)、槓桿內端的圓頭卡在
// b 的方塊的橫槽裡、下臂的銷插在棘爪的直槽裡(兩端都走圓弧,要有槽才不卡死)、棘齒的齒距;各段所佔的進程;
// 換新繩後放回原處的那一段(原文沒寫,為了讓劇情能連續重播)。
// 偏離插圖:板彈簧以左右兩半各繞外端轉動示意彎曲(同第 63、64 種),中間讓開拉桿 b 的桿身;棘爪穿過的導座只開在側柱前半,
// 後半實心,側柱上下才相連(原圖是剖面,看不出深度)。
import { smooth } from "./kit.js";
import { shape, rect, circle, disc, thickLine } from "./shapes.js";
import { falling } from "./jumps.js";
import { polygonsOverlap, pushUntilClear, placeOutline, swingUntilContact, circlePolygon } from "./contact.js";

const POST = { x: 2.0, face: 1.75, width: 0.5 };
const TOOTH = { pitch: 0.42, depth: 0.14, from: -3.2, count: 13 };
// 平台(相對平台頂,右半;左半是鏡像)
const BEAM = { bottom: -0.4, hole: 0.07 }; // 橫樑 B 的底面、拉桿 b 穿過的孔(半寬)
const LEG = { inner: 1.23, outer: 1.6, bottom: -2.35 }; // 側柱
const LUG = { inner: 0.78, half: 0.13 }; // 側柱內側伸出、裝樞軸的耳(推斷)
// 肘形槓桿
const PIVOT = [0.88, -0.82]; // 轉角的樞軸
const ARM_IN = 0.7; // 橫臂:樞軸 → 內端圓頭
const ARM_DOWN = 0.65; // 下臂:樞軸 → 下端的銷
const NOSE = 0.05; // 內端圓頭的半徑(= b 的方塊橫槽的半高)
const PIN = 0.04; // 下臂下端的銷、樞軸銷的半徑
const Z = { lever: 0.27, pawl: 0.12, plate: 0.2 }; // 槓桿在平台前面一層,棘爪在側柱的前半
// 拉桿 b:原點在下端方塊的橫槽中心
const JAW = { half: 0.22, thick: 0.08 }; // 方塊半寬、上下兩片的厚度
const JAW_TOP = NOSE + JAW.thick;
const SHANK = 0.95; // 桿身長
const EYE = { r: 0.13, hole: 0.055, at: JAW_TOP + SHANK + 0.11 };
const B_UP = PIVOT[1] + ARM_IN * Math.sin(0.13); // 繩子拉著時 b 的方塊(相對平台頂)
const B_DOWN = PIVOT[1] - ARM_IN * Math.sin(0.135); // 斷繩後彈簧把 b 壓到底(沒被棘齒擋住時)
// 棘爪:原點在直槽中心(= 下臂的銷),往外是爪尖
const PAWL_Y = PIVOT[1] - ARM_DOWN; // 棘爪的高度(相對平台頂;銷走圓弧,上下只差 0.006,在直槽裡)
const leverAngle = (b) => Math.asin((PIVOT[1] - b) / ARM_IN); // b 的高度 → 槓桿轉角(右邊那支,逆時針為正)
const pinAt = (a) => [PIVOT[0] + ARM_DOWN * Math.sin(a), PIVOT[1] - ARM_DOWN * Math.cos(a)];
const PAWL_TIP = 1.56 - pinAt(leverAngle(B_UP))[0]; // 銷 → 爪尖:繩拉著時爪尖縮在齒尖(1.61)內
const PAWL_OUTLINE = [
  [-0.08, -0.1], [0.07, -0.1], [0.07, -0.07], [PAWL_TIP, -0.07], [PAWL_TIP, -0.02], [PAWL_TIP - 0.12, 0.07], [0.07, 0.07], [0.07, 0.12], [-0.08, 0.12],
]; // 底面平(落在棘齒的平面上),爪尖上緣往外斜(伸進上一齒斜面下方的空間);內端是帶直槽的耳
const PAWL_SLOT = rect(2 * PIN + 0.002, 0.12, 0, 0.01).reverse();
const HOIST = 2.2; // 吊起的高度
const BASE = -1.6; // 進程 0 時平台頂的高度
const P = { up: 0.3, down: 0.42, brk: 0.47, mend: 0.75, tight: 0.79 }; // 吊起、放下一段、斷繩、換新繩、繩拉緊的進程
const SPREAD = 0.03; // 斷繩後彈簧把 b 壓到底所佔的進程
const G = 120; // 落下的「加速度」(以進程計:落下 d 花 √(d / G) 的進程)

/** 銷 b 的高度 → 沒碰到棘齒時爪尖離中線的距離(槓桿撐開) */
export const pawlReach = (b) => pinAt(leverAngle(b))[0] + PAWL_TIP;

// 棘齒(右立柱;世界座標):齒的上面是平的(擋住往下的棘爪)、下面是斜的
const TEETH = Array.from({ length: TOOTH.count }, (_, i) => {
  const y = TOOTH.from + i * TOOTH.pitch;
  return [[POST.face, y], [POST.face, y + TOOTH.pitch * 0.85], [POST.face - TOOTH.depth, y + TOOTH.pitch * 0.85]];
});
const flats = TEETH.map((t) => t[1][1]);
const pawlPoly = (x, top) => PAWL_OUTLINE.map(([u, v]) => [x + u, top + PAWL_Y + v]);
const RETRACTED = pinAt(leverAngle(B_UP))[0];

/**
 * 平台頂在 top、彈簧把 b 壓到 b 時:棘爪(銷)的實際位置、槓桿轉角與 b 的實際高度。
 * 槓桿要把棘爪推到 pinAt(leverAngle(b));推到碰上棘齒就停在剛好不重疊處,槓桿與 b 也停在對應的位置。
 */
export function pawlAt(top, b) {
  const free = pinAt(leverAngle(b))[0];
  const hits = (x) => TEETH.some((t) => polygonsOverlap(pawlPoly(x, top), t));
  const joint = free <= RETRACTED ? free : pushUntilClear(free, -1, free - RETRACTED, hits);
  const angle = Math.asin((joint - PIVOT[0]) / ARM_DOWN);
  return { joint, angle, b: PIVOT[1] - ARM_IN * Math.sin(angle) };
}

const TOP0 = BASE + HOIST - 0.8; // 斷繩時平台頂的高度
// 斷繩後:棘爪撐出棘齒尖的那一刻(b 壓下到爪尖 > 齒尖)
const SPREAD_AT = (() => {
  let t = 0;
  while (t < SPREAD && pawlReach(B_UP + (B_DOWN - B_UP) * falling(t / SPREAD)) <= POST.face - TOOTH.depth) t += SPREAD / 400;
  return t;
})();
// 落點:棘爪撐出時已落下的高度以下,最近的一個棘齒平面(棘爪底面落在上面)
const LAND = (() => {
  const py = TOP0 + PAWL_Y - G * SPREAD_AT * SPREAD_AT;
  const flat = Math.max(...flats.filter((f) => f + 0.07 <= py));
  return flat + 0.07 - PAWL_Y; // 平台頂
})();
const T_LAND = Math.sqrt((TOP0 - LAND) / G);

/** 進程 p → 平台頂的高度、彈簧要把 b 壓到的高度、繩是否已斷 */
export function story(p0) {
  const p = ((p0 % 1) + 1) % 1;
  if (p < P.up) return { top: BASE + HOIST * smooth(p / P.up), b: B_UP, broken: false };
  if (p < P.brk) return { top: BASE + HOIST - 0.8 * smooth(Math.min(1, (p - P.up) / (P.down - P.up))), b: B_UP, broken: false };
  if (p < P.mend) {
    const t = p - P.brk;
    const b = B_UP + (B_DOWN - B_UP) * falling(Math.min(1, t / SPREAD));
    const top = t < T_LAND ? TOP0 - G * t * t : LAND;
    return { top, b, broken: true };
  }
  // 換上新繩:拉緊時把 b 拉上(棘爪縮回),再把平台放回最低處
  if (p < P.tight) return { top: LAND, b: B_DOWN + (B_UP - B_DOWN) * smooth((p - P.mend) / (P.tight - P.mend)), broken: false };
  return { top: LAND + (BASE - LAND) * smooth((p - P.tight) / (1 - P.tight)), b: B_UP, broken: false };
}
export const landing = { top: LAND, T_LAND, SPREAD_AT };

// 板彈簧 c 的右半:外端(原點)頂著橫樑底面,往內彎下;整片繞外端轉到內端壓在 b 的方塊頂上
const SPRING_ROOT = [0.7, BEAM.bottom];
const SPRING_OUTLINE = thickLine([[0, -0.0175], [-0.15, -0.116], [-0.35, -0.206], [-0.5, -0.241], [-0.62, -0.25]], 0.035);
const upperJaw = (by) => rect(2 * JAW.half, JAW.thick, 0, by + NOSE + JAW.thick / 2);
const lowerJaw = (by) => rect(2 * JAW.half, JAW.thick, 0, by - NOSE - JAW.thick / 2);
const springAngle = (top, by) =>
  swingUntilContact({ pivot: [SPRING_ROOT[0], top + SPRING_ROOT[1]], outline: SPRING_OUTLINE, from: -0.2, into: 1, sweep: 1.2, steps: 60 }, [upperJaw(by)]);

/** 檢查用:進程 p 時右半邊的接觸(世界座標 2D;左邊是鏡像) */
export function contactAt(p) {
  const { top, b: pressed } = story(p);
  const { joint, angle, b } = pawlAt(top, pressed);
  const by = top + b;
  const pivot = [PIVOT[0], top + PIVOT[1]];
  const nose = [pivot[0] - ARM_IN * Math.cos(angle), pivot[1] - ARM_IN * Math.sin(angle)];
  const pin = [pivot[0] + ARM_DOWN * Math.sin(angle), pivot[1] - ARM_DOWN * Math.cos(angle)];
  const at = (poly) => poly.map(([u, v]) => [joint + u, top + PAWL_Y + v]);
  const spring = placeOutline(SPRING_OUTLINE, [SPRING_ROOT[0], top + SPRING_ROOT[1]], springAngle(top, by));
  return {
    top,
    pawl: pawlPoly(joint, top),
    pawlSolid: { outline: at(PAWL_OUTLINE), holes: [at(PAWL_SLOT)] },
    teeth: TEETH,
    nose: { center: nose, r: NOSE, circle: circlePolygon(nose, NOSE, 24) },
    pin: { center: pin, r: PIN, circle: circlePolygon(pin, PIN, 24) },
    jaws: [upperJaw(by), lowerJaw(by)],
    springs: [spring, spring.map(([x, y]) => [-x, y])],
  };
}

export const geometry = {
  face: POST.face,
  toothTip: POST.face - TOOTH.depth,
  B_UP,
  B_DOWN,
  pitch: TOOTH.pitch,
  P,
  PAWL_TIP,
  PAWL_Y,
  pivot: PIVOT,
  beam: BEAM,
  leg: LEG,
  jawTop: JAW_TOP,
};

// 立柱:內側一排棘齒
const post = (s) => {
  const pts = [[s * (POST.face + POST.width), TOOTH.from - 0.3]];
  pts.push([s * POST.face, TOOTH.from - 0.3]);
  for (let i = 0; i < TOOTH.count; i++) {
    const y = TOOTH.from + i * TOOTH.pitch;
    pts.push([s * POST.face, y], [s * (POST.face - TOOTH.depth), y + TOOTH.pitch * 0.85], [s * POST.face, y + TOOTH.pitch * 0.85]);
  }
  const yTop = TOOTH.from + TOOTH.count * TOOTH.pitch + 0.3;
  pts.push([s * POST.face, yTop], [s * (POST.face + POST.width), yTop]);
  return s > 0 ? pts : pts.reverse();
};

const mirror = (s, poly) => (s > 0 ? poly : poly.map(([x, y]) => [-x, y]).reverse());
const box = (x0, x1, y0, y1, z0, z1) => ({ kind: "box", size: [x1 - x0, y1 - y0, z1 - z0], at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });
const T = Z.plate;
const NOTCH = 0.085; // 導座開口的半高(棘爪半高 0.07)

// 平台:橫樑 B(中間留孔讓 b 穿過)、兩側柱(棘爪的導座只開在前半)、裝樞軸的耳與樞軸銷、底板
const platformPieces = [
  box(-1.6, -BEAM.hole, BEAM.bottom, 0, -T, T),
  box(BEAM.hole, 1.6, BEAM.bottom, 0, -T, T),
  box(-BEAM.hole, BEAM.hole, BEAM.bottom, 0, BEAM.hole, T),
  box(-BEAM.hole, BEAM.hole, BEAM.bottom, 0, -T, -BEAM.hole),
  ...[1, -1].flatMap((s) => {
    const xs = s > 0 ? [LEG.inner, LEG.outer] : [-LEG.outer, -LEG.inner];
    const gx = s > 0 ? [LUG.inner, LEG.inner] : [-LEG.inner, -LUG.inner];
    return [
      box(...xs, PAWL_Y + NOTCH, BEAM.bottom, -T, T),
      box(...xs, LEG.bottom, PAWL_Y - NOTCH, -T, T),
      box(...xs, PAWL_Y - 0.25, PAWL_Y + 0.25, -T, Z.pawl - 0.1), // 導座後面的實心部分:側柱上下相連
      box(...gx, PIVOT[1] - LUG.half, PIVOT[1] + LUG.half, -T, T),
      { kind: "cylinder", radius: PIN, length: Z.lever + 0.07 + T, at: [s * PIVOT[0], PIVOT[1], (Z.lever + 0.07 - T) / 2] },
    ];
  }),
  box(-1.6, 1.6, LEG.bottom - 0.2, LEG.bottom, -0.6, 0.6),
];

// 肘形槓桿(局部座標:原點在樞軸,轉角 0 時橫臂水平朝內、下臂垂直朝下)
const bar = (a, b, w) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const l = Math.hypot(dx, dy);
  const [nx, ny] = [(-dy / l) * (w / 2), (dx / l) * (w / 2)];
  return [[a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]];
};
const lever = (s) => {
  const plate = (outline, holes = []) => ({ kind: "plate", shape: shape(mirror(s, outline), holes), thickness: 0.08 });
  const at = (x, y) => [s * x, y];
  return [
    { kind: "plate", shape: disc(0.09, PIN + 0.002), thickness: 0.08 }, // 轂:樞軸銷穿過
    plate(bar([-0.07, 0], [-ARM_IN, 0], 0.07)),
    plate(circle(NOSE, -ARM_IN, 0)), // 內端圓頭:卡在 b 的方塊的橫槽裡
    plate(bar([0, -0.07], [0, -ARM_DOWN], 0.09)),
    plate(circle(0.065, 0, -ARM_DOWN)),
    { kind: "cylinder", radius: PIN, length: Z.lever + 0.04 - (Z.pawl - 0.08), at: [...at(0, -ARM_DOWN), (Z.pawl - 0.08 - Z.lever + 0.04) / 2] }, // 下端的銷:往後插進棘爪的直槽
  ];
};

export default {
  figure: 278,
  parts: [
    { id: "postL", kind: "plate", shape: shape(post(-1)), thickness: 0.5, label: "A", labelOffset: [-2.2, 1.0, 0.4] },
    { id: "postR", kind: "plate", shape: shape(post(1)), thickness: 0.5, label: "A", labelOffset: [2.2, 1.0, 0.4] },
    { id: "platform", kind: "group", label: "B", labelOffset: [-0.9, -0.2, 0.4], pieces: platformPieces },
    {
      id: "rodB",
      kind: "group",
      label: "b",
      labelOffset: [0.3, JAW_TOP + SHANK * 0.75, 0.3],
      pieces: [
        { id: "shank", kind: "box", size: [0.1, SHANK, 0.1], at: [0, JAW_TOP + SHANK / 2, 0] },
        { kind: "cylinder", radius: EYE.r, inner: EYE.hole, length: 0.1, at: [0, EYE.at, 0] }, // 上端的眼:吊繩繫在這裡
        { kind: "box", size: [2 * JAW.half, JAW.thick, 0.44], at: [0, NOSE + JAW.thick / 2, 0.14] }, // 方塊的上片(彈簧 c 壓在上面)
        { kind: "box", size: [2 * JAW.half, JAW.thick, 0.44], at: [0, -NOSE - JAW.thick / 2, 0.14] }, // 方塊的下片
        { kind: "box", size: [2 * JAW.half, 2 * NOSE, 0.28], at: [0, 0, 0.06] }, // 方塊後半:上下兩片之間是兩支槓桿圓頭的橫槽
      ],
    },
    { id: "springC", kind: "plate", shape: shape(SPRING_OUTLINE), thickness: 0.3, arrow: false, label: "c", labelOffset: [-0.35, -0.25, 0.3] },
    { id: "springC2", kind: "plate", shape: shape(mirror(-1, SPRING_OUTLINE)), thickness: 0.3, arrow: false },
    { id: "leverL", kind: "group", pieces: lever(-1) },
    { id: "leverR", kind: "group", pieces: lever(1) },
    { id: "pawlL", kind: "plate", shape: shape(mirror(-1, PAWL_OUTLINE), [mirror(-1, PAWL_SLOT)]), thickness: 0.16, arrow: false, label: "d", labelOffset: [0.3, -0.3, 0.3] },
    { id: "pawlR", kind: "plate", shape: shape(PAWL_OUTLINE, [PAWL_SLOT]), thickness: 0.16, arrow: false, label: "d", labelOffset: [-0.3, -0.3, 0.3] },
    { id: "ropeA", kind: "rope", label: "a", center: [0, 2.2, 0], labelOffset: [0.3, 0, 0] },
    { id: "ropeEnd", kind: "rope" },
  ],
  // 動力重演:繩斷前後,平台與拉桿 b 照模型擺放(b 由彈簧壓下),兩支槓桿以平台上的樞軸自由轉、兩個棘爪在平台的導座裡
  // 自由滑:要由 b 的方塊壓下槓桿的圓頭、槓桿下端的銷推棘爪,棘爪才撐進棘齒,停在模型算的位置
  replay: {
    from: P.brk - 0.03,
    to: P.mend - 0.01,
    seconds: 8,
    free: {
      leverR: { pivot: [PIVOT[0], TOP0 + PIVOT[1], Z.lever], axis: [0, 0, 1], on: "platform" },
      leverL: { pivot: [-PIVOT[0], TOP0 + PIVOT[1], Z.lever], axis: [0, 0, 1], on: "platform" },
      pawlR: { slide: [1, 0, 0], on: "platform" },
      pawlL: { slide: [1, 0, 0], on: "platform" },
    },
    expect: [
      { part: "leverR", label: "繩斷後 b 壓下槓桿相連的一端,槓桿繞樞軸轉", quote: "彈簧 c 會將銷 b 及槓桿相連的兩端下壓" },
      { part: "pawlR", label: "槓桿把棘爪推進棘齒,隨平台停在棘齒上", quote: "因此將棘爪推入棘齒中，並阻止平台的下降" },
      { part: "pawlL", label: "槓桿把棘爪推進棘齒,隨平台停在棘齒上", quote: "因此將棘爪推入棘齒中，並阻止平台的下降" },
    ],
  },
  powered: ["platform", "rodB"], // 外力來源:平台由繩拉著(斷繩後由自重);b 由繩拉上、由彈簧 c 壓下
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.07 },
  targets: ["pawlL", "pawlR"], // 繩斷時撐進棘齒的棘爪
  view: { direction: [0.05, 0.05, 1] },
  pose(p) {
    const { top, b: pressed, broken } = story(p);
    const { joint, angle, b } = pawlAt(top, pressed);
    const by = top + b;
    const py = top + PAWL_Y;
    const sa = springAngle(top, by);
    const eye = by + EYE.at;
    const ropeTop = 2.5;
    const eyeAtBreak = TOP0 + B_UP + EYE.at;
    return {
      parts: {
        platform: { position: [0, top, 0] },
        rodB: { position: [0, by, 0] },
        springC: { position: [SPRING_ROOT[0], top + SPRING_ROOT[1], 0], angle: sa },
        springC2: { position: [-SPRING_ROOT[0], top + SPRING_ROOT[1], 0], angle: -sa },
        leverR: { position: [PIVOT[0], top + PIVOT[1], Z.lever], angle },
        leverL: { position: [-PIVOT[0], top + PIVOT[1], Z.lever], angle: -angle },
        pawlR: { position: [joint, py, Z.pawl], angle: 0 },
        pawlL: { position: [-joint, py, Z.pawl], angle: 0 },
      },
      paths: {
        ropeA: { points: [[0, ropeTop, 0], [0, broken ? eyeAtBreak + 0.5 : eye, 0]], closed: false, phase: broken ? -TOP0 : -top }, // 斷後上段留在原處
        ropeEnd: { points: [[0, eye, 0], [0, broken ? eye + 0.35 : eye + 0.01, 0]], closed: false, phase: -top, visible: broken },
      },
      readouts: [],
    };
  },
};
