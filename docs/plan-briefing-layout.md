# Plan: a shorter, easier concierge briefing

## What is wrong today

- Up to 6 tall cards stacked in half of the Home page. Each card shows everything at once: badge,
  number, title, a 2–3 line detail, the action buttons, Open, and a suggested question. With 6 items
  the column is several screens long, and the intake card next to it ends long before it does.
- Everything carries the same weight. An "In progress, nothing to do" item takes as much space as an
  approval waiting on the employee.
- The headline and details are long and repeat what the badge and title already say ("This incident is
  In Progress with … It was opened on … and last updated …").
- The same tickets show again in "My open requests" further down Home.
- To find what needs action, the employee has to read every card.

## Target

The employee sees in 3 seconds **what needs them, and does it in one click**. Everything else is one
click away.

```
Your concierge                                    Updated 21:50 · Refresh
2 need you · 1 with no recent update · 3 on track

[ Need you (2) ] [ No recent update (1) ] [ On track (3) ]     ← tabs, first non-empty selected

 ● REQ0010073  Adobe Acrobat for a new hire · 120 €    [Approve] [Reject]  ⌄
 ● INC0026055  VPN drops at home – resolved            [Yes, it is fixed]  ⌄
     ⌄ expanded: one-sentence detail · Still not fixed · Open · Ask the assistant: "…"
```

## Changes

| # | Change | Where |
|---|---|---|
| 1 | **Summary line** with counts per group, built from the items (no extra agent call). | `luxesc-concierge.js` |
| 2 | **Three groups as tabs** (OOB `aiux-tabs`, `role="tablist"`): Need you (approval, action, done), No recent update (stale), On track (progress). First non-empty tab is selected; empty tabs are hidden. | `luxesc-concierge.js` |
| 3 | **One compact row per item**: kind dot, number, title (truncated with tooltip), and only the main action (Approve/Reject, Yes it is fixed, Post comment → opens the draft). | `luxesc-concierge.js` |
| 4 | **Details on demand**: a disclosure (`<details name="briefing">`, so one row is open at a time) holds the detail, the secondary action (Still not fixed), Open, and the suggested question. Confirm blocks open inside the row, as today. | `luxesc-concierge.js` |
| 5 | **Shorter text from the agent**: headline at most 90 characters; `detail` one sentence, at most 140 characters, without repeating state/number; title at most 60 characters for the row (implemented without a new field: older, longer titles truncate with a tooltip); `question` only for "Need you" items. | `agent.now.ts` instructions + `saveBriefing` caps in `LuxEscConcierge.js` |
| 6 | **Layout on Home**: concierge moves to its own full-width row right below the known issues (it is the most personal content); "Fix it or report it" and "My open requests" share the two-column row below. | `pages/start/page.js` |
| 7 | **No duplicates**: "My open requests" hides the records already in the briefing, or becomes a "See all" link when the briefing covers them all. | `pages/start/page.js` |
| 8 | **States**: all clear → one line "Nothing needs you today" + On track count; while refreshing, keep showing the previous briefing with a small spinner instead of replacing it with the step list (steps go behind "What the concierge is doing"). | `luxesc-concierge.js` |

All controls stay OOB (aiux tabs, badges, buttons, details/collapse); no new libraries.

## Accessibility and i18n

- Tabs with arrow-key navigation and `aria-controls`; rows are list items; the disclosure is native
  `<details>`, so it works with keyboard and screen readers without extra code.
- Counts use `i18n.getMessage('{0} need you', n)` style keys; new strings go into `src/fluent/i18n/es.json`.
- Reflow at 320 px: the row's action wraps below the title.

## Steps and estimate

1. Agent output: `short` field, shorter caps, question only for Need you; check 2–3 runs (0.25 day).
2. Component: summary, tabs, compact rows, disclosure, refresh keeps old briefing (0.5 day).
3. Home layout and de-duplication with My open requests (0.25 day).
4. Spanish strings, browser test as svc_fcaamano and the analyst, 320 px check (0.25 day).

About 1–1.5 days.

## Decisions to confirm

- **Full-width row (recommended) or keep the side column?** Full width gives the rows room for the
  title and the action on one line.
- **"My open requests" on Home:** de-duplicate (recommended) or remove it and keep only the briefing.
- **Tabs or sections?** Tabs (recommended) keep the card short; sections with "On track" collapsed show
  everything at once but are longer.
