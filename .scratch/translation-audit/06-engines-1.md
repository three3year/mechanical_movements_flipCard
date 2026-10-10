# 中譯檢查:引擎與調速機構 上(第 155–172 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 8 張圖、14 筆(誤譯 3、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 10)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 155 | `oriText/18.txt` 第 1 行 | elbow-lever | 肘節槓桿 | 肘形槓桿 | 用詞統一:elbow-lever 是彎成肘形的槓桿(角槓桿);「肘節」在本書另指 toggle-joint |
| 156 | `oriText/18.txt` 第 3 行 | wrist | 手腕 | 腕銷 | 用詞統一:wrist(wrist-pin)是腕銷,「手腕」是字面直譯 |
| 156 | `oriText/18.txt` 第 3 行 | elbow-lever | 肘節槓桿 | 肘形槓桿 | 用詞統一:elbow-lever 是彎成肘形的槓桿(角槓桿);「肘節」在本書另指 toggle-joint |
| 159 | `oriText/18.txt` 第 9 行 | a cord and pulley being substituted for the connecting rod | 繩索與皮帶輪 | 繩索與滑輪 | 用詞統一:pulley:繞繩索;models/fig159.js 已寫滑輪 |
| 161 | `oriText/18.txt` 第 13 行 | are driven from the engine by the bevel-gears at the top | 透過斜齒輪由引擎所驅動 | 透過頂部的斜齒輪由引擎所驅動 | 漏譯:漏了 at the top(斜齒輪在頂部)。模型 fig161.js:1 檔頭已寫「頂部的斜齒輪」,和英文一致。 |
| 161 | `oriText/18.txt` 第 13 行 | bevel-gear | 斜齒輪 | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 161 | `oriText/18.txt` 第 13 行 | The central spindle and attached arms and balls | 連接的搖臂和球體 | 連接的臂和球體 | 用詞統一:arm:調速器的球臂隨心軸整圈轉動;models/fig161.js、models/governor.js 註解也用「搖臂」,但沒有逐字引用這段原文 |
| 162 | `oriText/18.txt` 第 15 行 | bevel-gear | 斜齒輪(5 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 164 | `oriText/19.txt` 第 1 行 | differing slightly from the toggle-joint shown in 140 | 與第 40 種所示 | 與第 140 種所示 | 誤譯:圖號錯:英文是 140,中譯寫成 40。模型與測試沒有引用這個圖號。 |
| 164 | `oriText/19.txt` 第 1 行 | stamp | 衝壓機 | 搗錘 | 用詞統一:stamp 是靠自重落下的搗礦錘,不是沖床;和第 351 種一致 |
| 170 | `oriText/19.txt` 第 13 行 | Instead of the arms being connected with a slide working on a spindle | 搖臂並非連接於 | 兩臂並非連接於 | 用詞統一:arm:調速器的球臂隨心軸整圈轉動;句首單字「臂」不順,補「兩」(原圖兩支臂交叉);models/fig170.js 註解也用「搖臂」,但沒有逐字引用這段原文 |
| 171 | `oriText/19.txt` 第 15 行 | Valve motion and reversing gear used in oscillating marine engines | 換向齒輪機構 | 換向機構 | 誤譯:reversing gear 的 gear 是「機構、裝置」,本圖沒有齒輪(偏心輪+開槽連桿)。模型結構沒有齒輪,但 models/fig171.js:1 檔頭寫「閥門運動與換向齒輪」。 |
| 171 | `oriText/19.txt` 第 15 行 | give an oscillating motion to the slotted link which works the curved slide over the trunnion | 該連桿作動於樞軸（trunnion）上的曲面滑塊上 | 該連桿帶動樞軸（trunnion）上方的曲面滑塊 | 誤譯:works the curved slide 是及物的「帶動」曲面滑塊,中譯「作動於…上」讀成連桿在滑塊上滑動;over 是在樞軸上方。模型 fig171.js:3 是連桿經閥桿帶動樞軸上方的曲面滑塊,和英文一致。 |
| 171 | `oriText/19.txt` 第 15 行 | as it moves with the cylinder it does not interfere with the stroke of the valve | 因此當它隨圓筒一同運動時 | 因此當它隨汽缸一同運動時 | 用詞統一:此處 cylinder 是擺動式引擎的汽缸,譯「圓筒」讀者認不出是汽缸;但全書(如 38.txt 的引擎)都用「圓筒」,要不要改需統一決定。models/fig171.js:4 引用「圓筒擺動」「此處圓筒不動」。 |
