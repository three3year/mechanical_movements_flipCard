# 09 — 模型註解、quote、畫面讀數與測試名稱還在用舊譯

**Status:** open

**Blocked by:** None(01–08 會改到其中幾個檔,一起做時注意衝突)

2026-10-10 改了 `oriText/`,但沒有動 `models/`、`tests/`(交接規定:模型連帶的改動另開票)。這些地方都不影響測試結果(`quote` 只出現在動力重演的錯誤訊息裡,測試名稱與註解不比對 `data.js`),但讀起來和卡片上的新中譯不一致。

**畫面上看得到的(優先)**:

- `models/fig111.js` 第 67 行讀數「模具前進」:die 新譯「螺紋塊」。
- `models/fig482.js` 第 82 行讀數「缺口 h 的開口」:字母新譯為 b(英文 notches, b);同檔第 3、4、20 行註解。
- `models/fig467.js` 第 108 行讀數「圓筒升起」:cylinder 新譯「液壓缸」。

**逐字引用被改掉的舊句**(精確比對舊句片段找到的;第 3、11 種的「導引皮帶輪」本來就是皮帶用的,不列):

| 圖號 | 舊句片段 | 新譯 | 引用處 |
| --- | --- | --- | --- |
| 18 | 兩個固定皮帶輪與一個可動皮帶輪 | 兩個固定滑輪與一個可動滑輪 | `models/fig018.js:1`、`tests/hoists.test.js:132` |
| 70 | 軸承與擋止 | 承靠面與擋止 | `models/fig070.js:2` |
| 75 | 振動桿 D | 擺動桿 D | `models/fig075.js:1` |
| 82 | 振動臂 B | 擺動臂 B | `models/fig082.js:1` |
| 98 | 不規則的振動運動 | 不規則的擺動運動 | `models/fig196.js:1` |
| 98 | 在振動臂上 | 在擺動臂上 | `models/fig098.js:1`、`models/fig098.js:118` |
| 108 | 將一個點放入該溝槽中 | 將一個尖點（point）放入該溝槽中 | `models/fig108.js:97` |
| 122 | 曲柄手腕 | 曲柄銷（crank-wrists） | `models/fig093.js:1`、`models/fig122.js:1`、`models/fig279.js:1`、`models/fig331.js:1`、`models/fig354.js:2`、`models/fig354.js:4`、`models/fig401.js:1`、`tests/cranks.test.js:107`、`tests/joints.test.js:400`、`tests/parallel.test.js:133` |
| 127 | 槓桿振動時 | 槓桿擺動時 | `models/fig127.js:1`、`models/fig271.js:1`、`models/fig271.js:136`、`tests/joints.test.js:475`、`tests/joints.test.js:479` |
| 137 | 叉形振動臂 | 叉形擺動臂 | `models/fig137.js:1`、`models/fig137.js:88` |
| 150 | 凸輪擺動幅度大小 | 凸輪升程大小 | `models/fig150.js:106` |
| 181 | 其後方的配重 | 其配重 | `models/cornish-model.js:138` |
| 182 | 活塞位於圓筒頂部時 | 活塞位於汽缸頂部時 | `models/fig182.js:1` |
| 194 | 必要的振動運動 | 必要的擺動運動 | `models/pinion-drive.js:2` |
| 217 | 心形凸輪 C、D、B | 心形凸輪 C、D、B、e（第 217 種） | `models/fig217.js:1`、`models/wool-comb.js:2` |
| 222 | 維持齒間的適當節距 | 維持齒的適當嚙合深度 | `models/fig222.js:3` |
| 225 | 搖臂之振動運動 | 搖臂之擺動運動 | `models/fig225.js:95`、`tests/ratchets-escapements.test.js:116` |
| 227 | 鏈條與鏈條皮帶輪 | 鏈條與鏈條滑輪 | `models/fig227.js:1` |
| 228 | 鏈條與皮帶輪 | 鏈條與滑輪 | `models/fig228.js:1`、`models/fig229.js:1` |
| 236 | 藉由振動槓桿 a | 藉由擺動槓桿 a | `models/fig236.js:104`、`tests/ratchets-escapements.test.js:228` |
| 251 | 被框架 B 的槽兩側向內壓 | 被框架頂部的槽 B 兩側向內壓 | `models/fig251.js:98` |
| 293 | 輪的邊緣便會依序落入該凹槽中 | 輪緣上的齒便會依序落入該凹槽中 | `models/fig293.js:124` |
| 320 | 主輪上的皮帶輪 | 主輪上的滑輪 | `models/fig320.js:1` |
| 320 | 棘輪皮帶輪 | 棘輪滑輪（ratchet-pulley） | `models/fig320.js:2`、`models/fig320.js:131`、`tests/regulators.test.js:78` |
| 331 | 曲柄手腕軸承 | 曲柄手腕軸頸（crank-wrist journal） | `models/fig331.js:1` |
| 395 | 四向活塞閥 | 四通旋塞（Four-way cock） | `models/fig395.js:1`、`tests/misc.test.js:504` |
| 400 | 桿 A 由凸輪 C | 桿 B 由凸輪 C | `models/fig400.js:138` |
| 455 | 圓筒下側 | 泵缸下側 | `models/fig455.js:2` |
| 462 | 不漏水的圓筒 | 不漏水的泵缸 | `models/fig462.js:1`、`tests/water.test.js:441` |
| 466 | 柱塞圓筒 | 柱塞缸（ram cylinder） | `models/fig466.js:1`、`models/fig466.js:14` |
| 467 | 附有爪鉤的圓筒 | 附有爪鉤的液壓缸 | `models/fig467.js:1` |
| 477 | Heard & Wiggin | Hoard & Wiggin | `models/fig477.js:1` |
| 478 | 加重的肘節槓桿 D | 加重的肘形槓桿 D | `models/fig478.js:2`、`tests/steam.test.js:116` |
| 482 | 另以側視圖示出 | 另單獨示出其外觀圖 | `models/fig482.js:2` |
| 482 | 縮小缺口 h 的開口 | 縮小缺口 b 的開口 | `models/fig482.js:4` |
| 492 | Brown & Level 的專利 | Brown & Level 的 | `models/fig492.js:1` |

