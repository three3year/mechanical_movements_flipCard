# 中譯檢查:引擎與調速機構 下(第 173–190 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 8 張圖、14 筆(誤譯 7、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 7)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 173 | `oriText/20.txt` 第 3 行 | A wrist secured to a nut on the screw enters and works in a slotted bar at the end of the rod which guides the silk on the bobbins. | 附著於螺桿上的一個手腕（wrist）進入螺帽中並作動，該螺帽位於桿末端的開槽桿內， | 固定於螺桿上螺帽的一個手腕（wrist），進入並作動於桿末端的開槽桿內， | 誤譯:英文是手腕固定在螺桿上的螺帽上、伸進導桿末端的開槽桿;中譯變成手腕附著於螺桿、伸進螺帽,螺帽位於開槽桿內,零件關係錯。模型 fig173.js:2、:11、:167 是螺帽帶手腕銷伸進 T 形桿直槽,和英文一致。 |
| 173 | `oriText/20.txt` 第 3 行 | bevel-gear | 斜齒輪 | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 173 | `oriText/20.txt` 第 3 行 | wrist | 手腕 | 腕銷 | 用詞統一:wrist(wrist-pin)是腕銷,「手腕」是字面直譯 |
| 176、177 | `oriText/20.txt` 第 9 行 | wrist | 手腕(2 處) | 腕銷 | 用詞統一:wrist(wrist-pin)是腕銷,「手腕」是字面直譯 |
| 179 | `oriText/20.txt` 第 13 行 | Reversing-gear for a single engine. | 換向齒輪機構（Reversing-gear） | 換向機構（Reversing-gear） | 誤譯:reversing-gear 的 gear 是「機構」,本圖靠偏心輪與凸出部分換向,沒有齒輪。models/fig179.js:1 檔頭寫「單一引擎的換向齒輪」。 |
| 181 | `oriText/21.txt` 第 1 行 | Diagonal catch or hand-gear used in large blowing and pumping engines. | 或稱手動齒輪機構 | 或稱手動操縱機構 | 誤譯:hand-gear 是用手柄操縱閥門的機構,沒有齒輪(第 181、182 種共用此句)。models/fig181.js:1 檔頭寫「或稱手動齒輪」。 |
| 181 | `oriText/21.txt` 第 1 行 | the back weight will pull the handle up | 其後方的配重 | 其配重 | 誤譯:back weight 應是「配重(平衡錘)」一詞,不是「在後方的」重物;拿不準原圖配重是否確實在後方。模型(cornish-model.js)沒把配重放在後方,只用彈簧模擬;models/fig181.js:3 引用「被後方的配重拉起」。 |
| 182 | `oriText/21.txt` 第 1 行 | when the piston is at the top of the cylinder | 活塞位於圓筒頂部時 | 活塞位於汽缸頂部時 | 用詞統一:cylinder 是引擎汽缸;全書慣用「圓筒」,需統一決定。models/fig182.js:1 引用「活塞位於圓筒頂部時」。 |
| 185 | `oriText/21.txt` 第 5 行 | Link-motion valve-gear of a locomotive. | 連桿運動閥門齒輪機構（Link-motion valve-gear） | 連桿運動閥動機構（Link-motion valve-gear） | 誤譯:valve-gear 是閥動機構,本圖沒有齒輪。models/fig185.js:1 檔頭寫「機車頭的連桿運動閥門齒輪」。同檔第 7 行(第 186 種)也有「閥門齒輪機構」,不在本批。 |
| 185 | `oriText/21.txt` 第 5 行 | the steam will have been admitted to the cylinder during almost the entire length of each stroke | 蒸汽都會被引入圓筒 | 蒸汽都會被引入汽缸 | 用詞統一:cylinder 是汽缸;全書慣用「圓筒」,需統一決定。模型與測試沒有引用這句。 |
| 185 | `oriText/21.txt` 第 5 行 | throw | 偏心輪之整個擺動幅度 | 偏心輪的整個行程（throw） | 用詞統一:偏心輪的 throw 是行程,偏心輪不擺動 |
| 185 | `oriText/21.txt` 第 5 行 | throw | 偏心輪擺動幅度的一部分 | 偏心輪行程的一部分 | 用詞統一:同上 |
| 186 | `oriText/21.txt` 第 7 行 | Apparatus for disengaging the eccentric-rod from the valve-gear | 用於將偏心桿與閥門齒輪機構脫鉤的裝置 | 用於將偏心桿與閥動機構脫鉤的裝置 | 誤譯(上一輪找到):valve-gear 是閥動機構,這裡沒有齒輪(model-audit #186-3) |
| 190 | `oriText/22.txt` 第 3 行 | the screw thrusts upward against the holder, which, operating as a lever | 螺桿會向上頂住支撐架，該支撐架以槓桿方式作動 | 螺桿會向上頂住壓桿，該壓桿以槓桿方式作動 | 誤譯(上一輪找到):holder 是壓住工件的槓桿(model-audit #190-3);models/fig190.js 檔頭「(支撐架)」跟著改 |
