# 中譯檢查:雜項與旋轉引擎(第 412–429 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 11 張圖、21 筆(誤譯 3、漏譯 2、增譯 1、網站勘誤 0、原文疑誤 0、用詞統一 15)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 412 | `oriText/46.txt` 第 1 行 | the capstan can be used as a simple or compound machine, single or triple purchase | 具有單倍、雙倍或三倍的機械利益 | 具有單倍或三倍的機械利益 | 增譯:原文只有 single or triple,沒有雙倍。models/fig412.js:1 引用了「單倍、雙倍或三倍」,fig412.js:6 還寫「原文提到的雙倍機械利益沒有說明做法」,改譯後這兩處註解要跟著改;模型本身只做單倍/三倍,與原文一致。 |
| 413 | `oriText/46.txt` 第 3 行 | frictional gearing | 摩擦齒輪機構 | 摩擦傳動機構 | 用詞統一:摩擦輪沒有齒;第 45 種譯摩擦式溝槽傳動 |
| 416 | `oriText/46.txt` 第 9 行 | A device for assisting the crank of a treadle motion over the dead-centers. | 輔助曲柄運動以越過死點 | 輔助踏板運動（treadle motion）的曲柄越過死點 | 漏譯:漏了 treadle(踏板),且「曲柄運動」把 crank of a treadle motion 的結構讀錯。模型 fig416.js 已畫出踏板,不受影響。 |
| 419 | `oriText/46.txt` 第 15 行 | connect each to a standard or post attached to the rocker, E, of the cradle | 各自連接於搖籃搖桿 E 所附屬的支柱或立柱上 | 各自連接於搖籃弧形搖腳（rocker）E 上所附的支柱或立柱 | 誤譯:搖籃的 rocker 是底下的弧形搖腳,不是連桿機構裡的「搖桿」。模型把 E 做成弧面在地上滾動,結構正確;但 models/fig419.js:2、5、13 與 tests/rotary.test.js:130 用了「搖桿 E」的說法。 |
| 421 | `oriText/47.txt` 第 1 行 | a trunk at the lower end of which the pitman is connected directly with the piston | 其下端直接與連桿（pitman）相連 | 連桿（pitman）在筒管下端直接與活塞相連 | 漏譯:漏了 with the piston:重點是連桿直接接在活塞上(在筒管裡),不是接在筒管上。模型 fig421.js:1 已寫成連桿下端接活塞。 |
| 421 | `oriText/47.txt` 第 1 行 | stuffing-box in cylinder-head | 圓筒端蓋 | 汽缸蓋 | 用詞統一:cylinder:規則指定:引擎的 cylinder-head → 汽缸蓋 |
| 421 | `oriText/47.txt` 第 1 行 | in the part of cylinder below | 下方圓筒的部分 | 下方汽缸的部分 | 用詞統一:cylinder:筒狀蒸汽引擎,引擎裡裝活塞的 cylinder |
| 422 | `oriText/47.txt` 第 3 行 | The profile of the cylinder A | 圓筒 A 的剖面呈扇形 | 汽缸 A 的剖面呈扇形 | 用詞統一:cylinder:擺動活塞蒸汽引擎,裝活塞的 cylinder(扇形) |
| 422 | `oriText/47.txt` 第 3 行 | steam is admitted to the cylinder | 被引入圓筒 | 被引入汽缸 | 用詞統一:cylinder:擺動活塞蒸汽引擎,引擎裡裝活塞的 cylinder |
| 424 | `oriText/47.txt` 第 7 行 | the piston, C, is connected with the wrist, a, of the crank on the main shaft, b | 曲柄的手腕 a | 曲柄的腕銷（wrist）a | 誤譯:wrist(wrist-pin)是曲柄銷,「手腕」是字面直譯。模型 fig424.js:2 已用「曲柄銷 a」。全書他處(如 tests/cranks.test.js:107 第 93 種、tests/engines.test.js:457 第 176–177 種)也用「手腕」,可能要全書統一。 |
| 424 | `oriText/47.txt` 第 7 行 | The "cylinder," A, of this engine | 「圓筒」A | 「汽缸」A | 用詞統一:cylinder:方形活塞蒸汽引擎;原文加引號是因為它是方的,仍是裝活塞的汽缸 |
| 425 | `oriText/47.txt` 第 9 行 | A is the cylinder | A 為圓筒 | A 為汽缸 | 用詞統一:cylinder:旋轉式蒸汽引擎,裝活塞的 cylinder |
| 425 | `oriText/47.txt` 第 9 行 | working in contact with the cylinder at one point | 於一點與圓筒接觸 | 於一點與汽缸接觸 | 用詞統一:cylinder:旋轉式蒸汽引擎,引擎裡裝活塞的 cylinder |
| 426 | `oriText/47.txt` 第 11 行 | within the cylinder | 圓筒內有兩個靜止的擋板 | 汽缸內有兩個靜止的擋板 | 用詞統一:cylinder:旋轉式蒸汽引擎,引擎裡裝活塞的 cylinder |
| 427 | `oriText/47.txt` 第 13 行 | eccentric to the cylinder | 與圓筒偏心 | 與汽缸偏心 | 用詞統一:cylinder:旋轉式蒸汽引擎,引擎裡裝活塞的 cylinder |
| 427 | `oriText/47.txt` 第 13 行 | always radial to the cylinder | 與圓筒保持徑向 | 與汽缸保持徑向 | 用詞統一:cylinder:旋轉式蒸汽引擎,引擎裡裝活塞的 cylinder |
| 427 | `oriText/47.txt` 第 13 行 | hubs on the cylinder-heads | 圓筒端蓋輪轂 | 汽缸蓋輪轂 | 用詞統一:cylinder:規則指定:引擎的 cylinder-head → 汽缸蓋 |
| 428 | `oriText/47.txt` 第 15 行 | said rollers being attached to arms radiating from the main shaft, B | 放射延伸的搖臂上 | 放射延伸的臂上 | 誤譯:arms 是從主軸放射出去、隨軸一起轉的臂(輻臂),不會擺動,不是「搖臂」。models/fig428.js:2 與 :65 註解用了「搖臂」;模型結構(臂固定在主軸上)正確。 |
| 428 | `oriText/47.txt` 第 15 行 | the cylinder has a flexible lining | 其圓筒具有 | 其汽缸具有 | 用詞統一:cylinder:橡膠旋轉式蒸汽引擎,裝滾子(代替活塞)的 cylinder |
| 428 | `oriText/47.txt` 第 15 行 | the surrounding rigid portion of the cylinder | 剛性的圓筒部分 | 剛性的汽缸部分 | 用詞統一:cylinder:同上 |
| 428 | `oriText/47.txt` 第 15 行 | revolve around the cylinder | 繞圓筒旋轉 | 繞汽缸旋轉 | 用詞統一:cylinder:同上 |
