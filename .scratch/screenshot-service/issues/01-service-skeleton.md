# 01 — 服務骨架:開關、靜態檔、一個 Chrome、截一頁

**What to build:** 主 session 執行啟動指令後,截圖服務在背景跑起來:同時提供專案的靜態檔(不用再另開 python 伺服器),只開一個 headless Chrome(用自己的暫存設定檔),先試顯示卡、讀 WebGL 的繪圖器名稱,拿不到 GPU(名稱是 SwiftShader 或讀不到)就重開成 CPU 模擬;就緒後啟動指令印一行「截圖服務就緒:GPU(顯示卡名稱)」或「截圖服務就緒:CPU 模擬(拿不到 GPU,每張較慢)」並結束。子代理(或主 session)執行命令列 client,給一個專案內的頁面與輸出路徑,服務開新分頁、等 `document.title` 變成 `ready`(變成 `error` 就回報頁面上的訊息)、截整頁、關分頁,client 印出寫出的檔案與寬高。服務沒開時 client 直接失敗,訊息叫你回報主 session 啟動,不自己開 Chrome。關閉指令關 Chrome、刪暫存設定檔、結束服務;啟動時若發現上一次的服務或 Chrome 還在(記錄行程編號的檔案),先清掉。只用 Node 內建模組,找不到 Chrome 就用 Edge;連接埠有預設值、可用環境變數覆寫。見規格 User Stories 1–10、13、16、18、25、28、29。

**Blocked by:** 無

**Status:** done

- [x] 新增 `npm run test:shot`(Node 內建測試執行器),測試啟動服務並把「畫一頁」換成假的元件,執行 client 驗外部行為
- [x] 測試:給一頁 → 寫出檔案、印出路徑與寬高;沒給輸出路徑 → 失敗並說明;服務沒開 → 失敗、訊息叫你回報主 session、不開 Chrome;頁面標題變成 `error` → 回報頁面上的訊息
- [x] 每個行為先寫失敗的測試再實作
- [x] 手動:在這台電腦啟動時印出 GPU 那一行;用 CPU 模擬的參數強制啟動時印出 CPU 模擬那一行
- [x] 手動:截 `tools/model-strip.html` 一張 4 個相位,四個相位都在圖裡
- [x] 手動:關閉後沒有殘留的 headless Chrome 行程與暫存設定檔;故意不關就再啟動,殘留被清掉
- [x] `npm test`、`npm run test:verify` 照舊全過;不新增任何套件
- [x] 以獨立暫存區提交(只放自己的檔案)

## Comments

- 2026-10-16 實作:服務 `tools/shot-service.mjs`(start / stop)、client `tools/shot.mjs`,共用模組在 `tools/shot/`(`service.js` 靜態檔 + 排隊 + 畫一頁、`chrome.js` 經 DevTools Protocol 控制 Chrome);預設連接埠 8618(8765 已被別的 python 靜態伺服器佔用),可用 `SHOT_PORT` 覆寫。測試的接縫是 renderer 開出的「頁面」(標題、版面、截圖),假的在 `tools/shot/fake.js`。
- 手動(這台電腦):`start` 1.6 秒印出「截圖服務就緒:GPU(NVIDIA GeForce GTX 1650, Direct3D11)」;`start --cpu` 印出「截圖服務就緒:CPU 模擬(拿不到 GPU,每張較慢)」。
- 手動:`tools/model-strip.html?fig=63&vs=0,1.5,3,4.5` 一張 1800×310、1.7 秒,插圖與四個相位都在圖裡。
- 手動:`stop` 後 headless Chrome 行程 0 個、暫存設定檔與記錄檔都刪掉;啟動後不關再 `start`,舊的服務被清掉、只剩一份 Chrome 與一個設定檔。在 Windows 上單獨殺掉服務時 Chrome 也跟著結束(Node 把子行程放在關閉即結束的 job 裡)。
