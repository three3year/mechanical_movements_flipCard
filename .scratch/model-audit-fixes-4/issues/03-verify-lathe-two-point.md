# 03 — 實體驗證建得出兩點剖面的旋轉體

**What to build:** `verify/solids.js` 的 `lathePieces` 建不出只有兩點剖面的 `lathe`(第 438 種下端的尖頂),實體驗證與一件掃描都看不到它。先用 `npm run test:verify` 寫失敗的例子(兩點剖面的旋轉體要有實體、和別的零件的距離量得到),再改。改完跑全書驗證,新冒出的問題範圍內併進各圖的票,範圍外寫進 pending.md。

**Blocked by:** 無

**Status:** done

- [x] 先寫失敗的測試,再改工具
- [x] 工具自己的測試、`npm test`(與改實體驗證時的 `npm run test:verify`)全過
- [x] 範圍內報出的列在 Comments 交給各圖的票,範圍外的寫進 pending.md
- [x] 以獨立暫存區提交(只放自己的檔案)

## Comments

2026-10-20:`verify/solids.js` 的 `lathePieces`:剖面沒有面積(兩點、共線)時補上軸上的兩點(半徑 0、高度同剖面兩端)封成實心的旋轉體再切凸塊——殼裡面就是實體;本來就封閉的剖面不變。先寫的失敗測試:`verify/one-piece.spec.js`(兩點剖面的圓錐懸空 0.3 要報、量得到間隙;接上不報)與 `verify/interference.spec.js`(圓錐穿進板要報、離開不報),改完都過,`npm run test:verify` 55 項通過。

全書掃過剖面沒有面積的 `lathe`,只有第 438 種 `shaft.pieces[2]`。改完跑全書 `npm run verify`:507 張、0 個未豁免、357 項豁免、沒有過時的豁免(和改前相同,607 秒)——尖頂有了實體也沒碰到別的零件,所以實體驗證沒有新問題;`node tools/one-piece.mjs 438` 新報出尖頂離主體 0.320(#438-1),已記在票 13。範圍外沒有新報出的,pending.md 只補一句。
