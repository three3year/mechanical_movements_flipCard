// 第 320 種:無端鏈(惠更斯的維持動力)。右上是動力輪部分主輪上的皮帶輪 P(表面粗糙,繩不打滑),左上是另一根軸上
// 的棘輪皮帶輪 p(以棘輪與制動爪連著,只能往一個方向轉)。一條無端的繩依序繞過 P、下方掛大重物 W 的滑輪、p、
// 掛小重物 w 的滑輪,再回到 P:繩段 d、a 吊著 W,b、c 吊著 w(w 只重到讓繩保持在輪上)。
// 時鐘走時,W 下降帶動 P;上發條時把繩段 b 往下拉,p 在制動爪下轉動、a 把 W 拉上來,而 c 仍拉著 P,
// 動力輪一刻也不失去動力。主動件是虛擬的「進程」:每一輪前段時鐘照走,後段同時上發條(拉 b)。
// p 的棘輪是鋸齒形(只能逆時針轉);制動爪 click 鉸在機架的樁上,靠自重搭在棘輪上:上發條時齒背從爪尖底下滑過、
// 爪被抬起又落下,爪尖的位置由爪尖和齒面相碰算(ratchets.pawlRest)。
// 推斷:每一輪上發條的時機與快慢;各輪尺寸依原圖;P、p 的軸裝在後面的夾板條上,兩個重物用叉形吊帶掛在滑輪軸上
// (原圖畫成一根吊桿)。
import { Z, smooth, routeBelt, deg } from "./kit.js";
import { ratchetShape, shape, thickLine } from "./shapes.js";
import { pawlRest, pawlTrack } from "./ratchets.js";
import { plateBar } from "./supports.js";

const R = 0.55;
const RW = 0.48; // W 的滑輪
const Rw = 0.32; // w 的滑輪
const PP = [1.3, 1.6, 0]; // P
const Pp = [-1.3, 1.6, 0]; // p
const W0 = -1.6; // W 滑輪的起始高度
const w0 = -1.0; // w 滑輪的起始高度
export const FEED = 0.55 * Math.PI; // 每一輪時鐘走過、經 P 送出的繩長(上發條時 p 轉半圈,正好 6 個棘齒)
const WIND = 0.75; // 每一輪的後段(0.75–1)同時上發條
export const RATCHET = { teeth: 12, outer: 0.38, inner: 0.28, dir: 1 }; // p 的棘輪:只能逆時針轉
// 制動爪:樞軸在 p 的上方偏右(皮帶輪與繩外),爪往左下斜,爪尖搭在棘輪的左上方
const CLICK = { pivot: [Pp[0] + 0.8 * Math.cos(deg(70)), Pp[1] + 0.8 * Math.sin(deg(70)), 0], length: 0.57 };
const Z_FRAME = -0.35;

// 上發條的行程(0→1):拉 b 時多拉 0.4 個棘齒,爪落進齒根後放手,W 把 p 拉回來、齒的直面靠上爪尖
const OVER = (0.4 * (2 * Math.PI) / 12 * 0.55) / FEED;
const winding = (x) => (x <= 0 ? 0 : x < 0.85 ? (1 + OVER) * smooth(x / 0.85) : 1 + OVER * (1 - smooth((Math.min(x, 1) - 0.85) / 0.15)));

/** 進程 p → 經 P 送出的繩長、經 p 拉過的繩長、兩重物的高度 */
export function chain(p) {
  const k = Math.floor(p);
  const f = p - k;
  const fed = FEED * p; // 時鐘一直在走
  const wound = FEED * (k + winding((f - WIND) / (1 - WIND)));
  return { fed, wound, W: W0 - fed / 2 + wound / 2, w: w0 + fed / 2 - wound / 2 };
}

/** p 轉到 angle 時,制動爪靠自重落到碰上棘輪面的角度(爪尖的方位,繞樞軸) */
const rest = (angle) => pawlRest({ pivot: CLICK.pivot, length: CLICK.length, from: deg(190), into: 1, sweep: 1.2 }, { center: Pp, angle, ...RATCHET });
// 棘輪的相位:停著時爪尖落在齒根、頂著齒的直面(W 的拉力讓 p 往回轉,直到被爪擋住)
const PHASE = (() => {
  const pitch = (2 * Math.PI) / RATCHET.teeth;
  let best = 0;
  let deepest = Infinity;
  for (let i = 0; i < 240; i++) {
    const phase = (pitch * i) / 240;
    const [x, y] = rest(phase).tip;
    const r = Math.hypot(x - Pp[0], y - Pp[1]);
    if (r < deepest - 1e-9) [deepest, best] = [r, phase];
  }
  return best;
})();
/** 經 p 拉過的繩長 → p 的轉角(逆時針) */
export const ratchetAngle = (wound) => PHASE + wound / R;
// 制動爪逐步跟著上發條的行程走:被齒背抬起,過了齒尖加速落回(一輪裡只有上發條那一段 p 會轉)
const track = pawlTrack({ rest: (f) => rest(ratchetAngle(chain(f).wound)).angle, x0: WIND, x1: 1, acc: 6000, samples: 2400 });
/** 進程 p → 制動爪的角度(爪尖的方位,繞樞軸) */
export const clickAngle = (p) => track(p - Math.floor(p));
/** 進程 p → 制動爪最深能落到的角度(爪尖碰到棘輪面;爪不會比它更深) */
export const clickLimit = (p) => rest(ratchetAngle(chain(p).wound)).angle;
export const geometry = { CLICK, Pp };

