# pi-eli5

Explain any topic to someone who knows nothing about it, as an HTML page of big pictures and few words. A plugin for the [pi](https://github.com/earendil-works/pi) coding agent.


## Demo

```
> /eli5 how does DNS work

  eli5  ~/.pi/eli5/2026-08-26-how-does-dns-work.html
        Opened in the default browser.
```

The explainer is a self-contained HTML file, saved to `~/.pi/eli5/`, opened in your browser as soon as it is written. The agent tells you the path.


## Quickstart

install

```bash
pi install git:github.com/johnkai-kai/pi-eli5
```

uninstall

```bash
pi uninstall git:github.com/johnkai-kai/pi-eli5
```

Uninstalling leaves `~/.pi/agent/pi-eli5.json` and everything in `~/.pi/eli5/` in place — your settings and your explainers survive a reinstall. Delete them yourself if you want them gone.


## Two entry points

| Form | Notes |
|---|---|
| `/eli5 <topic>` | Short command registered by the extension |
| `/skill:eli5 <topic>` | pi's built-in skill command; same result |
| Plain English | "explain X in the simplest possible terms" — the model invokes the skill on its own |


## Config

`~/.pi/agent/pi-eli5.json`. No file means all defaults. Changes take effect immediately; no restart.

| Key | Default | Meaning |
|---|---|---|
| `outputDir` | `~/.pi/eli5` | Where explainers are saved; `~` is expanded |
| `autoOpen` | `"on"` | Open in the default browser after writing, `"on"` / `"off"` |

```json
{
  "outputDir": "~/Documents/explainers",
  "autoOpen": "off"
}
```

A missing or malformed config falls back to the defaults silently — a bad config file should not stop you getting an explainer.


## What it actually does

The Claude Code version of eli5 relies on the Artifact tool to publish HTML as a viewable page. **pi has no such runtime**, so this port supplies the part Artifact used to hide:

| Unit | Responsibility |
|---|---|
| `skills/eli5/SKILL.md` | How to explain, how to draw, and the rule that the HTML must be fully self-contained (inline CSS, no CDN, no external assets) |
| `eli5_publish` tool | Picks the filename, writes the file, opens it cross-platform, reports the path |
| `/eli5` command | The short entry point |

Opening is always an argv array, never a concatenated string: Windows `cmd /c start "" <path>`, macOS `open <path>`, otherwise `xdg-open <path>`. Filenames are `YYYY-MM-DD-<slug>.html`, where the slug keeps only `a-z0-9-` — that is also the boundary that stops a topic from escaping the output directory. Same topic twice in one day gets a numeric suffix rather than overwriting.


## Thanks

Ported from [eli5](https://github.com/anthropics/claude-plugins-community/tree/main/eli5)
(MIT, © 2026 Thariq Shihipar), a Claude Code plugin. Its license and provenance are preserved in full in `LICENSE-eli5`.


## License

MIT — `LICENSE`.
