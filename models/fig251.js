// 第 251 種:打樁機的釋放鉤。重物 W 由鉤 A 吊著往上拉;拉到夠高時,兩支鉤的上端進入框架頂部的槽 B(下寬上窄),
// 被槽的兩側往內壓,鉤繞著自己的銷轉,下端的鉤爪隨之往外張開,重物突然被放開,沿立柱的導條落到樁頭上。
// 照原圖(507movements 的 525 px 原圖):兩支鉤 A 是上端往外翹的月牙形彎鉤,各自以一根銷裝在吊架上(兩根銷左右分開),
// 吊架上方掛在吊繩上;鉤爪往內勾,托住 W 柱頂 T 形頭的兩端;W 兩側的凹口套在立柱的導條上;吊繩從頂樑上的槽 B 穿下來。
// 主動件是吊繩與吊架:拉上去(釋放)、再放下去讓鉤爪重新抓住重物(累計行程,見 kit.swing)。
// 由接觸算:鉤張開的角度是「張到剛好不碰槽壁」(兩支鉤和槽壁同一層);托著重物時 W 的高度是「T 形頭落到碰到鉤爪」,
// 鉤爪讓開到托不住時就是放開的那一刻(RELEASE);放下吊繩時,鉤爪碰到 T 形頭被撐開、越過後合攏勾在底下。
// 重物靠重力落下,落下的過程演出來(jumps.falling:起步慢、越來越快、到底停住),佔吊繩再走 DROP 的行程。
// 推斷:放下時鉤爪抓回重物的動作(原文只寫釋放);樁(原圖框架往下截斷,沒畫樁,照原文「落到樁頭上」補在 W 正下方);
// 吊架的形狀(原圖兩鉤之間的斜線剖面)。鉤靠自重合攏(月牙的重心在銷的外側);原圖鉤內側的細彎片像是撐住鉤合攏的片簧,
// 托著重物時鉤爪受的拉力有把鉤往外張的傾向,實物靠它撐住,這裡沒畫。
// 偏離插圖:原圖的槽 B 是頂樑上的梯形口,這裡把框架頂部加厚成兩塊斜面板、頂樑另留穿繩的方口(鉤的上端要升進斜面一段,
// 張開的角度才夠讓鉤爪讓開 T 形頭);鉤比原圖小一些,好讓吊架的行程放得進框架。
import { swingPhase } from "./kit.js";
import { falling } from "./jumps.js";
import { shape, thickLine, circle, rect, pinBoss } from "./shapes.js";
import { placeOutline, polygonsOverlap, pushUntilClear } from "./contact.js";

export const HEIGHT = 3.0; // 吊繩的行程
export const DROP = 0.6; // 重物落到底所佔的吊繩行程(約 0.24 秒);落得比吊架回頭往下快,鉤合攏時重物已在下方
const PIN_X = 0.34; // 兩根銷離中線的距離
const OPEN_MAX = 0.6; // 找接觸時鉤最多張到的角度
const PILE_TOP = -3.3; // 樁頭的高度
const W_BOTTOM = -2.25; // W 底面在 T 形頭頂面下方的距離
const BASE_TOP = PILE_TOP - W_BOTTOM; // 重物落在樁頭上時 T 形頭頂面的高度

// 左鉤的中心線(局部座標以它的銷為原點):月牙形,上端往外翹;銷下方往下伸,底端往內彎成鉤爪,爪尖朝上托住 T 形頭
const HOOK_LINE = [
  [-0.2, 1.42], [-0.29, 1.33], [-0.37, 1.21], [-0.44, 1.06], [-0.49, 0.9], [-0.52, 0.73], [-0.52, 0.56], [-0.49, 0.4],
  [-0.43, 0.26], [-0.34, 0.14], [-0.22, 0.05], [-0.1, 0.01], [0, 0], [0.01, -0.15], [0, -0.3], [0, -0.45],
  [0.03, -0.53], [0.08, -0.555], [0.13, -0.53], [0.15, -0.47],
];
// 銷在中心線的折角上:thickLine 在折點取前後平均的切線,折角外側那條邊離銷只剩 0.049,銷孔(半徑 0.05)破到外形外。
// 銷上補一個半徑 0.07 的圓轂(孔周圍留一圈 0.02 的肉;比半寬 0.065 大一點,折角內側也凸出一點)
const HOOK_W = 0.13;
const hookShape = (m) => shape(pinBoss(thickLine(HOOK_LINE.map(([x, y]) => [m * x, y]), HOOK_W), [0, 0], 0.07), [circle(0.05).reverse()]);
const HOOK = { L: hookShape(1), R: hookShape(-1) };
// T 形頭(W 的局部座標,原點在頂面):兩端擱在鉤爪的爪尖上,細柱接到 W 的頂面
const HEAD = [[-0.2, 0], [0.2, 0], [0.2, -0.1], [0.05, -0.1], [0.05, -0.27], [-0.05, -0.27], [-0.05, -0.1], [-0.2, -0.1]];
// 槽 B 的兩側(框架頂部,和兩支鉤同一層):下寬上窄的斜面把鉤的上端往內壓,斜面以上是直的,吊繩從中間穿上去
const WALL_L = [[-1.34, 3.15], [-0.97, 3.15], [-0.31, 3.81], [-0.31, 4.15], [-1.34, 4.15]];
const WALL_R = WALL_L.map(([x, y]) => [-x, y]);

