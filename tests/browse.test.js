// 瀏覽模組:給條目清單(與用途檔),呼叫動作,斷言它回答的所在位置
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// 頁面用 <script> 依序載入的一般 script,在同一個全域裡執行;回傳取全域名稱的函式
function load(...files) {
  const context = vm.createContext({});
  for (const file of files) vm.runInContext(readFileSync(new URL("../" + file, import.meta.url), "utf8"), context);
  return (name) => vm.runInContext(name, context);
}

const page = load("data.js", "browse.js");
const Browse = page("Browse");
const entries = page("entries");

const entry = (no, images = [no]) => ({ no: String(no), images: images.map((n) => `images/${n}.png`), text: [] });

test("原書順序:預設在第 1 種、序列頭", () => {
  const b = Browse.createBrowser(entries);
  const at = b.where();
  assert.equal(at.mode, "book");
  assert.equal(at.entry.no, "1");
  assert.equal(at.index, 0);
  assert.equal(at.count, 487);
  assert.equal(at.atStart, true);
  assert.equal(at.atEnd, false);
  assert.equal(at.figure, null);
  assert.equal(at.backNo, null);
  assert.equal(at.figureCount, 507);
});

test("原書順序:翻頁依編號,到頭尾不再移動", () => {
  const b = Browse.createBrowser([entry(1), entry(2), entry(3)]);
  assert.equal(b.step(-1), false);
  assert.equal(b.where().entry.no, "1");
  assert.equal(b.step(1), true);
  assert.equal(b.step(1), true);
  const at = b.where();
  assert.equal(at.entry.no, "3");
  assert.equal(at.index, 2);
  assert.equal(at.atEnd, true);
  assert.equal(b.step(1), false);
  assert.equal(b.where().entry.no, "3");
});

test("原書順序:交互參照跳到多插圖條目並選中該圖", () => {
  const b = Browse.createBrowser(entries);
  b.step(1);
  assert.equal(b.follow(21), true);
  const at = b.where();
  assert.equal(at.entry.no, "19–22");
  assert.equal(at.figure, 21);
  assert.equal(at.backNo, "2");
});

test("原書順序:跳到目前這張不推入返回堆疊", () => {
  const b = Browse.createBrowser(entries);
  assert.equal(b.follow(1), false);
  assert.equal(b.where().backNo, null);
});

test("原書順序:返回多層依序退回,恢復原本選中的插圖", () => {
  const b = Browse.createBrowser(entries);
  b.goto(16);
  b.selectFigure(17);
  b.follow(20);
  b.follow(40);
  assert.equal(b.where().backNo, "19–22");
  assert.equal(b.back(), true);
  let at = b.where();
  assert.equal(at.entry.no, "19–22");
  assert.equal(at.figure, 20);
  assert.equal(at.backNo, "16–17");
  b.back();
  at = b.where();
  assert.equal(at.entry.no, "16–17");
  assert.equal(at.figure, 17);
  assert.equal(at.backNo, null);
  assert.equal(b.back(), false);
});

test("原書順序:翻頁離開參照脈絡,返回堆疊清空、插圖不再指定", () => {
  const b = Browse.createBrowser(entries);
  b.follow(21);
  b.step(1);
  const at = b.where();
  assert.equal(at.backNo, null);
  assert.equal(at.figure, null);
});

test("原書順序:跳到圖號清空返回堆疊並選中該圖", () => {
  const b = Browse.createBrowser(entries);
  b.follow(5);
  assert.equal(b.goto(40), true);
  const at = b.where();
  assert.equal(at.entry.no, "40–41");
  assert.equal(at.figure, 40);
  assert.equal(at.backNo, null);
});

test("原書順序:不存在的圖號不移動", () => {
  const b = Browse.createBrowser(entries);
  b.goto(7);
  for (const no of [0, 508, NaN]) {
    assert.equal(b.goto(no), false);
    assert.equal(b.follow(no), false);
  }
  const at = b.where();
  assert.equal(at.entry.no, "7");
  assert.equal(at.figure, 7);
});

test("原書順序:前後幾張的條目供預載", () => {
  const b = Browse.createBrowser([entry(1), entry(2), entry(3), entry(4)]);
  assert.deepEqual(b.around(2).map((e) => e.no), ["1", "2", "3"]);
  b.step(1);
  b.step(1);
  assert.deepEqual(b.around(1).map((e) => e.no), ["2", "3", "4"]);
});
