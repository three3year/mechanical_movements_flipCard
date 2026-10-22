# 模型程式速查

改動或新增模型前讀這一份:程式分哪幾層、定義有哪些欄位、零件種類與共用模組各管什麼、測試和維護工具在哪。它是地圖,細節留在程式裡:**需要哪個函式就 `grep -n` 找它的名字,再 `sed -n` 讀那一段(連同上面的註解)**;一份檔要看大半時 `cat` 一次,之後靠記憶。範例圖同理,只讀用到那個零件或函式的區段。用語照 `CONTEXT.md`,要查什麼照 `docs/agents/model-audit.md`。`tools/cheatsheet.test.mjs` 驗這裡提到的函式與範例圖都還存在。

## 三層

| 層 | 位置 | 管什麼 |
|---|---|---|
| 定義 | `models/figNNN.js` + 共用模組 | 純函式,不依賴 Three.js:零件清單與 `pose()`。`npm test` 只驗這一層 |
| 繪圖 | `viewer/parts.js`(零件)、`paths.js`(皮帶、繩、桿、鍊)、`flows.js`(流體) | 依 `kind` 建 3D 物件 |
| 實體驗證 | `verify/solids.js` → `index.js` | **沿用繪圖層建出的同一份幾何**拆成凸塊:驗的就是讀者看到的形狀。認不得的幾何退回凸包;轉動記號與刻線不算實體 |

新增零件種類:`models/kinds.js` 列名 + `viewer/parts.js` 加建構方式,實體驗證不用另外教。

## 模型定義(`export default`)

| 欄位 | 內容 |
|---|---|
| `figure` | 圖號 |
| `parts[]` | 零件;共通欄位 `id`、`kind`、`center`(頂層的位置;`at` 只用在 `pieces` 裡)、`axis`、`pieces`(同一零件的其他塊,座標在零件裡)、`label`/`labelOffset`、`spin`(轉動箭頭半徑)、`arrow: false`、`accent`(記號色)、`metal: "brass"`、`posed`、`mark` |
| `driver` | `{ part, type: "rotation" \| "translation", range?, cycle?, direction?, grips? }`;虛擬主動件 `{ type: "virtual", label, range, mode: "balance" \| "progress" }`,不指向零件 |
| `target` / `targets` | 目標件 1–3 個;只有主動件自己在動的圖列在 `tests/registry.test.js` 的 `ONLY_DRIVER_MOVES` |
| `states` | `{ initial, options: [{ id, label }] }`;姿勢由狀態決定的零件標 `posed`(否則切換狀態時轉角以偏移量接續) |
| `view` | `{ direction }` 初始視角;`fit`(只以這些零件取景)、`fov`。取景在主動量的範圍(或一個週期、一個進程)內均勻取樣,規則在 `viewer/framing.js` |
| `pose(v, state)` | 回傳 `{ parts: { id: { angle, position, rotation(四元數), visible, ghost, level } }, readouts: [{ label, value }] }`;路徑零件回傳折線 |
| `waivers[]` | `{ check: "interference" \| "unsupported" \| "replay", parts, reason, at? }`,原因必填;未修的以「未修:」開頭 |
| `powered[]` | 直接受力的零件(虛擬主動件、流體、重力) |
| `replay` | 動力重演的宣告,格式見 `verify/replay.js` 檔頭 |

`tests/registry.test.js` 對全書每張圖驗上表的規則(id 不重複、kind 存在、目標件數、豁免有原因、`posed`、連桿長度不變),改定義後先跑它。

## 座標約定

- 每個零件以**局部 Z 為轉軸**,繪圖層把它對齊到 `axis`;`pieces` 的 `at`、`axis` 都在零件座標裡。
- 板件(`plate`):`shape: { outline, holes }` 在局部 xy,沿 z 擠出 `thickness`;輪廓由 `models/shapes.js` 算,模型可用同一份輪廓算接觸。
- 齒輪:齒 0 的中心在局部 +X;`radius` 是節圓半徑。
- `lathe`:`profile: [[r, z], …]` 沿局部 Z 由下而上;`sweep < 2π` 時剖開,`cut` 是起始角。剖面圖剖掉朝向讀者的一半:`models/section.js` 給 `cut`/`sweep`。
- 平面機構在 xy、z 留給深度;接觸類的工具都在 xy 上算。

## 零件種類(`kind`)

參數是 `viewer/parts.js` 各建構函式讀的欄位;範例圖號是真的用了這種零件的定義。

| kind | 參數 | 範例 |
|---|---|---|
| `box` | `size` | 到處都有 |
| `cylinder` / `sphere` | `radius`、`length` | |
| `plate` | `shape`、`thickness`、`mark` | 凸輪、棘輪、槓桿、擒縱輪 |
| `gear` / `rack` | `teeth`、`radius`(`internal`、`rim`、`bore`、`mask`) | `fig025` |
| `bevel` | `apex`、`axis`(指向錐尖)、`teeth`、`radius`、`cone`、`width`;由 `gears.js` 的 `bevelGear` 產生 | `fig315`、`fig411` |
| `pulley` / `drum` / `stepped` / `cone` | 皮帶輪系;`stepped` 多段半徑 | `fig008`、`fig015` |
| `shaft` / `bar` / `sectorLever` / `weight` / `ropeEnd` | 機架與吊重的零件 | `fig006`、`fig012` |
| `lathe` | `profile`、`sweep`、`cut`、`mark` | 剖面圖 `fig247`、`fig248`;泵筒見 `pump.js` |
| `link` | 姿勢用 `from`/`to`;`stretch: "原因"` 宣告會伸縮(彈簧畫成桿、熱脹;`rigid-links.mjs` 略過並列出,沒寫原因的照報) | `fig039`、`fig078` |
| `spring` | 姿勢用 `from`/`to`,長度隨之伸縮 | `fig035`、`fig081` |
| `worm` | 螺桿、蝸桿 | `fig031`、`fig102` |
| `tube` | `points`、`radius`、`closed`:固定在零件上的凸條(螺紋) | `fig029`、`fig050` |
| `fill` | 存量:`size: [w, h, d]`(或 `shape: "cylinder"`、或 `outline` 固定外形),姿勢的 `level` 0–1 由底往上填 | `fig162`、`fig316` |
| `group` | 只由 `pieces` 組成 | 機架、軸承 |
| 路徑零件 `belt` / `rope` / `rod` / `chain` / `trace` | 姿勢回傳折線;`rod` 任一段變長會被 `rigid-links.mjs` 報出(零件上 `stretch: "原因"` 的除外) | |

