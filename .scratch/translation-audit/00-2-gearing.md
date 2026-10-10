# 中譯檢查:齒輪傳動(第 24–49 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 8 張圖、8 筆(誤譯 5、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 3)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 25 | `oriText/03.txt` 第 5 行 | bevel-gear | 斜齒輪(2 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 28 | `oriText/03.txt` 第 11 行 | These are sometimes called “brush-wheels.” | 此類齒輪有時被稱為 | 此類輪有時被稱為 | 誤譯:刷輪靠摩擦或附著力傳動，沒有齒；原文只說 These，中譯加了「齒輪」。模型 fig028.js 做成摩擦輪，正確。 |
| 29 | `oriText/03.txt` 第 13 行 | moving it the distance of one tooth at every revolution | 使其每旋轉一圈就移動一齒的距離 | 碟形輪每旋轉一圈，就使正齒輪移動一齒的距離 | 誤譯:every revolution 指碟形輪轉一圈；中譯的「其」指正齒輪，讀成正齒輪每轉一圈移動一齒，主詞錯。模型 fig029.js:2 與 tests/gearing.test.js:100 已是碟形輪每轉一圈，正確。 |
| 32 | `oriText/04.txt` 第 3 行 | one is sometimes faced with leather | 其中一面有時會鑲覆皮革 | 其中一個輪有時會在輪面鑲覆皮革 | 誤譯:one 指兩個摩擦輪中的一個（輪面覆皮革），不是「一面」。 |
| 36 | `oriText/04.txt` 第 11 行 | The shaft of pinion has a vibratory motion | 小齒輪的軸具有振動運動 | 小齒輪的軸具有擺動運動 | 誤譯:同第 6 種：vibratory motion 在本書指來回擺動（小齒輪軸在直槽內上下移動、繞曼格輪端頭），「振動」易誤解為震動。引用：models/fig036.js:6、fig036.js:109（「原文：小齒輪的軸有振動運動」）。 |
| 37 | `oriText/04.txt` 第 13 行 | bevel-gear | 斜齒輪 | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 39 | `oriText/04.txt` 第 17 行 | Each revolution of the planet-gear, which is rigidly attached to the connecting-rod, gives two to the sun-gear | 其每旋轉一圈 | 其每繞太陽齒輪公轉一圈 | 誤譯:行星齒輪剛性連在連桿上、本身不自轉，revolution 指繞太陽齒輪一圈；「旋轉一圈」可能被讀成自轉。原文本身也只寫 revolution，所以列疑問。模型 fig039.js:2 已寫「行星齒輪繞太陽齒輪一圈」，正確。 |
| 49 | `oriText/05.txt` 第 15 行 | bevel-gear | 斜齒輪(2 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
