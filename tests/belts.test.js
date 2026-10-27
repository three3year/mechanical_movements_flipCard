// 皮帶傳動模型的測試:斷言直接對應原文描述(同向、反向、半徑比)
import { test } from "node:test";
import assert from "node:assert/strict";
import fig1 from "../models/fig001.js";
import fig2 from "../models/fig002.js";
import fig5 from "../models/fig005.js";
import fig7 from "../models/fig007.js";
import fig3 from "../models/fig003.js";
import fig4 from "../models/fig004.js";
import fig6 from "../models/fig006.js";
import fig11 from "../models/fig011.js";
import fig8 from "../models/fig008.js";
import fig9 from "../models/fig009.js";
import fig10 from "../models/fig010.js";
import { sweep } from "./helpers.js";

const close = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg ?? ""} 期望 ${expected},實際 ${actual}`);

const part = (def, id) => def.parts.find((p) => p.id === id);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

test("第 1 種:開口皮帶,主動輪轉 +θ 時從動輪同向轉 θ·r主/r從", () => {
  const rDriver = part(fig1, "driver").radius;
  const rDriven = part(fig1, "driven").radius;
  assert.equal(fig1.driver.part, "driver");
  assert.equal(fig1.driver.type, "rotation");
  const pose = fig1.pose(0.6);
  close(pose.parts.driver.angle, 0.6);
  close(pose.parts.driven.angle, (0.6 * rDriver) / rDriven);
  assert.ok(pose.parts.driven.angle > 0, "兩輪旋轉方向相同");
});

test("第 1 種:回傳皮帶行進相位,且沒有讀數", () => {
  const pose = fig1.pose(1);
  assert.ok(pose.paths.belt.closed);
  assert.ok(pose.paths.belt.points.length > 10);
  assert.notEqual(pose.paths.belt.phase, fig1.pose(0).paths.belt.phase);
  assert.deepEqual(pose.readouts, []);
});

test("第 2 種:交叉皮帶在固定輪上時,從動軸與主動輪反向", () => {
  assert.equal(fig2.states.initial, "crossed-on-fixed");
  const pose = fig2.pose(0.5, "crossed-on-fixed");
  assert.ok(pose.parts.drum.angle > 0);
  assert.ok(pose.parts.shaft.angle < 0, "反向");
});

test("第 2 種:把開口皮帶換到固定輪上,從動軸反轉,主動端方向不變", () => {
  const crossed = fig2.pose(0.5, "crossed-on-fixed");
  const open = fig2.pose(0.5, "open-on-fixed");
  assert.equal(open.parts.drum.angle, crossed.parts.drum.angle, "主動端方向與轉角不變");
  assert.ok(open.parts.shaft.angle > 0);
  close(open.parts.shaft.angle, -crossed.parts.shaft.angle, "反轉後轉速相同");
});

test("第 2 種:鬆動輪隨皮帶空轉,但不帶動軸", () => {
  const crossed = fig2.pose(0.5, "crossed-on-fixed");
  // 開口皮帶在左側鬆動輪上:鬆動輪正轉,軸卻反轉
  assert.ok(crossed.parts.looseLeft.angle > 0);
  assert.ok(crossed.parts.shaft.angle < 0);
  close(crossed.parts.fixed.angle, crossed.parts.shaft.angle, "固定輪與軸一起轉");
  const open = fig2.pose(0.5, "open-on-fixed");
  assert.ok(open.parts.looseRight.angle < 0);
  assert.ok(open.parts.shaft.angle > 0);
});

test("第 5 種:張緊輪 B 放開時,不論主動輪怎麼轉,從動輪都不動", () => {
  const a = fig5.pose(0, "released").parts.driven.angle;
  const b = fig5.pose(2.3, "released").parts.driven.angle;
  const c = fig5.pose(-7, "released").parts.driven.angle;
  assert.equal(a, b);
  assert.equal(a, c);
});

test("第 5 種:張緊輪 B 壓下時,從動輪依半徑比同向傳動", () => {
  assert.equal(fig5.states.initial, "pressed");
  const rDriver = part(fig5, "driver").radius;
  const rDriven = part(fig5, "driven").radius;
  const delta = fig5.pose(1, "pressed").parts.driven.angle - fig5.pose(0, "pressed").parts.driven.angle;
  close(delta, rDriver / rDriven);
});

test("第 5 種:張緊輪標示字母 B,且壓下與放開時位置不同", () => {
  assert.equal(part(fig5, "tensioner").label, "B");
  const pressed = fig5.pose(0, "pressed").parts.tensioner.position;
  const released = fig5.pose(0, "released").parts.tensioner.position;
  assert.notDeepEqual(pressed, released);
});

const turn = (def, id, state) => def.pose(1, state).parts[id].angle - def.pose(0, state).parts[id].angle;

test("第 7 種:皮帶在中間鬆動輪上時,直立軸不轉", () => {
  assert.equal(fig7.states.initial, "middle");
  assert.equal(turn(fig7, "shaftC", "middle"), 0);
});

test("第 7 種:皮帶移到左輪與右輪時,直立軸轉向相反,主動端方向不變", () => {
  const left = turn(fig7, "shaftC", "left");
  const right = turn(fig7, "shaftC", "right");
  assert.ok(left !== 0 && right !== 0);
  assert.ok(Math.sign(left) === -Math.sign(right), "左右反向");
  assert.equal(turn(fig7, "drum", "left"), turn(fig7, "drum", "right"));
});

test("第 7 種:直立軸與下方水平軸成直角", () => {
  assert.equal(Math.abs(dot(part(fig7, "shaftC").axis, part(fig7, "shaftA").axis)), 0);
});

test("第 7 種:依原文標示 A、B、a、b", () => {
  const labels = fig7.parts.filter((p) => p.label).map((p) => p.label).sort();
  assert.deepEqual(labels, ["A", "B", "a", "b"]);
});

test("沒有字母的模型不出現標籤", () => {
  for (const def of [fig1, fig2]) assert.ok(def.parts.every((p) => !p.label));
});

for (const [def, name] of [[fig3, "第 3 種:用導引皮帶輪"], [fig4, "第 4 種:交叉皮帶、兩軸同平面"], [fig11, "第 11 種:不用導引輪"]]) {
  test(`${name},從動軸與主動軸成直角,轉角依半徑比`, () => {
    const driver = part(def, "driver");
    const driven = part(def, "driven");
    assert.equal(def.driver.part, "driver");
    assert.equal(Math.abs(dot(driver.axis, driven.axis)), 0, "兩軸成直角");
    close(Math.abs(turn(def, "driven")), driver.radius / driven.radius);
  });

  test(`${name},初始視角是斜視,能同時看清兩根軸`, () => {
    const [x, y, z] = def.view.direction;
    const length = Math.hypot(x, y, z);
    for (const id of ["driver", "driven"]) {
      const facing = Math.abs(dot(part(def, id).axis, [x / length, y / length, z / length]));
      assert.ok(facing > 0.2 && facing < 0.95, `${id} 的軸既不正對也不側對鏡頭`);
    }
  });
}

test("第 6 種:槓桿是有範圍的旋轉型主動件,超出範圍被夾住", () => {
  const [min, max] = fig6.driver.range;
  assert.equal(fig6.driver.type, "rotation");
  assert.ok(min < 0 && max > 0 && max < Math.PI / 2);
  assert.deepEqual(fig6.pose(max + 1), fig6.pose(max));
  assert.deepEqual(fig6.pose(min - 1), fig6.pose(min));
});

test("第 6 種:槓桿往復擺動,兩個皮帶輪做往復旋轉;皮帶交叉繫在扇形段上,兩輪同向、與槓桿反向", () => {
  const forth = fig6.pose(0.25).parts;
  const back = fig6.pose(-0.25).parts;
  assert.ok(forth.left.angle < 0 && forth.right.angle < 0);
  assert.ok(back.left.angle > 0 && back.right.angle > 0, "槓桿擺回,兩輪轉回");
  const sector = part(fig6, "lever").radius;
  close(forth.left.angle, (-0.25 * sector) / part(fig6, "left").radius);
});

// 皮帶所在位置(沿軸)處的輪半徑,由零件外形量出
function radiusAt(p, along) {
  const start = p.center[0] - (p.length ?? p.steps.reduce((sum, s) => sum + s.width, 0)) / 2;
  if (p.kind === "stepped") {
    let edge = start;
    for (const s of p.steps) {
      edge += s.width;
      if (along < edge) return s.radius;
    }
  }
  const f = (along - start) / p.length;
  const i = Math.max(1, p.profile.findIndex(([g]) => g >= f)); // 左端面(f = 0)取第一段
  const [f0, r0] = p.profile[i - 1];
  const [f1, r1] = p.profile[i];
  return r0 + ((r1 - r0) * (f - f0)) / (f1 - f0);
}

test("第 8 種:速度皮帶輪,每一段階梯的轉速比符合該處半徑比,而且各段不同", () => {
  const ratios = fig8.states.options.map(({ id }) => {
    const belt = fig8.pose(0, id).paths.belt.points;
    const along = belt.reduce((sum, p) => sum + p[0], 0) / belt.length; // 皮帶沿軸的位置
    const expected = radiusAt(part(fig8, "driver"), along) / radiusAt(part(fig8, "driven"), along);
    const ratio = turn(fig8, "driven", id) / turn(fig8, "driver", id);
    close(ratio, expected, `狀態 ${id}`);
    return ratio;
  });
  assert.ok(fig8.states.options.length >= 3);
  assert.equal(new Set(ratios.map((r) => r.toFixed(6))).size, ratios.length, "各段轉速比不同");
});

// 第 9、10 種:撥叉把皮帶沿錐面慢慢推過去再推回來;在主動輪一個來回(driver.period)上均勻取樣
const H = 1e-3; // 量轉速比的微小主動量
const rateAt = (def, v) => (def.pose(v + H).parts.driven.angle - def.pose(v - H).parts.driven.angle) / (2 * H);
const beltAlong = (def, v) => def.pose(v).paths.belt.points[0][0]; // 皮帶繞在垂直軸的平面上,每一點的 x 相同
const coneSamples = (def) => sweep(def.driver.period, 240);

/** 皮帶前段(z > 0)在高度 y 處的深度 z:沿折線內插 */
function frontRunZ(points, y) {
  let best = -Infinity;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) return;
    const t = (y - a[1]) / (b[1] - a[1]);
    best = Math.max(best, a[2] + (b[2] - a[2]) * t);
  });
  return best;
}

for (const [def, name] of [[fig9, "第 9 種:錐形皮帶輪"], [fig10, "第 10 種:變形錐形皮帶輪"]]) {
  test(`${name},原文「逐漸加快或減慢」:主動輪一直轉,從動輪的轉速比連續變化,沒有跳段`, () => {
    assert.ok(def.driver.period > 2 * Math.PI, "皮帶要主動輪轉好幾圈才走完一個來回");
    const rates = coneSamples(def).map((v) => rateAt(def, v));
    const span = Math.max(...rates) - Math.min(...rates);
    assert.ok(span > 1.5, `一個來回裡轉速比變化很大(${span.toFixed(2)})`);
    rates.slice(1).forEach((r, i) => assert.ok(Math.abs(r - rates[i]) < span / 20, `取樣 ${i}→${i + 1} 轉速比 ${rates[i].toFixed(3)}→${r.toFixed(3)} 跳段`));
  });

  test(`${name},每一刻的轉速比等於皮帶所在處兩輪的半徑比(皮帶不打滑)`, () => {
    for (const v of coneSamples(def)) {
      const along = beltAlong(def, v);
      const expected = radiusAt(part(def, "driver"), along) / radiusAt(part(def, "driven"), along);
      const rate = rateAt(def, v);
      assert.ok(Math.abs(rate / expected - 1) < 2e-3, `主動量 ${v.toFixed(2)}:轉速比 ${rate.toFixed(4)},皮帶處半徑比 ${expected.toFixed(4)}`);
    }
  });

  test(`${name},皮帶走到錐面的兩端,轉速比在兩端達到錐面兩端的比值`, () => {
    const cone = part(def, "driver");
    const [left, right] = [cone.center[0] - cone.length / 2, cone.center[0] + cone.length / 2];
    const r = part(def, "belt").radius;
    const xs = coneSamples(def).map((v) => beltAlong(def, v));
    const [lo, hi] = [Math.min(...xs), Math.max(...xs)];
    assert.ok(lo - r >= left && hi + r <= right, "皮帶全程在錐面上");
    assert.ok(lo - r - left < 0.05 && right - hi - r < 0.05, `皮帶的邊走到錐面兩端(${(lo - r).toFixed(3)}..${(hi + r).toFixed(3)},錐面 ${left}..${right})`);
    // 皮帶在兩端時,兩輪皮帶處的半徑和錐面端面的半徑只差一點點,最快、最慢的轉速比就是那裡的半徑比
    for (const [x, end] of [[lo, left], [hi, right]]) {
      for (const id of ["driver", "driven"]) assert.ok(Math.abs(radiusAt(part(def, id), x) - radiusAt(part(def, id), end)) < 0.04, `${id} 在皮帶最遠處的半徑接近端面`);
    }
    const rates = coneSamples(def).map((v) => rateAt(def, v));
    const atEnds = [lo, hi].map((x) => radiusAt(cone, x) / radiusAt(part(def, "driven"), x));
    assert.ok(Math.abs(Math.max(...rates) / Math.max(...atEnds) - 1) < 2e-3 && Math.abs(Math.min(...rates) / Math.min(...atEnds) - 1) < 2e-3, "最快、最慢就是皮帶在兩端時的半徑比");
  });

  test(`${name},撥叉夾著皮帶前段:皮帶的位置由撥叉決定,推的一側和皮帶相碰`, () => {
    const fork = part(def, "fork");
    const prongs = fork.pieces.filter((q) => q.role === "prong");
    assert.equal(prongs.length, 2, "撥叉有兩根叉齒");
    assert.ok(def.powered?.includes("fork"), "推撥叉的機構沒有畫出來,撥叉直接受力");
    const r = part(def, "belt").radius;
    for (const v of coneSamples(def)) {
      const pose = def.pose(v);
      const at = pose.parts.fork.position;
      const along = beltAlong(def, v);
      const [a, b] = prongs.map((q) => [at[0] + q.at[0] - q.size[0] / 2, at[0] + q.at[0] + q.size[0] / 2]).sort((p, q) => p[0] - q[0]);
      const gaps = [along - r - a[1], b[0] - (along + r)]; // 左叉齒內面到皮帶、皮帶到右叉齒內面
      assert.ok(Math.min(...gaps) >= -1e-9, `主動量 ${v.toFixed(2)}:叉齒穿入皮帶`);
      assert.ok(Math.max(...gaps) < 0.01, `主動量 ${v.toFixed(2)}:叉齒和皮帶相碰(間隙 ${gaps.map((g) => g.toFixed(3))})`);
      const z = frontRunZ(pose.paths.belt.points, at[1]);
      for (const q of prongs) {
        assert.ok(at[2] + q.at[2] - q.size[2] / 2 < z - r && z + r < at[2] + q.at[2] + q.size[2] / 2, `叉齒在深度上跨過皮帶(皮帶 z ${z.toFixed(3)})`);
        assert.ok(Math.abs(q.at[1]) < q.size[1] / 2, "叉齒在皮帶前段的高度");
      }
    }
  });

  test(`${name},讀數「轉速比」隨皮帶位置變化,標出漸快或漸慢`, () => {
    for (const v of coneSamples(def).filter((_, i) => i % 10 === 5)) {
      const [readout] = def.pose(v).readouts;
      assert.ok(readout?.label.startsWith("轉速比"), "有轉速比讀數");
      const rate = rateAt(def, v);
      assert.ok(Math.abs(parseFloat(readout.value) - rate) < 0.006, `讀數 ${readout.value},量到 ${rate.toFixed(3)}`);
      const trend = rateAt(def, v + 0.05) > rate ? "漸快" : "漸慢";
      assert.ok(readout.value.includes(trend), `讀數 ${readout.value} 應標 ${trend}`);
    }
  });
}

test("第 8 種:每一段階梯各是一個狀態", () => {
  assert.equal(fig8.states.options.length, part(fig8, "driver").steps.length);
});

test("第 10 種的輪形與第 9 種不同", () => {
  assert.notDeepEqual(part(fig10, "driver").profile, part(fig9, "driver").profile);
});
