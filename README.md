# pi-eli5

用大圖少字的 HTML 把一個主題解釋給完全不懂的人聽。[pi](https://github.com/earendil-works/pi) coding agent 外掛。


## Demo

```
> /eli5 how does DNS work

  eli5  ~/.pi/eli5/2026-08-26-how-does-dns-work.html
        已用預設瀏覽器開啟。
```

解說是一份自包含的 HTML，存進 `~/.pi/eli5/`，寫完自動跳出瀏覽器，agent 順便告訴你檔案在哪。


## Quickstart

install

```bash
pi install git:github.com/johnkai-kai/pi-eli5
```

uninstall

```bash
pi uninstall git:github.com/johnkai-kai/pi-eli5
```

設定檔 `~/.pi/agent/pi-eli5.json` 與 `~/.pi/eli5/` 裡的解說不會跟著被刪，重裝時原本的設定與累積的解說都還在。真的不要了就自己刪。


## 兩個入口

| 方式 | 說明 |
|---|---|
| `/eli5 <主題>` | extension 註冊的短指令，直接開講 |
| `/skill:eli5 <主題>` | pi 內建的 skill 指令，效果相同 |
| 自然語言 | 「用最白話的方式解釋 X」「當我是小孩子講一次」，模型自己會叫用 skill |


## Config

設定檔為 `~/.pi/agent/pi-eli5.json`，沒有這個檔就是全用預設。改完立即生效，不用重啟。

| 鍵 | 預設 | 說明 |
|---|---|---|
| `outputDir` | `~/.pi/eli5` | 解說 HTML 存哪，可用 `~` |
| `autoOpen` | `"on"` | 寫完要不要自動用系統預設瀏覽器開啟，`"on"` / `"off"` |

```json
{
  "outputDir": "~/Documents/explainers",
  "autoOpen": "off"
}
```

設定檔壞掉或不存在一律靜默回退預設——設定檔的問題不該讓你連解說都產不出來。


## 它做了什麼

Claude Code 版的 eli5 靠 Artifact 工具把 HTML 發佈成網頁。**pi 沒有那個執行期**，所以這個移植補上了被 Artifact 隱藏掉的那一段：

| 單元 | 職責 |
|---|---|
| `skills/eli5/SKILL.md` | 教模型怎麼講、怎麼畫，以及 HTML 必須完全自包含（inline CSS、零 CDN、零外部資源） |
| `eli5_publish` 工具 | 決定檔名、寫檔、跨平台開啟、回報路徑 |
| `/eli5` 指令 | 短指令入口 |

跨平台開檔一律以 argv 陣列呼叫，不拼字串：Windows `cmd /c start "" <path>`、macOS `open <path>`、其他 `xdg-open <path>`。檔名為 `YYYY-MM-DD-<slug>.html`，slug 只保留 `a-z0-9-`（同時是擋路徑穿越的安全邊界），同日同題不覆蓋而是加序號。


## Thanks

移植自 [eli5](https://github.com/anthropics/claude-plugins-community/tree/main/eli5)
(MIT, © 2026 Thariq Shihipar)，一個 Claude Code 外掛。原始授權與來源聲明完整保留在 `LICENSE-eli5`。


## License

MIT — `LICENSE`。
