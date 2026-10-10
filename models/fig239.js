// 第 239 種:用於正齒輪的擋止裝置配置方式。齒輪上方左右各一支擋爪,外端以樞軸固定,內端的爪尖靠彈簧壓在齒間。
// 爪尖照原圖是單向的止回爪:一側是直的端面,一側是斜面。左爪的端面朝右(擋住齒輪逆時針轉),右爪的端面朝左
// (擋住順時針轉):齒輪往擋住的方向轉時,齒的側面貼上端面,齒輪轉不動;往另一個方向轉時,齒沿斜面把爪頂起、
// 越過齒尖,爪再彈回下一個齒間。端面照原圖和齒的側面平行;推力的作用線在樞軸上方,擋得住靠彈簧把爪壓在齒間(推斷)。
// 狀態(維護者決定 (a)):只放下左爪 / 只放下右爪(另一支抬起,由插在它下面的撐銷撐住),各擋一個方向,
// 齒輪只能往放行的方向轉,往回只能轉到爪落定的位置;兩支都放下(原圖畫的樣子)時兩個方向都擋住。主動件是齒輪。
// 推斷:原文只有一句;爪的作用方式、彈簧與齒數依原圖;撐銷、樞軸銷、彈簧座、托架(兩根立柱落到底板)與齒輪軸的支座。
// 接觸(由接觸算,共用 pawl-drive.js):彈簧把爪尖往齒輪壓;齒把爪頂起多高、何時越過齒尖,由外形相碰算出,
// 越過之後爪從當下的速度起加速彈回、落進下一個齒間。擋住的位置是爪落定的位置(落下時齒輪只再轉了極小的一段)。
import { TAU, deg, rot2 } from "./kit.js";
import { shape, circle, gearProfile, gearSize, toothOutline } from "./shapes.js";
import { resample } from "./noncircular.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const N = 14;
const R = 1.55;
const { addendum, dedendum } = gearSize(R, N);
const TIP = R + addendum;
const ROOT = R - dedendum;
const PITCH = TAU / N;
// 擋爪:樞軸、爪尖落在哪一個齒間(齒輪轉角 0 時的方位)、端面朝哪一側(沿齒輪逆時針為 +1)、彈簧把爪往哪邊壓、
// 擋住齒輪往哪個方向轉(逆時針 +1)
const PAWLS = {
  left: { pivot: [-2.45, 0.6], gap: 4.5 * PITCH, face: -1, into: -1, blocks: 1 },
  right: { pivot: [3.4, 0.55], gap: 2.5 * PITCH, face: 1, into: 1, blocks: -1 },
};

// 齒間兩側的齒腹(齒輪轉角 0、齒間中線為 0 的局部座標):沿中線的距離 x 處,齒腹離中線多遠
const FLANK = (() => {
  const t = toothOutline({ teeth: N, radius: R }, 0);
  const [root, tip] = [t[1], t[2]]; // 齒的順時針側齒腹:齒根、齒頂的角
  const local = ([x, y]) => rot2([x, y], PITCH / 2); // 換到齒間的座標(中線在 0,這一齒在中線的逆時針側)
  const [a, b] = [local(root), local(tip)];
  return (x) => a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
})();
const CLEAR = 0.02; // 爪落定時端面和齒腹之間的間隙

