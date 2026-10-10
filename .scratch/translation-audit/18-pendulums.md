# 中譯檢查:擺與鐘錶調節(第 315–321 種)

2026-10-10 對照 507movements.com 的英文原文與網站註記。改了 7 張圖、16 筆(誤譯 9、漏譯 1、增譯 1、網站勘誤 0、原文疑誤 0、用詞統一 5)。做法、理由的分類與術語表見 [README](README.md)、[glossary.md](glossary.md)。

| 圖號 | 位置 | 英文 | 原中譯 | 新中譯 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 315 | `oriText/35.txt` 第 5 行 | Lower end connected with and driven in a circle by an arm attached to a vertical rotating spindle. | 下端連接著一個球體，並由連接於垂直旋轉心軸的搖臂帶動以圓周方式運動 | 下端與裝在垂直旋轉心軸上的一支臂相連，並由它帶動以圓周方式運動 | 增譯:英文沒有「球體」:下端是和臂相連。arm 裝在旋轉心軸上一直繞圈,不是來回擺的「搖臂」。模型的擺錘、尖銷照原圖,不受影響;models/fig315.js:67 的 quote 引用舊句,fig315.js:1–3 檔頭與 tests/regulators.test.js:27 測試名稱用「搖臂」。 |
| 316 | `oriText/35.txt` 第 7 行 | As rod is contracted by a reduction of temperature, contraction of mercury lowers it relatively to rod. | 水銀的收縮會相對地降低擺桿的重心 | 水銀的收縮會使其重心相對於擺桿降低 | 誤譯:降低的是水銀(擺錘)的重心,相對於擺桿;不是「擺桿的重心」。模型照英文(fig316.js:1–2)。 |
| 317 | `oriText/35.txt` 第 9 行 | C is a compound bar of brass and iron or steel, brazed together with brass downward. | 由黃銅與鐵或鋼焊接在一起所組成的複合桿 | 由黃銅與鐵或鋼焊接在一起、黃銅朝下的複合桿 | 漏譯:漏了 with brass downward;這是複合桿受熱向上彎的原因。模型的複合桿畫成單一根桿、沒分層,不違背但也沒表現。 |
| 317 | `oriText/35.txt` 第 9 行 | raising the center of the aggregate weight, M, W, to raise the center of oscillation as much as elongation of the pendulum-rod would let it down. | 將整體重量的重心抬升；若擺桿因收縮而導致擺動中心本應下降的量，被此機制抬升到相同的程度。 | 將整體重量 M、W 的重心抬升，使擺動中心升高的量恰好等於擺桿伸長使它下降的量。 | 誤譯:擺桿是「伸長」(elongation)讓擺動中心下降,中譯寫成「收縮」;另漏了 M、W。模型照英文(fig317.js:2–3)。 |
| 318 | `oriText/35.txt` 第 11 行 | The balance-spring is attached at its outer end to a fixed stud, R, and at its inner end to staff of balance. | 內端固定於擺輪軸之上，外端則固定於擺輪的框架之上 | 外端固定於固定的凸柱 R 上，內端則固定於擺輪軸之上 | 誤譯:外端固定在固定凸柱 R 上,不是「擺輪的框架」,並漏了 R。模型有樁 R(結構正確);models/fig318.js:1 檔頭寫「外端固定在擺輪框架的樁 R 上」沿用了「框架」。 |
| 319 | `oriText/35.txt` 第 13 行 | t, a, t', is the main bar of balance | 為擺輪的主要環臂 | 為擺輪的主桿 | 誤譯:main bar 是橫貫擺輪中心的主桿;「環臂」容易讓人以為是輪圈。拿不準處:原中譯可能刻意用「臂」,模型檔頭(fig319.js:1)用「主臂」,兩者擇一即可。 |
| 320 | `oriText/35.txt` 第 15 行 | maintaining power on going-barrel | 維持動力輪（going-barrel）的動力 | 維持動力盒（going-barrel）的動力 | 用詞統一:同一段裡 going-wheel 也譯「動力輪」,兩者混在一起;第 321 種把 going-barrel 譯「動力盒」。拿不準處:屬用詞統一,不算錯譯。 |
| 320 | `oriText/35.txt` 第 15 行 | A similar pulley rides on another arbor, p | 類似的皮帶輪 p 位於另一根軸上 | 類似的皮帶輪位於另一根軸 p 上 | 誤譯:p 是軸(arbor),不是皮帶輪。模型把標籤 p 放在棘輪皮帶輪上(models/fig320.js:87),檔頭 fig320.js:2「棘輪皮帶輪 p」與 tests/regulators.test.js:78 測試名稱「棘輪皮帶輪 p」都跟著舊譯;影響小(標籤位置)。 |
| 320 | `oriText/35.txt` 第 15 行 | The weights are hung, as may be seen, the small one being only large enough to keep the rope or chain on the pulleys. | 可以看到，重物以小型的方式懸掛著，僅重到足以 | 重物的懸掛方式如圖所示，其中小重物僅重到足以 | 誤譯:the small one 指兩個重物中的小重物,不是「以小型的方式懸掛」。模型有大重物 W 與小重物 w,照英文。 |
| 320 | `oriText/35.txt` 第 15 行 | the great weight is pulled up by c | 而主輪則由 c 向上拉起 | 而大重物則由 c 向上拉起 | 誤譯:被拉起的是大重物(great weight),不是主輪。另請維護者留意:模型檔頭 fig320.js:3–4 寫「a 把 W 拉上來,而 c 仍拉著 P」,和英文「W 由 c 拉起」的字母對不上,不是跟著中譯,是模型自己的字母判讀,需對照原圖。 |
| 320 | `oriText/35.txt` 第 15 行 | P is a pulley fixed to the great wheel of the going part ... to prevent a rope or chain hung over it from slipping | 主輪上的皮帶輪 | 主輪上的滑輪 | 用詞統一:pulley:掛繩索或鏈條吊重物;引用:models/fig320.js:1(註解) |
| 320 | `oriText/35.txt` 第 15 行 | A similar pulley rides on another arbor, p | 類似的皮帶輪 | 類似的滑輪 | 用詞統一:pulley:同上 |
| 320 | `oriText/35.txt` 第 15 行 | to keep the rope or chain on the pulleys | 保持在皮帶輪上 | 保持在滑輪上 | 用詞統一:pulley:同上 |
| 320 | `oriText/35.txt` 第 15 行 | the ratchet-pulley runs under the click | 棘輪皮帶輪（ratchet-pulley） | 棘輪滑輪（ratchet-pulley） | 用詞統一:pulley:同上,掛繩/鏈的那個 pulley;引用:models/fig320.js:2(註解)、models/fig320.js:131 quote「棘輪皮帶輪會在制動爪下方運行」 |
| 321 | `oriText/35.txt` 第 17 行 | is connected with the great wheel, G, by a spring, S, S' | 透過彈簧 G 與主輪 G 相連 | 透過彈簧 S、S' 與主輪 G 相連 | 誤譯:彈簧的字母是 S、S',不是 G。模型照英文(fig321.js:2)。 |
| 321 | `oriText/35.txt` 第 17 行 | as it need only just keep the escapement going, the pendulum taking care of itself for that short time | 擺鐘只需在那短暫的時間內自行照料擒縱機構即可 | 因為彈簧只需讓擒縱機構維持運作即可，在那短暫的時間內擺會自行維持擺動 | 誤譯:it 指彈簧:彈簧只需維持擒縱機構運作,擺在那短時間內自己顧好自己;中譯變成「擺鐘自行照料擒縱機構」。 |
