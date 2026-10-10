# 中譯檢查:平行運動與引擎 上(第 322–335 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 4 張圖、5 筆(誤譯 1、漏譯 1、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 3)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 324 | `oriText/36.txt` 第 5 行 | In this the ends as well as the edges are kept parallel. | 尺的邊緣能保持平行 | 尺的兩端與邊緣皆能保持平行 | 漏譯:漏了 the ends as well as(兩端也保持平行,這正是複合平行尺的特點)。模型本身已讓兩尺上下正對(fig324.js:2),不用改;測試名稱 tests/parallel.test.js:59 引用「尺的邊緣保持平行」。 |
| 329 | `oriText/36.txt` 第 15 行 | wrist | 手腕 | 腕銷 | 用詞統一:wrist(wrist-pin)是腕銷,「手腕」是字面直譯 |
| 330 | `oriText/36.txt` 第 17 行 | in line with the center of the cylinder | 與圓筒的中心成一直線 | 與汽缸的中心成一直線 | 用詞統一:cylinder:蒸汽引擎的活塞桿導引,引擎裡裝活塞的 cylinder |
| 331 | `oriText/37.txt` 第 1 行 | the crank-wrist journal working in a slotted cross-head, A | 曲柄手腕軸承（crank-wrist journal） | 曲柄手腕軸頸（crank-wrist journal） | 誤譯:journal 是軸頸(被支承的那段軸),不是軸承(bearing);在溝槽裡走的是曲柄銷本身。模型檔頭 fig331.js:1 寫「曲柄手腕軸承 B」。 |
| 331 | `oriText/37.txt` 第 1 行 | crank-wrist | 曲柄手腕 | 曲柄銷 | 用詞統一:crank-wrist 就是曲柄銷,「手腕」是字面直譯 |
