// 第 278 種:C. R. Otis 的吊升平台安全擋止。A 是兩根靜止的立柱,內側固定著棘齒;平台(上部為 B)在兩柱之間升降。
// 吊繩 a 經銷 b 連在平台上,銷 b 又連著兩根肘節槓桿,槓桿外端是棘爪 d;彈簧 c 把 b 往下壓。
// 吊升或降下時,平台的重量與繩的張力把 b 往上拉,棘爪縮在內側、不碰棘齒;繩索斷裂時,彈簧 c 把 b 往下壓,
// 肘節撐開,棘爪 d 被推進棘齒,擋住平台不再下降。
// 主動件是虛擬的「進程」(規則 9:斷繩後棘爪撐出、擋住平台,播放時自己呈現,不靠按鈕):吊起平台 → 放下一段 →
// 繩索斷裂:彈簧 c 把 b 往下壓(加速),肘節撐開棘爪;平台憑自重加速落下,棘爪撐出棘齒尖之後,落到下方最近一個棘齒的
// 平面上停住(由棘爪尖與棘齒的位置算)。之後換上新繩:繩一拉緊就把 b 拉上、棘爪縮回,再把平台放回最低處,
// 接著下一輪(整段連續,沒有跳回)。
// 推斷:肘節與棘爪的尺寸、棘齒的齒距;各段所佔的進程;換新繩後放回原處的那一段(原文沒寫,為了讓劇情能連續重播)。
// 動力重演不適用:棘爪由兩端都鉸接的肘節連桿撐出(重演的自由零件只能有一個樞軸),撐出多少由肘節的幾何算。
import { smooth } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { falling } from "./jumps.js";

const POST = { x: 2.0, face: 1.75, width: 0.5 };
const TOOTH = { pitch: 0.42, depth: 0.14, from: -3.2, count: 13 };
const LINK = 1.6; // 肘節連桿長
const PAWL_Y = -1.0; // 棘爪所在的高度(相對平台頂)
const B_UP = -0.3; // 繩子拉著時銷 b 的高度
const B_DOWN = -0.75; // 斷繩後彈簧把 b 壓下的高度
const PAWL_TIP = 0.15; // 棘爪尖超出肘節接點的長度
const HOIST = 2.2; // 吊起的高度
const BASE = -1.6; // 進程 0 時平台頂的高度
const P = { up: 0.3, down: 0.42, brk: 0.47, mend: 0.75, tight: 0.79 }; // 吊起、放下一段、斷繩、換新繩、繩拉緊的進程
const SPREAD = 0.03; // 斷繩後彈簧把 b 壓到底所佔的進程
const G = 120; // 落下的「加速度」(以進程計:落下 d 花 √(d / G) 的進程)

/** 銷 b 的高度 → 棘爪尖離中線的距離(肘節撐開) */
export const pawlReach = (b) => Math.sqrt(LINK * LINK - (b - PAWL_Y) ** 2) + PAWL_TIP;
export const geometry = { face: POST.face, toothTip: POST.face - TOOTH.depth, B_UP, B_DOWN, pitch: TOOTH.pitch, P };

// 棘齒的平面(齒的上面)高度:from + k·齒距 + 0.85·齒距
const flats = Array.from({ length: TOOTH.count }, (_, k) => TOOTH.from + k * TOOTH.pitch + 0.85 * TOOTH.pitch);
const TOP0 = BASE + HOIST - 0.8; // 斷繩時平台頂的高度
// 斷繩後:棘爪撐出棘齒尖的那一刻(b 壓下到 reach > 齒尖)
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

/** 進程 p → 平台頂的高度、銷 b 的相對高度、繩是否已斷 */
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

// 立柱內側在高度 y 處的邊界 x(棘齒的斜面或柱面)
const faceAt = (y) => {
  const k = Math.floor((y - TOOTH.from) / TOOTH.pitch);
  const local = y - TOOTH.from - k * TOOTH.pitch;
  if (k < 0 || k >= TOOTH.count || local >= 0.85 * TOOTH.pitch) return POST.face;
  return POST.face - (TOOTH.depth * local) / (0.85 * TOOTH.pitch);
};
const TIP_END = PAWL_TIP + 0.02; // 棘爪尖端離肘節接點
/** 平台頂在 top、銷 b 被彈簧壓到 b 時,棘爪接點的實際位置與銷 b 的實際高度:棘爪尖頂到上方棘齒的斜面就撐不出去 */
export function pawlAt(top, b) {
  const py = top + PAWL_Y;
  // 棘爪外形的右緣(尖端)與上緣(往內升高)上的點都要在柱面 / 斜面之內
  const edge = [];
  for (let i = 0; i <= 10; i++) edge.push([TIP_END, -0.07 + (0.05 * i) / 10], [(TIP_END * i) / 10, 0.07 - (0.09 * i) / 10]);
  const room = Math.min(...edge.map(([u, d]) => faceAt(py + d) - u));
  const joint = Math.min(pawlReach(b) - PAWL_TIP, room);
  return { joint, b: PAWL_Y + Math.sqrt(LINK * LINK - joint * joint) };
}

