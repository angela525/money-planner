# Dream Tree V6.2 Cloud

## 已整合
- Email / 密碼註冊與登入
- 忘記密碼郵件
- 保持登入狀態
- 登出
- Firestore 單一使用者資料文件
- 首次登入自動將本機資料搬到雲端
- 手機、電腦即時同步
- 700ms 防抖自動存檔
- 離線／同步中／已同步／同步失敗狀態
- 手動立即同步

## Firestore 路徑
`users/{uid}/data/app`

## 上線前 Firebase Console 必做
1. Authentication > Settings > Authorized domains 加入：`angela525.github.io`
2. Authentication > Sign-in method：Email/Password 已啟用
3. Firestore Rules 已發布：使用者只能讀寫自己的 `/users/{uid}/...`

## 首次使用資料策略
- 使用者雲端尚無資料：將目前瀏覽器 localStorage 的 Dream Tree 資料上傳。
- 使用者雲端已有資料：以雲端資料載入目前裝置。

## 部署
把本資料夾中的全部檔案覆蓋到 GitHub Desktop 的 `money-planner` 資料夾，Commit 後 Push origin。
