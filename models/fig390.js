// 第 390 種:把擺動轉成旋轉。半圓形部件 A 接在一根以 a 為支點的槓桿上,也接著兩條皮帶 C、D 的末端;兩條皮帶繞過飛輪 B
// 軸上的兩個鬆套皮帶輪,C 是開口的、D 是交叉的。兩個皮帶輪上都有棘爪,與固定在飛輪軸上的兩個棘輪咬合。A 往一個方向擺時,
// 一個皮帶輪的棘爪帶動棘輪;往另一個方向擺時換另一個,飛輪軸因此連續朝同一方向轉。主動件是部件 A(累計擺動)。
// 推斷:皮帶輪的半徑與擺幅;兩個皮帶輪前後並排。
// 皮帶(2026-10-20 改):兩條皮帶的兩端都固定在 A 的弧上,從端頭沿 A 的弧繞到切點、沿公切線直下到皮帶輪、沿輪緣繞過、
// 再沿另一條公切線上去、沿 A 的弧繞到另一端(C 是外公切線、繞過皮帶輪的下半;D 是內公切線、兩段在中間交叉、
// 繞過皮帶輪的大半圈)。A 的弧以 a 為圓心,切點在空間裡不動,A 擺過 Δ 時一側的弧上多繞 (ARC + BELT)·Δ、另一側少繞一樣多,
// 皮帶長度不變,皮帶輪轉 (ARC + BELT)·Δ / (PULLEY + BELT)(皮帶的中心線半徑,不打滑)。A 的弧做寬,兩條皮帶都繞在上面。
// 機架(推斷):A 的樞軸座接在上方的橫梁下,橫梁由兩根立柱撐在地上;飛輪軸往後伸,穿過地上的兩個軸承座(原圖只畫到軸)。
//
// 由接觸算(2026-10-07 複查,原本沒有畫棘爪,飛輪照「哪個皮帶輪往前轉就跟著它」的進度表轉):
// - 兩個棘輪(鋸齒:推的一面陡、背面斜)固定在飛輪軸上,各在一個皮帶輪的後面一層;每個皮帶輪的背面伸出一根銷,
//   銷上鉸著一個棘爪,由小彈簧壓著搭在棘輪上(彈簧沒畫;皮帶輪會轉,棘爪不能靠自重)。
// - 皮帶輪往前(逆時針)轉時,爪尖頂著棘輪的陡面把飛輪帶著走;往回轉時爪尖沿斜背滑過,越過齒尖後被彈簧壓進下一齒
//   (加速落下)。兩個皮帶輪一個往前、一個往回,所以飛輪一直被其中一個帶著;換向時爪尖要先落進齒裡才推得動,
//   中間有一小段空程。飛輪轉多少全由爪尖與棘齒相碰決定;每個來回推過整數個齒。
import { TAU, deg, swingPhase } from "./kit.js";
import { ratchetShape, shape, circle, arcPoints } from "./shapes.js";
import { ratchetRadius } from "./ratchets.js";
import { pedestal } from "./supports.js";

const A_PIVOT = [0, 2.0, 0];
const ARC = 1.8; // 半圓部件的半徑(皮帶繞在它的外緣)
const WHEEL = { center: [0.2, -0.75, 0], r: 1.55 };
const PULLEY = 0.45;
const BELT = 0.05; // 皮帶的半徑(圓帶;中心線離輪緣、弧面這麼遠)
const RA = ARC + BELT; // A 上皮帶中心線的半徑
const RP = PULLEY + BELT; // 皮帶輪上皮帶中心線的半徑
export const SWING = deg(19.5); // 擺幅:每個來回剛好推過整數個齒(推斷)
const RATCHET = { teeth: 14, outer: 0.38, inner: 0.28, dir: 1 };
export const PITCH = TAU / RATCHET.teeth;
const PAWL = { at: 0.44, angle: deg(-90), len: 0.2 }; // 棘爪的銷在皮帶輪局部的位置(半徑、方位)與爪長
const Z = { C: 0, D: 0.3 }; // 兩個棘輪(與棘爪)那一層
const SHAFT = { r: 0.08, z0: -1.5, z1: 0.55 }; // 飛輪軸
const FLOOR = -2.5;

/** 累計擺動 v → A 的角度、兩個皮帶輪的轉角(開口皮帶 C 與 A 同向,交叉皮帶 D 反向) */
function pulleys(v) {
  const { at } = swingPhase(v, -SWING, SWING);
  const strap = ((at + SWING) * RA) / RP; // A 擺過的弧長帶動皮帶輪(皮帶不打滑)
  return { a: at, c: strap, d: -strap };
}

