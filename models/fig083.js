// 第 83 種:兩塊具棘齒的弧形板 C 固定在同一根搖臂軸 B 上,齒的方向相反,分別作用在水平棘輪 D 的前緣與後緣
// (原圖只畫出前面一塊)。桿 A 往復時搖臂軸來回擺動:往右擺時前板的齒推動 D 的前緣、後板被彈簧壓著、
// 齒沿 D 的齒背被頂起滑過;擺回來時換後板推動 D 的後緣、前板滑過。兩側的推動都使 D 朝同一方向轉
// (從上面看逆時針),得到近乎連續的旋轉。主動量是桿 A 的累計行程(以搖臂軸的擺角表示)。
//
// 齒形:D 的冠狀棘齒與弧形板的齒都是鋸齒,齒距相同(弧形板最低處的齒剛好嵌進 D 的齒縫);
// 推的一面陡、背面緩。弧形板以長孔套在軸上、由彈簧往下壓,滑過時被 D 的齒背頂起多少由兩排齒形算出。
// 一程先空走一點(板的齒比齒縫窄,留了餘隙)再推一個齒;滑過的板相對 D 走兩個多齒,在換向前落回齒縫。
// 立體化:弧形板立在 D 的前緣與後緣正上方(與輪緣齒同一圈),搖臂軸由 D 後方的立柱支承(深度是推斷)。
import { TAU, deg, Y, quatFromBasis, swing as swingAt } from "./kit.js";
import { shape, arcPoints, circle } from "./shapes.js";

const B = [0, 2.2, 0];
const D = { y: -0.4, radius: 2.0, width: 0.4, teeth: 24, ring: 1.75, face: 0.4, height: 0.3 };
const TOP = D.y + D.width / 2; // D 的齒面(齒根)高度
const PITCH = (D.ring * TAU) / D.teeth; // 齒距(在齒圈上量的弧長)
const STEEP = 0.1; // 每齒前 1/10 是陡的推面,其餘是緩的齒背
const CLEAR = 0.03; // 嵌合時弧形板齒與 D 齒之間的間隙
const R0 = B[1] - TOP - CLEAR; // 弧形板齒尖到軸 B 的距離
const SPAN = deg(38); // 弧形板齒弧的半角

/** 鋸齒的高度(週期 PITCH):陡升 STEEP,再緩降回 0 */
function saw(x) {
  const f = (((x / PITCH) % 1) + 1) % 1;
  return f < STEEP ? (D.height * f) / STEEP : D.height * (1 - (f - STEEP) / (1 - STEEP));
}
// 弧形板的齒在推的那一面比 D 的齒縫退後 BACKLASH(背面的斜面仍互相貼合):板隨搖臂擺動時推面跟著斜,
// 留了餘隙才不會擦到 D 的齒
const BACKLASH = 0.1;
// 一程先空走半個餘隙(推面靠上之前),再推一個齒距;滑過的那塊板因此在換向前就已落回齒縫。
// 擺角不大(±6.4°),板的推面跟著斜的量還在餘隙之內
const SWING = (PITCH + BACKLASH / 2) / R0;
const envelope = (x) => Math.max(saw(x), saw(x + BACKLASH));
export const swing = SWING;
export const toothAngle = TAU / D.teeth;

// D 的冠狀棘齒:每齒一塊鋸齒形的板,立在齒面上、沿徑向有 D.face 厚(局部 z 是輪軸)。
// 前緣(世界 +z)往 +x 對應局部角增加;齒形沿局部角先陡升再緩降
const crownTeeth = Array.from({ length: D.teeth }, (_, i) => {
  const step = TAU / D.teeth;
  const a = (i + 0.5) * step;
  const len = 2 * D.ring * Math.sin(step / 2);
  return {
    kind: "plate",
    shape: shape([[-len / 2, 0], [-len / 2 + STEEP * len, D.height], [len / 2, 0]]),
    thickness: D.face,
    at: [D.ring * Math.cos(a) * Math.cos(step / 2), D.ring * Math.sin(a) * Math.cos(step / 2), D.width / 2],
    rotation: quatFromBasis([-Math.sin(a), Math.cos(a), 0], [0, 0, 1], [Math.cos(a), Math.sin(a), 0]),
    accent: i === 0,
  };
});

