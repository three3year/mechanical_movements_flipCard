// 模型登記表的完整性:清單中的每個定義都逐一載入,並符合繪圖層需要的形狀
import { test } from "node:test";
import assert from "node:assert/strict";
import { sources, hasModel, loadModel } from "../models/registry.js";
import { PART_KINDS, PATH_KINDS, FLUIDS, targetsOf, canBeTarget } from "../models/kinds.js";

// 只有主動件自己是會動的實體(其餘是皮帶 / 繩 / 鍊或靜止件):沒有別的零件可標,維持主動件的橘色(維護者決定)
// 第 102 種螺帽轉在不動的螺栓上(2026-10-07 複查時比照加入)、第 134 種鼓輪 + 繩、第 227–229 種輪 + 鍊、第 254–259 種皮帶輪 + 皮帶、第 322、323、325 種平行尺、第 363 種蹺蹺板、第 409 種比例規(兩腳都是主動件,樞軸滑塊在一個狀態裡不動;model-audit-fixes-4 票 06)
const ONLY_DRIVER_MOVES = new Set([102, 134, 227, 228, 229, 254, 255, 256, 257, 258, 259, 322, 323, 325, 363, 409]);

const figures = Object.keys(sources).map(Number);
const models = await Promise.all(figures.map((n) => loadModel(n)));

test("全書圖 1–507 都有登記的模型", () => {
  for (let figure = 1; figure <= 507; figure++) assert.ok(hasModel(figure), `圖 ${figure} 沒有模型`);
});

test("登記表的圖號與定義的圖號一致", () => {
  figures.forEach((figure, i) => assert.equal(models[i].figure, figure));
});

test("未登記的圖號載入時失敗,不回傳定義", async () => {
  assert.equal(hasModel(0), false);
  await assert.rejects(loadModel(0));
});

// 檢查姿勢時取的主動量:有範圍取兩端與中間,往復取一個來回中的幾處,其餘取正負幾個值
function sampleValues(driver) {
  if (driver.type === "virtual" && driver.mode === "progress") {
    const span = driver.range[1] - driver.range[0];
    return [0, span * 0.37, span * 2.6];
  }
  if (driver.range) {
    const [min, max] = driver.range;
    return [min, (min + max) / 2, max];
  }
  if (driver.cycle) {
    const span = Math.abs(driver.cycle[1] - driver.cycle[0]);
    return [0, span * 0.5, span * 1.5, span * 3.2];
  }
  return [-3, 0, 3];
}

