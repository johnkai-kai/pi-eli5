---
name: eli5
description: Explain a topic to someone who knows nothing about it, using an HTML page of big pictures and very few words. Use when the user types /eli5 <topic> or /skill:eli5 <topic>, or asks to have something explained in the simplest possible terms, drawn out, or "explained like I'm five". The HTML is saved to the user's explainer folder and opened in their browser.
license: MIT (see LICENSE-eli5)
---

# eli5

Explain the topic to **someone who knows nothing about it**, as an HTML page of big pictures and few words.

## How to explain

- **Pictures first, words second.** The page is carried by visuals: boxes, arrows, flows, contrasts. Text labels the picture; it does not replace it.
- **One idea per section.** Each section teaches exactly one thing before the next begins.
- **Few words.** If a section needs more than two sentences, you have not worked out how to draw it yet.
- **No jargon.** When a term is unavoidable, compare it to an everyday object first, then name it.
- **Start from first principles.** Explain *why this thing needs to exist* before *how it works*. An explanation that skips the motivation does not stick.

## HTML rules

The output is a **local file opened in a browser** — no server, no guaranteed network:

- **Fully self-contained.** All CSS inline in a `<style>` block. No external stylesheets, no CDN, no web fonts, no remote images.
- **Draw with inline SVG or plain CSS.** Never `<img src="http...">` — offline that is a broken image.
- **Dark background, warm palette**, large type, generous line height. The reader may stare at this for a while.
- Set `lang` on `<html>` and give the page a `<title>` — it becomes the browser tab name.
- Constrain the layout with `max-width` and make sure a narrow window never scrolls horizontally.

## Delivery

When the HTML is ready, **call the `eli5_publish` tool** with `{ topic, html }`.

- **Never write the file yourself.** Do not use the `write` tool for the explainer, and do not run `start`, `open`, or `xdg-open`. The tool already handles the filename, the output directory, and cross-platform opening. Writing it yourself puts the file in the wrong place with the wrong name and nothing opens.
- The tool returns an absolute path. **Tell the user that path** and whether it was opened automatically.
- If the tool reports it was not opened, do not retry — just tell the user where the file is.

## What the user can configure

`<agentDir>/pi-eli5.json` (`agentDir` is usually `~/.pi/agent`), two keys:

| Key | Default | Meaning |
|---|---|---|
| `outputDir` | `~/.pi/eli5` | Where explainers are saved; `~` is expanded |
| `autoOpen` | `"on"` | Whether to open the file in the default browser, `"on"` / `"off"` |

"Stop popping up a window" or "put these somewhere else" means editing this file. Changes take effect immediately; no restart.