// 弧形板(局部座標原點在軸 B,未擺動、未頂起):齒尖在 R0,齒形與 D 的齒互補;mirror = −1 是後板(齒向相反)。
// 前緣:板上局部角 φ 的齒在最低處時對到 D 前緣 x = R0·φ 的位置
const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? poly.reverse() : poly;
};
const SLOT = { radius: 0.16, depth: D.height + 0.08 }; // 套在軸上的長孔:板被頂起時軸在孔裡相對往下
function plateTeeth(mirror) {
  // 前板:板上 x = R0·φ 處的齒高是 envelope(x + PHASE),D 前緣在 x 處是 saw(x − ring·θ − ring·π/2);
  // ψ = −SWING/2、θ = 0 時兩者嵌著(之後 D 被推到哪裡由接觸算)。後板的齒形左右相反
  const PHASE = -R0 * (SWING / 2) - (D.ring * Math.PI) / 2;
  // 齒的折點(陡面的頭尾、齒根)與齒弧兩端
  const xs = [-R0 * SPAN, R0 * SPAN];
  for (let k = -60; k <= 60; k++) for (const e of [-BACKLASH, 0, BACKLASH]) for (const f of [0, STEEP]) xs.push(mirror * ((k + f) * PITCH + e) - PHASE);
  return xs
    .filter((x) => Math.abs(x) <= R0 * SPAN + 1e-9)
    .sort((a, b) => a - b)
    .map((x) => {
      const phi = x / R0;
      const r = R0 - envelope(mirror * (x + PHASE));
      return [r * Math.sin(phi), -r * Math.cos(phi)];
    });
}
function arcPlate(mirror) {
  const teeth = plateTeeth(mirror);
  const edge = (phi) => [(R0 - 0.35) * Math.sin(phi), -(R0 - 0.35) * Math.cos(phi)];
  const outline = ccw([[-0.24, 0.48], [0.24, 0.48], edge(SPAN), ...teeth.reverse(), edge(-SPAN)]);
  const slot = [...arcPoints(SLOT.radius, 0, Math.PI), ...arcPoints(SLOT.radius, Math.PI, TAU, 0, -SLOT.depth)].reverse();
  const windows = [
    [...arcPoints(0.8, deg(-118), deg(-96)), ...arcPoints(1.75, deg(-98), deg(-122))].reverse(),
    [...arcPoints(0.8, deg(-84), deg(-62)), ...arcPoints(1.75, deg(-58), deg(-82))].reverse(),
  ];
  return shape(outline, [slot, ...windows]);
}

// 齒形折線細分成取樣點(板的局部座標),算頂起量用
const SAMPLES = Object.fromEntries(
  [["front", 1], ["back", -1]].map(([key, mirror]) => {
    const line = plateTeeth(mirror);
    const pts = [];
    for (let i = 0; i + 1 < line.length; i++) {
      const [p, q] = [line[i], line[i + 1]];
      const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.015));
      for (let k = 0; k < n; k++) pts.push([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
    }
    return [key, pts.filter(([x]) => Math.abs(x) < 1.15)]; // 擺到 ±6.4° 時板上更外側的點都在齒圈之外
  }),
);

// 板的一面(z 固定)上,D 的齒圈所在的 x 範圍,以及 x 處對應到 D 上的方位角(查表,省掉逐點的 atan2)
const FACE_GRID = 0.002;
function faceOf(z) {
  const reach = Math.sqrt(Math.max(0, (D.ring + D.face / 2) ** 2 - z * z));
  const n = Math.ceil(reach / FACE_GRID);
  const angle = Float64Array.from({ length: 2 * n + 1 }, (_, i) => Math.atan2(-z, (i - n) * FACE_GRID));
  return { reach, n, angle };
}

// 板沿長孔被頂起 l 時(方向隨搖臂斜),板的齒形要整個在 D 的齒面之上:逐點比較板的正反兩面所在的那一圈 D 齒高
// (D 的齒在兩面看到的相位不同,中間夾著的不會更緊),迭代修正水平的偏移
function liftOf(points, faces, psi, theta, rounds = 3) {
  const [c, s] = [Math.cos(psi), Math.sin(psi)];
  let l = 0;
  for (let k = 0; k < rounds; k++) {
    let need = 0;
    for (const [px, py] of points) {
      const x = px * c - py * s - l * s;
      const y = B[1] + px * s + py * c;
      for (const { reach, n, angle } of faces) {
        if (x <= -reach || x >= reach) continue;
        const u = x / FACE_GRID + n;
        const i = Math.floor(u);
        const a = angle[i] + (angle[i + 1] - angle[i]) * (u - i);
        const top = TOP + saw(D.ring * (a - theta));
        need = Math.max(need, (top + 0.005 - y) / c);
      }
    }
    l = need;
  }
  return l;
}

