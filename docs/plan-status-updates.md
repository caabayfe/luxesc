# Plan: plain-language status updates ("Where is my stuff?")

## Problem

Employees open a ticket and then see a state code ("Work in Progress", "Awaiting Info") and a
journal written for agents. They chase the service desk to ask what is happening, and they miss
the moments when the service desk is waiting for them.

## What the employee gets

1. **A status line per request, in their language.** "Your laptop is being prepared; it should
   ship Thursday. Nothing needed from you." Built from the record, its catalog tasks, approvals,
   SLA and the comments the employee can see, never from work notes.
2. **"Waiting on you" first.** When the service desk asked a question (state Awaiting Info /
   On Hold - Awaiting Caller, or a comment ending in a question), the card says so at the top of
   My requests and on Home, with an inline reply box. The reply is posted as a comment on the
   record (Table API), which resumes the ticket through the platform's own rules.
3. **What happens next and when.** Next step and expected date from the SLA (task_sla planned end),
   the catalog item's delivery time and open catalog tasks; "late" is said plainly with the
   reason when there is one.
4. **Change digest.** "Since you last looked: approved by your manager, ordered from the vendor."
   Uses the time the employee last opened the request (a user preference per record, or the run
   table).

## Design

| Piece | What | Notes |
| --- | --- | --- |
| `LuxEscStatus` script include (classic) | `facts(taskId)`: state, approvals, catalog tasks, SLA, visible comments, delivery time, assignment group (no names of agents) | Reads with GlideRecordSecure as the employee, so ACLs decide what is visible |
| Status Explainer agent (`sn_aia`) | Tools: "Read request facts", "Save status". Output JSON `{headline, waitingOnYou, question, nextStep, expectedBy, late, changes[]}` | Unattended, one tool call per request; short instructions, employee's language |
| Batch for My requests | One agent run per page load covers up to 10 open requests (facts for all, one save) | Keeps latency to one run (~30 s); cached on the run table for 1 hour |
| Cheap path first | If nothing changed since the cached status (sys_mod_count), reuse it; no agent call | Most page loads cost nothing |
| REST routes | `GET /status?ids=` (cached or start a run), `POST /status/{task}/reply {text}` | Reply posts a comment with the employee's text only |
| UI | `luxesc-status` line on My requests rows and the request page; "Waiting on you" strip on Home | OOB list/record components stay; the status is an extra line |
| Otto | `aiContext` of the request page includes the status JSON; client tool `reply_to_service_desk` drafts, the employee confirms | Same confirm-before-write rule as the concierge |

## Guardrails

- Only data the employee can already see (GlideRecordSecure; comments, not work notes).
- No agent or approver names unless they appear in visible comments; groups are fine.
- Replies are the employee's own words; Otto may draft, the employee sends.
- Dates come from SLA / delivery time fields; the agent never invents a date ("no date yet").

## Steps and estimate

1. `LuxEscStatus.facts` + unit checks with `now-sdk exec` on a request item, an incident in
   Awaiting Info and one with a breached SLA (0.5 day).
2. Status Explainer agent + run kind `status`, cache by sys_mod_count (0.5 day).
3. REST routes and the reply path (0.5 day).
4. UI: status line, Waiting on you strip, reply box; Otto context and tool (1 day).
5. Browser test with an employee account (not admin), Spanish and English (0.5 day).

## Open questions

- Should "Waiting on you" also notify (email / Now Mobile push) or stay in the portal?
- Which states mean "waiting on the caller" on this instance (incident `hold_reason`, RITM custom
  states)? To confirm from data in step 1.
- Run the status for all open requests on page load, or only when the employee expands one?
  (Cost versus immediacy; default: batch of the 10 most recent.)