// 擋爪的外形(局部座標:原點在樞軸,桿身沿 +x):桿身,末端是止回爪的爪尖——遠端是和齒腹平行的直端面,
// 爪尖底下一小段平的,靠樞軸那一側是斜面(放行的方向,齒沿它把爪頂起)。以齒輪轉角 0、爪尖落在齒間時的世界座標畫,
// 再換成局部座標
function pawlGeometry({ pivot, gap, face }) {
  // 齒間的座標:x 沿中線往外,q 沿圓周、往端面那一側為正
  const at = (x, q) => [x * Math.cos(gap) - face * q * Math.sin(gap), x * Math.sin(gap) + face * q * Math.cos(gap)];
  const root = at(TIP + 0.22, 0);
  const rest = Math.atan2(root[1] - pivot[1], root[0] - pivot[0]);
  const local = (p) => rot2([p[0] - pivot[0], p[1] - pivot[1]], -rest);
  const L = Math.hypot(root[0] - pivot[0], root[1] - pivot[1]);
  const down = Math.sign(local([0, 0])[1]); // 齒輪在桿身的哪一側
  const [lo, hi] = [ROOT + 0.12, TIP + 0.24];
  const faceAt = (x) => FLANK(x) - CLEAR;
  const tip = [
    local(at(hi, faceAt(hi))), // 端面頂
    local(at(lo, faceAt(lo))), // 端面底(爪尖)
    local(at(lo, faceAt(lo) - 0.07)), // 爪尖底下平的一小段
    local(at(TIP + 0.1, -0.3)), // 斜面頂,接到桿身的下緣
  ];
  const outline = [[-0.22, -0.12 * down], [tip[0][0] - 0.05, -0.12 * down], ...tip, [tip[3][0] - 0.25, 0.12 * down], [-0.22, 0.12 * down]];
  return { rest, L, down, outline: down > 0 ? outline : outline.reverse(), faceEdge: [tip[0], tip[1]] };
}
const GEO = { left: pawlGeometry(PAWLS.left), right: pawlGeometry(PAWLS.right) };

const gearObstacles = (theta) => [...Array.from({ length: N }, (_, i) => toothOutline({ teeth: N, radius: R }, i).map((p) => rot2(p, theta))), circle(ROOT - 0.01)];
// 每支爪各算一次:齒輪往它放行的方向轉(爪的主動量 t = 齒輪往放行方向轉過的角度),每個齒距一個週期
const DRIVES = Object.fromEntries(
  Object.entries(PAWLS).map(([w, p]) => [
    w,
    pawlDrive({
      period: PITCH,
      samples: 360,
      pins: () => ({ [w]: p.pivot }),
      wheel: { obstacles: gearObstacles, angle: (t) => -p.blocks * t },
      pawls: { [w]: { outline: GEO[w].outline, into: p.into, angle: GEO[w].rest, limits: [GEO[w].rest - deg(25), GEO[w].rest + deg(25)] } },
    }),
  ]),
);
/** 爪 which 放下時,齒輪轉角 theta 下的轉角(齒輪先前往它放行的方向轉過來) */
const downAngle = (which, theta) => DRIVES[which].at(-PAWLS[which].blocks * theta).angles[which];
// 爪落定的位置(爪的主動量,一個齒距內):轉角驟變(落下)之後,第一個不再往下落的取樣
const LANDING = Object.fromEntries(
  Object.keys(PAWLS).map((w) => {
    const n = 720;
    const at = (i) => PAWLS[w].into * DRIVES[w].at((PITCH * i) / n).angles[w];
    let [start, best] = [0, 0];
    for (let i = 1; i <= n; i++) if (at(i) - at(i - 1) > best) [best, start] = [at(i) - at(i - 1), i];
    let i = start;
    while (at(i + 1) - at(i) > 1e-7 && i < start + n / 4) i++;
    return [w, ((PITCH * i) / n) % PITCH];
  }),
);
/** 爪 which 擋住齒輪的轉角:從 theta 往它擋住的方向轉,碰到的第一個爪落定的位置 */
export function stopAt(which, theta) {
  const { blocks } = PAWLS[which];
  const t = -blocks * theta; // 爪的主動量;往擋住的方向轉 = t 減少
  const last = LANDING[which] + Math.floor((t - LANDING[which]) / PITCH + 1e-9) * PITCH;
  return -blocks * last;
}
// 抬起的爪:撐在插在它下面的撐銷上(比落在齒間時離開齒輪 RAISE)
const RAISE = deg(16);
const raisedAngle = (which) => GEO[which].rest - PAWLS[which].into * RAISE;
// 撐銷:抬起時桿身下緣(朝齒輪那一側)、離樞軸 0.9 處
const PROP = Object.fromEntries(
  Object.keys(PAWLS).map((w) => {
    const [x, y] = rot2([0.9, GEO[w].down * (0.12 + 0.06)], raisedAngle(w));
    return [w, [PAWLS[w].pivot[0] + x, PAWLS[w].pivot[1] + y]];
  }),
);
const DOWN = { left: { left: true, right: false }, right: { left: false, right: true }, both: { left: true, right: true } };