const Z = { front: D.ring, back: -D.ring, post: D.ring + 0.17 };
const FACES = { front: [faceOf(Z.front - 0.06), faceOf(Z.front + 0.06)], back: [faceOf(Z.back - 0.06), faceOf(Z.back + 0.06)] };
const liftAt = (key, psi, theta, rounds) => liftOf(SAMPLES[key], FACES[key], psi, theta, rounds);

// 推的那塊板(前板在 ψ 增加時、後板在 ψ 減少時)壓在齒縫裡往前走,頂到 D 的推面就把 D 往前推:
// 每一步把 D 轉到剛好不被這塊板穿入;另一塊板沿長孔被 D 的齒背頂起多少也由接觸算。
// 從起點走兩個來回,第二個來回起每個來回都一樣(D 轉兩個齒):取第二個來回當作週期
const STEPS = 160; // 一個來回的取樣數
const { TABLE, TURN } = (() => {
  let theta = 0;
  let prev = -SWING / 2;
  const run = [];
  for (let i = 0; i <= 2 * STEPS; i++) {
    const psi = swingAt((2 * SWING * i) / STEPS, -SWING / 2, SWING / 2);
    const key = psi > prev ? "front" : psi < prev ? "back" : null;
    if (key && liftAt(key, prev, theta, 1) < 0.01) {
      // 從目前的位置往前每 0.1° 試一次,找到第一個不被穿入的轉角,再二分細修
      const step = deg(0.1);
      const hits = (t) => liftAt(key, psi, t, 1) > 0.002;
      let t = theta;
      for (let k = 0; k < 30 && hits(t); k++) t += step;
      if (t > theta && !hits(t)) {
        let [lo, hi] = [t - step, t];
        for (let k = 0; k < 6; k++) {
          const mid = (lo + hi) / 2;
          if (hits(mid)) lo = mid;
          else hi = mid;
        }
        theta = hi;
      }
    }
    prev = psi;
    run.push({ theta, front: liftAt("front", psi, theta, 2), back: liftAt("back", psi, theta, 2) });
  }
  // 每個來回推過整數個齒;逐步推開的微小誤差按比例攤掉,播久了才不會越差越多
  const table = run.slice(STEPS);
  const [t0, raw] = [table[0].theta, table[STEPS].theta - table[0].theta];
  const turn = Math.round(raw / (TAU / D.teeth)) * (TAU / D.teeth);
  return { TABLE: table.map((s) => ({ ...s, theta: t0 + ((s.theta - t0) * turn) / raw })), TURN: turn };
})();

function lookup(v) {
  const period = 2 * SWING;
  const k = Math.floor(v / period);
  const x = ((v - k * period) / period) * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { theta: k * TURN + a.theta + (b.theta - a.theta) * t, front: a.front + (b.front - a.front) * t, back: a.back + (b.back - a.back) * t };
}

/** 主動量 v:D 繞 +y 的轉角(從上面看逆時針為正,自起點) */
export const wheelAngle = (v) => lookup(v).theta - TABLE[0].theta;
/** 主動量 v 時兩塊弧形板沿長孔被 D 的齒背頂起的量(前板、後板;推的那塊嵌著,為 0) */
export function lifts(v) {
  const { front, back } = lookup(v);
  return { front, back };
}

const ARM = 1.05; // 搖臂(接桿 A、頂著彈簧)長
const rockPoint = (psi, [x, y], z) => [B[0] + x * Math.cos(psi) - y * Math.sin(psi), B[1] + x * Math.sin(psi) + y * Math.cos(psi), z];

const plate = (id, mirror, z) => ({ id, kind: "plate", center: [B[0], B[1], z], shape: arcPlate(mirror), thickness: 0.12, arrow: false });
// 搖臂:從軸往上的立柱(在板的外側),頂端的橫擔伸到板的正上方,彈簧在橫擔與板頂之間
const bracket = (z) => {
  const side = Math.sign(z);
  return [
    { kind: "box", size: [0.14, ARM, 0.1], at: [0, ARM / 2, z + side * 0.17] },
    { kind: "box", size: [0.3, 0.1, 0.32], at: [0, ARM, z + side * 0.06] },
  ];
};

