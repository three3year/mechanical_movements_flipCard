// 第二十二章「儀錶與周轉輪系」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import fig500, { gauge } from "../models/fig500.js";

const needle = (p) => fig500.pose(p).parts.needle.angle;

test("第 500 種:壓力越大指針轉角越大,壓力為零時指針歸零", () => {
  const zero = needle(0);
  const turns = sweep(10, 20).map((p) => zero - needle(p)); // 指針順時針轉
  close(turns[0], 0, "壓力為零時指針在零點");
  for (let i = 1; i < turns.length; i++) assert.ok(turns[i] > turns[i - 1], "壓力越大轉角越大");
  close(needle(-3), zero, "超出範圍的壓力被夾住");
});

test("第 500 種:碟片 A 的變形經扇形段 e 帶動小齒輪,轉角符合齒數比", () => {
  const sector = fig500.parts.find((p) => p.id === "sector");
  const pinion = fig500.parts.find((p) => p.id === "pinion");
  const a = gauge(2);
  const b = gauge(6);
  assert.ok(b.lift > a.lift, "壓力越大碟片拱得越高");
  close(b.pinion - a.pinion, -((b.sector - a.sector) * sector.teeth) / pinion.teeth);
});

test("第 500 種:主動件是虛擬的「壓力」,不指向零件", () => {
  assert.equal(fig500.driver.type, "virtual");
  assert.equal(fig500.driver.label, "壓力");
  assert.equal(fig500.driver.mode, "balance");
});