// 棘爪的銷(世界座標 2D)
const pinAt = (pulley) => [WHEEL.center[0] + PAWL.at * Math.cos(PAWL.angle + pulley), WHEEL.center[1] + PAWL.at * Math.sin(PAWL.angle + pulley)];
// 爪的外形(銷在原點,爪身沿局部 +x,爪尖是尖的)與爪身上取來量離齒面多遠的點
const PAWL_OUTLINE = [[-0.04, -0.03], [PAWL.len - 0.06, -0.03], [PAWL.len, 0], [PAWL.len - 0.06, 0.03], [-0.04, 0.03]];
const PROBES = [[PAWL.len, 0], ...Array.from({ length: 8 }, (_, i) => { const b = (i + 1) * 0.025; const h = 0.03 * Math.min(1, b / 0.06); return [[PAWL.len - b, -h], [PAWL.len - b, h]]; }).flat()];
// 爪(整個外形上取的點)離齒面多遠(負的是壓進去);留一點間隙,探測點之間的邊不會切到齒尖
const gapOf = (pulley, psi, fly) => {
  const pin = pinAt(pulley);
  const [c, s] = [Math.cos(psi), Math.sin(psi)];
  let g = Infinity;
  for (const [px, py] of PROBES) {
    const x = pin[0] + px * c - py * s - WHEEL.center[0];
    const y = pin[1] + px * s + py * c - WHEEL.center[1];
    g = Math.min(g, Math.hypot(x, y) - ratchetRadius(RATCHET, Math.atan2(y, x) - fly));
  }
  return g - 0.006;
};

// 依接觸逐步算。每一小步:
// (1) 往前轉的皮帶輪帶著爪撞上陡面:飛輪被推到陡面剛好貼著爪。銷在爪尖的外側(離輪心較遠),
//     陡面頂回來的力把爪壓向輪心,爪鎖得住、不會被翻開。
// (2) 爪被齒面壓進去(往回轉時斜背頂上來)就往外讓開;沒碰到就被彈簧往裡壓,越壓越快,碰到齒面就停。
const SAMPLES = 1200; // 一個來回的步數
const PERIOD = 4 * SWING;
const SPRING = 400; // 彈簧把爪壓下去的角加速度(主動量的單位)
const FOLLOW = 0.02; // 每一步至少往裡試這麼多(爪貼著往下斜的齒面時跟得上)
function simulate(cycles) {
  let fly = 0;
  const psi = { c: PAWL.angle + Math.PI / 2, d: PAWL.angle + Math.PI / 2 }; // 爪先朝切線方向,再壓下去
  const w = { c: 0, d: 0 };
  const dv = PERIOD / SAMPLES;
  const run = [];
  const prev = pulleys(0);
  for (let i = 0; i <= cycles * SAMPLES; i++) {
    const p = pulleys(i * dv);
    for (const key of ["c", "d"]) {
      const pulley = p[key];
      // (1) 皮帶輪往前轉、爪壓進齒裡,而且把飛輪往前轉一點就讓得開(頂在陡面上):飛輪被推到剛好貼著
      if (pulley > prev[key] && gapOf(pulley, psi[key], fly) < 0) {
        let d = 0;
        while (gapOf(pulley, psi[key], fly + d) < 0 && d < 0.3 * PITCH) d += PITCH / 400;
        if (d < 0.3 * PITCH) {
          let [lo, hi] = [Math.max(0, d - PITCH / 400), d];
          for (let j = 0; j < 30; j++) {
            const mid = (lo + hi) / 2;
            if (gapOf(pulley, psi[key], fly + mid) >= 0) hi = mid;
            else lo = mid;
          }
          fly += hi;
        }
      }
      // (2)
      if (gapOf(pulley, psi[key], fly) < 0) {
        let d = 0;
        while (gapOf(pulley, psi[key] - d, fly) < 0 && d < 1) d += 0.002;
        let [lo, hi] = [psi[key] - d, psi[key] - d + 0.002];
        for (let j = 0; j < 30; j++) {
          const mid = (lo + hi) / 2;
          if (gapOf(pulley, mid, fly) >= 0) lo = mid;
          else hi = mid;
        }
        psi[key] = lo;
        w[key] = 0;
      } else {
        w[key] += SPRING * dv;
        const span = Math.max(w[key] * dv, FOLLOW); // 貼著齒面時跟著齒面走;離開齒面才越壓越快
        const n = Math.max(1, Math.ceil(span / 0.004));
        let next = psi[key] + span;
        for (let j = 1; j <= n; j++) {
          const q = psi[key] + (span * j) / n;
          if (gapOf(pulley, q, fly) < 0) {
            let [lo, hi] = [psi[key] + (span * (j - 1)) / n, q];
            for (let m = 0; m < 30; m++) {
              const mid = (lo + hi) / 2;
              if (gapOf(pulley, mid, fly) >= 0) lo = mid;
              else hi = mid;
            }
            next = lo;
            w[key] = 0;
            break;
          }
        }
        psi[key] = next;
      }
    }
    [prev.c, prev.d] = [p.c, p.d];
    run.push({ fly, c: psi.c, d: psi.d });
  }
  return run;
}

