# 中譯檢查:離合與變速(第 50–62 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 5 張圖、9 筆(誤譯 6、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 3)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 53 | `oriText/06.txt` 第 5 行 | bevel-gear | 斜齒輪 | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 56 | `oriText/06.txt` 第 11 行 | by reason of the slot in which it slides being cut eccentrically to the center or fulcrum of the lever | 被切割成偏離槓桿中心或支點的位置 | 被切割成與槓桿中心或支點不同心（偏心）的弧形 | 誤譯:eccentrically to the center 指溝槽的弧和支點不同心，所以按下槓桿時軸被往後拉；舊譯「偏離…的位置」像是講溝槽擺在別處。模型幾何正確（軸的兩個位置到支點距離不同）；models/fig056.js:2 註解「溝槽偏離槓桿的支點」沿用舊說法。 |
| 57 | `oriText/06.txt` 第 13 行 | the large, internally-toothed gear and the concentric gear within will be driven in opposite directions by the bands, and at the same time will impart motion to the intermediate pinion | 同時皮帶也會將運動傳遞給底部的中間小齒輪 | 同時這兩個齒輪也會將運動傳遞給底部的中間小齒輪 | 誤譯:will impart 的主詞是兩個同心齒輪，不是皮帶。模型的中間小齒輪與兩者咬合，正確。 |
| 61 | `oriText/07.txt` 第 3 行 | For transmitting two speeds, one a differential motion. | 用於傳遞兩種速度的差動運動機構（differential motion）。 | 用於傳遞兩種速度，其中一種為差動運動（differential motion）。 | 誤譯:原文是兩種速度中的一種為差動運動（同第 62 種的句型），舊譯把整個機構說成差動機構。models/fig061.js:1「傳遞兩種速度的差動機構」沿用舊說法。 |
| 61 | `oriText/07.txt` 第 3 行 | On moving band on middle pulley a simple motion is the result, but when it is moved to right-hand pulley a double speed is given to shaft. | 當推動中間皮帶輪時，會產生單純的運動；但當推動右側皮帶輪時 | 當把皮帶移到中間皮帶輪上時，會產生單純的運動；但當把皮帶移到右側皮帶輪上時 | 誤譯:移動的是皮帶（moving band on…、it is moved to…），不是推動皮帶輪。模型是換皮帶位置，正確；tests/speed-changes.test.js:35 測試名稱「推動中間皮帶輪時…推動右側皮帶輪」引用舊句。 |
| 61 | `oriText/07.txt` 第 3 行 | Pulley on the right, which, like that on the left, is loose on shaft, carries, transversely, another bevel-gear. | 橫向地帶動另一個斜齒輪 | 橫向地裝著另一個斜齒輪 | 誤譯:carries 是承載（斜齒輪裝在皮帶輪上、軸與主軸垂直），「帶動」容易讀成驅動。行星架帶著它公轉也說得通，所以列疑問。models/fig061.js:2 寫「橫向帶著」，正確。 |
| 61 | `oriText/07.txt` 第 3 行 | bevel-gear | 斜齒輪(4 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
| 62 | `oriText/07.txt` 第 5 行 | and pulley at the right turns in the same direction | 且右側的皮帶輪與軸朝同方向轉動時 | 且右側的皮帶輪也朝同一方向轉動時 | 誤譯:原文沒說「與軸」；比較的對象應是承載中間斜齒輪的那個皮帶輪。軸和那個皮帶輪轉向相同，結果一樣，所以列疑問。models/fig062.js:3「若右邊的皮帶輪與軸同向轉」沿用舊說法。 |
| 62 | `oriText/07.txt` 第 5 行 | bevel-gear | 斜齒輪(3 處) | 傘齒輪 | 用詞統一:bevel 是傘齒輪;台灣也有人稱斜齒輪,但現代多指 helical gear,模型註解一律用傘齒輪 |
