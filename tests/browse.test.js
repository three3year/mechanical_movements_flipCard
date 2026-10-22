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

// 和頁面相同的載入順序:條目資料、用途檔、瀏覽模組
// vm 裡的陣列和測試的陣列原型不同,比對前用 [...x] 複製成測試這邊的陣列
const page = load("data.js", "uses.js", "browse.js");
const Browse = page("Browse");
const entries = page("entries");

const entry = (no, images = [no]) => ({ no: images.length > 1 ? `${images[0]}–${images.at(-1)}` : String(no), images: images.map((n) => `images/${n}.png`), text: [] });

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
  assert.deepEqual([...b.around(2).map((e) => e.no)], ["1", "2", "3"]);
  b.step(1);
  b.step(1);
  assert.deepEqual([...b.around(1).map((e) => e.no)], ["2", "3", "4"]);
});

// ── 用途檔 ──

const realUses = { groups: page("useGroups"), entryUses: page("entryUses") };

// 小型條目清單:第 1、2、3、5–6(多插圖)、7 種
const small = [entry(1), entry(2), entry(3), entry(5, [5, 6]), entry(7)];
const smallUses = () => ({
  groups: [
    { name: "甲", uses: ["甲一", "甲二"] },
    { name: "乙", uses: ["乙一"] },
  ],
  entryUses: { 1: ["甲一"], 2: ["甲二", "乙一"], 3: ["甲一"], 5: ["乙一"], 7: ["甲二"] },
});

test("用途檔:真正的用途檔沒有問題", () => {
  assert.deepEqual([...Browse.checkUses(entries, realUses)], []);
});

test("用途檔:完好的假用途檔沒有問題", () => {
  assert.deepEqual([...Browse.checkUses(small, smallUses())], []);
});

test("用途檔:條目沒有用途被報出", () => {
  const uses = smallUses();
  delete uses.entryUses[3];
  uses.entryUses[7] = [];
  const problems = Browse.checkUses(small, uses);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /圖 3.*沒有用途/);
  assert.match(problems[1], /圖 7.*沒有用途/);
});

test("用途檔:空的用途被報出", () => {
  const uses = smallUses();
  uses.groups[1].uses.push("乙二");
  assert.deepEqual([...Browse.checkUses(small, uses)], ["用途「乙二」沒有任何條目"]);
});

test("用途檔:用途名稱重複被報出", () => {
  const uses = smallUses();
  uses.groups[1].uses.push("甲一");
  assert.deepEqual([...Browse.checkUses(small, uses)], ["用途「甲一」重複"]);
});

test("用途檔:鍵不是任何條目的第一張插圖被報出", () => {
  const uses = smallUses();
  uses.entryUses[6] = ["甲一"];
  uses.entryUses[999] = ["甲一"];
  const problems = Browse.checkUses(small, uses);
  assert.deepEqual([...problems], ["圖 6 不是任何條目的第一張插圖", "圖 999 不是任何條目的第一張插圖"]);
});

test("用途檔:值是不存在的用途被報出", () => {
  const uses = smallUses();
  uses.entryUses[3] = ["甲一", "丙"];
  assert.deepEqual([...Browse.checkUses(small, uses)], ["圖 3 的用途「丙」不存在"]);
});

test("卡片上的用途:依用途檔的順序;沒有用途檔時是空的", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.setMode("book");
  b.step(1);
  assert.deepEqual([...b.where().uses], ["甲二", "乙一"]);
  assert.deepEqual([...Browse.createBrowser(small).where().uses], []);
});

// ── 用途瀏覽 ──
// 假用途檔的序列:甲一(1、3)→ 甲二(2、7)→ 乙一(2、5–6);第 2 種在兩個用途各出現一次

// 目前所在的精簡描述:「用途大類/用途/條目 第幾張/共幾張」
const at = (b) => {
  const w = b.where();
  return w.mode === "use" ? `${w.group}/${w.use}/${w.entry.no} ${w.index + 1}/${w.count}` : `book/${w.entry.no} ${w.index + 1}/${w.count}`;
};
// 從頭一路往後翻,記下每一張
const walk = (b) => {
  const seen = [at(b)];
  while (b.step(1)) seen.push(at(b));
  return seen;
};

test("用途瀏覽:預設在第一個用途大類的第一個用途的首張", () => {
  const b = Browse.createBrowser(small, smallUses());
  assert.equal(at(b), "甲/甲一/1 1/2");
  const w = b.where();
  assert.equal(w.atStart, true);
  assert.equal(w.figure, null);
  assert.equal(w.backNo, null);
});

test("用途瀏覽:用途內依圖號翻頁,跨用途、跨用途大類連續,同一條目在兩個用途各出現一次", () => {
  const b = Browse.createBrowser(small, smallUses());
  assert.deepEqual(walk(b), ["甲/甲一/1 1/2", "甲/甲一/3 2/2", "甲/甲二/2 1/2", "甲/甲二/7 2/2", "乙/乙一/2 1/2", "乙/乙一/5–6 2/2"]);
  assert.equal(b.where().atEnd, true);
  assert.equal(b.step(1), false);
});

test("用途瀏覽:往回翻也跨用途、跨用途大類,到序列頭停住", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  assert.equal(b.step(-1), true);
  assert.equal(at(b), "甲/甲二/7 2/2");
  b.step(-1);
  b.step(-1);
  assert.equal(at(b), "甲/甲一/3 2/2");
  b.step(-1);
  assert.equal(b.where().atStart, true);
  assert.equal(b.step(-1), false);
});

