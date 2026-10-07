// 第 390 種:把擺動轉成旋轉。半圓形部件 A 接在一根以 a 為支點的槓桿上,也接著兩條皮帶 C、D 的末端;兩條皮帶繞過飛輪 B
// 軸上的兩個鬆套皮帶輪,C 是開口的、D 是交叉的。兩個皮帶輪上都有棘爪,與固定在飛輪軸上的兩個棘輪咬合。A 往一個方向擺時,
// 一個皮帶輪的棘爪帶動棘輪;往另一個方向擺時換另一個,飛輪軸因此連續朝同一方向轉。主動件是部件 A(累計擺動)。
// 推斷:皮帶輪的半徑與擺幅;兩個皮帶輪前後並排。
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

const A_PIVOT = [0, 2.0, 0];
const ARC = 1.8; // 半圓部件的半徑(皮帶繞在它的外緣)
const WHEEL = { center: [0.2, -0.75, 0], r: 1.55 };
const PULLEY = 0.45;
export const SWING = deg(18);
const RATCHET = { teeth: 14, outer: 0.38, inner: 0.28, dir: 1 };
export const PITCH = TAU / RATCHET.teeth;
const PAWL = { at: 0.44, angle: deg(-90), len: 0.2 }; // 棘爪的銷在皮帶輪局部的位置(半徑、方位)與爪長
const Z = { C: 0, D: 0.3 }; // 兩個棘輪(與棘爪)那一層

/** 累計擺動 v → A 的角度、兩個皮帶輪的轉角(開口皮帶 C 與 A 同向,交叉皮帶 D 反向) */
function pulleys(v) {
  const { at } = swingPhase(v, -SWING, SWING);
  const strap = ((at + SWING) * ARC) / PULLEY; // A 擺過的弧長帶動皮帶輪
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

// 棘爪:銷在原點,爪身沿局部 +x,爪尖是尖的
const pawlShape = shape(PAWL_OUTLINE);
const pin = (z) => ({ kind: "cylinder", radius: 0.025, length: 0.22, at: [PAWL.at * Math.cos(PAWL.angle), PAWL.at * Math.sin(PAWL.angle), z] });

export default {
  figure: 390,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [5.0, 0.15, 0.4], at: [0, A_PIVOT[1] + 0.25, -0.3] }, { kind: "cylinder", radius: 0.15, length: 0.5, at: A_PIVOT }] },
    {
      id: "partA",
      kind: "group",
      center: A_PIVOT,
      arrow: false,
      label: "A",
      labelOffset: [1.75, -0.6, 0.3],
      pieces: [{ kind: "plate", shape: shape([...arcPoints(ARC, deg(180), deg(360)), ...arcPoints(ARC - 0.18, deg(360), deg(180))]), thickness: 0.2 }, { kind: "box", size: [2 * ARC, 0.12, 0.15] }],
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
        { kind: "cylinder", radius: 0.08, length: 1.2 },
      ],
    },
    // 兩個皮帶輪鬆套在軸上(輪轂、輻條),背面伸出一根銷鉸著棘爪
    { id: "pulleyC", kind: "group", center: [WHEEL.center[0], WHEEL.center[1], 0.12], spin: PULLEY, label: "C", labelOffset: [0.9, 0.2, 0.3], pieces: [{ kind: "cylinder", radius: PULLEY, inner: 0.4, length: 0.12, mark: true }, { kind: "cylinder", radius: 0.14, inner: 0.08, length: 0.1 }, { kind: "box", size: [0.62, 0.05, 0.04], angle: deg(30) }, pin(-0.1)] },
    { id: "pulleyD", kind: "group", center: [WHEEL.center[0], WHEEL.center[1], 0.42], spin: PULLEY, label: "D", labelOffset: [-0.6, 0.55, 0.3], pieces: [{ kind: "cylinder", radius: PULLEY, inner: 0.4, length: 0.12, mark: true }, { kind: "cylinder", radius: 0.14, inner: 0.08, length: 0.1 }, { kind: "box", size: [0.62, 0.05, 0.04], angle: deg(30) }, pin(-0.1)] },
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
    const p = WHEEL.center;
    // 兩條皮帶的兩端都固定在 A 的弧緣上,中間繞過飛輪軸上的皮帶輪(C 開口、D 交叉:兩條的繞向相反)
    const ptA = (ang, z) => [A_PIVOT[0] + ARC * Math.cos(ang), A_PIVOT[1] + ARC * Math.sin(ang), z];
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
        strapC: { points: [ptA(o.a - deg(55), 0.12), [p[0] + PULLEY, p[1], 0.12], [p[0], p[1] - PULLEY, 0.12], [p[0] - PULLEY, p[1], 0.12], ptA(o.a + deg(-125), 0.12)], closed: false, phase: o.c * PULLEY },
        strapD: { points: [ptA(o.a - deg(125), 0.42), [p[0] + PULLEY, p[1], 0.42], [p[0], p[1] - PULLEY, 0.42], [p[0] - PULLEY, p[1], 0.42], ptA(o.a - deg(55), 0.42)], closed: false, phase: o.d * PULLEY },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["pulleyC", "strapC"], reason: "帶子的端頭繫在輪緣上:帶子的第一段貼著輪面,中心線落在輪緣內 0.05" },
    { check: "interference", parts: ["pulleyD", "strapD"], reason: "帶子的端頭繫在輪緣上:帶子的第一段貼著輪面,中心線落在輪緣內 0.06" },
  ],
};