## 共用模組:什麼情境用哪個

基礎層(任何模型都可能用到)。每列只給情境與一兩個錨點函式,其餘 `grep -n "^export" models/模組.js` 一行就有:

| 模組 | 情境 |
|---|---|
| `kit.js` | 向量、四元數(`quatFromBasis`)、往復(`swing`)、螺旋前進、皮帶與繩的路徑 |
| `shapes.js` | 板件的 2D 輪廓:圓、環、齒輪(`gearShape`)、扇形齒、棘輪、齒條、加厚折線;做 pieces 的 `zCylinder`、`spanBox` |
| `gears.js` | 咬合:兩輪的相位(`meshAngle`)、齒輪齒條、傘齒輪(`bevelGear`) |
| `linkage.js` | 連桿閉合:兩圓交點、滑塊、四連桿(`fourBar`)、數值求根 |
| `contact.js` | 由接觸算:零件擺到碰到障礙物為止(`swingUntilContact`)、多邊形的間隙與穿入深度、脫開後落下。範例 `fig063` |
| `escapement.js` | 擒縱:逐步模擬一個週期(`escapeByContact`)、叉瓦作圖、落下。範例 `fig288`;靜擊式見 `dead-beat-anchor.js`,止動式見 `detent-escapement.js` |
| `jumps.js` | 間歇的時序:推—落(`pushAndFall`)、頂起—落下、分度 |
| `cams.js` | 凸輪與從動件:刀口、平面、滾子從動件,輪廓取樣 |
| `flow.js` | 流體示意:沿路徑移動的點(`stream`)、存量的斜坡。範例 `fig162` |
| `section.js` | 剖面:剖掉前半(`backHalf`)、螺紋剖面 |
| `supports.js` | 機架補件:軸承座(`pedestal`)、方形導套、板條 |
| `pump.js` | 泵的剖面:可開口的泵筒(`barrel`)、可斷開的管壁(`pipeWalls`)、閥室、瓣閥、隨活塞升降的水 |
| `epicyclic.js` / `bevel-train.js` | 周轉輪系:Willis 公式、行星傘齒輪的姿勢 |
| `kinds.js` | 種類清單(`PART_KINDS`)、目標件的判定 |

其餘五十多個是 2–4 張圖共用的機構模組(`cone-pair.js`、`cornish-gear.js`…),**檔頭第一行寫了共用哪幾張與原理**。找有沒有現成的:`sed -n 1,2p models/*.js | grep 關鍵詞`。改共用模組會影響所有 import 它的圖:`grep -ln "from \"./模組.js\"" models/`。

## 測試

- 一族一檔 `tests/<族>.test.js`;某張圖的測試用 `grep -n "NNN" tests/*.test.js` 找。新測試放在該圖現有測試旁邊;同一模組的 import 只留一行,要新函式就擴充檔頭那一行。
- 斷言對到原文的一句、或對到接觸與守恆(間隙接近 0、全程不穿入、桿長不變、扭矩同向),見 `model-audit.md` 第 1 類。
- `tests/helpers.js` 依用途分四組,錨點如下,其餘 `grep -n "^export" tests/helpers.js`:

| 用途 | 錨點 |
|---|---|
| 取零件、比數值、兩個主動量之間的轉角、取樣點 | `part`、`turned`、`sweep` |
| 2D 實體:取零件在某個 z 的截面,點在實體裡、兩多邊形的間隙 | `sectionSolids`、`inSolid`、`polyGap` |
| 銷在導槽裡、軸在軸承裡 | `assertShaftInBearings` |
| 同一零件的各塊相連、齒不重疊 | `assertOnePiece`、`assertMeshFree` |

## 維護工具(`tools/`,用法見各檔頭)

| 工具 | 做什麼 |
|---|---|
| `audit.mjs 圖號…` | 原文與各零件的動作摘要 |
| `verify.mjs 圖號…` | 實體驗證;`--brief` 只印結論,只對有問題的圖看完整輸出 |
| `one-piece.mjs`、`rigid-links.mjs`、`outlines.mjs` | 一件、剛性、板件輪廓(複查第 3 類) |
| `model-strip.html?fig=N&vs=…` + `shot.mjs` | 多相位並排截圖;`state=`、`dir=`、`fit=`;一律經截圖服務 |
| `model-preview.html?fig=N` | 插圖與模型初始視角並排 |
| `list-targets.mjs`、`scan-models.mjs` | 全書的目標件、定義掃描 |
| `framing.mjs 圖號…` | 取景掃描:均勻取樣比舊取樣、段數加倍比預設段數的外框大多少,與走到最遠的零件和主動量 |

## 維護本檔

`tools/cheatsheet.test.mjs` 在 `npm test` 裡驗:零件種類表涵蓋 `PART_KINDS` 每一種、每個範例圖真的用了那種零件、共用模組表與 helpers 表提到的函式都還 export 著。它紅了就改表;新增基礎層的共用模組時補一列。
