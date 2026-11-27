# Basic B US3 — recovery, cancellation and explicit retry

US2 was committed and pushed as `d23fa3e` on `origin/002-basic-b-us1` at the owner's request.
US3 is the subsequent reviewable working increment, identified by the accompanying per-file
source fingerprints. Historical US1/US2 evidence remains evidence for its recorded revision.
These are local/fake-adapter and synthetic native-expression results, not operational adoption
or another genuine factory task.

## Implemented scope

T027–T034 add named-unit startup/status reconciliation without redispatch, original deadline
retention, immutable boot/invocation identities, bounded process observation, stopped interruption
results, cancellation and conservative holds. Accepted-but-undispatched recovery uses an atomic
status check; a competing dispatch cannot acquire false stopped proof. API remains inspectable
with an occupied/held slot. Worker checks cancellation before preparation, launch and push;
missing stop observations preserve a result awaiting trusted stopped evidence.

Collection publishes sanitized failure markers and retained branch/head references, confirms
Stuck and releases only with stopped/effect proof. A fresh explicit owner Approved event after
failure creates a distinct priority retry with durable predecessor/work provenance. Unchanged
source retains original approval, discussion and answer history; renewed source requires renewed
explicit approval. Exact failure body/id/actor and current source/approval are rechecked before
launch and push. Retry never replays a previous attempt or preempts a reserved task.

Closed Waiting/Stuck and other active tasks remain discoverable. Tracking records cancellation
before Done writes; collection can release closed stopped attempts only after every earlier
effect is confirmed. Closure while an external effect is uncertain retains the slot for exact
remote/owner reconciliation; it cannot erase a pending push/PR/comment. Old results cannot
overwrite renewed approval. All generated workflows remain inactive and retain node/stage notes.

Pause/drain/inspect/backup/restore/resume CLI commands preserve the independent workflow guard.
Backup requires paused empty slot, all attempts released and stopped named-unit inventory; it
copies SQLite plus complete private work root and dedicated checkout under the reservation lock.
Restore checks fingerprints, original paths, matching retained history, stopped inventory and a
recorded owner decision, refuses overwrites/older or missing ledger history, and stays paused.
Configuration/credentials remain separately owner-managed. Ambiguous/lost ledger recovery requires
owner investigation; this command never guesses history or automatically clears uncertainty.

## Checks actually run

| Check | Outcome and environment |
|---|---|
| Python unittest discovery with ResourceWarning treated as error | 80 passed; one opt-in actual Ubuntu deadline test skipped. Development Python 3.15. Tests include immutable/reused/missing unit identities, lost acceptance/dispatch responses, original deadline across reconciliation, interrupted/delivered results, clock uncertainty, outage/unknown push, cancellation before dispatch and after agent completion, active complete-tree proof, dispatch/reconciliation race, retry failure identity and coherent/tampered/stale backup/restore. Temporary local Git/worktree regressions from US1/US2 remain included. |
| Generated workflow graph harness | 12 scenarios passed through real temporary SQLite and complete ASGI API with fake GitHub/model/services. Includes prior nine US1/US2 scenarios plus stopped failure→Stuck release→distinct retry→PR, lost failure response without duplicate post, and closed released Waiting cancellation/Done. Closure after stopped done now safely releases instead of the former US1/US2 hold. |
| Pure question/protocol fixtures | Passed. |
| Existing refinement / historical tracking checks | 35 refinement and 25 tracking groups passed. |
| All four generator consistency checks and whitespace check | Passed. Refinement rebuilt because shared protocol/state source changed; it retains US2 behavior. |
| Native n8n VM parameter/pagination checks | 1,412 passed: reserve 511, collect 531, track 201, refine 169. Synthetic contexts evaluated in the verified `factory-guard-test` n8n 2.48.8 container, loopback editor 5679. No imports, workflow activation, HTTP/table/credential operations or ordinary tasks. |

The local graph harness hit sandbox subprocess timeouts; running the same local fake-adapter
harness outside that restriction passed. Test-first recovery import failed before implementation.
The new graph fixtures exposed the retained pre-US3 Stuck guard and non-monotonic fixture event
ids; both were corrected. An added retry identity fixture initially reused the approval timestamp
as its failure time and correctly failed freshness validation; its failure now predates approval.
Backup QA found and corrected an unclosed SQLite destination connection; ResourceWarning checks
now pass. No failed live run is hidden by these fixture corrections.

## Remaining acceptance gates

No service installation, account/credential/network provisioning, operational import/activation,
actual Ubuntu user-manager restart/reboot, full real 30-minute descendant lifetime, real Codex
smoke, isolated scheduled HTTP exercises or genuine Basic B task run was performed. The opt-in
`FACTORY_ISOLATED_DEADLINE_TEST=yes` test is provided, but needs the owner-provisioned isolated
Ubuntu account/manager and takes 30 minutes. Missing/rebooted unit evidence conservatively holds
for owner recovery. Real outage/restore and already-issued remote-effect reconciliation still
need provisioned isolated acceptance; fake fault evidence does not replace them. US4 and
T039–T045 remain pending. No extension hooks were registered (`.specify/extensions.yml` absent).