const hookAt = (side, pivot, open) =>
  side < 0 ? placeOutline(HOOK.L.outline, [-PIN_X, pivot], -open) : placeOutline(HOOK.R.outline, [PIN_X, pivot], open);
const bothHit = (pivot, open, other) => polygonsOverlap(hookAt(-1, pivot, open), other.L) || polygonsOverlap(hookAt(1, pivot, open), other.R);
const headAt = (top) => HEAD.map(([x, y]) => [x, y + top]);

/** 槽 B 的兩側把鉤的上端往內壓:鉤張到剛好不碰槽壁(由接觸算) */
const pressedOpen = (pivot) => pushUntilClear(0, 1, OPEN_MAX, (o) => bothHit(pivot, o, { L: WALL_L, R: WALL_R }));

/** 托住時 T 形頭頂面在銷下方多遠(銷在 0):從鉤爪上方放下,停在碰到鉤爪的高度;放下 0.3 都碰不到 = 鉤爪已讓開,托不住 */
function restTop(open) {
  const start = -0.3;
  const hit = (d) => { const head = headAt(start - d); return bothHit(0, open, { L: head, R: head }); };
  for (let d = 0.01; d <= 0.3 + 1e-9; d += 0.01) {
    if (!hit(d)) continue;
    let [lo, hi] = [d - 0.01, d];
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (hit(mid)) hi = mid;
      else lo = mid;
    }
    return start - lo;
  }
  return null;
}

const KNOB = -restTop(0); // 鉤爪合攏托住時,T 形頭頂面在銷下方的距離
const PIVOT0 = BASE_TOP + KNOB; // 吊繩在最低處時銷的高度(重物這時落在樁頭上)

// 放開的那一刻:往上拉時,鉤被槽壁壓開到托不住 T 形頭(由接觸算)
const { RELEASE: release, LIFT: lift } = (() => {
  let at = 0;
  let held = 0;
  for (; at <= HEIGHT; at += 0.002) {
    const top = restTop(pressedOpen(PIVOT0 + at));
    if (top == null) break;
    held = at + top + KNOB;
  }
  return { RELEASE: at, LIFT: held };
})();
export const RELEASE = release; // 吊繩拉到這裡時鉤爪讓開,放開重物
const LIFT = lift; // 放開前一刻重物被抬起的高度

/** 放下吊繩時,合攏的鉤爪往下碰到 T 形頭的頂面被撐開(張到剛好不碰),越過後再合攏、勾在底下(由接觸算) */
const pushedOpen = (pivot, open) => {
  const head = headAt(BASE_TOP);
  return pushUntilClear(open, 1, OPEN_MAX - open, (o) => bothHit(pivot, o, { L: head, R: head }));
};

/** 主動量 v(累計行程)→ 吊架(銷)的高度、鉤張開的角度、重物上升量 */
export function hook(v) {
  const { at, forward, cycle } = swingPhase(v, 0, HEIGHT);
  const pivot = PIVOT0 + at;
  let open = pressedOpen(pivot);
  // 往上拉時重物擱在鉤爪上跟著上升,放開後加速落下;落下的時間以吊繩的累計行程量(跨過到頂回頭的那一刻)
  const since = v - (2 * cycle * HEIGHT + RELEASE); // 離這一輪放開多久(放開前為負)
  let weight = 0;
  if (since < 0) weight = forward ? at + restTop(open) + KNOB : 0;
  else if (since < DROP) weight = LIFT * (1 - falling(since / DROP));
  if (!forward && since >= DROP) open = pushedOpen(pivot, open);
  return { pivot, open, weight, hold: forward && at < RELEASE };
}

