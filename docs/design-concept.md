# Design concept: "One box, one feed"

## Diagnosis

The portal grew feature by feature and now looks like a classic portal with AI bolted on:

- **Five ways to ask.** Hero "Ask" (assistant chat), "Fix it or report it" (intake agent), the concierge,
  the planner (catalog page) and the shell's floating "Ask or search" bar. The employee has to know which
  one fits before typing.
- **Navigation by back-office structure.** Request something / My requests / Knowledge mirror ServiceNow
  tables (catalog, task, kb_knowledge), not what people want: *get help, get something, know what is happening*.
- **Home is a stack of sections.** Hero, known issues, concierge, intake, categories, featured: everything
  has the same weight and you scroll to find what matters.
- **Status is a state code.** "Work in Progress" / "Open" tell nothing; the request records already know the
  stage (approval → fulfillment → delivery) and the due date, but the portal does not show it.

## The idea

**Ask once, see everything that concerns you in one place.**

1. **One box.** A single "What do you need?" input that understands intent. While typing, it shows instant
   matches (answers, services, your tickets) from plain searches; pressing Enter hands the sentence to the
   agents, which already exist: a problem → the intake agent (self-help, known issue, drafted ticket);
   several needs → the planner (one cart); a status question → the concierge's data. The answer opens
   **in place**, under the box, as a card, not on another page. `⌘K` opens the same box from any page.
2. **One feed.** Home becomes "For you": a bento grid of live tiles about the employee, most urgent first.
3. **Three destinations instead of four tables.** *For you* (home), *My stuff* (requests, incidents,
   approvals, with a tracker), *Explore* (services and answers in one search and browse page).

## Home: "For you"

```
Good evening, Fer                                                       ⌘K
┌──────────────────────────────────────────────────────────────────────────┐
│  What do you need?                                                       │
│  [ Describe a problem, ask for something, or ask a question…        ] ↵ │
│  ┌ as you type ───────────────────────────────────────────────────────┐ │
│  │ Answers   VPN: no puedo conectarme desde casa…   KB0010019          │ │
│  │ Services  Developer Laptop (Mac)                  $1,499             │ │
│  │ Yours     INC0026092 MFA notifications not arriving                 │ │
│  │ ↵  Let an agent handle it                                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│  Recent: My laptop is slow · Teams keeps dropping · New hire setup       │
└──────────────────────────────────────────────────────────────────────────┘
┌ Needs you · 3 ────────────────────────────┐ ┌ Happening now ───────────┐
│ ● Approve Adobe CC for a new hire  [✓][✕] │ │ ⚠ Teams calls dropping    │
│ ● SAP orders saving again?     [Yes, fixed]│ │   Fix in progress · 21:43 │
│ ● Second monitor — fixed?      [Yes, fixed]│ │   [I'm affected too]      │
│                         See all (6) →      │ └───────────────────────────┘
└────────────────────────────────────────────┘ ┌ Popular answers ──────────┐
┌ On its way ────────────────────────────────┐ │ Set up VPN on a Mac       │
│ Developer Laptop (Mac)                     │ │ Recover deleted email     │
│ ◉──────○──────○──────○   Approval · due Fri│ │ Phishing: how to spot it  │
│ Visio Pro for Office 365                   │ └───────────────────────────┘
│ ◉──────◉──────○──────○   Fulfillment · 2 days late │
└────────────────────────────────────────────┘
```

- **Needs you** is the concierge, reduced to the items that need an action (approve, confirm a fix, answer a
  question), each with its one-click action. "See all" opens My stuff.
- **On its way** is new and needs no AI: requested items with a 4-step tracker from `stage`
  (Approval → Fulfillment → Delivery → Done), the due date, and "late" when the due date has passed.
- **Happening now** is the known issues tile (hidden when there are none).
- **Popular answers**: most read articles; the full list lives in Explore.
- The answer to the box opens between the box and the tiles; the tiles stay where they are.

## My stuff

Tabs: **Needs you** · **Open** · **Done**. One row per record with the same tracker (requests) or a plain
state line (incidents), the concierge's one-sentence explanation when there is one, and the main action.
The request page gets the tracker at the top and the activity below.

## Explore

One search over services and answers, with tabs **All · Services · Answers**, categories as filter chips,
and the planner ("Plan a bigger request") as a call to action at the top. Replaces Request something and
Knowledge in the navigation.

## Visual language

- Calm neutral surfaces, one accent (primary) used only for the main action of each tile; status colours
  only for status (Horizon tokens, light and dark).
- Bento tiles with the same radius and padding; tile headers are a label and a count, no paragraphs.
- Type scale with fewer sizes: greeting (2xl), tile titles (sm, semibold, uppercase-free), body (sm).
- Motion: the answer card expands with the Horizon expand token; reduced motion respected.
- Mobile: the box stays at the top; tiles stack in priority order (Needs you, Happening now, On its way).

## What stays

All agents, REST routes and record logic stay as they are; this is a front-end recomposition. OOB pieces:
aiux nav layout, tab group, steps (tracker), badges, buttons, cards, inputs, modal (⌘K), empty states,
OOB list on My stuff "Done".

## Phases

1. **Home "For you"**: one box with instant results and in-place agent answers (intake and planner merged
   behind it), Needs you, On its way (tracker), Happening now, Popular answers. (1.5 days)
2. **Navigation and Explore**: three destinations, combined search page, ⌘K from any page. (1 day)
3. **My stuff and the request page**: tabs with trackers, explanation lines, tracker on the record page.
   (1 day)
4. Spanish strings, keyboard and screen reader pass, 320 px check, browser test as employee and analyst.
   (0.5 day)