// 先空走兩個來回,取第三個來回當作週期;每個來回推過整數個齒,逐步推的微小誤差按比例攤掉
const { TABLE, TURN } = (() => {
  const run = simulate(3);
  const table = run.slice(2 * SAMPLES);
  const [f0, raw] = [table[0].fly, table[SAMPLES].fly - table[0].fly];
  const turn = Math.round(raw / PITCH) * PITCH;
  return { TABLE: table.map((s) => ({ ...s, fly: f0 + ((s.fly - f0) * turn) / raw })), TURN: turn };
})();
/** 一個來回飛輪轉過的角度(整數個齒) */
export const perCycle = TURN;

function lookup(v) {
  const k = Math.floor(v / PERIOD);
  const x = ((v - k * PERIOD) / PERIOD) * SAMPLES;
  const i = Math.max(0, Math.min(SAMPLES - 1, Math.floor(x)));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  const lerp = (key) => a[key] + (b[key] - a[key]) * t;
  return { fly: k * TURN + lerp("fly") - TABLE[0].fly, c: lerp("c"), d: lerp("d"), absFly: k * TURN + lerp("fly") };
}

/** 累計擺動 v → A 的角度、兩個皮帶輪的轉角、飛輪的轉角(只朝一個方向)、兩個棘爪的角度 */
export function oscillation(v) {
  const p = pulleys(v);
  const s = lookup(v);
  return { a: p.a, c: p.c, d: p.d, fly: s.fly, pawlC: s.c, pawlD: s.d, absFly: s.absFly };
}

/** 檢查用:爪尖離棘輪齒面多遠(負的是壓進去) */
export function pawlGap(v, key) {
  const o = oscillation(v);
  return gapOf(key === "c" ? o.c : o.d, key === "c" ? o.pawlC : o.pawlD, o.absFly) + 0.006;
}

// 兩條皮帶的公切線:A 的弧(圓心 A_PIVOT、半徑 RA)與皮帶輪(圓心 WHEEL.center、半徑 RP)。
// 切線 m·x = k(m 單位向量):m·A − k = RA、m·P − k = s·RP;外公切線 s = +1(C)、內公切線 s = −1(D)。
// 回傳兩個切點的方位角(A 上、皮帶輪上);side 選左右兩條之一
function tangent(s, side) {
  const d = [A_PIVOT[0] - WHEEL.center[0], A_PIVOT[1] - WHEEL.center[1]];
  const L = Math.hypot(...d);
  const [u, n] = [[d[0] / L, d[1] / L], [-d[1] / L, d[0] / L]];
  const c = (RA - s * RP) / L;
  const q = side * Math.sqrt(1 - c * c);
  const m = [c * u[0] + q * n[0], c * u[1] + q * n[1]];
  return { onA: Math.atan2(-m[1], -m[0]), onPulley: Math.atan2(-s * m[1], -s * m[0]) };
}
const TAN = { cLeft: tangent(1, -1), cRight: tangent(1, 1), dLeft: tangent(-1, -1), dRight: tangent(-1, 1) };
// 皮帶的兩端在 A 局部的方位角:擺到兩頭,端頭到切點之間的弧上都還繞著一段(至少約 5°)
const ENDS = { c: [deg(189), deg(359.5)], d: [deg(205), deg(340)] };
const BELT_SAMPLES = { onA: 12, onPulley: 32 };
const arcOf = (c, r, a0, a1, n, z) => Array.from({ length: n + 1 }, (_, i) => [c[0] + r * Math.cos(a0 + ((a1 - a0) * i) / n), c[1] + r * Math.sin(a0 + ((a1 - a0) * i) / n), z]);
const norm2 = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** A 轉到 a 時皮帶的路徑:A 上左端 → 左切點 →(直線)→ 皮帶輪 → 繞輪緣 →(直線)→ A 上右切點 → 右端 */
function beltPath(key, a, z) {
  const [left, right] = key === "c" ? [TAN.cLeft, TAN.cRight] : [TAN.dLeft, TAN.dRight];
  const [e0, e1] = ENDS[key].map((e) => e + a);
  const toLeft = e0 + norm2(left.onA - e0); // A 上從左端往逆時針繞到左切點
  const fromRight = right.onA + norm2(e1 - right.onA);
  // 皮帶輪上:C 從左切點逆時針繞過下半到右切點;D 從右上的切點順時針繞過大半圈到左上的切點
  const p0 = left.onPulley;
  let p1 = right.onPulley;
  if (key === "c") while (p1 < p0) p1 += TAU;
  else while (p1 > p0) p1 -= TAU;
  return [
    ...arcOf(A_PIVOT, RA, e0, toLeft, BELT_SAMPLES.onA, z),
    ...arcOf(WHEEL.center, RP, p0, p1, BELT_SAMPLES.onPulley, z),
    ...arcOf(A_PIVOT, RA, right.onA, fromRight, BELT_SAMPLES.onA, z),
  ];
}

