// 瀏覽模組:不碰畫面的導覽邏輯,頁面與 npm test 共用(一般 script,file:// 開也能載入)。
// 頁面每次動作都呼叫這裡,再依 where() 的回答畫出卡片、位置與返回鍵。
const Browse = (() => {
  const figureOf = (src) => parseInt(src.match(/(\d+)\.png$/)[1], 10);

  function createBrowser(entries) {
    // 目前序列:原書順序就是全部條目依編號排列
    const sequence = entries.map((entry, e) => ({ e }));
    let pos = 0;
    let figure = null; // 指定選中的插圖(交互參照、跳到圖號的目標);null 表示由頁面決定
    const backStack = []; // 交互參照的跳轉來源,可多層依序退回

    const entryIndexOf = (no) => entries.findIndex((entry) => entry.images.some((src) => figureOf(src) === no));
    const landing = (e) => sequence.findIndex((item) => item.e === e);

    function where() {
      const entry = entries[sequence[pos].e];
      const from = backStack[backStack.length - 1];
      return {
        mode: "book",
        entry,
        index: pos,
        count: sequence.length,
        atStart: pos === 0,
        atEnd: pos === sequence.length - 1,
        figure,
        backNo: from ? entries[sequence[from.pos].e].no : null,
        figureCount: sequence.reduce((sum, item) => sum + entries[item.e].images.length, 0),
      };
    }

    // 手動翻頁即離開參照脈絡:返回堆疊清空、插圖改由頁面決定
    function step(delta) {
      const next = pos + delta;
      if (next < 0 || next >= sequence.length) return false;
      pos = next;
      figure = null;
      backStack.length = 0;
      return true;
    }

    // 「第 N 種」交互參照:跳到該圖所在條目並選中它,來源推入返回堆疊
    function follow(no) {
      const e = entryIndexOf(no);
      if (e === -1 || e === sequence[pos].e) return false;
      backStack.push({ pos, figure });
      pos = landing(e);
      figure = no;
      return true;
    }

    // 跳到圖號:同樣選中該圖,但視為新的閱讀起點,返回堆疊清空
    function goto(no) {
      const e = entryIndexOf(no);
      if (e === -1) return false;
      backStack.length = 0;
      pos = landing(e);
      figure = no;
      return true;
    }

    function back() {
      const from = backStack.pop();
      if (!from) return false;
      pos = from.pos;
      figure = from.figure;
      return true;
    }

    // 頁面選了別的插圖(多插圖條目的小頁籤,或依有無模型改選)
    function selectFigure(no) {
      figure = no;
    }

    // 目前卡片前後各 d 張的條目(含自己),供預載圖片
    function around(d) {
      return sequence.slice(Math.max(0, pos - d), pos + d + 1).map((item) => entries[item.e]);
    }

    return { where, step, follow, goto, back, selectFigure, around };
  }

  return { createBrowser };
})();