for (const def of models) {
  test(`圖 ${def.figure}:主動件、狀態與範圍的定義有效`, () => {
    const ids = def.parts.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, "零件 id 不重複");
    for (const p of def.parts) {
      assert.ok(PART_KINDS.has(p.kind) || PATH_KINDS.has(p.kind), `未知的零件種類 ${p.kind}`);
      assert.ok(!("at" in p), `頂層零件 ${p.id} 的位置要用 center,不是 at(at 只用在 pieces 裡,頂層會被忽略)`);
    }
    const d = def.driver;
    assert.ok(["rotation", "translation", "virtual"].includes(d.type));
    if (d.range) assert.ok(d.range[0] < d.range[1], "範圍 min < max");
    if (d.type === "virtual") {
      assert.ok(d.label, "虛擬主動件有名稱");
      assert.ok(d.range, "虛擬主動件有範圍");
      assert.ok(["balance", "progress"].includes(d.mode), "虛擬主動件是平衡型或進程型");
      assert.equal(d.part, undefined, "虛擬主動件不指向零件");
    } else {
      assert.ok(ids.includes(d.part), "主動件指向存在的零件");
      for (const grip of d.grips ?? []) assert.ok(ids.includes(grip), `抓取處 ${grip} 指向存在的零件`);
      if (d.type === "translation" && !d.cycle && !d.grips) assert.ok(d.range && d.direction);
      if (d.cycle) assert.ok(d.cycle[0] !== d.cycle[1], "往復的兩端不同");
    }
    const targets = targetsOf(def);
    for (const t of targets) {
      assert.ok(ids.includes(t), `目標件 ${t} 指向存在的零件`);
      assert.notEqual(t, d.part, "目標件不是主動件");
      assert.ok(canBeTarget(def, t), `目標件 ${t} 要是畫得出目標色的實體零件(不是皮帶 / 繩 / 鍊 / 流體 / 空群組,也不在主動件的抓取處裡)`);
    }
    if (ONLY_DRIVER_MOVES.has(def.figure)) assert.equal(targets.length, 0, "只有主動件自己在動的模型不標目標件");
    else assert.ok(targets.length >= 1 && targets.length <= 3, `每個模型有一個目標件(成組動作的最多三個),現在是 ${targets.length} 個`);
    if (def.states) {
      const options = def.states.options.map((o) => o.id);
      assert.ok(options.includes(def.states.initial), "預設狀態在狀態清單中");
      assert.ok(def.states.options.every((o) => o.label));
    }
  });

  test(`圖 ${def.figure}:實體驗證的宣告(豁免、外力來源、動力重演)指向存在的零件,豁免有原因`, () => {
    const ids = new Set(def.parts.map((p) => p.id));
    for (const w of def.waivers ?? []) {
      assert.ok(["interference", "unsupported", "replay"].includes(w.check), `豁免的檢查種類 ${w.check}`);
      assert.ok(typeof w.reason === "string" && w.reason.trim().length > 0, `豁免(${(w.parts ?? []).join("、")})必須寫原因`);
      assert.ok(Array.isArray(w.parts) && w.parts.length > 0, "豁免指明涉及的零件");
      for (const id of w.parts) assert.ok(ids.has(id), `豁免指向不存在的零件 ${id}`);
    }
    for (const id of def.powered ?? []) assert.ok(ids.has(id), `外力來源指向不存在的零件 ${id}`);
    if (def.replay) {
      for (const [id, free] of Object.entries(def.replay.free ?? {})) {
        assert.ok(ids.has(id), `動力重演的自由零件 ${id} 不存在`);
        if (free.on) assert.ok(ids.has(free.on), `動力重演:${id} 裝在不存在的零件 ${free.on} 上`);
      }
      assert.ok(def.replay.expect?.length, "動力重演要有預期事件");
      for (const e of def.replay.expect) {
        assert.ok(ids.has(e.part), `動力重演的預期事件指向不存在的零件 ${e.part}`);
        assert.ok(e.at == null || Number.isFinite(e.at), "預期事件的主動量是數字(省略 = 區間的終點)");
      }
      for (const pair of def.replay.ignore ?? []) for (const id of pair) assert.ok(ids.has(id), `動力重演的 ignore 指向不存在的零件 ${id}`);
    }
  });

  test(`圖 ${def.figure}:平板的記號(mark)是一個位置 [x, y]`, () => {
    const all = (parts) => parts.flatMap((p) => [p, ...all(p.pieces ?? [])]);
    for (const p of all(def.parts).filter((q) => q.kind === "plate" && q.mark != null)) {
      assert.ok(Array.isArray(p.mark) && p.mark.length === 2 && p.mark.every(Number.isFinite), `平板的 mark 應為 [x, y],實際 ${JSON.stringify(p.mark)}`);
    }
  });

  test(`圖 ${def.figure}:每個狀態的姿勢都涵蓋所有路徑零件,且只指向存在的零件`, () => {
    const ids = new Set(def.parts.map((p) => p.id));
    const pathIds = def.parts.filter((p) => PATH_KINDS.has(p.kind)).map((p) => p.id);
    const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
    for (const state of states) {
      for (const value of sampleValues(def.driver)) {
        const pose = def.pose(value, state);
        for (const [id, p] of Object.entries(pose.parts)) {
          assert.ok(ids.has(id), `姿勢指向不存在的零件 ${id}`);
          for (const key of ["position", "from", "to", "rotation"]) {
            if (p[key]) assert.ok(p[key].every(Number.isFinite), `${id}.${key} 有非數值`);
          }
          if (p.angle != null) assert.ok(Number.isFinite(p.angle), `${id}.angle 有非數值`);
        }
        for (const id of pathIds) {
          const path = pose.paths[id];
          assert.ok(path && path.points.length >= 2, `${id} 沒有路徑`);
          assert.ok(path.points.flat().every(Number.isFinite), `${id} 的路徑有非數值`);
        }
        for (const flow of pose.flows ?? []) {
          assert.ok(FLUIDS.has(flow.fluid), `未知的流體 ${flow.fluid}`);
          assert.ok(flow.points.flat().every(Number.isFinite), "流體示意的點有非數值");
        }
        assert.ok(Array.isArray(pose.readouts));
      }
    }
  });
}

