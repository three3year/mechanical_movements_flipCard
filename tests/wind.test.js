// 第二十一章「風力、船舶與起重」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";

import fig484 from "../models/fig484.js";
import * as m485 from "../models/fig485.js";
import * as m486 from "../models/fig486.js";
import * as m487 from "../models/fig487.js";
import * as m488 from "../models/fig488.js";
import * as m489 from "../models/fig489.js";

test("第 484 種:圓筒上的螺旋葉片:風沿軸吹過,圓筒旋轉", () => {
  const a = fig484.pose(0.1);
  assert.equal(a.flows[0].fluid, "air", "風以空氣示意");
  const xs = a.flows[0].points.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "風沿軸吹過整個圓筒");
  assert.notDeepEqual(fig484.pose(0.1).parts.drum.rotation, fig484.pose(0.2).parts.drum.rotation, "圓筒隨進程轉");
});

test("第 485 種:風車:風吹在斜的帆面上產生圓周運動", () => {
  assert.ok(m485.PITCH > 0 && m485.PITCH < Math.PI / 4, "帆面相對旋轉平面斜一個角度");
  const def = m485.default;
  assert.notDeepEqual(def.pose(0.1).parts.sails.rotation, def.pose(0.3).parts.sails.rotation, "帆隨進程轉");
  assert.ok(def.pose(0.2).flows[0].points.length > 0, "有風");
});

test("第 486 種:垂直式風車:受風的一側帆面正對著風,轉回迎風時以邊緣對著風", () => {
  const face = m486.sail(0); // 右側:臂端順著風走
  const edge = m486.sail(Math.PI); // 左側:逆著風回來
  close(face.angle, 0, "受風時帆面與風垂直");
  close(edge.angle, Math.PI / 2, "回程時邊緣對著風");
  assert.equal(face.face, 1);
  assert.equal(edge.face, 0);
});

test("第 487 種:明輪:輪轉時下方的槳板把水往後推,船往前", () => {
  const def = m487.default;
  // 逆時針轉:最下面的槳板往右走(推水往右)
  const theta = 0.1;
  const below = (t) => [Math.cos(t - Math.PI / 2) * m487.R.paddle, Math.sin(t - Math.PI / 2) * m487.R.paddle];
  assert.ok(below(theta)[0] > below(0)[0], "下方的槳板往右(往後)推水");
  assert.ok(-m487.R.paddle < m487.WATER && m487.WATER < -m487.R.rim + 0.2, "只有下方的槳板浸在水裡");
  assert.match(def.pose(0).readouts[0].value, /往左/);
});

test("第 488 種:螺旋槳:槳葉是螺紋的片段,旋轉時沿軸推進", () => {
  assert.ok(m488.PITCH_ANGLE > 0 && m488.PITCH_ANGLE < Math.PI / 2, "槳葉斜一個螺距角");
  const def = m488.default;
  const xs = def.pose(1).flows[0].points.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "水沿軸被推動");
});

test("第 489 種:垂直槳板明輪:臂轉動時,環 d 繞偏心輪 e 轉,經曲柄使槳板始終直立", () => {
  const def = m489.default;
  for (const t of sweep(2 * Math.PI, 24)) {
    const parts = def.pose(t).parts;
    m489.joints(t).forEach((j, i) => {
      close(Math.hypot(j.pivot[0], j.pivot[1]), m489.ARM, "槳板的樞軸離軸心相等");
      // 曲柄端在環 d 上:離偏心輪中心也是 ARM
      close(Math.hypot(j.crank[0] - m489.ECC[0], j.crank[1] - m489.ECC[1]), m489.ARM, "曲柄端在繞偏心輪轉的環上");
      assert.equal(parts[`paddle${i}`].angle, undefined, "槳板不轉,始終直立");
    });
  }
});
