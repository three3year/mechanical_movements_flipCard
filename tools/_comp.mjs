// 暫用:虛擬主動件的模型裡,會動的零件依「相碰」分成幾群;每一群要有一個外力來源(powered)
import { sources, loadModel } from "../models/registry.js";
import { Scene } from "../verify/scene.js";
import { sampleValues, statesOf } from "../verify/sampling.js";
const args = process.argv.slice(2).flatMap((a) => { const [x, y] = a.split("-").map(Number); return Array.from({ length: (y ?? x) - x + 1 }, (_, i) => x + i); });
for (const fig of args.length ? args : Object.keys(sources).map(Number)) {
  const def = await loadModel(fig);
  if (def.driver.type !== "virtual") continue;
  const scene = new Scene(def);
  const links = new Map();
  const moving = new Set();
  const same = (a = {}, b = {}) => JSON.stringify([a.angle ?? 0, a.position, a.rotation, a.from, a.to]) === JSON.stringify([b.angle ?? 0, b.position, b.rotation, b.from, b.to]);
  for (const state of statesOf(def)) {
    const values = sampleValues(def.driver, 40);
    const eps = Math.abs(values[1] - values[0]) / 40;
    for (const v of values) {
      const pose = def.pose(v, state), ahead = def.pose(v + (v + eps > def.driver.range[1] && def.driver.mode !== "progress" ? -eps : eps), state);
      scene.apply(pose);
      const mv = scene.entries.filter((e) => e.visible && e.pieces.length && (e.path ? JSON.stringify(pose.paths?.[e.id]) !== JSON.stringify(ahead.paths?.[e.id]) : !same(pose.parts[e.id], ahead.parts[e.id])));
      for (const e of mv) moving.add(e.id);
      for (const a of mv) for (const b of scene.entries) {
        if (a === b || !b.visible) continue;
        const d = scene.distance(a, b, 0.03);
        if (d != null) { (links.get(a.id) ?? links.set(a.id, new Set()).get(a.id)).add(b.id); (links.get(b.id) ?? links.set(b.id, new Set()).get(b.id)).add(a.id); }
      }
    }
  }
  const seen = new Set(), comps = [];
  for (const id of moving) {
    if (seen.has(id)) continue;
    const comp = [], q = [id];
    seen.add(id);
    while (q.length) { const x = q.pop(); comp.push(x); for (const y of links.get(x) ?? []) if (moving.has(y) && !seen.has(y)) { seen.add(y); q.push(y); } }
    comps.push(comp);
  }
  console.log(`${fig}「${def.driver.label}」powered=${JSON.stringify(def.powered ?? [])} :: ${comps.map((c) => c.join(",")).join(" | ")}`);
  scene.dispose();
}