/** 狀態 state、齒輪轉角 theta:兩支擋爪的轉角 */
export function pawlAngles(theta, state = "left") {
  const out = {};
  for (const w of Object.keys(PAWLS)) out[w] = DOWN[state][w] ? downAngle(w, theta) : raisedAngle(w);
  return out;
}
/** 爪被齒頂起的角度(0 為落在齒間),齒輪往它放行的方向轉 */
export const liftOf = (which, theta) => PAWLS[which].into * (GEO[which].rest - downAngle(which, theta));
export const geometry = { N, PITCH, TIP, ROOT, PAWLS, LANDING };
/** 檢查用:狀態 state、齒輪轉 theta 時兩支擋爪(放下的)、端面(世界座標的兩端)與齒輪的齒(世界座標 2D) */
export const contactAt = (theta, state = "left") => {
  const a = pawlAngles(theta, state);
  const place = (w, pts) => pts.map((p) => {
    const [x, y] = rot2(p, a[w]);
    return [PAWLS[w].pivot[0] + x, PAWLS[w].pivot[1] + y];
  });
  const pawls = Object.fromEntries(Object.keys(PAWLS).filter((w) => DOWN[state][w]).map((w) => [w, { outline: place(w, GEO[w].outline), face: place(w, GEO[w].faceEdge) }]));
  return { pawls, teeth: gearObstacles(theta).slice(0, -1) };
};
// 彈簧:一端固定在機架上(SPRING_AT),另一端壓在爪背上(爪的局部座標)
const SPRING_AT = { left: [PAWLS.left.pivot[0] + 0.4, PAWLS.left.pivot[1] + 1.0], right: [PAWLS.right.pivot[0] - 0.8, PAWLS.right.pivot[1] + 0.95] };
const SPRING_ON = { left: [GEO.left.L * 0.55, 0.12], right: [GEO.right.L * 0.55, -0.12] };

const pawlPart = (which, id) => ({ id, kind: "plate", center: [...PAWLS[which].pivot, 0], shape: shape(GEO[which].outline, [circle(0.07).reverse()]), thickness: 0.12, arrow: false, posed: true });
const BEAM_Y = 2.2;
const FLOOR = -2.3;
const BASE = FLOOR - 0.18; // 底板頂面(齒輪軸承座的腳放在上面)
const BACK = -0.4; // 托架的平面(z)
const POSTS = [-3.2, 4.2]; // 托架兩端落到底板的立柱(x)