// 連桿(link)是剛體:姿勢以 from/to 指定時,兩端距離在整個運動中不變(宣告 stretch: "原因" 的除外)。
// 連桿機構走到不可達的位置時(兩圓不相交),這條檢查會抓出來。
function denseValues(driver) {
  if (driver.type === "virtual" && driver.mode === "progress") return sweepValues(0, (driver.range[1] - driver.range[0]) * 2, 48);
  if (driver.range) return sweepValues(driver.range[0], driver.range[1], 48);
  if (driver.cycle) return sweepValues(0, Math.abs(driver.cycle[1] - driver.cycle[0]) * 4, 48);
  return sweepValues(-2 * Math.PI, 2 * Math.PI, 96);
}
const sweepValues = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

for (const def of models) {
  const links = def.parts.filter((p) => p.kind === "link" && !(typeof p.stretch === "string" && p.stretch.trim())); // 宣告了卻沒寫原因的照驗
  if (!links.length) continue;
  test(`圖 ${def.figure}:連桿在整個運動中長度不變(機構不會分離)`, () => {
    const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
    for (const state of states) {
      const lengths = new Map();
      for (const v of denseValues(def.driver)) {
        const pose = def.pose(v, state).parts;
        for (const link of links) {
          const p = pose[link.id];
          if (!p?.from || !p?.to) continue;
          const l = Math.hypot(p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]);
          if (!lengths.has(link.id)) lengths.set(link.id, [l, l]);
          const r = lengths.get(link.id);
          r[0] = Math.min(r[0], l);
          r[1] = Math.max(r[1], l);
        }
      }
      for (const [id, [lo, hi]] of lengths) assert.ok(hi - lo < 1e-6 * Math.max(1, hi), `${id} 長度在 ${lo.toFixed(4)}–${hi.toFixed(4)} 之間變動(狀態 ${state ?? "—"})`);
    }
  });
}

// 狀態決定姿勢的零件要標 posed:網頁切換狀態時,沒標 posed 的零件轉角以偏移量接續(切換瞬間不跳動),
// 姿勢由狀態決定的零件(指針、撥桿、棘爪)就不會動。同一主動量下各狀態的轉角不同、而且不是轉速類的零件要標 posed;
// 轉速類的零件(狀態只改轉速或轉向、間歇轉動的輪)轉角是累積的,接續才對。位置不必標:切換時位置一律以短動畫移過去;
// 以 rotation 擺放的零件也不必標(切換時一律以短動畫轉過去),這裡只看 angle

// 持續運轉的主動量走很多輪之後,零件在某個狀態下轉了一圈以上:轉速類(取樣的範圍內轉得慢、還沒轉滿一圈的也算)
function keepsTurning(def, id, states) {
  const d = def.driver;
  if (d.range && !(d.type === "virtual" && d.mode === "progress")) return false;
  // 走 20 輪:進程 20 個滑桿長、往復 20 個來回、轉動 20 圈
  const far = d.type === "virtual" ? (d.range[1] - d.range[0]) * 20 : d.cycle ? Math.abs(d.cycle[1] - d.cycle[0]) * 40 : 40 * Math.PI;
  return states.some((s) => Math.abs((def.pose(far, s).parts[id]?.angle ?? 0) - (def.pose(0, s).parts[id]?.angle ?? 0)) >= 2 * Math.PI);
}

for (const def of models) {
  if (!def.states || def.states.options.length < 2) continue;
  test(`圖 ${def.figure}:狀態決定姿勢的零件標了 posed`, () => {
    const states = def.states.options.map((o) => o.id);
    const values = denseValues(def.driver);
    const poses = values.map((v) => states.map((s) => def.pose(v, s).parts));
    const missing = [];
    for (const part of def.parts.filter((p) => !p.posed && !PATH_KINDS.has(p.kind))) {
      let differs = false;
      let lo = Infinity;
      let hi = -Infinity;
      for (const perState of poses) {
        const angles = perState.map((pose) => pose[part.id]?.angle);
        if (angles.some((a) => a == null)) continue;
        lo = Math.min(lo, ...angles);
        hi = Math.max(hi, ...angles);
        if (Math.max(...angles) - Math.min(...angles) > 1e-6) differs = true;
      }
      if (differs && hi - lo < 2 * Math.PI && !keepsTurning(def, part.id, states)) missing.push(part.id);
    }
    assert.deepEqual(missing, [], `這些零件的轉角由狀態決定,要標 posed`);
  });
}
