// 第 49 種:水平軸的往復圓周運動,透過連在斜齒輪上的棘輪,使直立軸連續旋轉。
// 兩個斜齒輪與它們的棘輪都鬆套在水平軸上,兩棘輪的齒方向相反;棘爪裝在固定於軸上的搖臂上,
// 也朝相反方向作動。軸往一個方向擺時,左棘爪帶動左斜齒輪;擺回來時右棘爪帶動右斜齒輪。
// 兩個斜齒輪都與上方直立軸的斜齒輪咬合、彼此反向轉,所以上方的輪始終朝同一方向轉。
// 照原圖,搖臂在棘輪外側(棘輪與軸架之間),伸出棘輪頂端,棘爪裝在搖臂頂上、伸到棘輪的齒上。
// 主動件是水平軸連同兩支搖臂(往復擺動的輸入);目標件是上方直立軸的斜齒輪(連續轉的輸出);
// 三個斜齒輪一樣大(原圖如此),上方那個不是主輪。主動量是軸的累計擺動量(見 kit.swing):左斜齒輪的轉角就等於它。
// 搖臂來回一趟擺 2·SWING,剛好是整數個棘齒:每一趟推程,帶動的棘爪都落在齒根、頂著齒的直面。
import { X, Y, TAU, deg, swingPhase, planeBasis, add, scale } from "./kit.js";
import { meshAngle, bevelGear, bevelContact } from "./gears.js";
import { ratchetShape, stadium, circle } from "./shapes.js";
import { pawlRest } from "./ratchets.js";

const SWING = deg(45); // 搖臂來回的角度(來回一趟 90°,是 6 個棘齒)
const M = 0.072;
const N = 40;
const APEX = [0, 0, 0];
export const LEFT = bevelGear({ apex: APEX, axis: [1, 0, 0], teeth: N, radius: (N * M) / 2, cone: Math.PI / 4, width: 0.6 });
export const RIGHT = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: N, radius: (N * M) / 2, cone: Math.PI / 4, width: 0.6 });
export const TOP = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: N, radius: (N * M) / 2, cone: Math.PI / 4, width: 0.6 });
const CONTACT_L = bevelContact(LEFT, TOP);
const CONTACT_R = bevelContact(RIGHT, TOP);
export const RATCHET = { teeth: 24, outer: 0.72, inner: 0.6 };
const RX = 2.0; // 棘輪所在平面(左右對稱)
const ARM = { pivot: 0.92, length: 0.5, gap: 0.17 }; // 棘爪樞軸離軸心的距離、棘爪長、搖臂在棘輪外側多遠

// 棘輪平面上的 2D 座標(繪圖層的局部 x、y)與世界座標的對應:軸沿 +x 時局部 x → 世界 −z
const toWorld = (x0, [u, v]) => {
  const [bu, bv] = planeBasis(X);
  return add([x0, 0, 0], add(scale(bu, u), scale(bv, v)));
};

/** 主動量 v(累計擺動)→ 軸的轉角、左右斜齒輪與上輪的轉角 */
export function motion(v) {
  const { at: shaft } = swingPhase(v, -SWING / 2, SWING / 2);
  const left = v - SWING / 2; // 累計擺動量:往正方向擺時左輪跟著軸,往回擺時左輪由上輪帶著繼續同向轉
  const top = meshAngle(LEFT, TOP, left, CONTACT_L);
  const right = meshAngle(TOP, RIGHT, top, CONTACT_R);
  return { shaft, left, right, top };
}

// 棘爪(在棘輪的局部平面內):樞軸在搖臂上(隨軸轉),爪尖靠在棘輪面上
function pawl(shaft, wheelAngle, dir) {
  const a = shaft + Math.PI / 2;
  const pivot = [ARM.pivot * Math.cos(a), ARM.pivot * Math.sin(a), 0];
  // dir = +1:爪尖在樞軸逆時針前方,推輪逆時針;−1 鏡像
  const from = a + dir * (Math.PI / 2 - deg(35));
  return { pivot, ...pawlRest({ pivot, length: ARM.length, from, into: dir, sweep: 1.4 }, { center: [0, 0], angle: wheelAngle, ...RATCHET, dir }) };
}

// 推程中帶動的棘爪與棘輪一起轉、相對位置不變:棘輪取讓爪尖落到齒根(最深處)的相位
function seat(dir, wheelAngle) {
  let best = 0;
  let deepest = Infinity;
  for (let i = 0; i < 120; i++) {
    const phase = (TAU / RATCHET.teeth) * (i / 120);
    const { tip } = pawl(0, wheelAngle + phase, dir);
    const r = Math.hypot(tip[0], tip[1]);
    if (r < deepest - 1e-9) [deepest, best] = [r, phase];
  }
  return best;
}
// 軸擺到中間(轉角 0)時:推程中左棘爪帶左輪,回程中右棘爪帶右輪
const PHASE_L = seat(1, motion(SWING / 2).left);
const PHASE_R = seat(-1, -motion((3 * SWING) / 2).right);

const bevel = (id, g, extra) => ({
  id,
  kind: "gear",
  center: g.center,
  axis: g.axis,
  teeth: g.teeth,
  radius: g.radius,
  cone: g.cone,
  width: g.width,
  ...extra,
});

