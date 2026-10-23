# 16 — 外形與洞:第 121、225、232、235 種

**What to build:** 外形與洞的檢查(`node tools/outlines.mjs`)在這幾張報出:第 121 種 `click`、`clickR`,第 225 種 `pawl`,第 232 種 `pawlC` 與 `leverB`,第 235 種 `click`、`arm`:洞一部分在外形外。第 235 種也在票 09(伸縮宣告)。逐項修到檢查不再報出——端頭的銷孔畫出圓頭讓洞落在外形裡、拿洞當缺口的改成外形本身的缺口、自交的輪廓重畫。不改零件的運動;外形一改,和它相碰的接觸重新量。細節見 `.scratch/physical-verification/pending.md`「工具補盲點後報出、留給各族的」。規格 User Stories 24–29。

**Blocked by:** 無

**Status:** done

- [x] `node tools/outlines.mjs 121 225 232 235` 0 項
- [x] 改到接觸面的,補量接觸的測試(先寫失敗的再改)
- [x] `npm run verify -- 121 225 232 235` 通過、`npm test` 全過
- [x] 第 121、225、232、235 種改過的每一張截四個相位(含斜後方)對照原圖,截圖經截圖服務
- [x] 以獨立暫存區提交(只放自己的檔案);pending.md 不在這張票改(收尾票統一更新),做了什麼寫在本票 Comments

## Comments

2026-10-23 做了什麼(一張圖一個子代理,主 session 核對 diff、合併驗收)。四張都是端頭的銷孔(孔圓心落在平頭上),用 `shapes.js` 新增的 `roundEnd`(前置提交 8d39a25,`tests/shapes.test.js`)畫出圓頭。運動不動。

- 第 121 種 `click`、`clickR`:`clickShape(side)` = `roundEnd(clickOutline(side), [0, 0], 0.12)`(r = 端頭半寬)。接觸照舊用平頭的 `clickOutline`(`swingUntilContact`、`contactShapes`):圓頭離齒輪中心至少 1.50,齒頂圓 1.213,碰不到(註解寫在定義檔)。另外主 session 修掉一個相鄰的問題:碟形輪上制動爪的樞軸銷原本 r 0.1、比爪的銷孔 0.07 大(穿在孔裡,實體驗證當成孔裡的軸放過),改成 r 0.06。
- 第 225 種 `pawl.pieces[0]`(棘爪桿身):`roundEnd(…, [0, 0], 0.1)`(半寬)。接觸只用爪尖 `NUB_OUTLINE`。
- 第 232 種 `pawlC.pieces[0]`:桿身沿 `cArc` 從樞軸外 0.05 才起畫,孔大半在平頭外,`roundEnd(…, [0, 0], 0.16)`(平頭兩端點離樞軸 0.147、0.168);`leverB`:`roundEnd(…, [0, 0], 0.18)`(半寬)。接觸只用爪尖與齒(`tipHits`)。
- 第 235 種 `click.pieces[0]`(止回爪):`CLICK_OUTLINE` 本身套 `roundEnd(…, [0, 0], 0.12)`(和銷上的軸套同半徑),畫的與 `pawlDrive` 算接觸的仍是同一份;圓頭離輪心至少 1.338 > 角尖 1.0,`motion()` 在 0–4 倍擺幅 401 個取樣前後完全相同。`arm.pieces[0]`:`roundEnd(…, [0, 0], 0.15)`(半寬;原圖臂端本來就是帶孔的圓頭)。
- 驗收:`node tools/outlines.mjs 121 225 232 235` 0 項;`npm run verify -- 75 76 77 80 121 225 232 235` 0 個未豁免(本票四張只有第 121 種原有的一項動力重演豁免);`npm test` 3554 項全過。沒有改到接觸面,沒有新測試。
- 截圖(`.playwright-mcp/maf5/`):`ol-121-front`(cw)/`-front-ccw`/`-back`/`-close`(fit=click)/`-close-ccw`;`ol-225-front`(v=0、0.053、0.106)/`-back`;`ol-232-front`(v=0、0.37、0.739)/`-back`;`ol-235-front`(v=0、0.11、0.22)/`-back`。主 session 看過 `ol-121-close`、`ol-232-front`:圓頭圍著銷孔,B 的軸端圓頭和原圖一致,沒有零件被蓋住或穿出。