**全書統一換掉的舊詞**(只列還出現這個詞的檔案;要看語境,不一定每處都要換,例如「振動」在第 420 種是真的震動):

| 舊詞 | 新譯 | 還出現的檔案 |
| --- | --- | --- |
| 手腕 | 腕銷 / 曲柄銷 | `models/fig093.js`�`models/fig122.js`�`models/fig143.js`�`models/fig146.js`�`models/fig173.js`�`models/fig176.js`�`models/fig177.js`�`models/fig220.js`�`models/fig279.js`�`models/fig329.js`�`models/fig331.js`�`models/fig354.js`�`models/fig401.js`�`models/uncoupling.js`�`tests/cranks.test.js`�`tests/engines.test.js`�`tests/joints.test.js`�`tests/mangles.test.js`�`tests/misc.test.js`�`tests/parallel.test.js`�`tests/racks.test.js`� |
| 斜齒輪 | 傘齒輪 | `models/bevel-differential.js`�`models/fig007.js`�`models/fig025.js`�`models/fig041.js`�`models/fig042.js`�`models/fig049.js`�`models/fig053.js`�`models/fig061.js`�`models/fig062.js`�`models/fig074.js`�`models/fig087.js`�`models/fig147.js`�`models/fig161.js`�`models/fig162.js`�`models/fig163.js`�`models/fig170.js`�`models/fig173.js`�`models/fig226.js`�`models/fig357.js`�`models/fig366.js`�`models/fig368.js`�`models/fig372.js`�`models/fig375.js`�`models/fig506.js`�`tests/clutches.test.js`�`tests/engines.test.js`�`tests/gearing.test.js`�`tests/intermittent.test.js`�`tests/misc.test.js`�`tests/speed-changes.test.js`�`viewer/parts.js`� |
| 閥門齒輪 | 閥動機構 | `models/fig185.js`�`models/fig186.js`�`models/link-motion.js`� |
| 換向齒輪 | 換向機構 | `models/fig171.js`�`models/fig179.js`� |
| 手動齒輪 | 手動操縱機構 | `models/cornish-gear.js`�`models/cornish-model.js`�`models/fig181.js`� |
| 肘節槓桿 | 肘形槓桿 | `models/fig153.js`�`models/fig155.js`�`models/fig156.js`�`models/fig278.js`�`models/fig391.js`�`models/fig478.js`�`tests/engines.test.js`�`tests/steam.test.js`� |
| 衝壓機 | 搗錘 | `models/fig164.js`�`models/fig351.js`�`tests/misc.test.js`� |
| 擺鐘擒縱 | 擺式擒縱 | `models/fig303.js`�`models/fig305.js`�`models/fig306.js`�`models/fig307.js`�`models/fig308.js`�`tests/escapements.test.js`� |
| 振動 | 擺動(第 420 種鐘體除外) | `models/fig036.js`�`models/fig075.js`�`models/fig077.js`�`models/fig079.js`�`models/fig080.js`�`models/fig082.js`�`models/fig098.js`�`models/fig101.js`�`models/fig127.js`�`models/fig137.js`�`models/fig196.js`�`models/fig201.js`�`models/fig203.js`�`models/fig206.js`�`models/fig225.js`�`models/fig232.js`�`models/fig236.js`�`models/fig261.js`�`models/fig271.js`�`models/fig281.js`�`models/fig288.js`�`models/fig289.js`�`models/fig337.js`�`models/fig343.js`�`models/fig420.js`�`models/pinion-drive.js`�`tests/cranks.test.js`�`tests/intermittent.test.js`�`tests/joints.test.js`�`tests/mangles.test.js`�`tests/misc.test.js`�`tests/parallel.test.js`�`tests/racks.test.js`�`tests/ratchets-escapements.test.js`� |

譯法依 [glossary.md](../glossary.md)。另有幾處是跟著舊中譯的「說法」而不是逐字引用(例如第 64 種檔頭「空心軸 A」、第 190、202 種已改),改的時候順手對一下各族改動表的「理由」欄,裡面寫了引用處。

- [ ] 畫面上看得到的三處改好
- [ ] 逐字引用的舊句改成新中譯
- [ ] 統一換掉的舊詞照術語表換(看語境)
- [ ] `npm test` 通過;測試名稱改了的,斷言仍對到原文