// 棘爪:銷在原點,爪身沿局部 +x,爪尖是尖的
const pawlShape = shape(PAWL_OUTLINE);
// 輻條從輪轂伸到輪緣(輪緣的孔 0.4)
const SPOKES = [deg(30), deg(120)].map((angle) => ({ kind: "box", size: [0.81, 0.05, 0.04], angle }));
const pin = (z) => ({ kind: "cylinder", radius: 0.025, length: 0.22, at: [PAWL.at * Math.cos(PAWL.angle), PAWL.at * Math.sin(PAWL.angle), z] });

export default {
  figure: 390,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 上方的橫梁、A 的樞軸座(貼在橫梁下)、撐著橫梁的兩根立柱與地上的橫木(推斷)
        { kind: "box", size: [5.0, 0.15, 0.4], at: [0, A_PIVOT[1] + 0.15 + 0.075, -0.3] },
        { kind: "cylinder", radius: 0.15, length: 0.5, at: A_PIVOT },
        { kind: "box", size: [0.15, A_PIVOT[1] + 0.15 - FLOOR, 0.4], at: [-2.4, (A_PIVOT[1] + 0.15 + FLOOR) / 2, -0.3] },
        { kind: "box", size: [0.15, A_PIVOT[1] + 0.15 - FLOOR, 0.4], at: [2.4, (A_PIVOT[1] + 0.15 + FLOOR) / 2, -0.3] },
        { kind: "box", size: [5.0, 0.18, 0.4], at: [0, FLOOR - 0.09, -0.3] },
        // 飛輪軸的兩個軸承座,在飛輪後面
        ...pedestal({ at: [WHEEL.center[0], WHEEL.center[1]], z: -0.8, bore: SHAFT.r, floor: FLOOR }),
        ...pedestal({ at: [WHEEL.center[0], WHEEL.center[1]], z: -1.3, bore: SHAFT.r, floor: FLOOR }),
      ],
    },
    {
      id: "partA",
      kind: "group",
      center: A_PIVOT,
      arrow: false,
      label: "A",
      labelOffset: [1.75, -0.6, 0.3],
      // 弧做寬(z −0.1..0.5),兩條皮帶都繞在它的外緣上
      pieces: [{ kind: "plate", shape: shape([...arcPoints(ARC, deg(180), deg(360)), ...arcPoints(ARC - 0.18, deg(360), deg(180))]), thickness: 0.6, at: [0, 0, 0.2] }, { kind: "box", size: [2 * ARC, 0.12, 0.15] }],
    },
    { id: "labela", kind: "group", center: A_PIVOT, label: "a", labelOffset: [0, 0.4, 0.3] },
    {
      id: "flywheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.r,
      label: "B",
      labelOffset: [-1.1, -1.0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.r), [circle(WHEEL.r - 0.2).reverse()]), thickness: 0.25, at: [0, 0, -0.45] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [2 * WHEEL.r - 0.3, 0.12, 0.1], at: [0, 0, -0.45], angle: (i * Math.PI) / 3 })),
        { kind: "plate", shape: ratchetShape(RATCHET), thickness: 0.08, at: [0, 0, Z.C] },
        { kind: "plate", shape: ratchetShape(RATCHET), thickness: 0.08, at: [0, 0, Z.D] },
        { kind: "cylinder", radius: SHAFT.r, length: SHAFT.z1 - SHAFT.z0, at: [0, 0, (SHAFT.z0 + SHAFT.z1) / 2] }, // 往後伸進兩個軸承座
      ],
    },
    // 兩個皮帶輪鬆套在軸上(輪轂、輻條),背面伸出一根銷鉸著棘爪
    { id: "pulleyC", kind: "group", center: [WHEEL.center[0], WHEEL.center[1], 0.12], spin: PULLEY, label: "C", labelOffset: [0.9, 0.2, 0.3], pieces: [{ kind: "cylinder", radius: PULLEY, inner: 0.4, length: 0.12, mark: true }, { kind: "cylinder", radius: 0.14, inner: 0.08, length: 0.1 }, ...SPOKES, pin(-0.1)] },
    { id: "pulleyD", kind: "group", center: [WHEEL.center[0], WHEEL.center[1], 0.42], spin: PULLEY, label: "D", labelOffset: [-0.6, 0.55, 0.3], pieces: [{ kind: "cylinder", radius: PULLEY, inner: 0.4, length: 0.12, mark: true }, { kind: "cylinder", radius: 0.14, inner: 0.08, length: 0.1 }, ...SPOKES, pin(-0.1)] },
    { id: "pawlC", kind: "plate", shape: pawlShape, thickness: 0.06, arrow: false },
    { id: "pawlD", kind: "plate", shape: pawlShape, thickness: 0.06, arrow: false },
    { id: "strapC", kind: "belt" },
    { id: "strapD", kind: "belt" },
  ],
  // 動力重演:只推部件 A(皮帶與皮帶輪照模型走);兩個棘爪鉸在皮帶輪的銷上、由彈簧壓向棘輪,飛輪只被棘爪推動
  replay: {
    to: 3 * PERIOD,
    seconds: 30,
    free: {
      // 爪很輕,彈簧的力矩會讓它一下子轉過頭;樞軸的轉角限在模型裡爪相對皮帶輪擺動的範圍(再寬一點)
      pawlC: { pivot: [...pinAt(0), Z.C], on: "pulleyC", spring: 1, gravity: false, limits: [-0.3, 0.45] },
      pawlD: { pivot: [...pinAt(0), Z.D], on: "pulleyD", spring: 1, gravity: false, limits: [-0.35, 0.4] },
      flywheel: { pivot: WHEEL.center, gravity: false },
    },
    ignore: [["flywheel", "pulleyC"], ["flywheel", "pulleyD"], ["flywheel", "frame"]],
    // 容許誤差放寬到兩、三個齒距:重演裡的爪很小很輕,換向後被彈簧壓回齒裡要多花一點時間,每次換向比模型多一小段空程
    // (三個來回累計約 7%);飛輪由兩個爪輪流推、一直朝同一方向轉,這件事本身不受影響
    expect: [
      { at: PERIOD / 2, part: "flywheel", label: "A 往一個方向擺,一個皮帶輪的棘爪帶動棘輪", quote: "當部件 A 朝某一方向轉動時,其中一個棘爪會作用於其棘輪上", tolerance: 2 * PITCH },
      { at: PERIOD, part: "flywheel", label: "A 擺回來,換另一個棘爪帶動,飛輪仍朝同一方向轉", quote: "當該部件朝另一方向轉動時,另一個棘爪便會作用", tolerance: 2 * PITCH },
      { part: "flywheel", label: "三個來回,飛輪連續朝同一方向轉", quote: "藉此獲得該軸的連續旋轉運動", tolerance: 3 * PITCH },
    ],
  },
  driver: { part: "partA", type: "rotation", cycle: [-SWING, SWING] },
  target: "flywheel", // 連續同向轉的飛輪
  view: { direction: [0.15, 0.08, 1] },
  pose(v) {
    const o = oscillation(v);
    return {
      parts: {
        partA: { angle: o.a },
        pulleyC: { angle: o.c },
        pulleyD: { angle: o.d },
        flywheel: { angle: o.absFly }, // 逐步算出的絕對轉角(和棘爪的位置對得上)
        pawlC: { position: [...pinAt(o.c), Z.C], angle: o.pawlC },
        pawlD: { position: [...pinAt(o.d), Z.D], angle: o.pawlD },
      },
      paths: {
        // 兩端固定在 A 上:路徑的起點就是皮帶的端頭,離起點的弧長就是材料座標(記號跟著皮帶走,不用另給相位)
        strapC: { points: beltPath("c", o.a, 0.12), closed: false },
        strapD: { points: beltPath("d", o.a, 0.42), closed: false },
      },
      readouts: [],
    };
  },
};

// 測試用
export const geometry = { A_PIVOT, ARC, PULLEY, BELT };
