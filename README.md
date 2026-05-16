# 公務人員薪資試算 govpay

[![Build and Deploy](https://github.com/z111048/govpay/actions/workflows/deploy.yml/badge.svg)](https://github.com/z111048/govpay/actions/workflows/deploy.yml)

台灣公務人員薪資靜態試算工具，支援多職系、多加給表、升等比較、年度試算、多年收入預測與暗黑模式。

🔗 **[線上試算 → https://z111048.github.io/govpay/](https://z111048.github.io/govpay/)**

> 資料僅供試算參考，不代表任何人實際薪資，以官方公告為準。

---

## 功能概覽

| 頁籤 | 功能 |
|------|------|
| **薪資試算** | 依職等、俸點、加給表、眷口數、退撫制度即時試算月實領 |
| **升等比較** | 選擇範例情境或自訂，對比升等前後應領／扣款／實領差異，產生分享圖卡 |
| **年度試算** | 本年度全薪試算（考績獎金＋年終獎金），以及 1–5 年不升等收入預測 |
| **資料查詢** | 瀏覽俸點表、職等俸級表、各專業加給表、主管加給、健保級距、退撫、公保 |
| **資料來源** | 所有資料集版本、生效日期與官方來源連結 |

### 介面與體驗

- 預設暗黑模式，可於頁首切換亮暗模式。
- 手機版分頁列支援橫向滑動與 sticky 固定，降低切換成本。
- 升等比較、薪資摘要、年度試算與資料表支援 RWD，窄螢幕會自動改為單欄或可橫向捲動。

### 支援參數

- 職等：委任1等 ～ 簡任14等
- 俸點：完整本俸＋年功俸對照
- 專業加給表：表一（主計）、表二（人事）、表三（政風）、表四（一般行政）、表七（技術/工程）、表八（醫事）
- 工程人員另增支 3,000 元
- 主管職務加給（依類別自動帶入）
- 健保眷口數：0–6 口
- 退撫舊制／新制
- 考績等次：甲等、乙等、丙等
- 年終獎金月數（可調整）
- 每年薪資調整率（多年預測用）

---

## 技術架構

```
資料處理層（Python / uv）
    ↓ 讀取 data/raw/*.csv
    ↓ 驗證、清理、標準化（pydantic）
    ↓ 輸出 data/processed/*.json
    ↓ 複製到 web/public/data/

靜態前端層（Vite / TypeScript / Tailwind CSS）
    ↓ 讀取 /public/data/*.json
    ↓ 純前端即時試算（不需後端）
    ↓ 分享圖卡產生（html-to-image）

部署層（GitHub Actions → GitHub Pages）
    pytest → export-web → npm build → deploy
```

### 資料流

```
官方 PDF / 法規
    → data/raw/*.csv      （人工整理）
    → data/processed/*.json  （Python 驗證輸出）
    → web/public/data/*.json  （前端讀取）
    → 使用者瀏覽器即時計算
```

---

## 專案結構

```
govpay/
├── pyproject.toml              # uv 專案設定（Python 3.12+）
├── uv.lock
├── data/
│   ├── raw/                    # 原始資料 CSV（人工維護）
│   │   ├── salary_points_114.csv
│   │   ├── salary_grades_114.csv
│   │   ├── professional_allowance_table_{1,2,3,4,7,8}.csv
│   │   ├── supervisory_allowance.csv
│   │   ├── health_insurance_115.csv
│   │   ├── pension_old.csv
│   │   └── civil_service_insurance.csv
│   └── processed/              # 產生的 JSON（由 Python 輸出）
├── src/salary_data/            # Python 套件
│   ├── schemas.py              # pydantic 資料模型
│   ├── loaders.py              # CSV → pydantic
│   ├── calculators.py          # 薪資試算核心邏輯
│   ├── exporters.py            # JSON 輸出
│   └── cli.py                  # typer CLI 指令
├── tests/
│   ├── test_calculators.py     # 試算邏輯驗證（含確認值）
│   └── test_validators.py      # 資料完整性測試
├── web/                        # 前端專案（Vite + TypeScript）
│   ├── index.html
│   ├── vite.config.ts
│   ├── public/data/            # 前端讀取的 JSON
│   └── src/
│       ├── main.ts             # 應用程式入口
│       ├── types.ts            # TypeScript 型別定義
│       ├── scenarios.ts        # 預設範例情境
│       ├── salaryCalculator.ts # 前端試算邏輯（純函式）
│       ├── dataLoader.ts       # JSON 資料載入
│       └── components/
│           ├── SalaryForm.ts       # 薪資條件表單
│           ├── SalaryBreakdown.ts  # 月薪明細
│           ├── PromotionCompare.ts # 升等比較＋分享圖卡
│           ├── AnnualProjection.ts # 年度試算＋多年預測
│           └── DataBrowser.ts      # 資料查詢瀏覽
└── .github/workflows/deploy.yml   # GitHub Actions CI/CD
```

---

## 本地開發

### 需求

| 工具 | 版本 |
|------|------|
| Python | 3.12+ |
| uv | 最新版 |
| Node.js | 20+ |

### 快速開始

```bash
# 1. 安裝 Python 相依套件
uv sync

# 2. 驗證資料完整性
uv run salary-data validate

# 3. 產生結構化 JSON
uv run salary-data build

# 4. 執行測試
uv run pytest -v

# 5. 複製 JSON 到前端
uv run salary-data export-web

# 6. 啟動前端開發伺服器
cd web
npm install
npm run dev
```

### 版本與變更紀錄

- 前端版本記錄於 `web/package.json`。
- 使用者可見的功能、修正與體驗調整記錄於 `CHANGELOG.md`。

---

## 資料更新流程

當官方資料異動時（如健保費率、俸額調整）：

```bash
# 1. 更新 data/raw/ 對應 CSV 檔案
# 2. 重新驗證與產生
uv run salary-data validate
uv run salary-data build
uv run pytest          # 確認確認值不變（或更新預期值）
uv run salary-data export-web

# 3. 建置前端
cd web && npm run build
```

---

## 確認值（Fixture）

以下數值已由法規計算確認，測試套件會自動驗證：

| 情境 | 項目 | 金額 |
|------|------|------|
| 薦任七本五（俸點 475）、專業加給表七、工程另增支、退撫舊制、健保0口 | 月實領 | **62,096** |
| 薦任八本三（俸點 475）、同上 | 月實領 | **64,450** |
| 升等差額 | 每月增加 | **2,354** |

---

## 資料來源

| 資料集 | 主管機關 |
|--------|----------|
| 公務人員俸額表（114年） | 銓敘部 |
| 公務人員職等俸級表（114年） | 銓敘部 |
| 公務人員專業加給表（一、二、三、四、七、八） | 銓敘部 |
| 主管職務加給表 | 銓敘部 |
| 全民健保投保金額分級表（115年） | 衛生福利部中央健康保險署 |
| 退休撫卹基金舊制費率表 | 公務人員退休撫卹基金管理委員會 |
| 公教人員保險費率表 | 臺灣銀行公教保險部 |

---

## 授權

MIT License

本工具及資料僅供個人試算參考，不代表任何人實際薪資，數據請以主管機關公告為準。
