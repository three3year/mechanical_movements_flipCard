# 中譯檢查:水車與泵 下(第 450–469 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 10 張圖、19 筆(誤譯 2、漏譯 0、增譯 0、網站勘誤 1、原文疑誤 0、用詞統一 16)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 450 | `oriText/50.txt` 第 5 行 | The cylinder is above water | 圓筒位於水面之上 | 泵缸位於水面之上 | 用詞統一:cylinder:壓力泵,泵裡裝活塞的 cylinder |
| 450 | `oriText/50.txt` 第 5 行 | water rushes into cylinder | 水湧入圓筒 | 水湧入泵缸 | 用詞統一:cylinder:壓力泵,泵裡裝活塞的 cylinder |
| 452 | `oriText/50.txt` 第 9 行 | Cylinder closed at each end | 圓筒兩端封閉 | 泵缸兩端封閉 | 用詞統一:cylinder:雙動式泵,泵裡裝活塞的 cylinder |
| 452 | `oriText/50.txt` 第 9 行 | the cylinder has four openings | 圓筒上有四個 | 泵缸上有四個 | 用詞統一:cylinder:雙動式泵,泵裡裝活塞的 cylinder |
| 452 | `oriText/50.txt` 第 9 行 | suction-valve, 1, on upper end of cylinder | 從圓筒上端的吸水閥 | 從泵缸上端的吸水閥 | 用詞統一:cylinder:雙動式泵,泵裡裝活塞的 cylinder |
| 452 | `oriText/50.txt` 第 9 行 | discharge-valve, 4, on upper end of cylinder | 經由圓筒上端的排水閥 | 經由泵缸上端的排水閥 | 用詞統一:cylinder:雙動式泵,泵裡裝活塞的 cylinder |
| 455 | `oriText/50.txt` 第 15 行 | inner surface of outer cylinder | 外側圓筒的內表面 | 外側泵缸的內表面 | 用詞統一:cylinder:旋轉泵的外殼,裡面轉的閥門/活塞貼著它推水,等同引擎第 425–428 種的汽缸;模型 fig455.js / fig456.js 的註解與標籤也用「圓筒」(非引用原文,不必同步) |
| 455 | `oriText/50.txt` 第 15 行 | lower side of cylinder | 圓筒下側 | 泵缸下側 | 用詞統一:cylinder:旋轉泵的外殼,裡面轉的閥門/活塞貼著它推水,等同引擎第 425–428 種的汽缸;模型 fig455.js / fig456.js 的註解與標籤也用「圓筒」(非引用原文,不必同步)。引用:models/fig455.js:2(註解) |
| 456 | `oriText/50.txt` 第 17 行 | Within the fixed cylinder | 在固定的圓筒內 | 在固定的泵缸內 | 用詞統一:cylinder:旋轉泵的外殼,裡面轉的閥門/活塞貼著它推水,等同引擎第 425–428 種的汽缸;模型 fig455.js / fig456.js 的註解與標籤也用「圓筒」(非引用原文,不必同步) |
| 458 | `oriText/51.txt` 第 3 行 | The common pulley and buckets for raising water | 汲水用皮帶輪與水桶 | 汲水用滑輪與水桶 | 誤譯:繩繞的 pulley 是滑輪,不是皮帶輪。模型 fig458.js 與 tests/water.test.js:470 已用「滑輪」。 |
| 459 | `oriText/51.txt` 第 5 行 | Behind worm-wheels are pulleys over which passes rope | 蝸輪後方有皮帶輪，繩索繞過皮帶輪 | 蝸輪後方有滑輪，繩索繞過滑輪 | 誤譯:同第 458 種:繩索繞的是滑輪。模型 fig459.js 已用「滑輪」。 |
| 459 | `oriText/51.txt` 第 5 行 | Coupling of latter allows small vibration | 些微的振動 | 些微的擺動 | 用詞統一:vibrate / vibratory motion:接頭讓螺旋軸小幅擺向一側,一次只嚙合一個蝸輪;非高頻震動 |
| 459 | `oriText/51.txt` 第 5 行 | vibrating tappet | 振動撥爪 | 擺動撥爪 | 用詞統一:vibrate / vibratory motion:撥爪被水桶撞擊時擺向一側,經臂把螺旋移到另一輪 |
| 462 | `oriText/51.txt` 第 11 行 | adapted to water-tight cylinder | 不漏水的圓筒 | 不漏水的泵缸 | 用詞統一:cylinder:鏈式泵的筒,碟片在裡面像活塞一樣把水往上推,屬泵缸;但它是一根長管,也可視為管/筒(拿不準)。fig462.js 註解與 tests/water.test.js:441、454 的測試名稱用「圓筒」(非逐字引用)。引用:models/fig462.js:1(註解)、tests/water.test.js:441(測試名稱) |
| 464 | `oriText/51.txt` 第 15 行 | Hero's fountain. | 希羅噴泉（Hiero's fountain，即 Hero's fountain） | 希羅噴泉（Hero's fountain） | 網站勘誤:網站勘誤:原書拼作 Hiero,網站依第 474 種的拼法改為 Hero(亞歷山卓的希羅)。中譯仍保留原書錯拼。模型 fig464.js 只寫「希羅噴泉」,不受影響。 |
| 466 | `oriText/52.txt` 第 1 行 | the ram cylinder | 柱塞圓筒（ram cylinder） | 柱塞缸（ram cylinder） | 用詞統一:cylinder:水壓機裝柱塞的 cylinder;ram cylinder 的通用譯名是「柱塞缸」。fig466.js:1 註解用「柱塞圓筒」(非逐字引用) |
| 467 | `oriText/52.txt` 第 3 行 | the cylinder with claw attached | 附有爪鉤的圓筒 | 附有爪鉤的液壓缸 | 用詞統一:cylinder:液壓千斤頂裡套在柱塞上、裝水的 cylinder → 液壓缸;fig467.js 註解、readout「圓筒升起」與 tests/water.test.js:594 用「圓筒」(非逐字引用)。引用:models/fig467.js:1(註解) |
| 467 | `oriText/52.txt` 第 3 行 | forces it ... into the cylinder | 將水壓入圓筒 | 將水壓入液壓缸 | 用詞統一:cylinder:液壓千斤頂裡套在柱塞上、裝水的 cylinder → 液壓缸;fig467.js 註解、readout「圓筒升起」與 tests/water.test.js:594 用「圓筒」(非逐字引用) |
| 467 | `oriText/52.txt` 第 3 行 | and so raises the latter | 抬升圓筒 | 抬升液壓缸 | 用詞統一:cylinder:液壓千斤頂裡套在柱塞上、裝水的 cylinder → 液壓缸;fig467.js 註解、readout「圓筒升起」與 tests/water.test.js:594 用「圓筒」(非逐字引用) |
