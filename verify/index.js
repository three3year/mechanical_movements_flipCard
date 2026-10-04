// 實體驗證(維護者工具,見 CONTEXT.md 與 ADR-0003):給一份模型定義,回傳一份問題清單。
// 三項檢查:干涉、憑空連動、動力重演;模型定義裡的豁免(waivers)比對後標在問題上。
// 模型本身仍依幾何關係連動;這裡只把模型算出的姿勢擺進物理引擎檢查,結果不回饋到模型。
import { Scene, axleIn, sameLine, describe } from "./scene.js";
import { sampleValues, statesOf, boundsOf } from "./sampling.js";
import { replay } from "./replay.js";

/** 全書共用的預設值;容許值是貼合誤差,不逐模型調 */
export const DEFAULTS = {
  samples: 96, // 每個狀態取樣的姿勢數
  tolerance: 0.03, // 穿入深度超過這個才算干涉(簡化齒形的齒頂、貼合面的誤差在這以內)
  gap: 0.03, // 兩個零件的間隙在這以內算相連
  reach: 1, // 憑空連動時,往外找最近實體的距離上限
  checks: ["interference", "unsupported", "replay"],
};

export const CHECK_NAMES = { interference: "干涉", unsupported: "憑空連動", replay: "動力重演", "stale-waiver": "過時的豁免" };

/**
 * 驗證一個模型。回傳問題清單,每個問題:
 * { check, figure, parts, value(主動量), state, severity(穿入深度或間隙), count(發生的取樣數), message, waived?(豁免的原因) }
 */
export function verifyModel(def, options = {}) {
  const opt = { ...DEFAULTS, ...options };
  const findings = [];
  const scene = new Scene(def);
  try {
    if (opt.checks.includes("interference") || opt.checks.includes("unsupported")) findings.push(...staticChecks(def, scene, opt));
  } finally {
    scene.dispose();
  }
  if (opt.checks.includes("replay") && def.replay) findings.push(...replay(def));
  return applyWaivers(def, mergeStates(findings), opt);
}

// 同一個問題在好幾個狀態都出現時併成一個:留最嚴重的那個狀態,次數相加
function mergeStates(findings) {
  const merged = new Map();
  for (const f of findings) {
    const key = `${f.check}|${f.parts.join("|")}|${f.check === "replay" ? f.value : ""}`; // 動力重演:每個預期事件各一項
    const g = merged.get(key);
    if (!g) merged.set(key, { ...f, states: [f.state] });
    else {
      const worse = f.check === "interference" ? f.severity > g.severity : false;
      const states = [...g.states, f.state];
      const count = g.count + f.count;
      if (worse) Object.assign(g, f);
      Object.assign(g, { states, count });
    }
  }
  return [...merged.values()].map(({ states, ...f }) => (states.length > 1 ? { ...f, message: `${f.message}〔共 ${states.length} 個狀態〕` } : f));
}

/** 沒有被豁免的問題(含過時的豁免);指令以這份清單是否為空決定成敗 */
export const unwaived = (findings) => findings.filter((f) => !f.waived);

const fmt = (v) => (Math.abs(v) < 1e-9 ? "0" : v.toFixed(2));
const at = (value, state) => `主動量 ${fmt(value)}${state != null ? `、狀態 ${state}` : ""}`;

// 兩塊要沿哪個方向才分得開(報告裡附上,修的時候知道該往哪邊挪)
const along = (n) => (n ? `,沿〔${[n.x, n.y, n.z].map((x) => (Math.abs(x) < 0.05 ? "0" : x.toFixed(1))).join(", ")}〕分開` : "");

// ── 姿勢有沒有在動 ─────────────────────────

const differs = (a, b) => a.length !== b.length || a.some((x, i) => Math.abs(x - b[i]) > 1e-9);

function partMoving(a = {}, b = {}) {
  if (Math.abs((a.angle ?? 0) - (b.angle ?? 0)) > 1e-9) return true;
  for (const key of ["position", "rotation", "from", "to"]) {
    if (!a[key] !== !b[key]) return true;
    if (a[key] && differs(a[key], b[key])) return true;
  }
  return false;
}

