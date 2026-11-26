# US4 recovery and restore validation — T027

**Complete, 2026-11-26.** Source workflows at commit
`219e351f77cd6be3534f297d1df2d95421f10f5d` are unchanged. The existing isolated n8n 2.48.8
instance uses `factory_guard_test_data`, loopback 5679 and story table `IgWCIu94ieyHQRHS`.
Operational n8n on 5678 and its different volume remain untouched. Exact workflow source and
mapped-package hashes/imported versions are in [guard results](us4-guard-results.json).
[Sanitized recovery/restore results](us4-recovery-results.json) preserve actual rows, effects,
reasons, execution IDs, repaired state, resumed observations and backup/clone verification.
These are synthetic resource exercises, not real GitHub outage or task-run evidence.

## Pause, drain, inspect, record, repair, reset and resume

The runbook in [operations](../docs/operations.md#t009--manual-failure-recovery) was followed
through explicit test operator actions, separate from all workflow error paths:

| Incident | Failed / resumed native execution | Actual outcome |
|---|---|---|
| Simulated GitHub outage | 1685 / 1689 | HTTP 500 issue read fails/holds with no remote writes. Later polls across three graphs preserve row/effects. Pause/drain; record private incident and source/issue context; explicitly restore synthetic service availability; reset only inspected busy; fresh whole-graph execution reaches QA and releases. |
| Partial label write | 1690 / 1694 | One result marker committed; target QA addition committed but receipt fails, leaving Building+QA. Held polls preserve both labels and marker. Pause/drain; inspect exact marker/head/approval and committed labels; explicitly remove only obsolete Building in synthetic state, retain QA/unrelated label and marker; reset; fresh poll makes no additional write and releases. |
| Unknown comment POST receipt | 1695 / 1699 | Exactly one marker committed, invalid receipt causes hold before label writes. Held polls add nothing. Pause/drain; inspect the one exact approval/PR/head marker and current labels; explicitly reconcile synthetic QA state while preserving marker; reset; fresh poll retains one marker and makes no additional write. No blind POST retry. |

Each reset compares singleton ID, exact failed execution and busy=true using the supported
Data Table API and preserves execution/issue/start diagnostics. Before reset, all test workflows
are unpublished with no running/waiting executions and the known failure is complete. Resumption
publishes only the credential-free tracking copy with **schedule disabled**, uses one fresh whole
execution and then unpublishes/drains it. This tests controlled recovery, not operational rollout
or a repeated scheduled acceptance suite. Real issue #1 remains Building and #4 remains Approved;
no manual agent or real task slot was cleared. Branch/PR and approval semantics remain unchanged.

The first outage attempt failed its resume observer: it read the old failed execution 1681 after
republishing, before the test webhook was registered. Inspected row/effects showed no fresh
resumed execution; all copies were paused/drained. Two subsequent case attempts stopped at the
active-workflow boundary without running a new case. The adapter now waits briefly for registration,
requires HTTP 200 and a different execution ID, and never blindly retries a write. The corrected
independent outage exercise above passed. This was a harness sequencing correction, not a source
workflow fix. The original trace and operator actions are preserved privately and summarized in
the public guard results.

Unknown real outcomes would remain held: the synthetic repair endpoint requires the exact known
scenario and explicit reason, and for partial/unknown POST requires one committed result marker.
It is test-only, restricted to loopback port 18768, and never connected to work/error paths.
No semantic scope change, renewed approval, automatic timeout/reset or replay was inferred.

## Stopped-volume backup and restore

The test instance was inactive/drained, busy=false at execution 1699. A new disposable Header
Auth credential was created solely for restore verification; its generated value was not logged
or published. The original instance was stopped before copying its full `.n8n` volume and matching
private container environment (including any encryption-key override). A private mode-0700 backup
and manifest were retained on the server; no backup/config/key was committed or exported publicly.

Backup archive SHA-256:
`357c7fd341c069602a717af64383f06c356cfc02a4d423a1cf70696d152e70c7`.
All **nine stopped-volume file hashes** match the restored copy before startup. This includes
SQLite and its associated state/config; there was no internal SQL or table manipulation.
Exact image ID: `sha256:e0df076a41076127d5f765e05acb8ba746bddff86442a92269c0f5a7219a7e4b`.

The restore uses a new volume `factory_us4_restore_data` and container `factory-us4-restore`,
with **network=none and no published ports**. The original volume is preserved. Supported APIs
inside the clone confirmed all 25 original workflow IDs restored/inactive, the exact full
singleton row, and zero running/waiting executions. A new loopback-only fixture workflow
`UnJxYKBNIvifC5TE` used the **backed-up disposable credential**, native execution **1700**,
and verified its header by SHA-256 at clone-local port 18769. That establishes successful
credential decryption with the restored key/config; historical GitHub/Gemini credentials stayed
encrypted/unused. No external connection is possible from this clone.

The credential-check workflow was unpublished and the clone stopped. Its volume and private
backup remain for inspection; neither the original volume nor operational containers were
overwritten/deleted. The original test instance was restarted unchanged with all 25 workflows
inactive. This is a successful test-instance rehearsal, not an operational restore or proof
that a future backup/restore will work without inspection.

## Final observations and limits

At `2026-11-26T14:25:30.430Z`, supported API inspection showed 25 inactive test workflows,
running=0, waiting=0, and singleton busy=false, execution 1699, issue 1,
started `2026-11-26T14:22:24.968Z`. The US4 loopback service was stopped by the stopped-volume
backup; its port 18768 returns ECONNREFUSED and its state/logs remain. Docker inspection confirms
the original test instance running on private 5679 and the restore clone stopped/network none.

Fresh read-only GitHub observation after the exercises confirms real issue #1 open/Building,
#4 open/Approved, and PR #5 owner-merged at its recorded head. No real issue/comment/PR write,
agent launch, operational import or merge occurred. No new real task run is counted. US4 guard
checks reuse existing scheduled-path evidence; operational adoption and T029/T030 final acceptance
remain separate. The project still needs at least five genuine issue/PR-linked runs.