export default {
  figure: 83,
  parts: [
    {
      id: "rock",
      kind: "group",
      center: B,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.14, length: 2 * Z.post + 0.8, at: [0, 0, -0.25] }, ...bracket(Z.front), ...bracket(Z.back)],
      label: "B",
      labelOffset: [0.35, 0.05, Z.front + 0.3],
    },
    plate("plateFront", 1, Z.front),
    plate("plateBack", -1, Z.back),
    { id: "labelC", kind: "group", label: "C", labelOffset: [0.5, B[1] - 1.3, Z.front + 0.1] },
    { id: "springFront", kind: "spring", radius: 0.09, coils: 6, wire: 0.025 },
    { id: "springBack", kind: "spring", radius: 0.09, coils: 6, wire: 0.025 },
    { id: "rodA", kind: "link", width: 0.1, thickness: 0.06, label: "A", labelOffset: [1.4, 0.3, 0] },
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      center: [0, D.y, 0],
      spin: D.radius,
      pieces: [
        { kind: "cylinder", radius: D.radius, length: D.width },
        { kind: "cylinder", radius: 0.35, length: D.width * 1.6 },
        { kind: "cylinder", radius: 0.12, length: 1.4, at: [0, 0, -0.8] },
        ...crownTeeth,
      ],
      label: "D",
      labelOffset: [-1.2, -0.65, 1.0],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 搖臂軸由 D 後方的立柱支承(長軸承套),底座伸到 D 的軸承下面
        { kind: "box", size: [0.3, B[1] + 1.85, 0.2], at: [0, (B[1] - 1.85) / 2, -Z.post - 0.42] },
        { kind: "cylinder", radius: 0.22, length: 0.4, at: [0, B[1], -Z.post - 0.42] },
        { kind: "box", size: [0.5, 0.2, Z.post + 0.62], at: [0, -1.95, -(Z.post + 0.62) / 2] },
        { kind: "cylinder", radius: 0.22, length: 0.3, axis: Y, at: [0, -1.7, 0] },
      ],
    },
  ],
  // 動力重演:只推搖臂軸;兩塊弧形板沿長孔滑動、由彈簧往下壓,D 靠摩擦定位,由兩塊板輪流推動
  replay: {
    free: {
      wheel: { hold: true, gravity: false },
      plateFront: { slide: [Math.sin(SWING / 2), Math.cos(SWING / 2), 0], on: "rock", spring: -1 },
      plateBack: { slide: [Math.sin(SWING / 2), Math.cos(SWING / 2), 0], on: "rock", spring: -1 },
    },
    expect: [{ part: "wheel", label: "搖臂軸一個來回,D 被推過的角度(兩個齒)" }],
  },
  driver: { part: "rock", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "wheel", // 近乎連續旋轉的棘輪 D
  view: { direction: [0.12, 0.1, 1], fov: 26 },
  pose(v) {
    const psi = swingAt(v, -SWING / 2, SWING / 2);
    const { front: lf, back: lb } = lifts(v);
    const up = [-Math.sin(psi), Math.cos(psi)];
    const plateAt = (l, z) => [B[0] + up[0] * l, B[1] + up[1] * l, z];
    const top = rockPoint(psi, [0, ARM], Z.front + 0.17);
    return {
      parts: {
        rock: { angle: psi },
        plateFront: { position: plateAt(lf, Z.front), angle: psi },
        plateBack: { position: plateAt(lb, Z.back), angle: psi },
        springFront: { from: rockPoint(psi, [0, ARM - 0.05], Z.front), to: rockPoint(psi, [0, 0.48 + lf], Z.front) },
        springBack: { from: rockPoint(psi, [0, ARM - 0.05], Z.back), to: rockPoint(psi, [0, 0.48 + lb], Z.back) },
        wheel: { angle: lookup(v).theta },
        rodA: { from: top, to: [top[0] + 2.6, top[1] - 0.6, top[2]] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——搖臂軸一個來回 D 只轉了約一齒(模型兩齒)。推的那塊板推面是沿半徑的,隨搖臂擺動會斜,推 D 時板沿長孔被往上擠;重演的彈簧力(板重的 3 倍)壓不住、又要對抗 D 的定位阻力,推的板滑過一部分,滑過的板也把 D 往回拖。實際機構要把推面做成倒鉤、或用更強的彈簧;模型的齒形用高度函數表示,做不出倒鉤(列入待確認清單)" },
  ],
};