function pathMoving(a, b) {
  if (!a || !b) return false;
  if (Math.abs((a.phase ?? 0) - (b.phase ?? 0)) > 1e-9) return true;
  return a.points.length !== b.points.length || a.points.some((p, i) => differs(p, b.points[i]));
}

// ── 干涉與憑空連動 ─────────────────────────

function staticChecks(def, scene, opt) {
  const findings = [];
  const d = def.driver;
  const values = sampleValues(d, opt.samples);
  const bounds = boundsOf(d);
  const probe = (values.length > 1 ? Math.abs(values[1] - values[0]) : 1) / 40;
  const sources = new Set(d.type === "virtual" ? [] : [d.part, ...(d.grips ?? [])]);
  for (const id of def.powered ?? []) sources.add(id);
  const entries = scene.entries;
  const doInterference = opt.checks.includes("interference");
  const doUnsupported = opt.checks.includes("unsupported");
  const prediction = Math.max(opt.gap, 0);

  // 有沒有相對運動、軸是不是裝在孔裡,要看過所有狀態才知道(某個狀態下整個機構可能都不動)
  const holes = new Map(); // 圓柱(或球)凸塊 → 它在對方座標裡的軸線是否始終是同一條(裝在孔裡)
  const placed = []; // 每個取樣姿勢下各零件的位置(判斷兩個零件之間有沒有相對運動)
  const perState = [];
  for (const state of statesOf(def)) {
    const cache = new Map(); // 兩個都沒動過的零件,沿用上一個姿勢的結果
    const overlaps = new Map(); // "a×b" → { parts, poses: [{ value, depth, pins }] }
    perState.push({ state, overlaps });
    const motion = new Map(); // id → { moved, touched, value, links }(會動的零件)
    let first = true;
    for (const value of values) {
      const pose = def.pose(value, state);
      scene.apply(pose);
      placed.push(new Map(scene.solids.map((e) => [e.id, e.object.matrixWorld.clone()])));
      // 在動的零件:主動量再走一小步,姿勢有變
      let next = value + probe;
      if (bounds && next > bounds[1]) next = value - probe;
      const ahead = def.pose(next, state);
      const moving = new Set();
      for (const e of entries) {
        if (!e.visible || !e.pieces.length) continue; // 沒有形體的零件(只有標籤的空群組)不算
        if (e.path ? pathMoving(pose.paths?.[e.id], ahead.paths?.[e.id]) : partMoving(pose.parts[e.id], ahead.parts[e.id])) moving.add(e.id);
      }
      const edges = new Map(entries.map((e) => [e.id, []]));
      for (let i = 0; i < entries.length; i++) {
        const a = entries[i];
        if (!a.visible) continue;
        for (let j = i + 1; j < entries.length; j++) {
          const b = entries[j];
          if (!b.visible) continue;
          const key = `${a.id}×${b.id}`;
          let hit = !first && !a.changed && !b.changed ? cache.get(key) : undefined;
          if (hit === undefined) {
            hit = measure(scene, a, b, prediction, opt.tolerance);
            cache.set(key, hit);
          }
          if (!hit) continue;
          if (hit.gap <= opt.gap) {
            edges.get(a.id).push(b.id);
            edges.get(b.id).push(a.id);
          }
          if (!doInterference) continue;
          for (const pin of hit.pins ?? []) {
            for (const [piece, other] of pin.fits) {
              const line = axleIn(piece, other);
              const hole = holes.get(piece) ?? new Map();
              holes.set(piece, hole);
              const seen = hole.get(other);
              if (!seen) hole.set(other, { line, fixed: true });
              else if (seen.fixed && !sameLine(seen.line, line)) seen.fixed = false;
            }
          }
          if (hit.depth > opt.tolerance || hit.pins?.length) {
            if (!overlaps.has(key)) overlaps.set(key, { parts: [a.id, b.id], poses: [] });
            overlaps.get(key).poses.push({ value, depth: hit.depth, where: hit.where, pins: hit.pins ?? [] });
          }
        }
      }
      first = false;
      if (!doUnsupported) continue;
      // 在動的零件碰著誰:記成「帶動」的邊(兩個零件相碰、其中至少一個在動)。不必每個姿勢都連回主動件——
      // 被頂起再自己落下的零件(落板、棘爪),落下時並沒有碰著主動件
      for (const id of moving) {
        const m = motion.get(id) ?? { moved: 0, touched: false, value, links: new Set() };
        m.moved++;
        for (const other of edges.get(id)) {
          m.touched = true;
          m.links.add(other);
        }
        motion.set(id, m);
      }
    }
    // 從主動件(與外力來源)出發,沿著帶動的邊、只經過會動的零件,走得到的就是有實體帶動的
    const linked = new Map();
    const link = (x, y) => linked.set(x, (linked.get(x) ?? new Set()).add(y));
    for (const [id, m] of motion) for (const other of m.links) if (motion.has(other) || sources.has(other)) (link(id, other), link(other, id));
    const driven = new Set(sources);
    const queue = [...sources];
    while (queue.length) {
      for (const other of linked.get(queue.pop()) ?? []) {
        if (driven.has(other)) continue;
        driven.add(other);
        queue.push(other);
      }
    }
    for (const [id, m] of motion) m.driven = driven.has(id);

    const lonely = [...motion].filter(([id, m]) => !sources.has(id) ? !m.driven : !m.touched);
    if (lonely.length) {
      // 沒連回主動件的,量它離「有實體帶動的零件」多遠;沒碰到任何零件的,量它離任何實體多遠
      const nearest = nearestGaps(def, scene, values, state, lonely.map(([id, m]) => ({ id, among: m.touched && !sources.has(id) ? driven : null })), opt);
      for (const [id, m] of lonely) {
        const gap = nearest.get(id);
        const far = gap == null ? `超過 ${opt.reach}` : fmt(Math.max(0, gap));
        const message = sources.has(id)
          ? `${id} 在動,卻沒有碰到任何零件(沒有軸、樞軸或導軌支撐);離最近的實體 ${far}`
          : m.touched
            ? `${id} 在動,卻沒有實體把它連回主動件;離最近的被帶動零件 ${far}`
            : `${id} 在動,卻沒有碰到任何零件(沒有東西帶動它,也沒有支撐);離最近的實體 ${far}`;
        findings.push({ check: "unsupported", figure: def.figure, parts: [id], value: m.value, state, severity: gap ?? opt.reach, count: m.moved, message: `${message}(${m.moved}/${values.length} 個取樣姿勢在動;例如${at(m.value, state)})` });
      }
    }
  }
  for (const { state, overlaps } of perState) {
    for (const o of overlaps.values()) {
      // 圓柱(軸、銷、輪轂、連桿的軸眼)伸進別的零件:兩者之中有會動的,而圓柱在對方座標裡的軸線始終是
      // 同一條(繞自己的軸轉、沿軸滑),就是機構裡裝在孔中的軸承、鉸接或導桿——孔沒畫出來,不算干涉;
      // 球心在對方座標裡不動的球是球接頭,同理。軸線會移動的(銷掃過對方的實體)算;
      // 兩個都固定不動的也算(簡化的機架,要寫豁免)
      const { moves, rigid } = relativeMotion(placed, ...o.parts);
      // 兩個零件一起動、彼此之間始終沒有相對運動:是固定在一起的同一個剛體(活塞與活塞桿、臂與臂端的球),
      // 和同一個零件自己的各部分一樣不查。兩個都固定不動的不在此列
      if (moves && rigid) continue;
      const inHole = ([piece, other]) => moves && holes.get(piece)?.get(other)?.fixed;
      o.depth = 0;
      o.count = 0;
      for (const pose of o.poses) {
        let { depth, where } = pose;
        for (const pin of pose.pins) if (!pin.fits.some(inHole) && pin.depth > depth) ({ depth, where } = pin);
        if (depth <= opt.tolerance) continue;
        o.count++;
        if (depth > o.depth) Object.assign(o, { depth, where, value: pose.value });
      }
      if (!o.count) continue;
      findings.push({
        check: "interference",
        figure: def.figure,
        parts: o.parts,
        value: o.value,
        state,
        severity: o.depth,
        count: o.count,
        message: `${o.parts[0]} 與 ${o.parts[1]} 互相穿入 ${o.depth.toFixed(2)}(${o.count}/${values.length} 個取樣姿勢;最深在${at(o.value, state)}:${o.where})`,
      });
    }
  }
  return findings;
}