test("用途瀏覽:選用途大類落在它第一個用途的首張,選用途落在它的首張", () => {
  const b = Browse.createBrowser(small, smallUses());
  assert.equal(b.selectGroup("乙"), true);
  assert.equal(at(b), "乙/乙一/2 1/2");
  assert.deepEqual([...b.where().groupUses], ["乙一"]);
  assert.equal(b.selectUse("甲二"), true);
  assert.equal(at(b), "甲/甲二/2 1/2");
  assert.equal(b.selectUse("沒有這個"), false);
  assert.equal(at(b), "甲/甲二/2 1/2");
});

test("用途瀏覽:選用途大類、選用途是新的閱讀起點,返回堆疊清空、插圖不再指定", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.follow(6);
  b.selectGroup("甲");
  assert.equal(b.where().backNo, null);
  assert.equal(b.where().figure, null);
});

test("用途瀏覽:頁尾的圖數是目前用途的插圖數", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  assert.equal(b.where().figureCount, 3);
});

test("切換瀏覽方式:切到原書順序停在同一條目", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.step(1);
  assert.equal(b.setMode("book"), true);
  assert.equal(at(b), "book/5–6 4/5");
  assert.equal(b.where().group, null);
  assert.equal(b.setMode("book"), false);
});

test("切換瀏覽方式:切回用途瀏覽落在切走前所在用途大類裡的用途", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.step(1);
  b.setMode("book");
  b.step(-1);
  b.step(-1);
  assert.equal(b.where().entry.no, "2");
  b.setMode("use");
  assert.equal(at(b), "乙/乙一/2 1/2");
});

test("切換瀏覽方式:條目在切走前所在的用途大類裡沒有用途,落在它的第一個用途", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.setMode("book");
  b.goto(7);
  b.setMode("use");
  assert.equal(at(b), "甲/甲二/7 2/2");
});

test("切換瀏覽方式:選中的插圖保留,返回堆疊清空", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.follow(6);
  b.setMode("book");
  assert.equal(b.where().figure, 6);
  assert.equal(b.where().backNo, null);
  b.setMode("use");
  assert.equal(b.where().figure, 6);
  assert.equal(at(b), "乙/乙一/5–6 2/2");
});

test("用途瀏覽:沒有用途檔時只有原書順序", () => {
  const b = Browse.createBrowser(small);
  assert.equal(b.where().mode, "book");
  assert.equal(b.setMode("use"), false);
});

test("用途瀏覽:真正的用途檔下,487 個條目都在序列裡至少出現一次", () => {
  const b = Browse.createBrowser(entries, realUses);
  assert.equal(b.where().mode, "use");
  const seen = new Set([b.where().entry.no]);
  while (b.step(1)) seen.add(b.where().entry.no);
  assert.equal(seen.size, 487);
});

// ── 用途瀏覽下的交互參照、跳到圖號與返回 ──

test("交互參照:目標在目前用途大類裡有用途,落在其中排最前的那個", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.step(1);
  assert.equal(b.follow(2), true);
  assert.equal(at(b), "乙/乙一/2 1/2"); // 第 2 種的第一個用途是甲二,但目前在乙
});

test("交互參照:目標在目前用途大類裡沒有用途,落在它的第一個用途", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.follow(7);
  assert.equal(at(b), "甲/甲二/7 2/2");
});

test("交互參照:選中被指定的插圖", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.follow(6);
  assert.equal(at(b), "乙/乙一/5–6 2/2");
  assert.equal(b.where().figure, 6);
});

test("返回:回到原用途而非目標條目的其他用途,恢復原插圖,可多層", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectUse("甲二");
  b.selectFigure(2);
  b.follow(5);
  assert.equal(at(b), "乙/乙一/5–6 2/2");
  b.follow(2); // 第 2 種在乙裡有乙一
  assert.equal(at(b), "乙/乙一/2 1/2");
  assert.equal(b.where().backNo, "5–6");
  b.back();
  assert.equal(at(b), "乙/乙一/5–6 2/2");
  assert.equal(b.where().backNo, "2");
  b.back();
  assert.equal(at(b), "甲/甲二/2 1/2"); // 原本那一個,不是第 2 種在乙裡的那張
  assert.equal(b.where().figure, 2);
  assert.equal(b.where().backNo, null);
});

test("跳到圖號:同一落點規則,清空返回堆疊", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.follow(7);
  assert.equal(b.where().backNo, "2");
  b.selectGroup("乙");
  assert.equal(b.goto(2), true);
  assert.equal(at(b), "乙/乙一/2 1/2");
  b.follow(1);
  assert.equal(b.goto(6), true);
  assert.equal(at(b), "乙/乙一/5–6 2/2");
  assert.equal(b.where().figure, 6);
  assert.equal(b.where().backNo, null);
});

test("跳到圖號:找不到的圖號不移動", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.step(1);
  assert.equal(b.goto(4), false);
  assert.equal(b.goto(999), false);
  assert.equal(at(b), "甲/甲一/3 2/2");
});

test("原書順序下的跳轉不受用途影響", () => {
  const b = Browse.createBrowser(small, smallUses());
  b.selectGroup("乙");
  b.setMode("book");
  b.follow(2);
  assert.equal(at(b), "book/2 2/5");
  b.goto(7);
  assert.equal(at(b), "book/7 5/5");
});
