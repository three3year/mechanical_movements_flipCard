# 中譯檢查:繪圖儀器(第 403–411 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 6 張圖、13 筆(誤譯 11、漏譯 2、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 0)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 405 | `oriText/45.txt` 第 5 行 | One end of rule turns on one focus as a center through which one edge ranges. | 透過該焦點，尺的一邊可自由滑動 | 尺的一邊對準並通過該焦點 | 誤譯:ranges 是「對齊、成一直線」:尺的一邊通過該焦點,不是「可自由滑動」。模型(鉛筆在過 F1 的直尺線上)正確。 |
| 405 | `oriText/45.txt` 第 5 行 | with just enough slack between to permit height to reach vortex when rule coincides with center line | 以允許繩子的高度能貼靠於尺的邊緣與中心線交會的頂點 | 使尺與中心線重合時，繩的彎曲處（bight）恰好能到達頂點 | 誤譯:英文的 height、vortex 是 bight、vertex 的誤植(下句 held in bight 可證);條件是「尺與中心線重合時」繩的彎曲處到頂點,中譯把條件改成「尺邊與中心線交會的頂點」。模型幾何正確,但 models/fig405.js:2 檔頭照抄「到達直尺邊緣與中心線交會的頂點」。 |
| 406 | `oriText/45.txt` 第 7 行 | Lay straight edge with near side coinciding with directrix, and square with stock against the same | 放置直尺使其靠近側邊與準線重合，並以曲尺（square）靠在同一準線上 | 放置直尺使其近側的邊與準線重合，並將曲尺（square）的尺座（stock）靠在該直尺上 | 誤譯:「使其靠近側邊」把 near side(直尺近側的邊)讀成動作;另漏了 stock(曲尺的尺座)靠著直尺。模型(fig406.js:30 曲尺橫頭靠在直尺下緣)正確。 |
| 407 | `oriText/45.txt` 第 9 行 | the latter bar is bent till the upper side meets apex of arch, fulcrum-piece at its base insuring its retaining tangential relation to jamb | 接著將後者的直尺傾斜，直到其上側邊緣與拱頂石（apex）吻合，此時支點於其基部仍保持與拱腳相切的關係 | 接著將後者的直尺彎曲，直到其上側與拱的頂點（apex）相接，其基部的支點件（fulcrum-piece）確保它保持與拱腳相切的關係 | 誤譯:bent 是彎曲(彈性木條)不是傾斜;apex 是拱的頂點,不是拱頂石(keystone);相切的是尺,由基部支點件保證。模型已做成彎曲(正確),但 models/fig407.js:2 檔頭寫「傾斜到它的上緣碰到拱頂石」、:7 引「支點於其基部仍保持與拱腳相切」。 |
| 408 | `oriText/45.txt` 第 11 行 | for drawing lines toward an inaccessible or inconveniently distant point | 無法到達或極不方便的點 | 無法到達或遠得不便的點 | 漏譯:漏了 distant(距離遠)。 |
| 408 | `oriText/45.txt` 第 11 行 | legs forming it may form unequal angles with blade | 兩腿可能形成不相等的角度 | 兩腿與葉片所成的角度可以不相等 | 漏譯:漏了「與葉片」:是兩腿各自和葉片的夾角可不等。模型(fig408.js:2)正確。 |
| 408 | `oriText/45.txt` 第 11 行 | At either end of dotted line crossing central, a pin is inserted vertically | 於中央點劃線交叉處的任一端 | 於與中央線交叉之點劃線的兩端 | 誤譯:原文是「橫越中央線的那條點劃線」的兩端各插一根銷,中譯成了「中央點劃線交叉處的任一端」。 |
| 408 | `oriText/45.txt` 第 11 行 | a corresponding convergence may be found between them by drawing a line parallel to and inward from each | 透過從每根銷畫出一條與其平行且朝內的線 | 透過在每條會聚線的內側畫一條與之平行的線 | 誤譯:each 指每條會聚線,不是每根銷;做法是在每條會聚線內側畫平行線。模型沒有表現這個步驟。 |
| 410 | `oriText/45.txt` 第 15 行 | Of two parallel cheeks on the cross-bar one is fixed and the other adjustable | 兩個平行的夾頰中，橫桿上的一個是固定的 | 橫桿上的兩個平行夾頰中，一個是固定的 | 誤譯:on the cross-bar 修飾兩個夾頰,中譯像是只有固定的那個在橫桿上。 |
| 410 | `oriText/45.txt` 第 15 行 | one of two short bars of equal length, united by a pivot, having a sharp point for marking | 中點以一根樞軸連接起來，於接合處有一尖銳的頂點 | 兩桿另一端以一根樞軸連接起來，樞軸處有一個用來劃線的尖頭 | 誤譯:「中點」是增出來的且錯(兩短桿是末端相接成 V 形,不是在中點交叉);漏了 for marking。模型(fig410.js:2「另一端以一根樞軸連在一起」)正確。 |
| 410 | `oriText/45.txt` 第 15 行 | so that any parallel sided solid to which the cheeks are adjusted may be bisected from end to end by drawing the gauge along it | 因此夾頰所調整至之與其平行的任何固體，皆可透過沿其拉動量規而被對半等分 | 因此任何兩側平行的固體，只要將夾頰調整至貼合，沿其拉動量規，即可從一端到另一端被對半等分 | 誤譯:parallel sided 是「兩側平行的」,中譯成「與其平行的」;另漏 from end to end。 |
| 411 | `oriText/45.txt` 第 17 行 | Consists of a carriage, the shape of which is governed by an isosceles triangle | 由一台托架所組成 | 由一輛台車（carriage）所組成 | 誤譯:carriage 這裡是帶輪子、在地上推的車;「托架」通常指支撐架(bracket),讀者不易想到有輪子。拿不準是否算誤譯。引用:models/fig411.js:1、3、4 用「托架」;tests/instruments.test.js:184「鼓輪由托架輪帶動」。 |
| 411 | `oriText/45.txt` 第 17 行 | A drum, rotated by gearing from one of the carriage wheels | 其中一個托架輪 | 其中一個台車輪子 | 誤譯:同上一筆(carriage wheels);若上一筆不改,這筆也不改。引用:tests/instruments.test.js:184、models/fig411.js:3。 |
