# ことり Kotori｜日語學習室

手機優先的免費日語學習 PWA，繁體中文介面。使用靜態 HTML、CSS、JavaScript，沒有付費 API、廣告 SDK 或追蹤程式。所有教材與進度都在瀏覽器端使用；未串接帳號同步或付費語音。

## 使用內容

- 五十音：46 個清音的平／片假名、92 字筆順、58 組濁音／半濁音／拗音，以及觸控自由手寫。手寫不做正確率評分。
- 單字：104 個原創生活例句與中文釋義，文字／聽音卡片、收藏、1／3／7／14 日複習。
- 文法：12 個核心句型、中文解說、語音例句及詞塊組句。
- 會話：6 組情境，分角色練習，最長 30 秒本機錄音對照。不做口說自動評分。
- 閱讀：4 篇原創短文、內建詞彙假名、逐句翻譯與閱讀題。
- 文章：貼上／UTF-8 TXT、Markdown 文字匯入；上限 50 KB 與 10,000 字。Kuromoji 斷詞、詞性、基本形及讀音，內建詞庫中文釋義，12 種規則句型線索。不是完整機器翻譯或通用 AI 語意家教。
- 遊戲：五十音、單字、聽力、文法選擇題，10 題一回合、XP、每日目標、錯題回訪及進度 JSON 備份。

## 免費與使用限制

Web Speech API 僅使用裝置可用的日文語音；缺少語音時會提示安裝，聽力遊戲不會開始。品質與連網需求取決於裝置，並非母語者錄音。

文章分析第一次下載約 18 MB 詞典，使用 Web Worker 在本機執行。日文專有名詞、歧義讀音、規則句型提示仍可能錯誤；未收錄詞彙不捏造中文意思。

進度只存於目前瀏覽器 localStorage。錄音僅留在本次頁面。無伺服器同步。離線資源以 service worker 快取，私人站點登入與部分裝置語音仍可能需要連網。靜態託管供應商的額度依其服務條件，程式不要求任何 API 金鑰。

## 執行與部署

`dist/` 可直接部署到支援 HTTPS 的靜態託管服務。PWA 安裝、麥克風及 service worker 需要安全環境。本站目前透過 Sites 私人部署；部署設定在 `.openai/hosting.json`。

沒有編譯步驟與執行時 npm 依賴。`tools/fetch-assets.py` 重新下載 Kuromoji 0.1.2 及 KanjiVG 的基本假名路徑；目前完整資料已包含在 `dist/assets`。

## 驗證

在暫存資料夾安裝 `linkedom`，再執行：

```bash
npm install --prefix /tmp/kotori-qa --no-save linkedom
KOTORI_QA_ROOT=/tmp/kotori-qa node tools/check.mjs
```

驗證範圍為 DOM 渲染與操作邏輯、題庫品質、進度、匯入驗證、文章內容轉義及真實 Kuromoji worker 的詞典分析。自動化驗證沒有實機瀏覽器；觸控、語音、麥克風、PWA 安裝與手機版面需要裝置驗證。

## 授權出處

教材、例句、會話、短文與題目為此專案編寫。

- [Kuromoji.js](https://github.com/takuyaa/kuromoji.js)，Takuya Asano，Apache 2.0。完整授權及 IPADIC 著作權聲明在 `dist/assets/kuromoji/LICENSE-2.0.txt` 與 `NOTICE.md`。
- [KanjiVG](https://kanjivg.tagaini.net/)，Ulrich Apel，CC BY-SA 3.0。`dist/assets/strokes.json` 由原 SVG 擷取路徑，顏色及動畫由本 App 改作；該衍生筆順資料仍依 CC BY-SA 3.0。完整授權在 `dist/assets/licenses/KanjiVG-COPYING.txt`。
- 自繪向量圖示與字元介面，無付費字型或圖片素材。