// 兩個零件在所有狀態的取樣姿勢中:moves 有沒有哪一個動過;rigid 彼此的相對位置是否始終不變
function relativeMotion(placed, idA, idB) {
  const first = placed[0];
  if (!first.has(idA) || !first.has(idB)) return { moves: true, rigid: false }; // 線狀零件
  const same = (m, n) => m.elements.every((x, i) => Math.abs(x - n.elements[i]) < 1e-6);
  const relative = (pose) => pose.get(idB).clone().invert().multiply(pose.get(idA));
  const rel0 = relative(first);
  let moves = false;
  let rigid = true;
  for (const pose of placed) {
    if (!moves && (!same(pose.get(idA), first.get(idA)) || !same(pose.get(idB), first.get(idB)))) moves = true;
    if (rigid && !same(relative(pose), rel0)) rigid = false;
  }
  return { moves, rigid };
}

// 兩個零件之間:gap(實體間隙,≤ 0 表示相貼或相交)與 depth(干涉的穿入深度)
function measure(scene, a, b, prediction, tolerance) {
  let gap = null;
  let solid = 0; // 算作干涉的那些凸塊配對中最小的距離
  let where = null; // 穿得最深的是哪兩塊
  if (a.path && b.path) {
    gap = scene.distance(a, b, prediction);
    return gap == null ? null : { gap, depth: 0 };
  }
  if (a.path || b.path) {
    const [path, part] = a.path ? [a, b] : [b, a];
    // 線狀零件以中心線穿進實體多深算干涉:貼著輪面(中心線在輪面上)不算。
    // 開放路徑的頭尾兩段若端點就繫在這個零件上,那一段不算
    let anchored = null;
    scene.contacts(path, part, prediction, (pa, pb, d, n) => {
      if (gap == null || d < gap) gap = d;
      if (d >= solid) return;
      anchored ??= path.closed ? [] : [0, path.points.length - 2].filter((s, end) => scene.endGap(path, end, part) <= prediction);
      if (anchored.includes(pa.segment)) return;
      solid = d;
      where = `${describe(path, pa)}穿過${describe(part, pb)}${along(n)}`;
    });
    return gap == null ? null : { gap, depth: Math.max(0, -solid - path.radius), where };
  }
  // 圓柱、球與對方的重疊另外記下,等整個狀態走完再判斷它是不是裝在孔裡
  const pins = [];
  scene.contacts(a, b, prediction, (pa, pb, d, n) => {
    if (gap == null || d < gap) gap = d;
    if (d >= 0) return;
    // 圓的軸(圓柱、球、螺紋);長條方桿另外算(它只當導桿,不當鉸接軸)。
    // 螺紋與方桿要整根穿過對方那一塊才可能是裝在孔裡:只從旁邊蹭到、或一頭頂進去的不算
    const ra = pa.axle && !pa.axle.bar && !(pa.axle.thread && !scene.passesThrough(pa.axle, b)) ? pa.axle : null;
    const rb = pb.axle && !pb.axle.bar && !(pb.axle.thread && !scene.passesThrough(pb.axle, a)) ? pb.axle : null;
    if (ra || rb) {
      // 兩塊都是圓柱時,只有細的那個可能是裝在對方孔裡的軸
      const fits = [];
      if (ra && !(rb && rb.radius < ra.radius)) fits.push([pa, b]);
      if (rb && !(ra && ra.radius < rb.radius)) fits.push([pb, a]);
      pins.push({ depth: -d, fits, where: `${describe(a, pa)} 與 ${describe(b, pb)}${along(n)}` });
    } else if (d < solid) {
      // 鉸接處的軸眼:某根軸(任一方的圓柱)的軸線同時穿過這兩塊,而且那根軸是裝在孔裡的鉸接軸,
      // 那麼這兩塊在軸周圍的重疊是鉸接處互相套著的軸眼(連桿端頭疊在槓桿上),和軸本身一樣等走完再判斷
      // 長條方桿伸進對方:可能是在沒畫出來的方孔裡滑動的導桿(軸線始終是同一條才算),同樣等走完再判斷
      const fits = d < -tolerance ? knuckles(scene, a, b, pa, pb) : [];
      if (d < -tolerance) {
        if (pa.axle?.bar && scene.passesThrough(pa.axle, b)) fits.push([pa, b]);
        if (pb.axle?.bar && scene.passesThrough(pb.axle, a)) fits.push([pb, a]);
      }
      if (fits.length) pins.push({ depth: -d, fits, where: `${describe(a, pa)} 與 ${describe(b, pb)}${along(n)}` });
      else {
        solid = d;
        where = `${describe(a, pa)} 與 ${describe(b, pb)}${along(n)}`;
      }
    }
  });
  return gap == null ? null : { gap, depth: -solid, pins, where };
}

