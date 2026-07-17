# 校園外送前台原型：小組 Git 協作練習

這是 Day 3 的小組協作 starter 專案。它是純 HTML、CSS、JavaScript 的靜態網站，不串接資料庫、付款或真正的外送服務；課程重點是 **branch、Pull Request、review 與 merge**。

## 開啟方式

直接在瀏覽器開啟 `index.html`，或使用 VS Code 的 Live Server 預覽。

## 專案結構

```text
delivery-demo-starter/
├── index.html                 # 首頁
├── css/base.css               # 全站共用樣式（起始檔，非主要任務）
├── js/app.js                  # 簡單的加入購物車提示
├── pages/
│   ├── restaurants.html
│   ├── menu.html
│   ├── cart.html
│   ├── order-status.html
│   ├── profile.html
│   └── contact.html
└── README.md
```

## 小組 Git 流程

```text
main（正式展示版本）
└── dev（整合版本）
    ├── feature/home
    ├── feature/restaurants
    ├── feature/menu
    ├── feature/cart
    ├── feature/order-status
    └── feature/profile-contact
```

1. 組長建立 repository，並從 `main` 建立 `dev`。
2. 每位組員從 `dev` 建立自己的功能分支。
3. 完成功能後，commit、push，並建立 `dev ← feature/*` 的 Pull Request。
4. 指定一位組員 review；組長／整合者 merge 到 `dev`。
5. 全組測試所有頁面與連結後，由組長建立 `main ← dev` 的 Pull Request。

### 分支保護建議

| 分支          | 課堂設定                                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| `main`      | Require a pull request；Required approvals 設為`1`；不要允許 force push 或刪除分支。 |
| `dev`       | Require a pull request；Required approvals 可設為`0`，避免流程卡住。                 |
| `feature/*` | 不設定保護，由個人開發。                                                               |

> 若使用 GitHub Free，請使用公開 repository，且不要放入密碼、Token、API Key 或其他機密資料。

## 六位組員任務

每人建立 **feature branch 與 Pull Request**。請優先修改自己負責的檔案；若真的需要改共用檔案，先與組長協調。

| 成員 | Branch                      | 主要檔案                                       | 任務                                                        | 驗收條件                                     |
| ---- | --------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| 1    |  `feature/home`           | `index.html`                                 | 完成首頁與平台介紹，加入至少 3 個服務特色或使用步驟。       | 首頁有清楚標題、介紹與可前往餐廳頁的連結。   |
| 2    | `feature/restaurants`     | `pages/restaurants.html`                     | 建立至少 3 張餐廳卡片：名稱、類型、營業時間與菜單連結。     | 三張卡片都能看見，且至少一個連結可到菜單頁。 |
| 3    | `feature/menu`            | `pages/menu.html`                            | 建立至少 3 張餐點卡片：名稱、簡介、價格與加入購物車按鈕。   | 點擊按鈕時，畫面顯示已加入的提示。           |
| 4    | `feature/cart`            | `pages/cart.html`                            | 建立購物車摘要：至少 2 項餐點、運費、總金額與模擬下單按鈕。 | 金額資訊清楚，按鈕不需要真的付款。           |
| 5    | `feature/order-status`    | `pages/order-status.html`                    | 建立訂單進度：店家接單、餐點製作中、外送途中。              | 至少三個步驟，且能辨識目前進行中的狀態。     |
| 6    | `feature/profile-contact` | `pages/profile.html`、`pages/contact.html` | 建立會員資料與客服資訊，或做一個不送出的意見表單。          | 兩頁都有明確內容，且不填入真實個人資料。     |

## Pull Request 檢查清單

開 PR 前，確認：

- [ ] 只修改自己負責的檔案或已先與組長協調。
- [ ] 網頁能正常開啟，導覽連結沒有壞掉。
- [ ] PR 標題說明做了什麼，例如：`新增餐廳列表頁`。
- [ ] PR 目標分支是 `dev`，不是 `main`。
- [ ] 沒有提交 `.env`、密碼、Token 或 API Key。
