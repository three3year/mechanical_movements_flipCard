// 測試共用:數值比較、零件查找、齒輪齒形不重疊的檢查
import assert from "node:assert/strict";
import { gearProfile } from "../models/shapes.js";
import { planeBasis, add, scale, rot2 } from "../models/kit.js";

export const close = (actual, expected, msg, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${msg ?? ""} 期望 ${expected},實際 ${actual}`);

export const part = (def, id) => def.parts.find((p) => p.id === id);

/** 主動量由 a 變到 b 時,零件 id 的轉角變化 */
export const turned = (def, id, a, b, state) => def.pose(b, state).parts[id].angle - def.pose(a, state).parts[id].angle;

// 齒輪零件在姿勢下的齒形(世界座標,投影到它自己的平面上,以 2D 回傳)
function worldProfile(gear, angle, position) {
  const [u, v] = planeBasis(gear.axis ?? [0, 0, 1]);
  const c = position ?? gear.center;
  return gearProfile(gear).map((p) => {
    const [x, y] = rot2(p, angle);
    const w = add(c, add(scale(u, x), scale(v, y)));
    return [w[0], w[1]];
  });
}

function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * 兩個咬合齒輪(同在 xy 平面)在主動量 values 下的齒形不重疊:
 * 外齒輪的齒不伸進另一輪的實體;內齒輪的齒廓是孔,小齒輪的點必須都在孔內。
 */
export function assertMeshFree(def, idA, idB, values, state) {
  const a = part(def, idA);
  const b = part(def, idB);
  for (const v of values) {
    const pose = def.pose(v, state).parts;
    const pa = worldProfile(a, pose[idA].angle, pose[idA].position);
    const pb = worldProfile(b, pose[idB].angle, pose[idB].position);
    if (b.internal) {
      for (const p of pa) assert.ok(inside(p, pb), `主動量 ${v}:${idA} 的齒伸進 ${idB} 的齒`);
    } else if (a.internal) {
      for (const p of pb) assert.ok(inside(p, pa), `主動量 ${v}:${idB} 的齒伸進 ${idA} 的齒`);
    } else {
      for (const p of pa) assert.ok(!inside(p, pb), `主動量 ${v}:${idA} 與 ${idB} 的齒重疊`);
      for (const p of pb) assert.ok(!inside(p, pa), `主動量 ${v}:${idB} 與 ${idA} 的齒重疊`);
    }
  }
}

/** 0 到 to 之間均勻取 n 個主動量 */
export const sweep = (to, n = 24, from = 0) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);
