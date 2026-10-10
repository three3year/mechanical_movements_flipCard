# 中譯檢查:雜項裝置 三(第 386–402 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 7 張圖、9 筆(誤譯 3、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 5)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 390 | `oriText/43.txt` 第 11 行 | attached to a lever which works on a fulcrum, a | 一根以支點作動的槓桿上 | 一根以支點 a 作動的槓桿上 | 漏譯:漏了支點的字母 a。模型檔頭已寫「以 a 為支點」。 |
| 391 | `oriText/43.txt` 第 13 行 | elbow-lever | 肘節槓桿 | 肘形槓桿 | 用詞統一:elbow-lever 是彎成肘形的槓桿(角槓桿);「肘節」在本書另指 toggle-joint |
| 393 | `oriText/43.txt` 第 17 行 | in a cup connected by a ball-and-socket joint and bent piece of metal with a rotating upright shaft set concentric to the body to be polished | 該杯子透過一個球窩接頭與一塊彎曲的金屬片相連，該金屬片則與一根旋轉的直立軸同心配置，該軸與欲拋光的物體同心 | 該杯子透過一個球窩接頭與一塊彎曲的金屬片，連接於一根旋轉的直立軸，該軸與欲拋光的物體同心配置 | 誤譯:原文是杯子經球窩接頭與彎金屬片連到直立軸,同心的是軸與工件;中譯說金屬片與直立軸同心,不對。模型(fig393.js:1-2)理解正確。 |
| 394 | `oriText/44.txt` 第 1 行 | oscillating cylinder engine | 擺動式圓筒引擎 | 擺動式汽缸引擎 | 用詞統一:cylinder:規則指定:擺動式圓筒引擎 → 擺動式汽缸引擎 |
| 395 | `oriText/44.txt` 第 3 行 | Four-way cock ... produced by a quarter turn of the plug | 四向活塞閥（Four-way cock） | 四通旋塞（Four-way cock） | 誤譯:cock 是旋塞(轉閥塞換向,同句也說「閥塞轉動 1/4 圈」),不是活塞閥(piston valve)。模型做的是旋塞,結構沒錯;引用:models/fig395.js:1「四向活塞閥(four-way cock)」、tests/misc.test.js:504 測試名稱「四向活塞閥」。 |
| 395 | `oriText/44.txt` 第 3 行 | exhaust steam from the cylinder | 排出圓筒中的蒸汽 | 排出汽缸中的蒸汽 | 用詞統一:cylinder:蒸汽引擎的四通旋塞,引擎裡裝活塞的 cylinder |
| 395 | `oriText/44.txt` 第 3 行 | the exhaust is from the right end of the cylinder | 從圓筒的右端排出 | 從汽缸的右端排出 | 用詞統一:cylinder:蒸汽引擎,引擎裡裝活塞的 cylinder |
| 400 | `oriText/44.txt` 第 13 行 | The bar, B, is lifted by a radial projection on the cam, C, at the same time the two bars are carried forward. A spring produces the return stroke, and the bar, B, drops of its own gravity. | 桿 A 由凸輪 C | 桿 B 由凸輪 C | 誤譯:原文是凸輪把鉸在叉口裡的桿 B 抬起(之後 B 也是自己落下),中譯寫成 A。模型照錯譯做:凸輪抬整根 A、B 坐在 A 右端跟著 A 升落(models/fig400.js:2、7、10),應改成 A 只被帶著前後走、凸輪抬 B 繞叉口樞軸升起、B 靠自重落下。引用:fig400.js:2「凸輪 C 上的徑向凸起把桿 A 抬起」;tests/misc.test.js:574 測試名稱「A 由凸輪頂起與推前」、:588「A 坐在凸輪上」。 |
| 401 | `oriText/44.txt` 第 15 行 | wrist | 手腕(2 處) | 腕銷 | 用詞統一:wrist(wrist-pin)是腕銷,「手腕」是字面直譯 |
