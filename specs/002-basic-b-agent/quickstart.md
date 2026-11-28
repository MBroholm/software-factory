# Basic B validation quickstart

The runner, four inactive workflow artifacts and local fake-adapter validation are implemented.
Provisioning, scheduled isolated acceptance, real model/deadline acceptance and operational
adoption remain gated. See `evidence/basic-b-validation.md` for current actual outcomes.

## Preconditions and isolated setup

1. Follow [Basic A operations](../../docs/operations.md) and verify designated isolated n8n
   identity (`factory-guard-test`, editor 5679), separate volume/control table and inactive test
   copies. Verify scoped test GitHub resources and credential mappings, not ordinary issues.
2. Use a separate Ubuntu test account/runner user manager, DB, work root, bearer secret and
   network address. Verify private bridge reachability and rejection from other interfaces.
   No operational Docker socket, n8n volume or personal home mounts. Owner provisions Codex
   test auth/model only for the bounded smoke task; use fake agent for fault exercises.
3. Record source revision, workflow hashes, tool versions, fixture mode and exact test-copy
   deltas. Missing instance identity or credentials stops tests; do not fall back to production.
4. Planned setup from repository root:

```bash
python3 -m venv factory/local/basic-b-venv
factory/local/basic-b-venv/bin/pip install --require-hashes -r factory/runner/requirements.lock
factory/local/basic-b-venv/bin/pip install --no-deps ./factory/runner
factory/local/basic-b-venv/bin/python -m factory_runner preflight --config factory/local/basic-b-test.toml
```

The implementation must provide the lock and module installation path used here. Preflight
checks systemd user manager, timeout/kill capabilities, Git/Codex versions, model/auth, paths,
repository allowlist, private bind, blank-or-reconciled slot and scoped external destinations.
It must not print secrets or start ordinary work. Unit provisioning and host firewall changes
are later reviewed setup steps, not commands authorized by this guide.

## Local and isolated validation commands

Local validation entry points (from the repository root):

```bash
factory/local/basic-b-venv/bin/python -m unittest discover -s factory/runner/tests
node factory/scripts/build-refine.cjs --check
node factory/scripts/build-reserve.cjs --check
node factory/scripts/build-track.cjs --check
node factory/scripts/build-collect.cjs --check
node factory/tests/run-basic-b-native.cjs
# Optional read-only installed native VM checks:
node factory/tests/run-basic-b-native.cjs --remote-vm
```

Keep existing affected Basic A pure/native checks; do not rerun unrelated historical model trials.
Validate workflow parameter expressions with the deployed VM engine, not default legacy imports.
Map test copies through reviewed preparation tooling, verify every external destination before
import, then execute only isolated fixtures. Verify every operational node/stage note matches
behavior. See `factory/tests/test-preparation.md` for inactive four-workflow fixture mapping and exact mapping deltas.

## Acceptance matrix

| Exercise | Expected observable result | Spec coverage |
| --- | --- | --- |
| Genuine approved owner task | Building before submit; async acceptance; issue-N result; one PR; owner decides merge | US1/4, SC-001/006 |
| Non-owner issue, stale source, AI/answer as initial approval | No start; visible refusal/hold for ambiguity | FR-001/002 |
| Valid structured question and marked owner answer | One question; Waiting; scoped answer becomes Approved; new invocation includes full context | US2, SC-002 |
| Non-owner/unrelated/edited/stale/multiple answers or changed scope | No unauthorized continuation; owner resolution or renewed refinement/approval | D2, SC-002 |
| Concurrent/duplicate reservation/start; lost HTTP reply | Same UUID/payload result, one worker; conflict rejected; slot retained | FR-003/009, SC-003 |
| Duplicate collection; lost comment/label/PR response | Reconcile journal/markers, no duplicate POST or false state; hold uncertainty | FR-006/009, SC-003 |
| Kill API before accept/dispatch, while coding, after push/result | Reconcile named unit/ledger; no second start; interrupted work Stuck and owner retry | D3, SC-003/004 |
| Restart host or worker; PID reuse; missing unit proof | Interrupted becomes Stuck if stopped proven; otherwise hold, never assume free | FR-008/009 |
| Failure, malformed outcome and full 30-minute timeout | Whole process tree stops; deadline not reset; Stuck reason/partial work visible | SC-004 |
| Close before start, during coding/push/PR effect | Cancellation persists; no new post-observation publication; reconcile earlier effects; stopped proof before release | SC-005 |
| Reset/release workflow guard while worker active | Durable reservation still blocks another build; collector can run after valid guard release | FR-011 |
| Waiting/Stuck/QA release and priority arrival | After confirmed effects/stopped state another task can run; answer/retry precedes ordinary work, never preempts | FR-015, SC-007 |
| Preserve dirty attributable work; conflicting branch/PR | Known work reused, unknown conflicts owner-held; no reset/force-push | D3, FR-012 |
| GitHub outage/rate limit, runner outage or unknown write | No blind retry/slot expiry; recover under pause/drain/inspect procedure | FR-009/010 |
| Merge/unmerged PR close/QA rework and issue close | Existing owner-review semantics retained, no advanced feedback automation | US4 |
| Backup/restore rehearsal | Ledger/worktree/secret configuration recovered together without forgetting potentially live work | FR-009/013 |
| Missing/wrong bearer; secret canary in diagnostics | No unauthorized work/results; canary absent from public artifacts | FR-013 |

Use fake time for fast deadline tests AND one real elapsed process-tree deadline test before
adoption. Record stopped-process proof; a Stuck label alone is insufficient. Fault-inject at each
intent/side-effect/confirmation boundary, including accepted-before-response and unit-start-before
ledger-update. Preserve failures and interventions. Native fixtures do not increase real-run count.

## Owner adoption and real evidence

Owner reviews permission expansion and versioned JSON in PR; manually import matching reviewed
`factory/workflows/refine.json`, `factory/workflows/reserve.json`,
`factory/workflows/track.json` and `factory/workflows/collect.json` only after test acceptance.
Pause/drain Basic A first; reconcile manual Building work and verify no owner-started agent
remains active. Record reviewed/source/imported hashes and all mappings before enabling schedules.
Do not activate mixed old/new reservation and tracking versions. If cutover is uncertain, stay
paused; revert only after workers/effects are reconciled, retaining ledger and partial work.

Run one genuine approved Basic B issue through automated result PR and owner review, retaining
question/answer and failure/retry evidence where exercised. Add new evidence records and extend
the index without rewriting Basic A facts. Report actual checks, revision/environment and unrun
criteria; do not declare all five project tasks complete until five genuine issue/PR runs exist.
