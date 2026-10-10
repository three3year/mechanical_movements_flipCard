# 中譯檢查:擒縱機構 三(第 306–314 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 5 張圖、6 筆(誤譯 4、漏譯 0、增譯 0、網站勘誤 0、原文疑誤 0、用詞統一 2)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 306 | `oriText/34.txt` 第 1 行 | pendulum escapement | 擺鐘擒縱機構 | 擺式擒縱機構 | 用詞統一:pendulum 是擺,不是擺鐘;和第 290 種一致 |
| 308 | `oriText/34.txt` 第 5 行 | pendulum escapement | 擺鐘擒縱機構 | 擺式擒縱機構 | 用詞統一:pendulum 是擺,不是擺鐘;和第 290 種一致 |
| 312 | `oriText/34.txt` 第 13 行 | the stopping is done by the action of the stops, A and B, on the larger wheel | 而止動則由較大的輪上的擋止 A 和 B 的作用來完成 | 而止動則由擋止 A 和 B 對較大的輪的作用來完成 | 誤譯:on the larger wheel 修飾 action:擋止 A、B 作用在大輪上(擋止在叉瓦臂上),不是「大輪上的擋止」。模型照英文做(擋止在兩臂上);models/fig312.js:199 的 quote 引用了舊句。 |
| 313 | `oriText/35.txt` 第 1 行 | the tooth, V, on the verge, presses the passing-spring against the lever | 將通過彈簧（passing-spring）向左按壓 | 將通過彈簧（passing-spring）壓向槓桿 | 誤譯:英文是 against the lever(壓向槓桿),沒有「向左」。models/fig313.js:8–10 檔頭與 :133 註解記載維護者 2026-10-08 依「原文說向左」與原圖不合而照原圖做的決定,那個前提來自誤譯;模型照原圖往右推止動器,與英文不衝突。fig313.js:134 的 quote 也引用了「向左按壓」。 |
| 313 | `oriText/35.txt` 第 1 行 | As balance returns, tooth, V, presses aside and passes spring without moving lever, which then rests against the stop, E. P is the only pallet upon which impulse is given. | 槓桿此時靠在擋止 E、P 上，即在傳遞衝量時唯一受到擺輪推動的部件。 | 槓桿此時靠在擋止 E 上。P 是唯一接受衝量的叉瓦。 | 誤譯:英文是兩句:槓桿靠在擋止 E 上;P 是唯一接受衝量的叉瓦。中譯把 P 併成擋止。models/fig313.js:10–11 檔頭說「原文『靠在擋止 E、P 上』也和插圖對不上」,引用舊句;改正後只剩 E 的判讀(模型把 E 當鎖石、止動器靠住的擋止不標字母)要維護者再看。 |
| 314 | `oriText/35.txt` 第 3 行 | look like those of the lever escapement 296 | 2/6 處所示的 | 第 296 種所示的 | 誤譯:圖號 296 被誤寫成「2/6 處」(疑為掃描誤認)。模型檔頭已寫第 296 種。 |
