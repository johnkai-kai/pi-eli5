# pi-eli5 design

2026-08-25

Port the Claude Code `eli5` skill to a plugin package for the pi coding agent, published as the public GitHub repo `johnkai-kai/pi-eli5`.

## Why this needs a design at all

Upstream eli5 is a five-line `SKILL.md`: tell the model to produce an HTML artifact. That works because Claude Code has the Artifact tool — a runtime that publishes HTML as a viewable page.

**pi has no such runtime.** The only way a model produces HTML in pi is the `write` tool. So the real work of the port is not moving text; it is supplying the part Artifact hid: where the file lands, who opens it, and how the user learns the path. That is the one genuine design decision here, and it was settled with the user.

## Decisions

| Item | Decision | Rationale |
|---|---|---|
| Output location | `~/.pi/eli5/` | An explainer is something you read once, not a project asset. Writing into the user's project imposes a side effect; a home directory collects them into a personal library worth revisiting |
| Delivery | Write, then open in the default browser, and have the agent state the path | The user wants it to pop up, and to know where it went |
| Plugin shape | skill + extension | Opening a file is cross-platform logic (Windows quoting is easy to get wrong) and must be real code to be testable; only an extension can register the `/eli5` command and the `eli5_publish` tool |
| Repo name | `pi-eli5` | Same naming family as `pi-statusline-hud` |
| Visibility | public | User's call. Installation needs no credentials; secret scanning matters more in return |
| Licensing | `LICENSE` (ours) + `LICENSE-eli5` (provenance + MIT text + Apache pointer) | Upstream ships no MIT text, so it must be supplied and both layers named |

## Upstream licensing facts

Verified before porting; recorded in `LICENSE-eli5`:

- eli5 comes from `anthropics/claude-plugins-community`, a repo owned by Anthropic, described as a read-only mirror of the community plugin marketplace; plugins are listed only after review and automated security scanning.
- That repo's root license is **Apache-2.0**.
- The eli5 plugin's `.claude-plugin/plugin.json` declares `"license": "MIT"` with `author.name` of **Thariq Shihipar**.
- The eli5 subdirectory ships **no** license text of its own (other plugins in the same repo do).

Both layers permit modification and redistribution; the obligation is preserving the notices. `LICENSE-eli5` therefore has three parts: a provenance statement quoting `plugin.json` verbatim, the standard MIT text under `Copyright (c) 2026 Thariq Shihipar`, and a note that the upstream repo is distributed under Apache-2.0.

## Architecture

```
pi-eli5/
├── package.json          pi.extensions: ./src/index.ts · pi.skills: ./skills
├── src/
│   ├── index.ts          re-export of the default extension
│   ├── eli5.ts           extension: registerTool + registerCommand
│   ├── config.ts         reads <agentDir>/pi-eli5.json
│   ├── naming.ts         slug and filename
│   ├── opener.ts         cross-platform open command
│   └── publish.ts        write → open → report
├── skills/eli5/SKILL.md
├── scripts/scan-secrets.mjs
├── tests/                node --test
├── .github/workflows/ci.yml
├── LICENSE · LICENSE-eli5
├── README.md · .gitignore · .gitattributes · tsconfig.json
```

One responsibility per unit, joined by plain-data interfaces:

**`naming.ts`** — takes a topic and the existing filenames, returns a filename. The slug keeps only `a-z0-9-`; a non-ASCII topic can slug to nothing, in which case it falls back to `explainer`. Format is `YYYY-MM-DD-<slug>.html`, with `-2`, `-3` on collision. The date is passed in — the function never reads the clock, which is what makes it testable.

**`opener.ts`** — takes a platform and an absolute path, returns `{ command, args }`. `win32` → `cmd` + `["/c", "start", "", path]`; `darwin` → `open`; otherwise `xdg-open`. Always an array, never a concatenated string, which sidesteps Windows quoting. It executes nothing.

**`config.ts`** — reads `<agentDir>/pi-eli5.json`. Two keys: `outputDir` (default `~/.pi/eli5`, `~` expanded) and `autoOpen` (`"on"`/`"off"`, default `"on"`, legacy booleans still accepted). A missing file, broken JSON, or a wrong type falls back to the defaults without throwing — a bad config must not stop an explainer being produced.

**`publish.ts`** — the coordinator. Takes topic, html, config, and injected `writeFile`/`exec`/`now`; returns `{ path, opened }`. A failed open is not an error: the file is already written, so it reports `opened: false` and lets the model fall back to stating the path.

**`eli5.ts`** — the only file that touches the pi API.
- `pi.registerTool({ name: "eli5_publish" })` taking `{ topic, html }`, returning the path and whether it opened.
- `pi.registerCommand("eli5")`, whose handler pushes "use the eli5 skill to explain \<args\>" into the conversation via `pi.sendUserMessage()`; with no argument it prints usage.

**`skills/eli5/SKILL.md`** — keeps the upstream intent (treat the reader as knowing nothing; big pictures, few words) and adds the two rules pi requires: the HTML must be fully self-contained (inline CSS, no external assets, no CDN, because it is a local file opened in a browser), and the model must deliver through `eli5_publish` rather than writing the file or running an open command itself. Visual default is a dark, warm palette with large type.

## Data flow

```
user: /eli5 how does DNS work
  → eli5.ts command handler → pi.sendUserMessage("use the eli5 skill …")
  → model reads SKILL.md, produces self-contained HTML
  → model calls eli5_publish({ topic, html })
  → publish.ts: ensure dir → naming picks the file → write → if autoOpen, opener + pi.exec
  → { path, opened } → model tells the user where the file is
```

## Error handling

| Case | Behavior |
|---|---|
| Config missing or malformed | Silent fallback to all defaults |
| `outputDir` not writable | The tool returns an error including the path; the model relays it. Not swallowed |
| Open command fails or times out | File is kept; reports `opened: false`; the model states the path instead |
| Topic slugs to nothing | Filename uses `explainer` |
| Filename collision | Numeric suffix; an existing explainer is never overwritten |

## Testing

`node --test`, one group per pure function:

- `naming` — plain strings, punctuation, non-ASCII (falls back to `explainer`), case, repeated whitespace, collision suffixes, traversal characters stripped
- `opener` — the command and argv shape on each of the three platforms; a path with spaces stays one element
- `config` — missing file, broken JSON, unknown keys, `~` expansion, legacy boolean `autoOpen`
- `publish` — injected fake fs/exec; verifies written content and path, that `autoOpen: off` never calls exec, and that a failed exec still returns a successful path with `opened: false`
- Contract tests — the config keys in README and SKILL.md match the defaults in `config.ts` (same approach as pi-statusline-hud's docs contract)

CI (`.github/workflows/ci.yml`, Node 22): install dev dependencies → `npm test` → `node scripts/scan-secrets.mjs` → `npx tsc --noEmit`. The install step runs first because every later step consumes it.

`scripts/scan-secrets.mjs` follows pi-statusline-hud, with `SKIP_FILES` set to `LICENSE`, `LICENSE-eli5`, `scan-secrets.mjs`. The repo is public, so no document or example may contain a personal email address or a home directory path.

## Not doing (YAGNI)

- No HTML template engine or component library — the model writes the styles each time; SKILL.md giving direction is enough
- No interactive settings menu (the HUD has one because it has ten palettes to browse; two keys can be edited by hand)
- No history index page or list command — wait until enough explainers accumulate to want one
- No custom open program — the default browser is enough
