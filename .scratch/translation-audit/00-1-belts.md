# 中譯檢查:皮帶與滑輪(第 1–23 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 10 張圖、15 筆(誤譯 13、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 2)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 3 | `oriText/01.txt` 第 7 行 | one for each leaf of the belt | 每一個對應皮帶的一葉（leaf） | 每一個對應皮帶的一邊（leaf） | 誤譯:leaf 指皮帶在兩輪之間的一段（一邊、一股），「一葉」是字面直譯、中文讀不懂；拿不準要用「一邊」或「一段」。models/fig003.js:1 註解寫「兩個導引輪各導一葉皮帶」。 |
| 6 | `oriText/01.txt` 第 13 行 | By giving a vibratory motion to the lever | 施加振動運動 | 施加擺動運動 | 用詞統一:本書的 vibratory motion 指來回擺動（槓桿是用手來回扳），中文「振動」偏指小幅快速震動；模型 fig006.js:1 已寫「擺動」。是否全書統一改譯請維護者決定。 |
| 7 | `oriText/01.txt` 第 15 行 | The belt is shown on the middle one of the three pulleys on the lower shafts, a, b | 圖中皮帶位於下方軸上三個皮帶輪的中間那個 a、b 之上 | 圖中皮帶位於下方軸 a、b 上三個皮帶輪的中間那個之上 | 誤譯:a、b 是下方的兩根軸（後文：空心軸 b、在 b 內部運轉的軸 a），中譯把 a、b 掛到中間那個皮帶輪上。模型 fig007.js 的 a、b 標在軸上，正確。 |
| 7 | `oriText/01.txt` 第 15 行 | bevel-gear | 斜齒輪 | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 12 | `oriText/02.txt` 第 3 行 | Simple pulley used for lifting weights. | 用於吊起重物的簡單皮帶輪 | 用於吊起重物的簡單滑輪 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。引用：models/fig012.js:1、tests/hoists.test.js:44。 |
| 13 | `oriText/02.txt` 第 5 行 | In this the lower pulley is movable. | 下方的皮帶輪為可動式 | 下方的滑輪為可動式 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。引用：models/fig013.js:1（「下方皮帶輪可動」）、tests/hoists.test.js:51。 |
| 14 | `oriText/02.txt` 第 7 行 | Divide the weight by double the number of pulleys in the lower block | 下方滑輪組中皮帶輪數量的兩倍 | 下方滑輪組中滑輪數量的兩倍 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。引用：models/fig014.js:1–2（「三個並排的皮帶輪」「下方皮帶輪數 × 2」）、tests/hoists.test.js:100。 |
| 15 | `oriText/02.txt` 第 9 行 | can either be made with separate loose pulleys | 分離的鬆動皮帶輪 | 分離的鬆動滑輪 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。 |
| 18 | `oriText/02.txt` 第 13 行 | a combination of two fixed pulleys and one movable pulley | 兩個固定皮帶輪與一個可動皮帶輪 | 兩個固定滑輪與一個可動滑輪 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。引用：models/fig018.js:1、tests/hoists.test.js:132（測試名稱逐字引用舊句）。 |
| 19 | `oriText/02.txt` 第 15 行 | Are different arrangements of pulleys. | 為皮帶輪的不同配置方式 | 為滑輪的不同配置方式 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。同一行還有五處，見下面幾筆。引用：models/fig019.js:1、fig020.js:1、fig021.js:1、models/hung-from-weight.js:1、tests/hoists.test.js:150–151（「2 的皮帶輪數量次方減 1」）。 |
| 19 | `oriText/02.txt` 第 15 行 | The following rule applies to these pulleys | 適用於這些皮帶輪 | 適用於這些滑輪 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。 |
| 19 | `oriText/02.txt` 第 15 行 | where each pulley is embraced by a cord | 若每一個皮帶輪都由 | 若每一個滑輪都由 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。 |
| 19 | `oriText/02.txt` 第 15 行 | at the other to the center of the movable pulley | 接於可動皮帶輪的中心 | 接於可動滑輪的中心 | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。 |
| 19 | `oriText/02.txt` 第 15 行 | as many times as there are movable pulleys in the system | 系統中可動皮帶輪數量相同的次數（即 2 的可動皮帶輪數量次方） | 系統中可動滑輪數量相同的次數（即 2 的可動滑輪數量次方） | 誤譯:原文是吊重物、繞繩的滑輪（pulley），沒有皮帶；譯成「皮帶輪」是零件認錯（第 14 種同句已用「滑輪組」，前後不一）。 |
| 23 | `oriText/03.txt` 第 1 行 | hangs from a rope passing over the two guide-pulleys, B, B | 兩個導引皮帶輪 B、B | 兩個導引滑輪 B、B | 誤譯:B、B 是讓吊住 A 的繩索繞過的滑輪，不是皮帶輪（同句的 A 與底部輪才在皮帶上，維持「皮帶輪」）。模型 fig023.js:3 寫「導引輪 B、B」，無需改。 |