export default {
  figure: 239,
  parts: [
    { id: "gear", kind: "plate", shape: shape(resample(gearProfile({ teeth: N, radius: R }), 0.03), [circle(0.25).reverse()]), thickness: 0.2, hub: 0.55, circles: [0.55], mark: [-0.9, -0.4], markSize: 0.08, spin: TIP },
    pawlPart("left", "pawlLeft"),
    pawlPart("right", "pawlRight"),
    { id: "springLeft", kind: "rod", radius: 0.03 },
    { id: "springRight", kind: "rod", radius: 0.03 },
    // 撐銷:抬起的爪下面插一根銷撐住(爪放下時拔掉)
    { id: "propLeft", kind: "cylinder", radius: 0.06, length: 0.5, center: [PROP.left[0], PROP.left[1], -0.11] },
    { id: "propRight", kind: "cylinder", radius: 0.06, length: 0.5, center: [PROP.right[0], PROP.right[1], -0.11] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.25, length: 0.5, at: [0, 0, -0.25] }, // 齒輪軸
        ...pedestal({ at: [0, 0], z: -0.45, bore: 0.25, floor: FLOOR }),
        { kind: "cylinder", radius: 0.07, length: 0.6, at: [...PAWLS.left.pivot, -0.05] }, // 擋爪的樞軸銷
        { kind: "cylinder", radius: 0.07, length: 0.6, at: [...PAWLS.right.pivot, -0.05] },
        { kind: "cylinder", radius: 0.06, length: 0.62, at: [...SPRING_AT.left, -0.08] }, // 彈簧的固定座,往後插進短柱
        { kind: "cylinder", radius: 0.06, length: 0.62, at: [...SPRING_AT.right, -0.08] },
        { kind: "box", size: [7.65, 0.25, 0.12], at: [0.5, BEAM_Y, BACK] }, // 托住樞軸銷與彈簧座的橫樑(推斷)
        { kind: "box", size: [0.25, 1.85, 0.12], at: [PAWLS.left.pivot[0], (PAWLS.left.pivot[1] + BEAM_Y) / 2, BACK] },
        { kind: "box", size: [0.25, 1.9, 0.12], at: [PAWLS.right.pivot[0], (PAWLS.right.pivot[1] + BEAM_Y) / 2, BACK] },
        { kind: "box", size: [0.25, 0.75, 0.12], at: [SPRING_AT.left[0], (SPRING_AT.left[1] + BEAM_Y) / 2, BACK] },
        { kind: "box", size: [0.25, 0.75, 0.12], at: [SPRING_AT.right[0], (SPRING_AT.right[1] + BEAM_Y) / 2, BACK] },
        // 撐銷插在從橫樑垂下的短柱上
        ...Object.values(PROP).map(([x, y]) => ({ kind: "box", size: [0.2, BEAM_Y - y + 0.1, 0.12], at: [x, (BEAM_Y + y - 0.1) / 2, BACK] })),
        // 橫樑兩端的立柱落到底板,底板接著齒輪軸承座的腳(推斷)
        ...POSTS.map((x) => ({ kind: "box", size: [0.25, BEAM_Y - BASE, 0.12], at: [x, (BEAM_Y + BASE) / 2, BACK] })),
        { kind: "box", size: [POSTS[1] - POSTS[0] + 0.5, 0.18, 0.6], at: [(POSTS[0] + POSTS[1]) / 2, BASE - 0.09, -0.45] },
      ],
    },
  ],
  // 動力重演(只放下左爪):只轉齒輪(順時針,左爪放行的方向);左爪鉸在銷上,彈簧把爪尖往齒輪壓,由齒頂起、越過後彈回
  replay: {
    from: -LANDING.left,
    to: -LANDING.left - 2 * PITCH,
    seconds: 12,
    free: { pawlLeft: { spring: -1, gravity: false } },
    expect: [
      { at: -LANDING.left - PITCH / 2, part: "pawlLeft", label: "齒沿斜面把左爪頂起" },
      { at: -LANDING.left - PITCH, part: "pawlLeft", label: "左爪落進下一個齒間" },
      { at: -LANDING.left - 2 * PITCH, part: "pawlLeft", label: "左爪再落進下一個齒間" },
    ],
  },
  // 主動量就是齒輪轉角(逆時針為正);各狀態只能往放行的方向轉,往回只能轉到爪落定的位置
  driver: {
    part: "gear",
    type: "rotation",
    initial: -LANDING.left,
    speed: 0.5,
    backstop: (theta, state = "left") => [state === "left" ? -Infinity : stopAt("right", theta), state === "right" ? Infinity : stopAt("left", theta)],
  },
  states: {
    options: [
      { id: "left", label: "只放下左爪(擋逆時針)", direction: -1 },
      { id: "right", label: "只放下右爪(擋順時針)" },
      { id: "both", label: "兩支都放下(兩個方向都擋住)", direction: 0 },
    ],
    initial: "left",
  },
  targets: ["pawlLeft", "pawlRight"], // 兩支擋爪
  view: { direction: [0.06, 0.05, 1] },
  pose(theta, state = "left") {
    const a = pawlAngles(theta, state);
    const spring = (which, angle) => {
      const p = PAWLS[which].pivot;
      const [x, y] = rot2(SPRING_ON[which], angle);
      return { points: [[...SPRING_AT[which], 0.0], [p[0] + x, p[1] + y, 0.0]], closed: false };
    };
    return {
      parts: {
        gear: { angle: theta },
        pawlLeft: { angle: a.left },
        pawlRight: { angle: a.right },
        propLeft: { visible: !DOWN[state].left },
        propRight: { visible: !DOWN[state].right },
      },
      paths: { springLeft: spring("left", a.left), springRight: spring("right", a.right) },
      readouts: [],
    };
  },
};
