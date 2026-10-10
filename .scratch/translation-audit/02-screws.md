# 中譯檢查:螺旋機構(第 102–112 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 3 張圖、4 筆(誤譯 4、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 0)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 108 | `oriText/12.txt` 第 11 行 | A point inserted in the groove will traverse the cylinder from end to end. | 將一個點放入該溝槽中 | 將一個尖點（point）放入該溝槽中 | 誤譯:point 指插進溝裡的尖頭件,不是幾何上的「點」;模型已做成尖點與滑座。引用:models/fig108.js:97 的 quote 照抄舊句。 |
| 111 | `oriText/13.txt` 第 1 行 | a die or nut fitted to the inner and smaller screw | 一個模具或螺帽 | 一個螺紋塊（die）或螺帽 | 誤譯:這裡的 die 是套在內側螺桿上、內有螺紋的塊(與 nut 並列),不是成形用的「模具」;拿不準最貼切的中文詞,故列疑問。模型結構(不轉、只上下移動的塊)與原文相符。引用:models/fig111.js:2-4、13、43、58、67(readout 標籤「模具前進」),tests/screws.test.js:45。 |
| 112 | `oriText/13.txt` 第 3 行 | The stock of the drill has a very quick thread cut upon it | 非常快速的螺紋 | 導程非常大的螺紋（very quick thread） | 誤譯:quick thread 是陡、導程大的螺紋,不是「快速」的螺紋;模型檔頭已寫「很快(導程很大)」。 |
| 112 | `oriText/13.txt` 第 3 行 | supported by the head at the top, which rests against the body. | 由頂部靠在本體上的頭部支撐 | 由頂部抵著身體（body）的頭部支撐 | 誤譯:the body 沒說是鑽的本體,較可能指操作者的身體(波斯鑽的頂頭抵在胸前);「本體」會被讀成機件本體。拿不準,列疑問。模型沒有畫本體或人。 |
