# Dream Tree V6.3 — Google 登入版

已修正：
- 登入、建立帳號、重設密碼不再同時顯示。
- 上方分頁只顯示對應表單。
- 重設密碼由「忘記密碼？」進入。

已新增：
- Google 一鍵登入。
- Google 帳號選擇器。
- 彈出視窗被阻擋時，自動改用重新導向登入。
- 原有 Email 登入、註冊、重設密碼與 Firestore 同步完整保留。

Firebase 必做：
1. Authentication → 登入方式 → 新增供應商 → Google。
2. 啟用 Google。
3. 選擇專案支援電子郵件。
4. 儲存。
5. Authentication → 設定 → 已授權網域，確認有 angela525.github.io。

部署：
把所有檔案覆蓋到 money-planner，再用 GitHub Desktop Commit 與 Push。