// 軸線同時穿過凸塊 pa、pb 的那些軸(a 或 b 的圓柱凸塊),各配上「它裝在哪個零件的孔裡」
function knuckles(scene, a, b, pa, pb) {
  const fits = [];
  for (const [owner, other] of [[a, b], [b, a]]) {
    for (const axle of owner.pieces) {
      if (!axle.axle || axle.axle.bar || axle.axle.from.distanceTo(axle.axle.to) < 1e-6) continue;
      if (scene.lineHits(axle.axle, pa) && scene.lineHits(axle.axle, pb)) fits.push([axle, other]);
    }
  }
  return fits;
}

// 憑空連動的零件離最近的實體多遠:重走一次這個狀態的取樣,往外找到 reach 為止
function nearestGaps(def, scene, values, state, wanted, opt) {
  const nearest = new Map();
  for (const value of values) {
    scene.apply(def.pose(value, state));
    for (const { id, among } of wanted) {
      const a = scene.byId.get(id);
      if (!a.visible) continue;
      for (const b of scene.entries) {
        if (b === a || !b.visible || (among && !among.has(b.id))) continue;
        const d = scene.distance(a, b, opt.reach);
        if (d != null && (!nearest.has(id) || d < nearest.get(id))) nearest.set(id, d);
      }
    }
  }
  return nearest;
}

