# 08 — 伸縮宣告:伸縮桿的檢查認得帶原因的宣告;第 198、416、478 種

**What to build:** 零件的「可伸縮」改成帶原因的宣告(原因必寫)。伸縮桿的檢查(`tools/rigid-links.mjs`)略過有宣告的零件、另外列出宣告與原因;有宣告卻沒寫原因的報錯;沒宣告的照報。檢視器照姿勢兩端畫長度,不受影響。這張票同時把第 198 種直條(維護者 2026-10-21 決定接受 0.005 的伸縮,`08-speed-1.md`)、第 416 種螺旋彈簧 A、第 478 種受熱伸長的管子 A 改成宣告並寫原因。第 125 種原本的標記在票 11 拿掉、改成真的定長;在那之前第 125 種會被報「沒寫原因」,屬預期,寫在 Comments。規格 User Stories 30–34。

**Blocked by:** 無

**Status:** done

- [x] 先寫檢查工具的失敗測試:有原因的被略過並列出、沒原因的報錯、沒宣告的照報
- [x] `npm test` 全過;`npm run verify -- 198 416 478` 通過
- [x] `node tools/rigid-links.mjs` 全書的輸出附在 Comments(第 400 種以前剩下的交給票 09–11)
- [x] 第 198 種的宣告原因對到 2026-10-21 的決定;`08-speed-1.md` 第 198 種直條那一題補狀態行
- [x] 以獨立暫存區提交(只放自己的檔案);pending.md 不在這張票改(收尾票統一更新),做了什麼寫在本票 Comments

## Comments

2026-10-23 做了什麼:

- 零件的 `stretch` 改成帶原因的宣告:`stretch: "原因"`。`tools/rigid-links.mjs` 新增 `stretchDeclarations(def)`(列出 { id, kind, reason }),`stretchedLinks` 略過有原因的宣告;`stretch: true`、空字串或只有空白的,不論長度變不變都回傳、帶 `missingReason: true`,命令列印成「宣告會伸縮卻沒寫原因」;命令列最後另列「宣告會伸縮的零件」與原因。測試先寫(紅:缺 export),兩條新測試:有原因的略過並列出(link 與 rod 路徑零件)、沒原因的報錯而沒宣告的照報。
- `tests/registry.test.js` 的連桿定長測試照舊用 `!p.stretch` 略過(有宣告就略過);沒寫原因由維護工具抓,不放進 `npm test`,免得第 125 種在票 11 之前讓測試失敗。
- 第 198 種直條、第 416 種彈簧 A、第 478 種管子 A 改成宣告並寫原因;第 198 種的原因對到 2026-10-21 的決定,`08-speed-1.md` 那一題補了狀態行。
- `docs/agents/model-cheatsheet.md`、`docs/agents/model-audit.md` 第 2 類與剛性那一段改成新的宣告寫法。
- 第 125 種仍是 `stretch: true`,現在被報「宣告會伸縮卻沒寫原因」,屬預期,票 11 拿掉。
- `npm test` 3544 項全過;`npm run verify -- 198 416 478` 0 個未豁免、2 項豁免。

`node tools/rigid-links.mjs` 全書:

```
圖 125:lower(link 宣告會伸縮卻沒寫原因 2.10–2.49)、upper(link 宣告會伸縮卻沒寫原因 2.73–2.90)
圖 235:spring(rod 0.60–0.69)
圖 239:springLeft(rod 0.17–0.52)、springRight(rod 0.32–0.56)
圖 240:spring(rod 3.11–3.22)
圖 287:springL(rod 1.59–1.59)、springL2(rod 1.59–1.59)、springR(rod 1.59–1.59)、springR2(rod 1.59–1.59)
圖 317:steelL(rod 1.97–2.36)、steelR(rod 1.97–2.36)、brassL(rod 1.97–2.43)、brassR(rod 1.97–2.43)
圖 319:brassR(rod 4.28–5.07)、steelR(rod 4.09–4.90)、brassL(rod 4.28–5.07)、steelL(rod 4.09–4.90)
圖 360:spring(rod 14.77–15.69)
圖 369:thread(rod 3.65–3.66)

長度會變的桿:9 張

宣告會伸縮的零件(3 個):
圖 198:bar(link)兩根桿已由四連桿定住,直條是多出來的一道約束,兩銷距離變 0.005 由銷孔餘隙吸收(維護者 2026-10-21 決定接受,見檔頭)
圖 416:spring(rod)螺旋彈簧 A 畫成一條螺線:內端固定在樁上、外端接在曲柄銷上,外端跟著曲柄銷繞圈,彈簧被拉長壓短
圖 478:pipe(rod)廢水管 A 受熱伸長、遇水縮短是原理(原文「管子膨脹使閥門關閉」),伸縮量放大顯示
```

**code review(2026-10-23,票 08–14 一起)**:修了 `tests/registry.test.js` 的連桿定長測試:原本 `!p.stretch` 讓 `stretch: true`(沒寫原因)的連桿照樣被略過,和新規則相反;改成只略過寫了原因的(現在全書沒有沒寫原因的宣告,所以沒有紅過)。
