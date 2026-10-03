// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree } from "./helpers.js";

import * as m412 from "../models/fig412.js";
import * as m413 from "../models/fig413.js";
import * as m414 from "../models/fig414.js";
import * as m415 from "../models/fig415.js";

test("第 412 種:絞盤解鎖時鼓頭與鼓輪反向轉,速度比三比一;鎖定時一起轉(單倍)", () => {
  const def = m412.default;
  close(turned(def, "barrel", 0, 1.2, "free"), -1.2 / 3, "解鎖:鼓輪反向轉三分之一");
  close(turned(def, "barrel", 0, 1.2, "locked"), 1.2, "鎖定:鼓輪與鼓頭一起轉");
  assertMeshFree(def, "sun", "planet1", sweep(1.5, 12), "free");
  assertMeshFree(def, "planet1", "barrel", sweep(1.5, 12), "free");
  assertMeshFree(def, "planet3", "barrel", sweep(1.5, 12), "free");
});

test("第 413 種:下輪帶動 A 反向轉;旋緊螺帽 B,橡膠碟夾緊、徑向擴張,牽引力變大(不再打滑)", () => {
  const def = m413.default;
  const tight = turned(def, "rubberTight", 0, 1, "tight");
  const loose = turned(def, "rubberLoose", 0, 1, "loose");
  assert.ok(tight < 0 && loose < 0, "A 與下輪反向轉");
  assert.ok(Math.abs(tight) > Math.abs(loose), "旋緊後 A 被帶得更確實");
  const gap = (state) => def.pose(0, state).parts.plateR.position[0] - def.pose(0, state).parts.plateL.position[0];
  assert.ok(gap("tight") < gap("loose"), "旋緊螺帽,兩片金屬板夾近");
  const tip = (id) => Math.max(...def.parts.find((p) => p.id === id).profile.map(([r]) => r));
  assert.ok(tip("rubberTight") > tip("rubberLoose"), "橡膠碟被迫徑向擴張");
});

test("第 414 種:小齒輪 B 沿鍵條滑動、始終咬著渦線;A 朝一個方向越轉越慢,朝相反方向越轉越快", () => {
  const def = m414.default;
  const vs = sweep(m414.RANGE[1] * 0.99, 12, m414.RANGE[0]);
  const speeds = [];
  for (const v of vs) {
    const pose = def.pose(v);
    const r = m414.radiusAt(m414.contact(v));
    close(pose.parts.pinion.position[1], -r, "小齒輪在咬合處(沿軸滑到渦線上)");
    // A 的轉速 / B 的轉速 = B 的節圓半徑 / 咬合處的半徑
    const dv = 1e-4;
    const speed = Math.abs(def.pose(v + dv).parts.volute.angle - pose.parts.volute.angle) / dv;
    close(speed, m414.RB / r, "A 的轉速比", 1e-3);
    speeds.push(speed);
  }
  for (let i = 1; i < speeds.length; i++) assert.ok(speeds[i] < speeds[i - 1], "B 往前轉:咬合處往外移,A 越轉越慢(反過來就越轉越快)");
});

test("第 415 種:C 嚙合時槓桿往一邊擺就帶著輪 D 轉、擺回時 D 停住;改由 B 嚙合時 D 反轉", () => {
  const S = m415.SWING;
  const span = 2 * S;
  // C 嚙合:第一個行程(逆時針擺)帶著 D 轉過同樣的角度,第二個行程(擺回)D 不動
  const c0 = m415.motion(0, "C");
  const c1 = m415.motion(span * 0.999, "C");
  const c2 = m415.motion(span * 1.999, "C");
  close(c1.wheel - c0.wheel, c1.lever - c0.lever, "擺動中 D 與槓桿一起轉", 1e-6);
  assert.ok(c1.wheel > c0.wheel, "C 嚙合:D 逆時針轉");
  close(c2.wheel, c1.wheel, "擺回時 D 停住", 1e-2);
  // 一個完整往復,D 前進一個行程
  close(m415.motion(2 * span, "C").wheel - m415.motion(0, "C").wheel, span, "一個往復前進一個行程");
  // B 嚙合:反向
  const b = m415.motion(4 * span, "B").wheel - m415.motion(0, "B").wheel;
  close(b, -2 * span, "B 嚙合:D 順時針轉,兩個往復轉兩個行程");
  // 姿勢:作動中的棘爪隨槓桿轉,另一個被抬起
  const pose = m415.default.pose(0.1, "C").parts;
  close(pose.pawlC.angle, pose.lever.angle, "C 隨槓桿貼著輪緣");
  assert.notEqual(pose.pawlB.angle, pose.lever.angle, "B 被抬起");
});
