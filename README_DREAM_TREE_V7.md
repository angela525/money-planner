# Dream Tree V7 Beta

## 本版完成
- 修正 Firebase API Key 的 `1`／`l` 字元錯誤。
- Google 一鍵登入：電腦使用 Popup，手機自動使用 Redirect。
- Google 登入回跳結果處理。
- Google 頭像顯示於右上角帳號選單。
- 第一次登入引導：稱呼、第一個夢想、目標金額。
- 第一個夢想會直接加入當月目標。
- Email 登入／註冊／忘記密碼完整保留。
- 雲端即時同步與本機離線資料完整保留。
- 修正 Service Worker 對 Chrome 擴充套件網址快取造成的錯誤。
- 新增 firestore.rules 供核對。

## 部署
1. 將本資料夾所有內容覆蓋到 GitHub Desktop 的 money-planner 資料夾。
2. Commit 訊息：`Release Dream Tree V7 Beta`
3. Commit to main → Push origin。
4. 等 GitHub Pages 部署後，手機關閉網站再重開；電腦按 Ctrl+Shift+R。

## Firebase 必要設定
- Authentication：Email/Password 與 Google 已啟用。
- Authorized domains：包含 `angela525.github.io`。
- Firestore 規則可與根目錄 firestore.rules 核對。

## 說明
目前保留單一雲端資料文件 `users/{uid}/data/app`，確保與既有資料完全相容。待資料穩定後再進行分集合遷移，避免升級時遺失既有帳務。
