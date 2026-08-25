# pi-eli5 設計規格

2026-08-25

把 Claude Code 的 `eli5` skill 移植成 pi coding agent 的外掛套件，發佈為公開 GitHub repo `johnkai-kai/pi-eli5`。

## 為什麼需要重新設計

上游 eli5 的全部內容是一份五行的 `SKILL.md`：叫模型產出 HTML artifact。它能成立，是因為 Claude Code 有 Artifact 工具——一個把 HTML 發佈成可瀏覽網頁的執行期。

**pi 沒有這個執行期。** 模型在 pi 裡產出 HTML 的唯一手段是 `write` 工具寫成檔案。所以移植的實質工作不是搬文字，是補上被 Artifact 隱藏掉的那一段：檔案落在哪、誰負責打開它、使用者怎麼知道它在哪。這是本案唯一的真設計決策，已與使用者談定。

## 決策

| 項目 | 決定 | 理由 |
|---|---|---|
| 輸出位置 | `~/.pi/eli5/` | eli5 產出是「看過就好的解說」，不是專案資產。寫進使用者的專案是強加副作用；集中在家目錄會自然累積成可回頭翻的個人圖書館 |
| 交付方式 | 寫檔後自動用系統預設瀏覽器開啟，並由 agent 明講路徑 | 使用者要的是「跳出來就能看」，同時知道東西放哪 |
| 外掛形態 | skill + extension | 開檔是跨平台程式邏輯（Windows 引號規則易錯），必須是真程式碼才可測；有 extension 才能註冊 `/eli5` 短指令與 `eli5_publish` 工具 |
| repo 名稱 | `pi-eli5` | 與 `pi-statusline-hud` 同命名家族 |
| repo 可見性 | public | 使用者裁定。安裝免憑證；相對地敏感資訊掃描更重要 |
| 授權疊法 | `LICENSE`(自己) + `LICENSE-eli5`(來源聲明 + MIT 全文 + Apache 指標) | 上游未留 MIT 全文，需自行補齊並標明兩層授權來源 |

## 上游授權事實

移植前查證的實據，寫進 `LICENSE-eli5`：

- eli5 來自 `anthropics/claude-plugins-community`，Anthropic 擁有的 repo，定位為社群外掛市集的唯讀鏡像，外掛需通過審查與自動安全掃描才會列入。
- 該 repo 根目錄授權為 **Apache-2.0**。
- eli5 外掛的 `.claude-plugin/plugin.json` 自宣告 `"license": "MIT"`，`author.name` 為 **Thariq Shihipar**。
- eli5 子目錄**沒有**自己的 LICENSE 全文檔（同 repo 的其他外掛有）。

兩層授權都允許修改與再散布，義務是保留版權與授權聲明。`LICENSE-eli5` 因此包含三段：來源事實聲明（repo、路徑、`plugin.json` 原文引述）、標準 MIT 全文標 `Copyright (c) 2026 Thariq Shihipar`、以及上游 repo 另以 Apache-2.0 散布的註記。

## 架構

```
pi-eli5/
├── package.json          pi.extensions: ./src/index.ts · pi.skills: ./skills
├── src/
│   ├── index.ts          re-export 預設 extension
│   ├── eli5.ts           extension：registerTool + registerCommand
│   ├── config.ts         讀寫 <agentDir>/pi-eli5.json
│   ├── naming.ts         slug 化與檔名決定
│   ├── opener.ts         跨平台開檔指令表
│   └── publish.ts        寫檔 → 開啟 → 回報
├── skills/eli5/SKILL.md
├── scripts/scan-secrets.mjs
├── tests/                node --test
├── .github/workflows/ci.yml
├── LICENSE · LICENSE-eli5
├── README.md · .gitignore · .gitattributes · tsconfig.json
```

每個單元一個職責，彼此以純資料介面相接：

**`naming.ts`** — 輸入 topic 字串與既有檔名清單，輸出檔名。slug 只保留 `a-z0-9-`（其餘字元轉連字號、去頭尾與連續連字號），非 ASCII 主題（中文）slug 可能全空，此時退回 `explainer`。檔名格式 `YYYY-MM-DD-<slug>.html`；已存在則加 `-2`、`-3`。日期由呼叫端傳入，函式本身不讀時鐘，才可測。

**`opener.ts`** — 輸入平台字串與絕對路徑，輸出 `{ command, args }`。`win32` → `cmd` + `["/c", "start", "", path]`；`darwin` → `open` + `[path]`；其他 → `xdg-open` + `[path]`。永遠傳陣列不拼字串，避開 Windows 引號規則。不執行任何東西，只回傳指令。

