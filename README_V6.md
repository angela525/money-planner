# Dream Tree V6.0 Refactor

本版將原本單一 `index.html` 拆成可維護結構：

- `index.html`：頁面結構
- `css/app.css`：全站樣式
- `js/app.js`：全部互動與資料邏輯
- `assets/images/brand-logo.png`：品牌 Logo
- `manifest.json` / `service-worker.js`：PWA 與離線快取

底部導覽順序：**規劃 → 轉帳 → 首頁 → 清算 → 帳戶**。

## 使用 GitHub Desktop 更新
1. 將本資料夾內所有檔案複製到本機 `money-planner` 資料夾並選擇取代。
2. GitHub Desktop 的 Changes 應出現新增與修改檔案。
3. Summary 輸入 `Upgrade to Dream Tree V6.0`。
4. 按 `Commit to main`。
5. 按 `Push origin`。
