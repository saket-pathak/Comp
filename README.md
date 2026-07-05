# Comp — Your Activity-Aware Companion

> Not a productivity tool. A presence that notices.

Comp is a browser extension that lives quietly in the corner of your screen, like Grammarly's floating icon — except instead of suggesting edits, it reacts to *you*. Late-night coding sessions, a LeetCode "Accepted," a new GitHub star, two hours without a break — Comp notices and responds with small ASCII-art expressions, emoticons, and short lines of encouragement, pride, or gentle scolding, delivered in a personality you choose.

No suggestions to accept or reject. No actionable to-dos. Just a companion that cares.

```

## Why

Most dev tools optimize your code. Nothing optimizes for *you*. Comp is an experiment in emotional, ambient computing — a small layer of personality sitting on top of your normal browsing, reacting to context the way a person who's paying attention would, instead of the way a notification system does.

## Core ideas

- **Affective, not actionable.** Output is always a reaction — ASCII art, an emoticon, a line of text — never a suggestion to click, fix, or change something.
- **Personality-driven.** Pick how it talks to you: Mom, Friend, Teacher, Drill Sergeant, and more. Same triggers, different voice.
- **Context-aware.** Reacts to time of day, coding duration, GitHub activity, LeetCode submissions, idle time, and more — expanding over time.
- **Privacy-first by default.** Runs entirely offline with rules-based triggers and static response banks unless you explicitly opt in to AI-generated phrasing. Raw page content never leaves your device.
- **Always there, never loud.** A small persistent widget, not a notification spam machine. One toggle to pause it whenever you want.

## Example reactions

| Trigger | Reaction |
|---|---|
| Coding past 1 AM | `(\_/) ( •_•) / >💤` — "Go get some sleep." |
| LeetCode solved | `👍 ( •‿• )` — "Great job! One more push and you're done." |
| 2 hours, no break | `(╯°□°）╯︵ ☕` — "Stand up. Stretch for 5 minutes." |
| New GitHub star | A small celebratory ASCII burst |
| Week-long study streak | A proud, persona-specific note |

## How it works

```
Content Scripts  →  Background Service Worker  →  Widget (Shadow DOM)
 (per-site signals)     (rules engine, state)        (renders reaction)
                              ↓ (opt-in only)
                         Backend (FastAPI)
                    (AI phrasing via Claude API,
                     redaction layer, sync)
```

1. **Content scripts** watch an explicit allowlist of sites (GitHub, LeetCode, etc.) for relevant DOM signals, plus generic idle/active-time tracking.
2. **Background service worker** holds the rules engine — decides *when* a reaction is warranted, using local state (session length, last break, streaks).
3. **Widget** renders the reaction as a floating, non-intrusive overlay using ASCII art, emoji, and short text.
4. **Backend** (optional, opt-in) phrases reactions dynamically via the Claude API instead of static templates, and syncs streaks across devices. Your activity is redacted to coarse categories before it ever reaches an LLM — no raw page content, file paths, or window titles are sent.

## Project structure

```
comp/
├── extension/        # Manifest V3 browser extension (the MVP)
│   └── src/
│       ├── background/      # rules engine, state, event bus
│       ├── content_scripts/ # per-site sensors
│       ├── widget/          # floating companion UI + personalities
│       └── popup/           # settings (persona, quiet hours, pause)
├── backend/           # optional FastAPI service for AI phrasing + sync
│   └── app/
│       ├── routes/
│       ├── personality/     # Claude API client (server-side only)
│       └── security/        # auth, redaction
└── mobile/            # planned: time/streak-based companion app
```

## Status

🚧 Early development. Phase 1 (extension-only, rules-based, no backend) in progress.

**Roadmap**
- [ ] Phase 1 — Core extension: time/idle sensors, floating widget, static persona response banks
- [ ] Phase 2 — GitHub + LeetCode sensors, persona switching UI, animation polish
- [ ] Phase 3 — Optional backend, AI-phrased reactions, redaction layer
- [ ] Phase 4 — Cross-device streak sync, mobile companion app

## Privacy

- Default mode makes **zero network calls** — purely local rules and static responses.
- AI phrasing is **opt-in**, and the consent screen shows exactly what gets sent.
- Content scripts only run on an explicit site allowlist, never `<all_urls>`.
- Any data sent for AI phrasing is reduced to coarse categories (e.g. `leetcode_solved, difficulty: medium`) — never raw page content, file paths, or full window titles.
- All activity data stays in local browser storage unless you explicitly enable sync.

## Contributing

This is currently a personal/portfolio project in active early development. Issues and ideas are welcome once the Phase 1 extension is published — check back soon, or watch the repo for updates.

## License

TBD

---

*Built because notifications tell you what to do. Comp just wanted to tell you it noticed.*
