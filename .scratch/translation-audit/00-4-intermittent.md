# 中譯檢查:間歇與棘輪運動(第 63–85 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 15 張圖、18 筆(誤譯 8、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 1、用詞統一 8)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 63 | `oriText/07.txt` 第 7 行 | spring throws down suddenly the drop, the pin on which strikes the pawl | 落板撞擊到棘爪的那根柱子 | 落板上的銷隨即撞擊棘爪 | 誤譯:the pin on which = 落板上的銷，撞擊的是棘爪；舊譯把銷（柱子）放到棘爪上。模型照舊譯做：柱子裝在棘爪上（models/fig063.js:23、40 POST/POST_AT），落板只有擋片（fig063.js:45、47），由擋片壓棘爪的柱子；註解 fig063.js:4、5 也引用「棘爪的柱子」。按英文應是落板上帶銷、銷撞棘爪。 |
| 64 | `oriText/07.txt` 第 9 行 | Upon the shaft carrying the worm-gear works another hollow shaft, on which is fixed cam, A. | 還套著另一根空心軸 A，A 上固定著凸輪（cam） | 還套著另一根空心軸，其上固定著凸輪（cam）A | 誤譯:A 是凸輪，不是空心軸。模型的凸輪與空心軸是同一個零件，標籤 A 放在這個零件上（fig064.js:90 hollowLabel），結構不受影響；但 models/fig064.js:1「蝸輪軸上套著空心軸 A,A 上固定一個蝸牛形凸輪」、fig064.js:2「推著 A 與凸輪走」沿用舊說法。 |
| 64 | `oriText/07.txt` 第 9 行 | A short piece of this hollow shaft is half cut away. | 這根空心軸有一小段被切除 | 這根空心軸有一小段被切去一半 | 漏譯:漏了 half：那一小段是把管壁切掉半圈，不是整段切除。模型的缺口只有 55°（fig064.js:9 FALL，缺口寬 = 落下角；models/worm-jump.js:2「空心軸切掉一段」與 gap 的弧），不是半圈。落下角可以小於缺口，模型要不要改成半圈缺口請維護者判斷（worm-jump.js 是第 64、66、67 種共用）。 |
| 64 | `oriText/07.txt` 第 9 行 | A pin fixed in worm-gear shaft turns hollow shaft and cam | 會頂住空心軸與凸輪 | 會帶動空心軸與凸輪旋轉 | 誤譯:turns = 帶著轉。模型是銷推著空心軸走，正確。 |
| 65 | `oriText/07.txt` 第 11 行 | at the instant tappet, A, strikes a stud, said notch faces the lever | 該凸柱亦面向槓桿 | 該凹槽正對著槓桿 | 誤譯:said notch 指凹槽，不是凸柱。模型照英文（models/fig065.js:3「C 上的凹槽轉到左端」），正確。 |
| 66 | `oriText/07.txt` 第 13 行 | attached to an arm secured in the shaft of the worm-gear | 固定在蝸輪軸上的搖臂上 | 固定在蝸輪軸上的臂上 | 用詞統一:arm:臂連同重物被銷推著整圈轉(推上頂點再落下,周而復始),不是來回擺;models/fig066.js 檔頭註解也用「搖臂」一詞,但沒有逐字引用這段原文 |
| 68 | `oriText/07.txt` 第 17 行 | turns the latter the distance of one notch in every revolution of C | 於每一次 C 完整旋轉時 | 於驅動輪 B 每一次完整旋轉時（譯注：原文作「每一次 C 完整旋轉」，依機構應為 B） | 原文疑誤:英文（含網站版）寫 every revolution of C，但照機構應是 B 每轉一圈（C 轉一格），網站沒有勘誤註記。中譯忠於字面；模型照 B（models/fig068.js:1）。是否改要維護者決定。 |
| 69 | `oriText/08.txt` 第 1 行 | the circumference entering between the teeth of the wheel, A, serves as a lock or stop | 而輪 A 上齒與齒之間的圓周部分，則在 | 而其圓周部分嵌入輪 A 的齒與齒之間，在 | 誤譯:嵌入 A 齒間的是 B 的圓周，舊譯變成 A 齒間的圓周。模型照英文（B 的圓周嵌在 A 兩齒尖之間），正確；models/fig069.js:3「原文說 A 上齒與齒之間的圓周部分起到鎖定或擋止的作用」引用舊句。 |
| 70 | `oriText/08.txt` 第 3 行 | the exterior of which serves as a bearing and stop for the studs | 軸承與擋止 | 承靠面與擋止 | 誤譯:這裡的 bearing 是凸柱靠著的承靠面，不是軸承這種零件。模型是輪緣外側托住凸柱，正確；models/fig070.js:2 註解「軸承與擋止」引用舊詞。 |
| 73 | `oriText/08.txt` 第 9 行 | the spring, B, passes under the strong spring, C, which presses it into a tooth of the ratchet-wheel, A | 將 C 壓入棘輪 A | 將 B 壓入棘輪 A | 誤譯:it 指 B：C 把 B 壓進棘輪的齒。模型照英文（models/fig073.js:3「C 把 B 往內壓」），正確。 |
| 74 | `oriText/08.txt` 第 11 行 | bevel-gear | 斜齒輪(2 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 75 | `oriText/08.txt` 第 13 行 | the vibrating-bar, D | 振動桿 D | 擺動桿 D | 用詞統一:vibrate / vibratory motion:D 是帶棘爪來回擺動的桿;引用:models/fig075.js:1 |
| 77 | `oriText/09.txt` 第 1 行 | The vibration of the lever, C, on the center or fulcrum, A | 支點 A 的振動運動 | 支點 A 的擺動運動 | 用詞統一:vibrate / vibratory motion:槓桿繞支點來回擺動 |
| 79 | `oriText/09.txt` 第 5 行 | the vibrating radial arms, C, C | 振動徑向臂 C、C | 擺動徑向臂 C、C | 用詞統一:vibrate / vibratory motion:徑向臂繞輪軸來回擺動 |
| 80 | `oriText/09.txt` 第 7 行 | the vibration of the lever, C | 槓桿 C 的振動 | 槓桿 C 的擺動 | 用詞統一:vibrate / vibratory motion:槓桿繞支點來回擺動 |
| 82 | `oriText/09.txt` 第 11 行 | A chain or strap attached to each treadle passes over the pulley, C | 繞過皮帶輪 C | 繞過滑輪 C | 用詞統一:pulley:鏈條(或帶)掛過 C 連接兩踏板,一踩一抬,是吊掛導引用而非皮帶傳動;models/fig082.js:2 已寫滑輪 C |
| 82 | `oriText/09.txt` 第 11 行 | the vibrating arms, B | 振動臂 B | 擺動臂 B | 用詞統一:vibrate / vibratory motion:臂 B 繞輪軸來回擺動;引用:models/fig082.js:1 |
| 83 | `oriText/09.txt` 第 13 行 | two ratchet-toothed arcs, C, one operating on each side of the ratchet-wheel, D | 其中一個弧形板作用於棘輪 D 的一側 | 兩者各作用於棘輪 D 的一側 | 誤譯:one operating on each side = 兩塊各作用在一側；舊譯讀成只有一塊作用在一側。模型兩塊分別推前緣與後緣，正確。 |
