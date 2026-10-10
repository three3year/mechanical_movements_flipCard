# 07 — 第 400 種:凸輪抬起的是桿 B,模型做成抬整根 A

**Status:** open

**Blocked by:** None

- **類別**:1(不合原文)。
- **證據**:英文「The bar, B, is lifted by a radial projection on the cam, C, at the same time the two bars are carried forward. A spring produces the return stroke, and the bar, B, drops of its own gravity.」舊中譯「桿 A 由凸輪 C…」,已改成「桿 B 由凸輪 C…」。模型照舊譯做:凸輪抬整根 A、B 坐在 A 右端跟著升落(`models/fig400.js` 第 2、7、10 行;第 138 行 quote);`tests/misc.test.js` 第 574 行測試名稱「A 由凸輪頂起與推前」、第 588 行「A 坐在凸輪上」。
- **建議修法**:A 只被帶著前後走;凸輪的徑向凸起抬 B,B 繞叉口的樞軸升起、靠自重落下(動力重演可能要宣告)。測試照新中譯改寫。
- **和定案衝突**:改之前查 `.scratch/recheck-86-507/tables/23-misc-3.md` 第 400 種的紀錄。

- [ ] 模型改成凸輪抬 B
- [ ] `npm test`、`npm run verify -- 400` 通過