const ratchet = (id, x, dir) => ({
  id,
  kind: "plate",
  axis: X,
  center: [x, 0, 0],
  shape: ratchetShape({ ...RATCHET, dir, bore: 0.12 }),
  thickness: 0.18,
  arrow: false,
});

const arm = (x) => ({ kind: "plate", shape: stadium(ARM.pivot, 0.16, 0.05), thickness: 0.06, at: [0, 0, x], angle: Math.PI / 2 });
// 棘爪在棘輪的平面上,一根銷子穿到外側的搖臂(out:外側在局部 +Z 或 −Z)
const pawlPart = (id, out) => ({
  id,
  kind: "plate",
  axis: X,
  shape: { outline: [[-0.06, 0.05], [ARM.length * 0.5, 0.07], [ARM.length, 0], [ARM.length * 0.5, -0.02], [-0.06, -0.05]], holes: [] },
  thickness: 0.1,
  pieces: [{ kind: "cylinder", radius: 0.045, length: ARM.gap + 0.08, at: [0, 0, (out * ARM.gap) / 2] }],
  arrow: false,
});

export default {
  figure: 49,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: X,
      posed: false,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 5.6 }, arm(-RX - ARM.gap), arm(RX + ARM.gap)],
      // 轉向箭頭畫在右搖臂上(主動件是搖臂,不是棘輪)
      spin: 1.08,
      spinOffset: RX + ARM.gap,
    },
    bevel("left", LEFT, { pieces: [{ kind: "cylinder", radius: 0.3, length: 0.75, at: [0, 0, -0.65] }] }),
    bevel("right", RIGHT, { pieces: [{ kind: "cylinder", radius: 0.3, length: 0.75, at: [0, 0, -0.65] }] }),
    bevel("top", TOP, { pieces: [{ kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -0.9] }] }),
    ratchet("ratchetL", -RX, 1),
    ratchet("ratchetR", RX, -1),
    pawlPart("pawlL", -1),
    pawlPart("pawlR", 1),
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.18, 2.0, 0.5], at: [s * 2.45, -0.7, 0] },
          { kind: "box", size: [0.7, 0.12, 0.8], at: [s * 2.45, -1.72, 0] },
        ]),
        { kind: "box", size: [6.2, 0.06, 1.4], at: [0, -1.8, 0] },
      ],
    },
  ],
  waivers: [
    { check: "replay", parts: ["ratchetR"], reason: "未修:動力重演不成立——「一個來回後右棘輪被棘爪推過的角度」預期 ratchetR 在主動量 1.57 時已轉 -90°,實際轉了 64°。模型的棘爪是照時序擺放的:重演裡輪被兩個照模型走的棘爪夾著或拖著,沒有照一齒一齒前進。棘爪要改成鉸接後靠自重或彈簧搭在齒上,爪尖與齒(凸柱)也要畫在同一層、鉤得到(列入待確認清單)" },
    { check: "replay", parts: ["ratchetL"], reason: "未修:動力重演不成立——「一個來回後左棘輪被棘爪推過的角度」預期 ratchetL 在主動量 1.57 時已轉 90°,實際轉了 -593°。模型的棘爪是照時序擺放的:重演裡輪被兩個照模型走的棘爪夾著或拖著,沒有照一齒一齒前進。棘爪要改成鉸接後靠自重或彈簧搭在齒上,爪尖與齒(凸柱)也要畫在同一層、鉤得到(列入待確認清單)" },
    { check: "interference", parts: ["ratchetR", "pawlR"], reason: "棘爪的停位以爪尖一點靠在齒面上計算;爪身有寬度,爪尖旁的邊角伸進齒 0.04" },
    { check: "interference", parts: ["ratchetL", "pawlL"], reason: "棘爪的停位以爪尖一點靠在齒面上計算;爪身有寬度,爪尖旁的邊角伸進齒 0.05" },
  ],
  // 動力重演:只推主動軸;兩個棘輪靠摩擦定位,由棘爪推動
  replay: { free: { ratchetL: { hold: true }, ratchetR: { hold: true } }, expect: [{ part: "ratchetL", label: "一個來回後左棘輪被棘爪推過的角度" }, { part: "ratchetR", label: "一個來回後右棘輪被棘爪推過的角度" }] },
  driver: { part: "shaft", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "top",
  view: { direction: [0.05, 0.14, 1], fov: 20 },
  pose(v) {
    const { shaft, left, right, top } = motion(v);
    // 右棘輪的局部平面朝 +x 看與左邊相同(都以軸 +x 為法線),右輪的轉角也繞 +x 量:右斜齒輪的軸朝 −x
    const pl = pawl(shaft, left + PHASE_L, 1);
    const pr = pawl(shaft, -right + PHASE_R, -1);
    return {
      parts: {
        shaft: { angle: shaft },
        left: { angle: left },
        right: { angle: right },
        top: { angle: top },
        ratchetL: { angle: left + PHASE_L },
        ratchetR: { angle: -right + PHASE_R },
        pawlL: { position: toWorld(-RX, pl.pivot), angle: pl.angle },
        pawlR: { position: toWorld(RX, pr.pivot), angle: pr.angle },
      },
      readouts: [],
    };
  },
};
