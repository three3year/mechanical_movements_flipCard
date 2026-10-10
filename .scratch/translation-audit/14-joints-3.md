# 中譯檢查:接頭與器具 三(第 274–287 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 6 張圖、9 筆(誤譯 4、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 5)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 278 | `oriText/30.txt` 第 17 行 | elbow-lever | 肘節槓桿 | 肘形槓桿 | 用詞統一:elbow-lever 是彎成肘形的槓桿(角槓桿);「肘節」在本書另指 toggle-joint |
| 279 | `oriText/31.txt` 第 1 行 | to set it out to the slot in the cross-head as the box and wrist wear | 將軸承盒向十字頭的溝槽外方推出 | 將軸承盒向外撐開以貼緊十字頭的溝槽 | 誤譯:set it out to the slot 是把盒子往外調、貼合槽壁以補償磨損；「向溝槽外方推出」讀起來像把盒子推出槽外。模型檔頭 models/fig279.js:3 寫「隨磨損把盒子往外推」，意思沒跟著錯，也沒逐字引用。 |
| 279 | `oriText/31.txt` 第 1 行 | crank-wrist | 曲柄手腕 | 曲柄銷 | 用詞統一:crank-wrist 就是曲柄銷,「手腕」是字面直譯 |
| 279 | `oriText/31.txt` 第 1 行 | wrist | 手腕(2 處) | 腕銷 | 用詞統一:wrist(wrist-pin)是腕銷,「手腕」是字面直譯 |
| 280 | `oriText/31.txt` 第 3 行 | By the alternating motion of the long handlever to the right | 透過長手動槓桿向右的交替運動 | 透過右邊長手動槓桿的交替運動 | 誤譯:to the right 指槓桿位在圖的右邊（交替運動不可能只往右）；中譯變成運動方向。模型 models/fig280.js:1 已照「右邊的長手動槓桿」做。 |
| 280 | `oriText/31.txt` 第 3 行 | By the upward motion of the outward end of the short lever | 短槓桿向外側端點的向上運動 | 短槓桿外側端點的向上運動 | 誤譯:outward end 是短槓桿的外端，中譯多了「向」讓它讀成往外的運動。模型 models/fig280.js:2 已寫「短槓桿外端往上」。 |
| 281 | `oriText/31.txt` 第 5 行 | causes the lever at the right to vibrate | 槓桿產生振動 | 槓桿產生擺動 | 用詞統一:vibrate / vibratory motion:槓桿繞軸來回擺動 |
| 283 | `oriText/31.txt` 第 9 行 | a vibratory motion of the handle | 手柄的振動運動 | 手柄的擺動運動 | 用詞統一:vibrate / vibratory motion:手柄繞小齒輪軸來回扳動 |
| 285 | `oriText/31.txt` 第 13 行 | the spindle in the end of which the center is fixed | 中心點即固定於心軸的末端 | 頂尖（center）即固定於心軸的末端 | 誤譯:車床的 center 是頂尖這個零件，不是幾何的中心點。模型已畫頂尖（models/fig285.js:2、:47），不受影響。 |
