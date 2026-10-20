# 31 — 收尾

**What to build:** 全書 `npm run verify` 通過(0 個未豁免、沒有過時的豁免);`.scratch/physical-verification/pending.md` 跟上(這一輪新增的「未修」、票 01–03 列給範圍外各族的問題、第 462 種的狀態);複查入口 `.scratch/recheck-86-507/tables/README.md` 的兩張表補齊;八份報告第 401–507 種每一筆都有「狀態」(已修,或寫明理由的未修);報告與規格的鏡像全部重新發布,規格改成 done。

**Blocked by:** 01–30

**Status:** done

- [x] 全書 `npm run verify` 通過,`npm test` 與 `npm run test:verify` 全過
- [x] `node tools/rigid-links.mjs 401-507` 與 `node tools/one-piece.mjs 401-507` 剩下的每一項在報告或 pending.md 寫出理由
- [x] 八份報告第 401–507 種的每一筆都有「狀態」行
- [x] pending.md 與複查入口的兩張表跟上
- [x] 規格的 Status 改成 done,報告與規格的鏡像重新發布
- [x] 以獨立暫存區提交(只放自己的檔案)

## Comments

2026-10-21 票 31:票 21–30 平行做完並合併到 main(各自的 worktree,import 衝突逐張併成一個模組一行)。全書 `node tools/verify.mjs` 507 張、0 個未豁免、沒有過時的豁免、124 項豁免(第 401–507 種從 249 項減到 16 項,沒有「未修」);`npm test` 3490 項、`npm run test:verify` 55 項通過。`node tools/outlines.mjs 401-507` 0 張;`rigid-links` 剩第 416 種螺旋彈簧、第 478 種受熱伸長的管(原理本身);`one-piece` 剩 10 張(第 408、419、433、439、440、445、446、447、487、488 種),理由在各票 Comments 與 pending.md「完成到什麼程度」第一條。八份報告第 401–507 種 250 筆都有「狀態」行,只有 #404-3 未修(理由已在 pending.md)。pending.md:「完成到什麼程度」加這一輪的狀態、這一輪冒出還沒決定的 19 題、第 491 種棘爪與冠狀齒互穿 0.026 的已知事項;未修清單拿掉已修的第 470、472 種(17 → 15 項)。複查入口的兩張表由票 06、12、30 登記(主動件第 502 種;目標件第 409、433、502、505、506 種)。規格 Status 改成 done;27-water-2、28-steam、29-wind、30-instruments、pending.md、規格的鏡像都重新發布。

2026-10-21 code review(規格軸、標準軸)後的修正:第 492 種舌片放開的時機改由接觸算(拿掉手寫的時間窗,`RELEASE` 由舌片往上翻時環孔還擋不擋住求出,之後舌片與小艇照加速度走);第 491 種棘爪的落定角改由立體的外形接觸算(互穿 0)、纜繩繞鼓的半徑加上纜繩半徑;第 493 種先擠緊再吊起的分界改由填塊碰到孔壁求出(`TIGHT_AT`);第 471 種孔 e 真的開在汽缸壁上(`pump.js` 的 `openedLathe` 多一種從弧中間挖出的開口);第 483 種進氣旗標改由 `ports()` 的幾何推出;第 498、501 種的 U 形管彎頭抽成 `models/u-tube.js`;測試的重複小工具合併(`sectionSolids` 搬進 `tests/helpers.js`,wind、instruments 的本地副本改用共用的),拿掉重述模型公式的斷言,第 506 種改量零件實體的節圓比。第 502 種換主動件、第 506 種改齒數兩項規格軸指出的範圍外改動,已寫成 `30-instruments.md` 的待決題,不改。修正後 `npm test` 3495 項、`npm run test:verify` 55 項通過,全書 `npm run verify` 507 張、0 個未豁免、124 項豁免;28-steam、29-wind、pending.md 的鏡像重新發布。
