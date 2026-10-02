// 皮帶傳動模型的測試:斷言直接對應原文描述(同向、反向、半徑比)
import { test } from "node:test";
import assert from "node:assert/strict";
import fig1 from "../models/fig01.js";
import fig2 from "../models/fig02.js";
import fig5 from "../models/fig05.js";
import fig7 from "../models/fig07.js";
import fig3 from "../models/fig03.js";
import fig4 from "../models/fig04.js";
import fig6 from "../models/fig06.js";
import fig11 from "../models/fig11.js";
import fig8 from "../models/fig08.js";
import fig9 from "../models/fig09.js";
import fig10 from "../models/fig10.js";

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
  const i = p.profile.findIndex(([g]) => g >= f);
  const [f0, r0] = p.profile[i - 1];
  const [f1, r1] = p.profile[i];
  return r0 + ((r1 - r0) * (f - f0)) / (f1 - f0);
}

for (const [def, name] of [[fig8, "第 8 種:速度皮帶輪"], [fig9, "第 9 種:錐形皮帶輪"], [fig10, "第 10 種:變形錐形皮帶輪"]]) {
  test(`${name},每個皮帶位置的轉速比符合該處半徑比,而且各位置不同`, () => {
    const ratios = def.states.options.map(({ id }) => {
      const belt = def.pose(0, id).paths.belt.points;
      const along = belt.reduce((sum, p) => sum + p[0], 0) / belt.length; // 皮帶沿軸的位置
      const expected = radiusAt(part(def, "driver"), along) / radiusAt(part(def, "driven"), along);
      const ratio = turn(def, "driven", id) / turn(def, "driver", id);
      close(ratio, expected, `狀態 ${id}`);
      return ratio;
    });
    assert.ok(def.states.options.length >= 3);
    assert.equal(new Set(ratios.map((r) => r.toFixed(6))).size, ratios.length, "各位置轉速比不同");
  });
}

test("第 8 種:每一段階梯各是一個狀態", () => {
  assert.equal(fig8.states.options.length, part(fig8, "driver").steps.length);
});

test("第 10 種的輪形與第 9 種不同", () => {
  assert.notDeepEqual(part(fig10, "driver").profile, part(fig9, "driver").profile);
});
