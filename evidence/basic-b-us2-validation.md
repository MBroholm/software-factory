# Basic B US2 — question/answer continuation

Implemented on `002-basic-b-us1` after Setup/Foundation/US1 commit
`46bb2c7`, which was committed and pushed to `origin/002-basic-b-us1` at the owner's request.
US2 remains a separate uncommitted working increment. The exact implementation is identified by
[per-file source fingerprints](basic-b-us2-sources.json); historical US1 fingerprints/evidence
remain unchanged. This is fixture evidence, not operational adoption or another genuine task run.

## Behavior and implementation

T021–T026 implement durable questions, exact owner replies, unique answer-derived authorization
and fresh continuation with attributable prior work. Question collection commits its comment
intent, publishes one trusted `<attempt>-q1` marker with decision context and reply grammar,
reads it back, confirms sole Waiting state and requires trusted stopped-process/effect proof
before releasing the durable slot. Other tasks can then run.

The additive authenticated `/v1/questions` read and `/v1/attempts/{uuid}/answer` PUT expose the
ledger's current unconsumed questions and commit an immutable answer claim. The runner independently
rereads current issue author/state, original approval/source, exact published question and complete
answer history. The reply must be owner-authored, created after the question, unedited, uniquely
matching the exact id, nonempty and followed by a literal `scope: unchanged` line. Caller hashes
are recomputed. Refine confirms this durable claim before adding derived Approved, rechecks it
before mutation and reads back labels/events. An answer or automated label event cannot become
initial approval; missing ledger lineage fails closed even when the token actor is the owner.

Changed-scope replies return to Ideas/refinement and renewed explicit owner approval. The changed
reply is captured even though it precedes the new Ideas label. Missing scope confirmation stays
Waiting: the posted question gives exact instructions and final workflow diagnostics identify the
missing confirmation. Factory v1/v2 markers and unchanged-scope answer protocol are excluded from
ordinary refinement loops. Competing/edited/deleted or contradictory lineage holds for owner
resolution; no second AI scope classifier is introduced.

Reservation selects answered tasks before ordinary approvals, then Approved-entry time and issue
number. It checks the global slot first and never preempts. A distinct deterministic attempt
consumes the answer atomically and preserves the approved specification, exact question/answer,
earlier question/answer history, base and ledger-retained work manifest. Git reuses only an
unchanged attributable worktree: branch/ancestry, status/patch/head and retained untracked-file
hashes must match. Unknown work is preserved and held. Fresh Codex invocation uses the captured
context and asks/stops if an answer conflicts with approved constraints. Consumed question/answer
history is revalidated at launch/push and before subsequent public collection/tracking writes.

## Checks actually run

| Check | Actual outcome and limit |
|---|---|
| Python unittest discovery | 39 passed in the development venv and the separate clean locked-dependency venv. Covers exact grammar, wrong author/id, empty/stale/edited/deleted/competing replies, changed scope, no initial approval from answers, immutable claims, stopped/released predecessor, concurrent single consumption, canonical source changes, fresh prompt context and multi-question history. Real temporary Git worktrees cover dirty/untracked retention and refusal of post-snapshot changes. GitHub verification uses fake current read responses; no live GitHub writes. |
| Pure Basic B execution/question fixtures | Passed. Includes one exact marker, lost/duplicate reconciliation, scope routing, changed-scope refinement capture, initial-approval refusal without durable continuation, exact PR association and priority policy. |
| Generated-graph harness | Nine scenarios passed using the actual SQLite ledger and complete ASGI API, with fake GitHub/model/service effects. Includes question once → stopped Waiting release → durable claim before Approved → distinct priority continuation → exact PR/QA, plus an older ordinary approval and occupied-slot non-preemption. Lost PR/question responses reconcile existing markers without duplicate POST. Missing scope waits; changed scope routes to Ideas without approval. |
| Existing refinement / historical v1 tracking | 35 refinement and 25 tracking groups passed. The old blanket prohibition on every Approved write was narrowed to allow only the named derived-answer node behind durable claim/revalidation; the initial-approval prohibition remains. The former unsupported-Waiting expectation is replaced by the new question scenarios. |
| Native n8n VM expression/pagination checks | 1,034 checks passed: reserve 367, collect 340, track 158, refine 169. Synthetic contexts in the verified isolated n8n 2.48.8 container; no workflow imports or HTTP/table/credential operations. |
| Native in-process Wait checks | Passed at 10,009 ms and 30,009 ms, with cancellation in 502 ms and no durable wait. Core helpers only; not an installed worker or persisted workflow test. |
| Package and generators | Reinstalled current runner into the clean locked-dependency venv; installed question-module import/grammar smoke passed. All four generator consistency checks and `git diff --check` passed. No dependency changes were needed. |

Environment remains Python 3.15.2, Git 2.56.1, Node 24.19.0; exact dependency pins remain in
`factory/runner/requirements.lock`. Native library checks target only `factory-guard-test`, image
n8n 2.48.8, editor 127.0.0.1:5679. Its volume remains separate from the operational container.

## Retained failures and limits

Test-first Python and JavaScript runs failed on missing question modules before implementation.
Subsequent fixtures exposed an incomplete fake manifest, missing queue-history issue references,
and the historical blanket no-Approved/unsupported-Waiting assumptions; fixtures and assertions
were aligned to the versioned US2 contract while preserving their initial-approval and fail-stop
checks. A broad edit briefly introduced a v2-only reference into the v1 tracking path; its
regression failed and the edit was corrected before final validation. Tests were rerun after fixes.
As with US1, sandbox child-process stdin requires separately approved unsandboxed local graph
execution; all fixture writes remain temporary and all external adapters remain fake.

No services, accounts, secrets, networks or operational workflow imports/activation were changed.
Actual Ubuntu/Codex execution, full native scheduled workflow runs, restart/active cancellation,
backup/restore, full process-tree deadline acceptance, operational adoption and genuine Basic B
run evidence remain subsequent tasks. Failure/unknown execution still retains the slot for US3;
occupied-slot API startup still fails closed. Owner review, manual matching-artifact import and
merge authority remain unchanged. No extension hooks were registered (extensions file absent).