// ── 豁免 ─────────────────────────────────

const sameParts = (a, b) => a.length === b.length && [...a].sort().join("\n") === [...b].sort().join("\n");

/** 有原因的豁免才有效;每一項只放過它指明的檢查與零件(動力重演另可用 at 指明是哪一個預期事件)。沒對到任何問題的豁免報為過時 */
function applyWaivers(def, findings, opt) {
  const out = findings.map((f) => ({ ...f }));
  for (const waiver of def.waivers ?? []) {
    if (!waiver.reason || !String(waiver.reason).trim()) continue;
    if (!opt.checks.includes(waiver.check)) continue;
    // 動力重演的豁免可以用 at 指明是哪一個預期事件(主動量),只放過那一個;沒寫 at 就是這個零件的每個預期事件
    const matched = out.filter((f) => f.check === waiver.check && sameParts(f.parts, waiver.parts ?? []) && (waiver.at == null || (f.check === "replay" && Math.abs(f.value - waiver.at) < 1e-9)));
    for (const f of matched) f.waived = waiver.reason;
    if (!matched.length) {
      out.push({
        check: "stale-waiver",
        figure: def.figure,
        parts: waiver.parts ?? [],
        value: null,
        state: undefined,
        severity: 0,
        count: 0,
        message: `豁免(${CHECK_NAMES[waiver.check] ?? waiver.check}:${(waiver.parts ?? []).join("、")})已經沒有對應的問題,請移除`,
      });
    }
  }
  return out;
}
