// 速查表(docs/agents/model-cheatsheet.md)沒過時:零件種類表涵蓋 PART_KINDS 每一種、範例圖真的用了那種零件、
// 共用模組表與 helpers 表提到的函式都還 export 著。零依賴,跑在 npm test 裡。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { PART_KINDS } from "../models/kinds.js";

const md = readFileSync(new URL("../docs/agents/model-cheatsheet.md", import.meta.url), "utf8");
const root = new URL("../", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), "utf8");

/** `## 標題` 之下到下一個 `## ` 之前的表格列(去掉表頭與分隔列),每列是各欄的字串 */
function rows(heading) {
  const start = md.indexOf(`\n## ${heading}`);
  assert.ok(start >= 0, `速查表缺「${heading}」一節`);
  const end = md.indexOf("\n## ", start + 1);
  const section = md.slice(start, end < 0 ? undefined : end);
  return section
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|[-\s|]+\|$/.test(l))
    .slice(1)
    .map((l) => l.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim()));
}
const ticks = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const figs = (s) => [...s.matchAll(/`fig(\d{3})`/g)].map((m) => m[1]);
const isIdent = (t) => /^[A-Za-z_]\w*$/.test(t) && !/^fig\d{3}$/.test(t);
const exportsOf = (file) => new Set([...read(file).matchAll(/^export (?:const|function|class) (\w+)|^export \{([^}]*)\}/gm)].flatMap((m) => (m[1] ? [m[1]] : m[2].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()))));

test("零件種類表涵蓋 PART_KINDS 每一種,範例圖真的用了那種零件", () => {
  const table = rows("零件種類");
  const listed = new Set(table.flatMap(([kind]) => ticks(kind)));
  assert.deepEqual([...PART_KINDS].filter((k) => !listed.has(k)), [], "這些零件種類沒列在表裡");
  for (const [kind, , examples] of table) {
    const kinds = ticks(kind);
    for (const n of figs(examples)) {
      const file = `models/fig${n}.js`;
      assert.ok(existsSync(new URL(file, root)), `${file} 不存在`);
      const src = read(file);
      assert.ok(kinds.some((k) => src.includes(`kind: "${k}"`)), `${file} 沒有用到 ${kinds.join(" / ")}`);
    }
  }
});

test("共用模組表提到的模組與函式都存在", () => {
  for (const row of rows("共用模組:什麼情境用哪個")) {
    const files = ticks(row[0]).filter((t) => t.endsWith(".js")).map((t) => `models/${t}`);
    for (const f of files) assert.ok(existsSync(new URL(f, root)), `${f} 不存在`);
    const exported = new Set(files.flatMap((f) => [...exportsOf(f)]));
    for (const name of ticks(row[1]).filter(isIdent)) assert.ok(exported.has(name), `${files.join(" / ")} 沒有 export ${name}`);
    for (const n of figs(row[1])) assert.ok(existsSync(new URL(`models/fig${n}.js`, root)), `fig${n} 不存在`);
  }
});

test("helpers 表提到的函式都還在 tests/helpers.js", () => {
  const exported = exportsOf("tests/helpers.js");
  for (const [, anchors] of rows("測試")) for (const name of ticks(anchors).filter(isIdent)) assert.ok(exported.has(name), `tests/helpers.js 沒有 export ${name}`);
});
