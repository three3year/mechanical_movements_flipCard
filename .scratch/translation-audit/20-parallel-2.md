# 中譯檢查:平行運動與引擎 下(第 336–349 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 9 張圖、13 筆(誤譯 2、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 10)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 337 | `oriText/37.txt` 第 13 行 | a short vibrating rod, the upper end of which | 短的振動桿的下端，該振動桿的上端 | 短的擺動桿的下端，該擺動桿的上端 | 用詞統一:vibrate / vibratory motion:平行運動機構中的短桿隨樑擺動 |
| 340 | `oriText/38.txt` 第 1 行 | Beam, D, C, with joggling pillar-support, B, F, which vibrates from the center, F. | 樑 D、C 透過搖動立柱支座 B、F 繞中心 F 擺動 | 樑 D、C 帶有搖動立柱支座 B、F，該支座繞中心 F 擺動 | 誤譯:which vibrates 的主詞是立柱支座 B、F,中譯變成樑繞 F 擺動。模型照英文做(立柱繞 F 擺、樑架在立柱頂,fig340.js:1),不用改;測試名稱 tests/parallel.test.js:222「樑繞搖動立柱 B–F 的中心 F 擺動」引用舊句。 |
| 341 | `oriText/38.txt` 第 3 行 | the shaft arranged as near to the cylinder as the crank will work | 配置得盡可能靠近圓筒，以便讓曲柄運作 | 在曲柄仍能運轉的範圍內，配置得盡可能靠近圓筒 | 誤譯:as near ... as the crank will work 是「近到曲柄還能轉為止」(限制條件),不是「為了讓曲柄運作」(目的)。模型註解(fig341.js:3)只寫盡量靠近汽缸,無誤。 |
| 341 | `oriText/38.txt` 第 3 行 | as near to the cylinder as the crank will work | 配置得盡可能靠近圓筒 | 配置得盡可能靠近汽缸 | 用詞統一:cylinder:蚱蜢式樑式引擎,引擎裡裝活塞的 cylinder |
| 342 | `oriText/38.txt` 第 5 行 | Very low pressure steam is admitted below piston | 低壓蒸汽於活塞下方被引入 | 極低壓的蒸汽於活塞下方被引入 | 漏譯:漏了 Very(大氣式引擎的蒸汽壓力只略高於大氣壓)。模型檔頭 fig342.js:2 寫「低壓蒸汽從活塞下方進入」,模型行為不受影響。 |
| 342 | `oriText/38.txt` 第 5 行 | The cylinder is open at top | 圓筒頂部為開放式 | 汽缸頂部為開放式 | 用詞統一:cylinder:大氣式蒸汽抽水引擎,引擎裡裝活塞的 cylinder |
| 343 | `oriText/38.txt` 第 7 行 | a vibrating piece on top of piston-rod | 頂部的振動部件 | 頂部的擺動部件 | 用詞統一:vibrate / vibratory motion:活塞桿頂部的件隨半徑桿擺動 |
| 344 | `oriText/38.txt` 第 9 行 | The cylinder has trunnions at the middle of its length | 圓筒於其長度的中點處 | 汽缸於其長度的中點處 | 用詞統一:cylinder:擺動式引擎,引擎裡裝活塞的 cylinder |
| 345 | `oriText/38.txt` 第 11 行 | The cylinder has trunnions at its upper end | 圓筒的上端具有樞軸 | 汽缸的上端具有樞軸 | 用詞統一:cylinder:倒置擺動式引擎,引擎裡裝活塞的 cylinder |
| 346 | `oriText/38.txt` 第 13 行 | The cylinder is fixed on a table-like base | 圓筒固定於桌形的底座上 | 汽缸固定於桌形的底座上 | 用詞統一:cylinder:桌式引擎,引擎裡裝活塞的 cylinder |
| 346 | `oriText/38.txt` 第 13 行 | fixed on top of cylinder | 固定在圓筒頂部 | 固定在汽缸頂部 | 用詞統一:cylinder:桌式引擎,引擎裡裝活塞的 cylinder |
| 347 | `oriText/38.txt` 第 15 行 | The cylinder-heads are cones | 圓筒的兩端為圓錐形 | 汽缸蓋為圓錐形 | 用詞統一:cylinder:碟形引擎的 cylinder-heads(兩端的端蓋)是汽缸蓋;去掉「的兩端」,汽缸蓋本身就在兩端 |
| 347 | `oriText/38.txt` 第 15 行 | concentric seats in cylinder-heads | 圓筒端部的同心座 | 汽缸蓋的同心座 | 用詞統一:cylinder:碟形引擎的 cylinder-heads → 汽缸蓋 |