// 立柱:內側一排棘齒,齒的上面是平的(擋住往下的棘爪)、下面是斜的
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

// 棘爪:底面平(落在棘齒的平面上),上面往外斜(伸進上一齒斜面下方的空間)
const PAWL_OUTLINE = [[0, -0.07], [TIP_END, -0.07], [TIP_END, -0.02], [0, 0.07]];
const pawl = (s) => shape(s > 0 ? PAWL_OUTLINE : PAWL_OUTLINE.map(([x, y]) => [-x, y]).reverse()); // 左邊的是鏡像(不是轉半圈)

export default {
  figure: 278,
  parts: [
    { id: "postL", kind: "plate", shape: shape(post(-1)), thickness: 0.5, label: "A", labelOffset: [-2.2, 1.0, 0.4] },
    { id: "postR", kind: "plate", shape: shape(post(1)), thickness: 0.5, label: "A", labelOffset: [2.2, 1.0, 0.4] },
    {
      id: "platform",
      kind: "group",
      label: "B",
      labelOffset: [-0.9, -0.08, 0.4],
      pieces: [
        { kind: "plate", shape: shape(rect(3.2, 0.16, 0, 0)), thickness: 0.4 },
        // 兩側柱在棘爪的高度開口,棘爪平時收在開口裡、繩斷時從開口伸出
        ...[-1.45, 1.45].flatMap((x) => [
          { kind: "plate", shape: shape(rect(0.16, 0.9, x, -0.45)), thickness: 0.4 },
          { kind: "plate", shape: shape(rect(0.16, 1.33, x, -1.735)), thickness: 0.4 },
        ]),
        { kind: "plate", shape: shape(rect(3.06, 0.12, 0, PAWL_Y - 0.13)), thickness: 0.3 },
        { kind: "plate", shape: shape(rect(0.14, 0.5, 0, -0.35)), thickness: 0.12, at: [0, 0, -0.12] },
        { kind: "box", size: [3.2, 0.2, 1.2], at: [0, -2.45, 0] },
      ],
    },
    { id: "pinB", kind: "cylinder", radius: 0.09, length: 0.4, label: "b", labelOffset: [0.25, 0.15, 0.3] },
    { id: "springC", kind: "spring", coils: 5, radius: 0.1, wire: 0.022, label: "c", labelOffset: [0.3, 0.1, 0.3] },
    { id: "linkL", kind: "link", width: 0.12, thickness: 0.07 },
    { id: "linkR", kind: "link", width: 0.12, thickness: 0.07 },
    { id: "pawlL", kind: "plate", shape: pawl(-1), thickness: 0.25, arrow: false, label: "d", labelOffset: [0.05, -0.35, 0.3] },
    { id: "pawlR", kind: "plate", shape: pawl(1), thickness: 0.25, arrow: false, label: "d", labelOffset: [-0.05, -0.35, 0.3] },
    { id: "ropeA", kind: "rope", label: "a", center: [0, 2.2, 0.25], labelOffset: [0.3, 0, 0] },
    { id: "ropeEnd", kind: "rope" },
  ],
  powered: ["platform"], // 外力來源:平台由繩拉著(斷繩後由自重)
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.07 },
  targets: ["pawlL", "pawlR"], // 繩斷時撐進棘齒的棘爪
  view: { direction: [0.05, 0.05, 1] },
  pose(p) {
    const { top, b: pressed, broken } = story(p);
    const { joint: reach, b } = pawlAt(top, pressed);
    const by = top + b;
    const py = top + PAWL_Y;
    const ropeTop = 2.5;
    const cut = by + 1.3; // 斷口
    return {
      parts: {
        platform: { position: [0, top, 0] },
        pinB: { position: [0, by, 0.25] },
        springC: { from: [0, top - 0.02, 0.25], to: [0, by + 0.08, 0.25] },
        linkL: { from: [0, by, 0.22], to: [-reach, py, 0.22] },
        linkR: { from: [0, by, 0.22], to: [reach, py, 0.22] },
        pawlL: { position: [-reach, py, 0.22] },
        pawlR: { position: [reach, py, 0.22], angle: 0 },
      },
      paths: {
        ropeA: { points: [[0, ropeTop, 0.25], [0, broken ? TOP0 + B_UP + 1.8 : by, 0.25]], closed: false, phase: broken ? -TOP0 : -top }, // 斷後上段留在原處
        ropeEnd: { points: [[0, by, 0.25], [0, broken ? cut : by + 0.01, 0.25]], closed: false, phase: -top, visible: broken },
      },
      readouts: [],
    };
  },
};