**`config.ts`** — 讀 `<agentDir>/pi-eli5.json`。兩個鍵：`outputDir`（預設 `~/.pi/eli5`，`~` 展開為家目錄）、`autoOpen`（`"on"`/`"off"`，預設 `"on"`，舊布林值也讀得進來）。檔案不存在、JSON 壞掉、型別不對，一律回退預設，不拋錯——設定檔壞掉不該讓解說產不出來。

**`publish.ts`** — 協調者。輸入 topic、html、config、以及注入的 `writeFile`/`exec`/`now`，輸出 `{ path, opened }`。負責建目錄、決定檔名、寫檔、依 `autoOpen` 決定是否呼叫 opener。開檔失敗不視為錯誤：檔案已經寫成功，回報 `opened: false` 讓模型改成單純告知路徑。

**`eli5.ts`** — 唯一碰 pi API 的檔案。
- `pi.registerTool({ name: "eli5_publish" })`，參數 `{ topic: string, html: string }`，回傳寫檔路徑與是否已開啟。
- `pi.registerCommand("eli5")`，handler 以 `pi.sendUserMessage()` 把「用 eli5 skill 解說 <args>」送進對話；無參數時提示用法。

**`skills/eli5/SKILL.md`** — 繁體中文。保留上游精神（把讀者當完全不懂的人、大圖少字），並補上 pi 特有的兩條硬規定：HTML 必須完全自包含（inline CSS、零外部資源、零 CDN，因為它是用瀏覽器開的本機檔案）；寫好後必須呼叫 `eli5_publish`，不要自己 `write` 檔案或自己下開檔指令。視覺預設深色暖色系、大字距、少文字。

## 資料流

```
使用者 /eli5 how does DNS work
  → eli5.ts command handler → pi.sendUserMessage("用 eli5 skill 解說：how does DNS work")
  → 模型讀 SKILL.md，產出自包含 HTML
  → 模型呼叫 eli5_publish({ topic, html })
  → publish.ts：建目錄 → naming 決定檔名 → 寫檔 → autoOpen 則 opener + pi.exec
  → 回傳 { path, opened } → 模型告訴使用者檔案在哪、已開啟
```

## 錯誤處理

| 情況 | 行為 |
|---|---|
| 設定檔缺失／壞掉 | 靜默回退全預設 |
| `outputDir` 不可寫 | 工具回傳錯誤訊息含路徑，模型轉達；不吞掉 |
| 開檔指令失敗或逾時 | 檔案保留，回報 `opened: false`，模型改為告知路徑 |
| topic slug 化後全空 | 檔名用 `explainer` |
| 檔名碰撞 | 加序號，不覆蓋既有解說 |

## 測試

`node --test`，每個純函式一組：

- `naming`：一般字串、含標點、中文（退回 `explainer`）、大小寫、連續空白、碰撞加序號、路徑穿越字元（`../`）被清掉
- `opener`：三個平台各自的指令與參數形狀，路徑含空白時仍是獨立 argv 元素
- `config`：檔案缺失、壞 JSON、未知鍵、`~` 展開、舊布林 `autoOpen`
- `publish`：注入假 fs/exec，驗證寫檔內容與路徑、`autoOpen: off` 不呼叫 exec、exec 失敗仍回傳成功路徑與 `opened: false`
- 契約測試：README 表格列出的設定鍵與 `config.ts` 的預設值一致（照 pi-statusline-hud 的 docs-contract 做法）

CI（`.github/workflows/ci.yml`，Node 22）：`npm test` → `node scripts/scan-secrets.mjs` → `npx tsc --noEmit`。

`scripts/scan-secrets.mjs` 照抄 pi-statusline-hud，`SKIP_FILES` 改為 `LICENSE`、`LICENSE-eli5`、`scan-secrets.mjs`。repo 為 public，全部文件與範例不得出現個人 email、Windows 使用者家目錄、家目錄路徑。

## 不做（YAGNI）

- 不做 HTML 樣板引擎或元件庫——樣式由模型逐次產生，SKILL.md 給方向就夠
- 不做互動式設定選單（hud 有是因為它有十種配色要瀏覽；這裡只有兩個鍵，手改 JSON 即可）
- 不做歷史索引頁／清單指令——先看使用者累積到會想找再說
- 不支援自訂開檔程式——系統預設瀏覽器即可
