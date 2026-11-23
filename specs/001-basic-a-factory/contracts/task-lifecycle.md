# Contract: Scheduled GitHub Lifecycle

**Scope**: Basic A, one production n8n instance and three scheduled mutating workflows.
Configuration: repository, stable owner ID, existing state names, 60-second default schedules,
private credential reference, shared control table. All reads paginate; preserve non-state labels.

## Common guard and error behavior

1. Read exactly one `factory_control/global` row. If busy, skip mutations and expose held context
   in the execution result. If missing/duplicate/unreadable, fail closed.
2. With production serialization enabled, set/verify busy before any remote writes or model call.
   Store the execution ID and current issue for diagnosis; these are not work-replay records.
3. Read source labels/content again immediately before a transition. Unknown/conflicting state,
   ambiguous approval or linkage, unexpected edits and API failures halt without guessing.
4. Clear busy only after every side effect is acknowledged and consistent. On any failure leave
   it held. Attempt a sanitized issue error comment only when safe (never retry uncertain POSTs).
   If GitHub is unavailable, the held row and failed n8n execution are the visibility fallback;
   owner records the issue summary when service returns.
5. A partial label change is not repaired automatically. Add target, then remove source; a crash
   between them leaves a visible multi-state issue and held flag. Owner normalizes it while paused.

No automatic write retries, resumed failed executions, or replay from a journal. Do not use
Wait/resume nodes, mutating error workflows or mutating subworkflows in Basic A; all production
mutation passes through the scheduled entry guard. Read-only retries
may be bounded. Rate limits respect server retry information and leave work pending/held on error.
Normal polls that make no changes release the flag; no-op/held polls must not publish repeated
issue comments. Retained private failures and operator inspection are part of operation.

## Shared-flag completion paths and required tests

| Execution path | Expected flag outcome |
|---|---|
| Acquires idle flag and completes acknowledged work | Release to `busy=false` as final acknowledged step |
| Acquires idle flag but finds no eligible work, occupied build slot or already-processed input | Release to idle; no false global hold for ordinary no-work |
| Encounters a flag already busy at entry | Skip and preserve that flag/context; never release another execution's hold |
| Unexpected exception before or after a side effect, crash, invalid output or uncertain remote response | Retain busy, preserve failure evidence; later schedules skip until manual recovery |
| Final release update fails or its result cannot be confirmed | Treat as held/unknown; never proceed on an assumed release |
| Acquisition is missing, invalid or cannot be confirmed | No remote mutation; no forced reset to idle |

Implement and test these paths in **each** of refine, reserve and track. An early return after
acquisition must use the successful no-work release path; a caught unexpected failure must not
fall through it. Do not enable continue-on-failure behavior that hides the error or use an
unconditional `finally` release. Releasing this short-lived execution interlock must not remove
an issue's long-lived `Building` reservation. Inject unexpected failures at the real workflow
boundary as well as testing any helper code; a fixture-only simulation cannot prove cleanup wiring.
No auto-expiry or automatic recovery is introduced by these tests.

## Refinement

Process open owner-authored issues only; reject non-owner issues before model calls. Ignore PR
objects. `Ideas` or new unmarked owner discussion at `Ready for approval` selects a source. The
source key combines issue number, SHA-256 of canonical JSON containing title/body and included
unmarked owner comment IDs/bodies, highest included comment ID, and prompt version. Record the exact captured source comment IDs on the refinement. Use fixed
field order and LF line endings. Do not hash issue `updated_at` (label changes affect it).

Before a model call enter `Refining`. If a valid marked output already exists for that exact
source, reuse it instead of posting/calling again. Source changed during inference: stop for owner
inspection, never silently approve or publish it as current. After a valid new output is posted,
enter `Ready for approval`. Preserve old comments. `Refining` left from an earlier execution is
not an eligible auto-resume state. Comments beginning with recognized `factory:*:v1` markers are
excluded from human-discussion triggers, even with owner-authored credentials.

Edits to previously included comments are detected by source digest and conservatively held;
request a new comment/refinement rather than inventing edit semantics. Truncated/oversize inputs
are not silently accepted; the owner must shorten/split the task.

## Approval and reservation

Only the owner moves a refined task to `Approved`. n8n code has no path adding that label.
Before reserving require: owner issue author, current `Approved` owner label event after latest
successful refinement, no later invalidating removal, matching input digest, no refinement edit
after approval, exactly one normal state label and an open issue. Recompute against only the comment IDs captured in that refinement plus current title/body;
later session summaries and QA rework comments are not implicitly added to its source digest.
Edits/deletions in the captured set invalidate it. A missing history/current-scope
match is not approval. `issue.updated_at` alone is not a scope identifier.

Check all repository `Building` issues (including closed or non-owner conflicts) before choosing
work. Any occupied/conflicting slot blocks another claim. With slot free, choose lowest eligible
issue number. This deterministic order is a recommendation, not a brief requirement. Set
`Building` before manual launch, remove `Approved`, and post one handoff keyed by approval event.
Successful reservation frees the shared workflow flag but leaves the build label until outcome.
The label means reserved/starting/underway, not confirmed process launch.

Record preexisting result PRs/head SHAs in the handoff. An unknown outcome setting Building or
posting handoff leaves the flag held; do not claim another task on the next poll. A restart does
not release either busy or Building automatically.

## Pull request tracking and rework

Explicit matching requires same repository, `issue-N` head, `main` base and explicit issue URL or
`Refs #N` in the PR body. Reject a mismatch or several plausible current PRs. Do not require
GitHub auto-close keywords; closing the issue is the owner's decision unless a reviewed PR uses
them intentionally.

For a new handoff, ignore unchanged baseline PRs. Match a new PR or a changed head SHA on an open
baseline PR after the recorded approval. If activity timing, unchanged reopen or association is
unclear, hold for owner resolution. Once a current result has moved the issue to `Your QA`, its
link/head and approval event are recorded in a `factory:result:v1` comment. This prevents repeated
QA comments and identifies the accepted result without a task DB.

Unchanged-scope rework comments do not require a fresh refinement merely because they were
posted later. Scope-changing rework must be incorporated into a fresh refinement and explicitly
approved before continuation; the owner/agent must stop rather than infer this semantically.
A newer explicit owner `Approved` event takes precedence over old QA/result markers. Tracking
never moves an `Approved` task back to QA from stale evidence. Rework requires a new handoff;
normal repeated polls cannot reuse an earlier attempt's result. Merged current result or owner
closed issue => `Done`. Closed unmerged result + open issue => stay `Your QA`. Human comment and
reapproval => future manual rework. Missing/edited association evidence => hold, not guess.

## Authority boundary

GitHub label operations are not compare-and-swap, and n8n serialization does not constrain human
clients. Re-read-before-write detects many changes but cannot remove every race. Owner avoids
editing approved scope in place and pauses/drains before manual repairs. Code guards, human
launch verification and review enforce the supported manual operating protocol; stronger hostile
concurrent-client/exactly-once guarantees require a separate requirements/design decision.