// 叉形吊帶:從重物頂面伸到滑輪軸的兩端(軸頭長 1.6 倍輪寬),前後各一條
const hanger = (top, width) => [1, -1].map((side) => ({ kind: "box", size: [0.1, top, 0.04], at: [0, top / 2, side * (0.8 * width + 0.02)] }));

export default {
  figure: 320,
  parts: [
    {
      id: "pulleyP",
      kind: "group",
      center: PP,
      spin: R,
      label: "P",
      labelOffset: [0, 0.15, 0.3],
      pieces: [{ kind: "pulley", style: "disc", radius: R, width: 0.2 }],
    },
    {
      id: "pulleyp",
      kind: "group",
      center: Pp,
      spin: R,
      label: "p",
      labelOffset: [0, 0.15, 0.3],
      pieces: [
        { kind: "pulley", style: "disc", radius: R, width: 0.2 },
        { kind: "plate", shape: ratchetShape(RATCHET), thickness: 0.1, at: [0, 0, 0.15] }, // 棘輪,固定在 p 上
      ],
    },
    {
      id: "click",
      kind: "group",
      center: CLICK.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [CLICK.length - 0.1, 0]], 0.08)), thickness: 0.06, at: [0, 0, 0.15] },
        { kind: "plate", shape: { outline: [[CLICK.length - 0.12, 0.04], [CLICK.length - 0.12, -0.04], [CLICK.length, 0]], holes: [] }, thickness: 0.06, at: [0, 0, 0.15] }, // 爪尖
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [Pp, PP], z: Z_FRAME, width: 0.24, boss: 0.16 }),
        ...[Pp, PP].map(([x, y]) => ({ kind: "cylinder", radius: 0.05, length: 0.14, at: [x, y, -0.23] })), // P、p 的軸,從夾板條伸出
        { kind: "plate", shape: shape(thickLine([Pp, CLICK.pivot], 0.16)), thickness: 0.1, at: [0, 0, Z_FRAME] }, // 制動爪的樁座
        { kind: "cylinder", radius: 0.035, length: 0.6, at: [CLICK.pivot[0], CLICK.pivot[1], -0.1] }, // 制動爪的樁
      ],
    },
    { id: "sheaveW", kind: "pulley", style: "disc", radius: RW, width: 0.16 },
    { id: "sheavew", kind: "pulley", style: "disc", radius: Rw, width: 0.14 },
    { id: "weightW", kind: "group", label: "W", labelOffset: [0, -1.05, 0.5], pieces: [{ kind: "box", size: [1.7, 1.0, 0.7], at: [0, -1.05, 0] }, ...hanger(0.55, 0.16).map((p) => ({ ...p, at: [0, -0.55 + p.at[1], p.at[2]] }))] },
    { id: "weightw", kind: "group", label: "w", labelOffset: [0, -0.75, 0.35], pieces: [{ kind: "box", size: [0.45, 0.55, 0.4], at: [0, -0.75, 0] }, ...hanger(0.475, 0.14).map((p) => ({ ...p, at: [0, -0.475 + p.at[1], p.at[2]] }))] },
    { id: "rope", kind: "rope" },
    { id: "labelA", kind: "group", center: [0.3, 0.3, 0], label: "a", labelOffset: [0, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-1.95, 0.4, 0], label: "b", labelOffset: [-0.2, 0, 0.3] },
    { id: "labelC", kind: "group", center: [-0.4, 0.4, 0], label: "c", labelOffset: [0.2, 0, 0.3] },
    { id: "labelD", kind: "group", center: [1.95, 0.3, 0], label: "d", labelOffset: [0.2, 0, 0.3] },
  ],
  // 動力重演:制動爪鉸在樁上、靠自重搭在棘輪上;上發條時棘輪從爪尖底下轉過,爪被齒背抬起又落下
  replay: {
    from: 0.7,
    to: 1.05,
    free: { click: { pivot: CLICK.pivot, gravity: true } },
    ignore: [["click", "frame"]],
    expect: [
      { at: 0.85, part: "click", label: "上發條:棘輪在制動爪下方運行,爪搭在齒上", quote: "棘輪皮帶輪會在制動爪下方運行" },
      { part: "click", label: "上完發條:爪落回齒根,擋住棘輪" },
    ],
  },
  powered: ["weightW"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.08 },
  target: "pulleyP", // 一刻不失去動力的動力輪
  view: { direction: [0.03, 0.04, 1] },
  pose(p) {
    const c = chain(p);
    const W = [PP[0], c.W, 0];
    const w = [Pp[0], c.w, 0];
    // 無端繩:P(順時針)→ W 的滑輪 → p(逆時針)→ w 的滑輪 → 回到 P
    const loop = routeBelt([
      { center: PP, axis: Z, radius: R, sense: -1 },
      { center: W, axis: Z, radius: RW, sense: -1 },
      { center: Pp, axis: Z, radius: R, sense: 1 },
      { center: w, axis: Z, radius: Rw, sense: 1 },
    ]);
    return {
      parts: {
        pulleyP: { angle: -c.fed / R },
        pulleyp: { angle: ratchetAngle(c.wound) },
        click: { angle: clickAngle(p) },
        sheaveW: { position: W, angle: -(c.fed + c.wound) / (2 * RW) },
        sheavew: { position: w, angle: (c.fed + c.wound) / (2 * Rw) },
        weightW: { position: W },
        weightw: { position: w },
      },
      paths: { rope: { points: loop.points, closed: true, phase: c.fed } },
      readouts: [],
    };
  },
};
