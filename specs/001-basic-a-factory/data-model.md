# Data Model: Basic A

**Date**: 2026-11-23. Logical records and validations, not SQL migrations.
GitHub is the task system of record. Only the last entity below is new n8n application control.

## Project owner

- Configuration: repository `MBroholm/software-factory`, owner login `MBroholm`, stable owner ID
  `202449424` (public API observation 2026-11-22); verify again during deployment.
- Only this identity authors eligible Basic A issues and supplies explicit approval/review.
- Assignment does not confer ownership; factory comments may share owner identity through a PAT.

## Task issue

Fields: issue number/URL, author ID, title, body, current labels, open/closed status; timeline
label event IDs/actor IDs/timestamps; ordered comments. Exclude PR objects in issue listings.
Exactly one of the managed state labels in normal operation. Preserve all unrelated labels.
Missing/multiple states on a known task are visible errors, not cues to infer approval.
All `Building` issues block reservation, including malformed or non-owner issues.

## Refinement comment

Fields in rendered comment: goal, constraints, acceptance criteria, questions; source body SHA-256,
captured source comment IDs, last included unmarked owner comment ID (0 if none), prompt version,
comment ID/URL/created and
updated times supplied by GitHub. Prefix marker `factory:refinement:v1` with a deterministic
source key composed of issue number, body digest, last included owner comment ID and prompt version.

The digest covers canonical UTF-8 issue title/body and relevant included comment IDs/bodies;
canonicalization is fixed in the contract (field-order-stable JSON, LF line endings). Edited
included comments therefore change the digest. Reservation recomputes only the captured source
comment set plus current title/body; later session summaries and QA rework comments do not
automatically invalidate unchanged-scope approval. Edits/deletions within the captured set do.
New Ready-stage discussion forms a fresh source set/revision. Scope-changing rework must be
incorporated into a fresh refined task and explicitly approved; no model classifies it silently. Comments with recognized factory markers are
excluded from owner revision triggers even if their author is the owner. Prior task revisions
are retained as comments rather than overwritten. The model output is candidate advice only.
A marked output for the same source is not posted twice during normal repeated polling.

## Approval event

GitHub `Approved` label event ID, actor ID and timestamp, associated with the latest successful
refinement existing before approval. No new approval table. Validate actor is owner, event is
current (no later removal invalidates it), refinement was not edited after approval, and current
source digest matches the refined inputs. Revalidate immediately before reserving.
A changed or missing record is a hold requiring owner inspection and renewed approval as needed.
No automatic semantic decision about whether an edit expands scope.

## Build reservation and handoff comment

Reservation: the issue's `Building` label. It persists while the laptop is off; the shared flag
is released after successful workflow completion, not kept for the entire coding session.

Handoff: marker `factory:handoff:v1`, issue number, approval event ID (attempt key), refinement
comment ID/URL and content digest, branch `issue-N`, baseline existing PR numbers/head SHAs and
states, and timestamp. Comments are evidence, not a general operation journal. The owner checks
this snapshot and current issue before manual launch. Missing/duplicate/edited handoff metadata
is an ambiguity for manual recovery, not an invitation to rebuild automatically.

## Decision record

Issue comment linking to the question/answer and resulting choice from the interactive session;
include whether scope changed and the explicit renewed approval reference where necessary.
Do not publish secrets or full private session logs. Owner or agent posts this before review.

## Result pull request

GitHub PR number/URL, head repository/branch/SHA, base branch, body issue link, state, merged
status/time and activity times. Associate only a unique current result with the handoff; old
PRs in the baseline cannot move reapproved work to QA merely because they still exist.
One attempt may produce a new PR or new commits on an existing open PR. An unchanged reopen or
multiple matches requires manual resolution; no historical attempt database is introduced.
After association, a `factory:result:v1` issue comment records the current approval event ID,
PR number and head SHA; this is the lightweight current-result reference used by tracking.
Every PR includes summary, actual checks/outcomes, failures and unchecked acceptance criteria.

## State transitions

| From | Trigger/actor | To | Conditions |
|---|---|---|---|
| Ideas | Scheduled refinement | Refining | Open, owner authored, fresh source |
| Refining | Successful validated output posted | Ready for approval | Only current execution; no automatic resumption of stranded state |
| Ready for approval | New unmarked owner revision comment | Refining | New source key; old comment retained |
| Ready for approval | Explicit owner label action | Approved | Current refined scope; automation never adds Approved |
| Approved | Reservation workflow | Building | Valid owner approval; no Building issue anywhere; shared flag held |
| Building | New unambiguous result PR | Your QA | Current handoff/result association |
| Your QA | Owner comment and explicit reapproval | Approved | Changed scope freshly approved; old result cannot override |
| Your QA | PR closes unmerged, issue open | Your QA | Wait for owner decision |
| Any managed active state | Owner closes issue | Done | Closure confirmed |
| Building or Your QA | Current result merged | Done | Merged status verified, not just closed |

Removing a reservation for retry is owner-controlled recovery while paused, with no active agent.
`Waiting for you` and `Stuck` are not Basic A states. `Done` is never inferred from an unmerged PR.

## factory_control — one row, not a task ledger

Columns: `key` string fixed to `global`; `busy` boolean; `execution_id` string; `issue_number`
nullable number; `started_at` timestamp string. Exactly one row, provisioned manually with busy
false. Missing/duplicate/unreadable row blocks mutation and raises a visible execution error.

Under single serialized production execution, read idle row, set busy true with context and
verify before GitHub writes/model invocation. On acknowledged successful completion clear busy
as the final action, including a normal execution that acquired the flag but found no eligible
work. A skipped execution finding the flag already busy preserves the existing row. Any
unexpected exception/error/crash/unknown response after acquisition leaves it true; never use
unconditional cleanup to clear it. Later schedules read busy
and skip all mutating processing, reporting the held context in n8n. Owner resets only after
pause/drain/inspection and recording recovery. A diagnostic update is best-effort; correctness
does not depend on error handlers running. A failure clearing the row is also a safe hold.

This row is a fail-stop interlock, not a distributed lock or a reservation table. Manual/CLI
mutators bypassing the production serialization are prohibited while schedules run. GitHub and
n8n are not one transaction. No automatic timeout/reset of this row is allowed.
