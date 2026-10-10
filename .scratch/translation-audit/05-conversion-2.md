# 中譯檢查:運動轉換與應用 下(第 142–154 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 6 張圖、9 筆(誤譯 6、漏譯 0、增譯 1、網站勘誤 1、原文疑誤 0、用詞統一 1)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 143 | `oriText/16.txt` 第 13 行 | which slides upon a horizontal bar of the fixed frame | 該框架在右側固定框架上的水平桿上滑動 | 該框架在固定框架的水平桿上滑動 | 增譯:英文這句沒有 at the right(at the right 是下一句連桿接固定框架的位置),「右側」會讓人以為水平桿只在右邊。模型檔頭照英文。 |
| 143 | `oriText/16.txt` 第 13 行 | the other end to a wrist secured in toothed wheel | 手腕（wrist） | 腕銷（wrist） | 誤譯:wrist 是曲柄銷(腕銷),不是「手腕」。引用:models/fig143.js:3「手腕(曲柄銷)」、11。 |
| 145 | `oriText/16.txt` 第 17 行 | The small standard at the right, to which is attached one end of the lever | 左側的小支架 | 右側的小支架 | 網站勘誤:網站註記:原書寫 left,應為 right,網站已改。中譯仍跟著原書。模型支架已在右側(fig145.js B = [3.35,0,0])。 |
| 145 | `oriText/16.txt` 第 17 行 | The small standard at the right, ... has a horizontal reciprocating rectilinear movement. | 該槓桿透過連桿與樑相連，並具有水平的往復直線運動 | 該槓桿透過連桿與樑相連；此小支架具有水平的往復直線運動 | 誤譯:英文句子的主詞是 small standard(has a horizontal reciprocating rectilinear movement),中譯接在「該槓桿」後面,變成槓桿做水平直線運動。模型的支架固定不動(fig145.js 的 B 是常數、frame 裡的支架板固定),沒做出支架的水平往復;但支架若可滑,機構會多一個自由度,要不要改模型需維護者判斷。 |
| 146 | `oriText/17.txt` 第 1 行 | by means of the wrist or crank-pin on the disk | 手腕（wrist） | 腕銷（wrist） | 誤譯:wrist 與 crank-pin 同義,都是曲柄銷,不是「手腕」。引用:models/fig146.js:119 的 quote 照抄舊句。 |
| 150 | `oriText/17.txt` 第 9 行 | The series of cams of varying throw | 具有不同擺動幅度的凸輪 | 具有不同升程（throw）的凸輪 | 誤譯:cam 的 throw 是升程(偏心量),凸輪本身不擺動。模型已做成偏心量不同的凸輪(結構正確)。引用:models/fig150.js:1「偏心量(擺動幅度)」,tests/conversion.test.js:241 測試名稱。 |
| 150 | `oriText/17.txt` 第 9 行 | according as a cam of greater or less throw is opposite the lever | 凸輪擺動幅度大小 | 凸輪升程大小 | 誤譯:同上一筆,throw 是升程。引用:models/fig150.js:106 的 quote 照抄舊句。 |
| 153 | `oriText/17.txt` 第 15 行 | The return motion is given by means of the bell-crank or elbow-lever | 曲柄搖臂或稱肘節槓桿 | 曲柄搖臂或稱肘形槓桿（elbow-lever） | 用詞統一:elbow-lever 是 bell-crank 的別名(L 形槓桿);「肘節」在本書另指 toggle-joint(第 140 種譯「肘節接頭」),容易混淆。屬用詞層級,拿不準是否算誤譯。引用:models/fig153.js:2「(肘節槓桿)」。 |
| 154 | `oriText/17.txt` 第 17 行 | a weighted cord passing over a pulley | 該繩索繞過皮帶輪 | 該繩索繞過滑輪 | 誤譯:繩子繞過的是滑輪,沒有皮帶;模型(fig154.js PULLEY)與測試(tests/conversion.test.js:287)都已稱滑輪。 |
