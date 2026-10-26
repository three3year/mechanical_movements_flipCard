// 瀏覽模組:不碰畫面的導覽邏輯,頁面與 npm test 共用(一般 script,file:// 開也能載入)。
// 頁面每次動作都呼叫這裡,再依 where() 的回答畫出卡片、位置與返回鍵。
const Browse = (() => {
  const figureOf = (src) => parseInt(src.match(/(\d+)\.png$/)[1], 10);
  // 條目在用途檔裡的鍵:第一張插圖的圖號
  const keyOf = (entry) => figureOf(entry.images[0]);

  // 用途檔的完整性:回傳問題清單(沒有問題時是空陣列)。
  // uses 是 { groups: 用途大類清單, entryUses: 圖號 → 用途名稱 }
  function checkUses(entries, uses) {
    const problems = [];
    const names = new Set();
    for (const group of uses.groups) {
      for (const name of group.uses) {
        if (names.has(name)) problems.push(`用途「${name}」重複`);
        names.add(name);
      }
    }
    for (const entry of entries) {
      if (!uses.entryUses[keyOf(entry)]?.length) problems.push(`圖 ${entry.no} 沒有用途`);
    }
    const keys = new Set(entries.map(keyOf));
    const used = new Set();
    for (const [key, list] of Object.entries(uses.entryUses)) {
      if (!keys.has(Number(key))) {
        problems.push(`圖 ${key} 不是任何條目的第一張插圖`);
        continue;
      }
      for (const name of list) {
        if (names.has(name)) used.add(name);
        else problems.push(`圖 ${key} 的用途「${name}」不存在`);
      }
    }
    for (const name of names) {
      if (!used.has(name)) problems.push(`用途「${name}」沒有任何條目`);
    }
    return problems;
  }

  // uses 可省略(用途檔載入失敗時):只有原書順序與插圖總覽,卡片照常顯示,只是沒有用途
  function createBrowser(entries, uses) {
    const names = new Set(uses ? uses.groups.flatMap((group) => group.uses) : []);
    // 卡片上列出的用途:依用途檔的順序,略過不存在的用途
    const usesOf = (entry) => (uses?.entryUses[keyOf(entry)] ?? []).filter((name) => names.has(name));

    // 兩種瀏覽方式各一條序列,每一項是一張卡片:e 是條目索引;用途瀏覽另記用途大類索引 g 與用途名稱 u。
    // 原書順序是全部條目依編號排列;用途瀏覽是用途大類依序、用途大類內用途依序、用途內條目依編號,
    // 掛多個用途的條目在每個用途下各出現一次
    const sequences = {
      book: entries.map((entry, e) => ({ e })),
      use: (uses?.groups ?? []).flatMap((group, g) =>
        group.uses.flatMap((u) => entries.flatMap((entry, e) => (usesOf(entry).includes(u) ? [{ e, g, u }] : []))),
      ),
    };

    // 插圖總覽:全書插圖依圖號排成一面,不是序列;在總覽時 mode 與 pos 仍記著目前所在的卡片,只是不顯示它
    const figures = entries.flatMap((entry) => entry.images.map(figureOf)).sort((a, b) => a - b);

    let mode = sequences.use.length ? "use" : "book"; // 目前卡片所在的序列
    let overview = false;
    let pos = 0; // 在目前序列裡的位置
    let lastGroup = null; // 切到原書順序前最後所在的用途大類,切回時用來決定落點
    let figure = null; // 指定選中的插圖(交互參照、跳到圖號的目標);null 表示由頁面決定
    const backStack = []; // 交互參照的跳轉來源 { pos, figure },可多層依序退回

    const sequence = () => sequences[mode];
    const entryIndexOf = (no) => entries.findIndex((entry) => entry.images.some((src) => figureOf(src) === no));

    // 條目在目前序列裡的落點。用途瀏覽:條目在用途大類 g 裡有用途時,落在其中排最前的那個;
    // 否則落在它的第一個用途(依卡片上的用途順序)。找不到(條目沒有用途)時回傳 -1
    function landing(e, g) {
      if (mode === "book") return e;
      const inGroup = sequences.use.findIndex((item) => item.e === e && item.g === g);
      if (inGroup !== -1) return inGroup;
      const first = usesOf(entries[e])[0];
      return sequences.use.findIndex((item) => item.e === e && item.u === first);
    }
    const currentGroup = () => (mode === "use" ? sequences.use[pos].g : lastGroup);

    function where() {
      // 總覽:全部插圖,標出目前卡片選中的插圖(由頁面決定時是條目的第一張)
      if (overview) return { mode: "overview", figures, highlight: figure ?? keyOf(entries[sequence()[pos].e]) };
      const seq = sequence();
      const item = seq[pos];
      const entry = entries[item.e];
      const from = backStack[backStack.length - 1];
      // 位置與圖數:用途瀏覽算目前用途裡的,原書順序算全部
      const span = mode === "use" ? seq.filter((other) => other.u === item.u) : seq;
      return {
        mode,
        group: mode === "use" ? uses.groups[item.g].name : null,
        use: mode === "use" ? item.u : null,
        groupUses: mode === "use" ? uses.groups[item.g].uses : [], // 目前用途大類的用途,供第二排頁籤
        entry,
        uses: usesOf(entry),
        index: span.indexOf(item),
        count: span.length,
        atStart: pos === 0,
        atEnd: pos === seq.length - 1,
        figure,
        backNo: from ? entries[seq[from.pos].e].no : null,
        figureCount: span.reduce((sum, other) => sum + entries[other.e].images.length, 0),
      };
    }

    // 手動翻頁即離開參照脈絡:返回堆疊清空、插圖改由頁面決定
    function moveTo(next) {
      pos = next;
      figure = null;
      backStack.length = 0;
    }

    function step(delta) {
      if (overview) return false;
      const next = pos + delta;
      if (next < 0 || next >= sequence().length) return false;
      moveTo(next);
      return true;
    }

    // 選用途大類落在它第一個用途的首張;選用途落在它的首張
    function selectFirst(matches) {
      const next = mode === "use" && !overview ? sequences.use.findIndex(matches) : -1;
      if (next === -1) return false;
      moveTo(next);
      return true;
    }
    const selectGroup = (name) => selectFirst((item) => uses.groups[item.g].name === name);
    const selectUse = (name) => selectFirst((item) => item.u === name);

    // 「第 N 種」交互參照:跳到該圖所在條目並選中它,來源推入返回堆疊
    function follow(no) {
      const e = overview ? -1 : entryIndexOf(no);
      if (e === -1 || e === sequence()[pos].e) return false;
      const next = landing(e, currentGroup());
      if (next === -1) return false;
      backStack.push({ pos, figure });
      pos = next;
      figure = no;
      return true;
    }

    // 跳到圖號:同樣選中該圖,但視為新的閱讀起點,返回堆疊清空
    function goto(no) {
      const e = overview ? -1 : entryIndexOf(no);
      const next = e === -1 ? -1 : landing(e, currentGroup());
      if (next === -1) return false;
      backStack.length = 0;
      pos = next;
      figure = no;
      return true;
    }

    function back() {
      const from = overview ? null : backStack.pop();
      if (!from) return false;
      pos = from.pos;
      figure = from.figure;
      return true;
    }

    // 切換瀏覽方式:停在同一條目、選中的插圖保留;和手動切頁籤一樣視為新的閱讀起點,返回堆疊清空。
    // 進總覽不動目前的卡片;從總覽切回卡片所在的瀏覽方式就回到那張卡片,切到另一種則照從卡片切換的落點
    function setMode(next) {
      const toOverview = next === "overview";
      if (toOverview ? overview : !sequences[next]?.length || (next === mode && !overview)) return false;
      if (mode === "use" && next !== mode) lastGroup = sequences.use[pos].g;
      overview = toOverview;
      if (!toOverview && next !== mode) {
        const e = sequence()[pos].e;
        mode = next;
        pos = landing(e, lastGroup);
      }
      backStack.length = 0;
      return true;
    }

    // 總覽裡點一格:以原書順序打開該圖所在的條目並選中它,視為新的閱讀起點
    function open(no) {
      const e = overview ? entryIndexOf(no) : -1;
      if (e === -1) return false;
      overview = false;
      mode = "book";
      pos = e;
      figure = no;
      backStack.length = 0;
      return true;
    }

    // 頁面選了別的插圖(模型模式下多插圖條目的小頁籤)
    function selectFigure(no) {
      figure = no;
    }

    // 目前卡片前後各 d 張的條目(含自己),供預載圖片
    function around(d) {
      return sequence().slice(Math.max(0, pos - d), pos + d + 1).map((item) => entries[item.e]);
    }

    return { where, step, selectGroup, selectUse, follow, goto, back, setMode, open, selectFigure, around };
  }

  return { createBrowser, checkUses };
})();
