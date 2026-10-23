# 18 — 外形與洞:第 284、321、360、361 種

**What to build:** 外形與洞的檢查(`node tools/outlines.mjs`)在這幾張報出:第 284 種 `crank`、`catch`、`click`,第 321 種 `clickR`、`clickT`,第 360 種 `pawl`,第 361 種 `lever`:洞一部分在外形外。第 321 種也在票 06(取景)、第 360 種也在票 10(伸縮宣告)。逐項修到檢查不再報出——端頭的銷孔畫出圓頭讓洞落在外形裡、拿洞當缺口的改成外形本身的缺口、自交的輪廓重畫。不改零件的運動;外形一改,和它相碰的接觸重新量。細節見 `.scratch/physical-verification/pending.md`「工具補盲點後報出、留給各族的」。規格 User Stories 24–29。

**Blocked by:** 無

**Status:** done

- [x] `node tools/outlines.mjs 284 321 360 361` 0 項
- [x] 改到接觸面的,補量接觸的測試(先寫失敗的再改)
- [x] `npm run verify -- 284 321 360 361` 通過、`npm test` 全過
- [x] 第 284、321、360、361 種改過的每一張截四個相位(含斜後方)對照原圖,截圖經截圖服務
- [x] 以獨立暫存區提交(只放自己的檔案);pending.md 不在這張票改(收尾票統一更新),做了什麼寫在本票 Comments

## Comments

2026-10-23 做了什麼(一張圖一個子代理,主 session 核對 diff、合併驗收)。運動都不動;第 321 種(票 06)取景前後相同,第 360 種(票 10)的伸縮宣告沒動。

- 第 284 種:`crank.pieces[0]` 軸孔圓心在曲柄臂平頭,`roundEnd(…, [0, 0], 0.09)`(半寬);`catch.pieces[0]` 卡榫彎臂的樞軸孔,`roundEnd(…, [0, 0], 0.06)`(比半寬 0.05 大一點,孔 0.04 四周留 0.02);`click.pieces[0]` 爪桿寬 0.1、樞軸孔 r 0.05 剛好頂到兩側(1/96),平邊與上下邊離孔心等距(`roundEnd` 會選錯邊)、孔也不能縮(樞軸銷 0.05),改成 `CLICK_OUTLINE` 樞軸端是半徑 `CLICK_EYE` = 0.08 的圓頭,爪桿兩側接上去。`CLICK_OUTLINE` 也傳給 `pawlDrive`:圓頭離棘輪中心至少 1.62 > 齒尖 1.22;`feed()` 兩個狀態、曲柄 12 圈 2001 點與改前比,轉角差 0;現有「畫出來的止回爪全程不穿進棘輪」測試照過。
- 第 321 種:`clickR.pieces[0]` 孔 r 0.03 圓心在臂(寬 0.07)平頭,`roundEnd` 取半寬只剩 0.005 的肉、取大又有台階,改用 `hubArms(0.05, R_WIDTH, …)`;`clickT.pieces[0]` 孔 r 0.085(套在 r 0.08 的樁上)比臂寬 0.08 還大,改用 `hubArms(0.12, 0.08, …)`(方向與長度同原中心線)。接觸由 `pawlRest`/`pawlTrack` 用樞軸、長度、爪尖算,不讀外形;輪轂繞樞軸對稱。`node tools/framing.mjs 321` 改前改後輸出相同(均勻比舊 2.7%,加倍 0.0%)。
- 第 360 種 `pawl`:`PAWL_BODY = roundEnd(PAWL_OUTLINE, [0, 0], 0.04)`(半寬)只用在畫;接觸照舊用平頭的 `PAWL_OUTLINE`(`swingUntilContact`),圓頭離棘輪中心至少 0.53 > 齒頂 0.5。
- 第 361 種 `lever.pieces[0]`:`roundEnd(thickLine(LEVER_LINE, 0.12), [0, 0], 0.06)`;圓頭整個落在同位置原有的 r 0.13 圓板(`pieces[1]`)裡,外觀不變。不參與接觸。
- 驗收:`node tools/outlines.mjs 284 321 360 361` 0 項;`npm run verify -- 284 321 360 361` 0 個未豁免、0 項豁免;`npm test` 3554 項全過。沒有改到接觸面,沒有新測試。
- 截圖(`.playwright-mcp/maf5/`):`ol-284-front`(v=0、1.6、3.14)/`-back`/`-zoom-pawls`/`-zoom-crank`;`ol-321-front`(v=0、0.5、0.8)/`-back`;`ol-360-front`(v=0、0.24、0.49)/`-back`/`-close`(fit=drum);`ol-361-front`(接合 v=0、2、4)/`-front-off`(脫開)/`-back`。主 session 看過 `ol-284-zoom-pawls`:三處樞軸端是圓頭、孔整個在裡面,止回爪爪尖照舊;原圖止回爪樞軸也是圓頭。
