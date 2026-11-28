# Basic B integrated validation

Source baseline: US4 commit `ff14865` on `002-basic-b-us1`, plus validation tooling recorded
by SHA-256 in `basic-b-results.json`. Date: 2026-11-27. Local Fedora Linux 45, Node v24.19.0, Python 3.15.2,
Git 2.56.1. Native checks use the designated `factory-guard-test` n8n 2.48.8 container after
read-only image/loopback port verification. No workflow import, service provisioning,
operational activation, actual model call or genuine factory task occurred.

## Actual checks

- Runner suite: 81 discovered, 80 passed, one opt-in real Ubuntu elapsed deadline test skipped.
- All four generators: passed source consistency checks.
- Basic B packaging: four inactive copies generated and byte-checked with synthetic mappings;
  missing/unknown/operational targets rejected. Private hashes/exact node deltas are under
  ignored `factory/local/basic-b-test/manifest.json`; live isolation remains unverified.
- Retained policies: 35 refinement, 19 historical reservation and 25 tracking groups passed.
- Generated US1–US4 graphs: 14 scenarios passed using real temporary SQLite/ASGI API and fake
  GitHub/agent/service adapters. Separate question/review protocol assertions passed.
- Final combined command: passed all local checks and 14 combined graph scenarios.
- Native VM: 583 reserve + 621 collect + 324 track + 171 refine = 1,699 checks.
  Actual core waits were 10,009 ms and 30,000 ms; cancellation completed in 502 ms.
  The isolated container production concurrency limit was verified as 1.
  Synthetic contexts and core timers establish no scheduled workflow/credential behavior.

## Coverage and pending acceptance

| Criterion | Local evidence | Remaining acceptance |
| --- | --- | --- |
| SC-001 | Approved async fixture to exact result PR/QA | Genuine owner task/automated PR/acceptance (T044) |
| SC-002 | Question/answer/context and invalid/replayed answer fixtures | Scheduled isolated cycle |
| SC-003 | Duplicate/lost writes, restart, slot and effect holds | Scheduled outages, actual host/user manager restart |
| SC-004 | Failure/retry/deadline policy and fake process fixtures | Elapsed Ubuntu deadline passed in isolation; scheduled faults remain open |
| SC-005 | Closure/cancellation/stopped-proof fixtures | Scheduled real process/effect observation |
| SC-006 | Versioned input/result/manual-review fixtures and adoption record | Owner review/manual import and real evidence |
| SC-007 | Waiting/Stuck/QA release and answer/retry priority fixtures | Scheduled isolated queue exercise |

The full quickstart edge-case matrix is retained in `basic-b-results.json`; each row separates
local coverage from unrun scheduled/provisioned acceptance. The local backup suite rehearsed
coherent restore, stale restore refusal, active-slot refusal and retained pause/history.
Diagnostic canary sanitization and publication allowlists have local tests, not a scheduled
secret-canary result. No private material is published.

## Failures retained

The first sandboxed combined invocation timed out spawning the Python bridge. Approved execution
outside the sandbox passed the graph cases. The initial documentation check incorrectly required
`notes` on sticky notes; it now checks their content. The initial Wait check treated an expression
as a numeric constant; it now evaluates the real Wait node in VM contexts at 10 and 30 seconds.
These are validation-tool failures, not failed live factory runs.

## Remaining boundaries

T041 passed with local/native checks, isolated scheduled fake HTTP and fault
fixtures, scratch backup/restore, and separate Ubuntu runner restart tests. T042 passed with the isolated real Codex
smoke, private reachability and bearer rejection, and elapsed Ubuntu deadline.
T044 requires owner review/manual matching import, Basic A pause/drain/manual
execution reconciliation and a genuine operational task. See `basic-b-adoption.md`.
Basic A evidence and the
five-genuine-run project requirement are unchanged. No extension hooks are registered.

## Isolated scheduled idle check

All four workflows were imported inactive into the designated n8n instance with a
separate table, test repository, and authenticated private runner endpoint. The first
scheduled sweep passed refine (1713), collect (1714), and track (1715). Reserve (1716)
failed at Validate continuation queue because n8n requires an object in the item JSON
field. The guard held. The generator now validates both queue arrays and wraps each in
an object. Focused empty, populated, and malformed response checks passed.

After verified drain and a guard release tied to execution 1716, the second scheduled
sweep passed refine (1717), collect (1718), track (1719), and reserve (1720) with an
empty test repository. The workflows were deactivated and the guard read back idle.
These results verify idle scheduling and integration; they do not exercise a real
coding attempt or the scheduled fault matrix. The reserve generator fix changes its
artifact fingerprint and needs renewed review before operational import.

The isolated Ubuntu real elapsed systemd test passed both tests. The transient
shell and sleep descendant cgroup stopped after 1795.919 seconds (1801-second
assertion limit including observation tolerance). This validates the exercised
transient unit policy; the scheduled end-to-end Codex result remains separate.

## Isolated real Codex smoke