const Z_CARRIER = -0.0075; // 吊架中間那塊的深度中心:和鉤同一層,往後接到背板
export default {
  figure: 251,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.22, 7.6, 0.4], at: [-1.45, 0.5, 0] },
        { kind: "box", size: [0.22, 7.6, 0.4], at: [1.45, 0.5, 0] },
        // 頂樑:中間留一個方口讓吊繩穿上去(槽 B 往上穿過頂樑),前後兩條把左右兩半連成一根樑
        { kind: "box", size: [1.55, 0.3, 0.4], at: [-0.875, 4.3, 0] },
        { kind: "box", size: [1.55, 0.3, 0.4], at: [0.875, 4.3, 0] },
        { kind: "box", size: [0.2, 0.3, 0.1], at: [0, 4.3, 0.15] },
        { kind: "box", size: [0.2, 0.3, 0.1], at: [0, 4.3, -0.15] },
        // 槽 B 的兩側
        { kind: "plate", shape: shape(WALL_L), thickness: 0.4 },
        { kind: "plate", shape: shape(WALL_R), thickness: 0.4 },
        // 立柱內側的導條:W 兩側的凹口套在上面,W 只能沿立柱上下
        { kind: "box", size: [0.14, 6.3, 0.12], at: [-1.27, -0.15, 0] },
        { kind: "box", size: [0.14, 6.3, 0.12], at: [1.27, -0.15, 0] },
        // 立柱的底座(中間讓出來給樁)
        { kind: "box", size: [0.44, 0.2, 1.0], at: [-1.56, -3.4, 0] },
        { kind: "box", size: [0.44, 0.2, 1.0], at: [1.56, -3.4, 0] },
      ],
    },
    // 槽 B 的標籤:在框架頂部、兩側槽壁之間(B 是槽,不是整個框架)
    { id: "slotB", kind: "group", label: "B", center: [0, 3.75, 0], labelOffset: [0.05, 0, 0.3] },
    // 樁(推斷):打進地裡,W 落在樁頭上
    { id: "pile", kind: "group", pieces: [{ kind: "cylinder", axis: [0, 1, 0], radius: 0.5, length: 1.0, at: [0, PILE_TOP - 0.5, 0] }] },
    // 吊架(推斷形狀,原圖兩鉤之間的斜線剖面):背板托著兩根銷,中間那塊和鉤同一層,往上是吊繩的眼
    {
      id: "carrier",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.9, 0.26, 0, 0.03)), thickness: 0.07, at: [0, 0, -0.105] },
        { kind: "plate", shape: shape([[-0.2, -0.22], [0.2, -0.22], [0.2, 0.18], [0.06, 0.3], [0.06, 0.86], [-0.06, 0.86], [-0.06, 0.3], [-0.2, 0.18]]), thickness: 0.135, at: [0, 0, Z_CARRIER] },
        { kind: "cylinder", radius: 0.12, inner: 0.06, length: 0.135, at: [0, 0.96, Z_CARRIER] },
        // 兩根銷:從背板穿過鉤,前端有銷頭
        { kind: "cylinder", radius: 0.045, length: 0.24, at: [-PIN_X, 0, -0.02] },
        { kind: "cylinder", radius: 0.045, length: 0.24, at: [PIN_X, 0, -0.02] },
        { kind: "cylinder", radius: 0.075, length: 0.03, at: [-PIN_X, 0, 0.08] },
        { kind: "cylinder", radius: 0.075, length: 0.03, at: [PIN_X, 0, 0.08] },
      ],
    },
    { id: "hookL", kind: "plate", shape: HOOK.L, thickness: 0.12, arrow: false, label: "A", labelOffset: [-0.45, 1.25, 0.2] },
    { id: "hookR", kind: "plate", shape: HOOK.R, thickness: 0.12, arrow: false, label: "A", labelOffset: [0.45, 1.25, 0.2] },
    {
      id: "weight",
      kind: "group",
      label: "W",
      labelOffset: [0, -1.0, 0.5],
      pieces: [
        { kind: "plate", shape: shape(rect(2.36, 2.0, 0, -1.25)), thickness: 0.8 },
        { kind: "plate", shape: shape(HEAD), thickness: 0.3 },
        // 兩側的凹口:上下各一對前後凸耳,夾著立柱的導條
        ...[-1, 1].flatMap((s) =>
          [-0.45, -2.05].flatMap((y) => [-1, 1].map((f) => ({ kind: "box", size: [0.13, 0.3, 0.32], at: [s * 1.245, y, f * 0.24] }))),
        ),
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  // 動力重演:只推吊繩;重物受重力,沿導條上下,由鉤爪托著 T 形頭提起,鉤爪張開後自己落下
  replay: {
    seconds: 16,
    free: { weight: { slide: [0, 1, 0] } }, // 滑軌就是立柱的導條(W 的凹口套在導條上,只能沿立柱上下)
    expect: [
      { at: RELEASE - 0.3, part: "weight", label: "鉤爪托住 T 形頭,把重物提起" },
      { at: RELEASE + DROP + 0.2, part: "weight", label: "鉤 A 的上端被槽壓攏,重物被放開、落到樁頭", quote: "鉤 A 的上端會被框架頂部的槽 B 兩側向內壓,重物就會被突然釋放,並以累積的力量落到樁頭上" },
      { at: 2 * HEIGHT, part: "weight", label: "放下吊繩,鉤爪重新抓住重物" },
    ],
  },
  driver: { part: "carrier", grips: ["hookL", "hookR"], type: "translation", direction: [0, 1, 0], cycle: [0, HEIGHT] },

  target: "weight",
  view: { direction: [0.06, 0.06, 1] },
  pose(v) {
    const h = hook(v);
    return {
      parts: {
        carrier: { position: [0, h.pivot, 0] },
        hookL: { position: [-PIN_X, h.pivot, 0], angle: -h.open },
        hookR: { position: [PIN_X, h.pivot, 0], angle: h.open },
        weight: { position: [0, BASE_TOP + h.weight, 0] },
      },
      paths: { rope: { points: [[0, 4.6, 0], [0, h.pivot + 1.08, 0]], closed: false, phase: h.pivot } },
      readouts: [],
    };
  },
};