Owner-approved test issue [#2](https://github.com/MBroholm/software-factory-test/issues/2)
completed with scheduled reserve execution 1740 and collect execution 1741. The runner
committed the retained verified worktree change and pushed
`707a79185ce174410f89b93fc8d3a30aa926f468`. Collection opened exactly one
[review PR #3](https://github.com/MBroholm/software-factory-test/pull/3) and set Your QA.
PR readback showed only the requested one-line marker file. The n8n guard and runner
slot were verified idle (generation 5) and test schedules deactivated.

Earlier owner-approved attempts exercised missing Codex tool prerequisites, the
commit requirement, the legacy non-issued push recovery and sandbox read-only linked
Git metadata. Their evidence and the retained work were preserved. This is an isolated
acceptance smoke and adds no operational project run.

Owner `MBroholm` merged isolated PR #3 at the verified head. The next isolated
tracking poll (execution 1743) succeeded and issue #2 read back with the sole
managed label Done. The issue itself remains open. All isolated schedules were
inactive and the guard was idle after observation. This completes the isolated
smoke and owner-review loop. It does not establish the full scheduled fault
matrix, operational adoption, or a genuine operational project run.

## Isolated outage and recovery rehearsal

The runner service was stopped temporarily with only the isolated collector scheduled.
Execution 1744 failed at Read runner slot and kept its guard held. The collector was
deactivated, the service restarted, and the runner slot was observed empty. After
checking for running and waiting executions, the guard tied to 1744 was released and
read back idle. No test issue or runner reservation was created in this exercise.

The Ubuntu backup/restore rehearsal used a disposable ledger and checkout/work
directories under the isolated account. Restore rejected overwrite, restored both
markers to their original scratch paths, and left the scratch ledger paused. The
temporary fixture and backup were removed. No live state was restored.

The focused local recovery graph run passed three scenarios. It injected a synthetic
secret into the worker failure reason and verified that the collector's simulated
GitHub failure comment included the redaction marker and excluded the canary. A separate scheduled n8n canary check is recorded below.

## Scheduled redaction check

Isolated n8n execution 1745 ran the generated Plan collection node on the normal
workflow schedule with synthetic read results and a fake API key in the failure
reason. The assertion observed the redaction marker and no canary in the
planned failure comment. The fixture had no credentials or HTTP nodes and did
not post to GitHub. A separate local graph check exercised simulated publication.
The temporary scheduled workflow was deactivated and deleted after verification.

The updated exports passed a fresh combined run after the receipt fixes and
strict item-shape checks: 14 generated graph scenarios, 1,699 native n8n 2.48.8
checks, isolated production concurrency set to 1, 10,011 ms and 30,008 ms
non-durable core waits, and 503 ms cancellation. The VM run used synthetic
inputs and did not execute scheduled workflows.

Isolated n8n execution 1746 ran seven generated collection decisions on schedule
with captured synthetic inputs. It passed new and existing PR, question, and
failure cases, plus closed issue cancellation. The workflow had only a schedule
and a Code node and was deactivated and deleted after readback. This exercised
scheduled policy decisions. Executing their effects against fake external
adapters on the full scheduled graphs remains open.

The full reserve and collect graphs ran on the isolated n8n scheduler against a
loopback HTTP simulator (1747 and 1748). Both completed with an empty simulated
runner slot and issue queue. The simulator saw GET only: slot, questions, retries,
issues and issue events. Workflow guard writes used the dedicated test Data Table,
which read back idle. Both credential-free imports were deactivated and deleted.
The simulator used a bounded loopback listener and published no ports. Scheduled
nonempty state-changing fault scenarios still remain open.

The full stopped-failure collection path passed on the isolated scheduler
(execution 1749). Its loopback replay matched all 17 HTTP requests by method,
path and JSON body, including the failure comment, label transition to Stuck,
effect confirmations, and reservation release. The real n8n test guard read back
idle. The temporary workflow was removed and the listener closed. External
mutations were simulated; this was not a GitHub or runner-ledger write.

Five further full collector replays passed in isolated n8n, using a temporary
10-second test schedule and the dedicated guard: new PR (1750), existing PR
reconciliation (1751), new question (1752), existing question reconciliation
(1753), and closed issue cancellation (1754). Across 92 HTTP requests the loopback
server checked method, path, body and order. The reconciliations omitted duplicate
creation and the cancellation followed its own release path. The guard read back
idle and the fixture workflow was deleted. This is scheduled HTTP replay evidence,
with no live GitHub mutations or worker dispatch.

Five full reservation replays passed in isolated n8n on a temporary 10-second
schedule: initial approval (1755), answer (1756), retry (1757), occupied runner
slot (1758), and empty candidate queue (1759). The loopback server matched 69
requests by method, path, body and order. The first three accepted a simulated
dispatch, while the last two made no start request. The temporary workflow was
deactivated and deleted, and the real test guard read back idle. Worker process
restart and duplicate-dispatch behavior remain separately assessed.

## Ubuntu controller restart and duplicate dispatch

A disposable SQLite ledger tracked a real Ubuntu user-systemd transient unit with
a shell and sleep descendant. After the first controller process exited, a fresh
process reopened the ledger, observed the same live invocation, preserved its
original deadline, and refused a duplicate dispatch. After natural unit exit it
recorded a terminal Stuck result with empty-cgroup proof for the same invocation.
The fixture cleaned up its unit and files. It did not restart the NAS or use the
live test runner ledger. The separate Ubuntu runner suite passed 82 tests with
one elapsed test skipped there and run separately. Its first upload omitted the
reviewed schema and unit templates, which were included in the successful rerun.

Scheduled protocol requests were checked against loopback responses; runner fault
semantics were checked separately with disposable ledgers. A NAS reboot, real
GitHub outages, and an operational run were not exercised.
