# Tasks: Basic B — Automated Coding-Agent Execution

**Input**: Design documents in `specs/002-basic-b-agent/`: plan.md, spec.md, research.md, data-model.md, contracts/runner.md, contracts/agent-and-issue.md and quickstart.md.
**Prerequisites**: Constitution v2.0.0; retained Basic A real-run evidence. This file plans work; it performs no implementation, provisioning or adoption.
**Tests**: Included because spec.md FR-014 and SC-001–007 explicitly require acceptance and fault exercises. Write story tests before implementation and demonstrate the relevant failure before fixing it.
**Organization**: Four user-story increments following shared setup/foundation, then cross-cutting validation and owner adoption gates.

## Format and path conventions

Tasks use `- [ ] Tnnn [P?] [USn?] Description`. `[P]` permits concurrent work only after stated prerequisites and on separate files. Paths are repository-relative. Runner modules are under `factory/runner/factory_runner/`; private configuration, databases, logs and worktrees stay outside tracked source (local fixtures may use ignored `factory/local/`). All field citations below resolve to the entity table in `data-model.md`; field labels containing spaces retain the source spelling.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the scoped implementation boundary and reproducible development entry points.

- [X] T001 Update the Basic A-only stage boundary in `factory/AGENTS.md` for this Basic B scope, preserving generator notes, VM checks, isolated-test rules and manual operational adoption; make the scoped change reviewable before implementing under factory/.
- [X] T002 Create Python 3.12+ package/install metadata, exact tested dependency pins and hash-locked FastAPI/Uvicorn/jsonschema dependencies in `factory/runner/pyproject.toml`, `factory/runner/requirements.lock` and `factory/runner/factory_runner/__init__.py`, matching quickstart installation commands.
- [X] T003 [P] Document separate runner/orchestrator credentials, dedicated account, private bridge/firewall, owner-provisioned model/auth and autonomy boundaries in `docs/permissions.md`; identify required owner review without provisioning accounts or secrets.
- [X] T004 Create fake Codex, GitHub, clock and service-manager adapters with temporary ledger/worktree fixtures in `factory/runner/tests/support.py` and `factory/runner/tests/fakes/`, supporting failures before/after each dispatch and external-effect boundary.

**Checkpoint**: Scope and local test scaffold are ready; no live resources touched.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Durable ownership, strict input contracts and shared reconciliation primitives. Complete before story implementation.

- [X] T005 Implement schema initialization, foreign keys, short BEGIN IMMEDIATE transactions and durable identities in `factory/runner/factory_runner/ledger.py`, implementing canonical `data-model.md` fields Task.repository, Task.issue_number, Task.owner_id, Task.branch, Task.current attempt, Task.manifest; Authorization.id, Authorization.kind, Authorization.initial approval event, Authorization.specification/source digests, Authorization.comment/event references, Authorization.approved_entered_at; Attempt.UUID, Attempt.task, Attempt.predecessor, Attempt.authorization_id, Attempt.immutable payload hash, Attempt.base_sha, Attempt.status, Attempt.accepted/start/deadline/stop times, Attempt.unit_name, Attempt.unit invocation identity, Attempt.result_id; Reservation.singleton id, Reservation.attempt_id, Reservation.generation, Reservation.reserved_at, Reservation.hold_reason and Reservation.release evidence.
- [X] T006 Implement strict versioned reservation/start/cancellation/effect/release schemas, canonical JSON hashing and deterministic UUID namespace in `factory/runner/factory_runner/contracts.py`; enforce `contracts/runner.md` body/context limits, forbidden overrides and all response/conflict semantics without trusting supplied hashes.
- [X] T007 [P] Implement private configuration loading, explicit allowlisted model identifier, role credential references, bounded sanitized diagnostics and fail-closed preflight in `factory/runner/factory_runner/config.py` and `factory/runner/factory_runner/__main__.py`; check Ubuntu tools, user manager/linger, private bind, paths, auth availability, target isolation and reconciled slot without printing credentials or starting work.
- [X] T008 Implement the durable intent/confirmation/unknown journal and compare-and-set release predicates in `factory/runner/factory_runner/effects.py`, implementing canonical `data-model.md` fields Effect.id, Effect.intent hash, Effect.pending/confirmed/unknown, Effect.external id/SHA and Effect.observed_at; unknown execution or writes hold the reservation independently of workflow guards.
- [X] T009 Implement authenticated bounded HTTP routing in `factory/runner/factory_runner/api.py` for every endpoint in `contracts/runner.md`, using T005–T008; commit before acknowledgement, expose stable reads and never wait for coding; leave worker dispatch behind an injectable adapter until US1.
- [X] T010 Add foundational contract/concurrency tests in `factory/runner/tests/test_api_ledger.py` covering all endpoint response classes, missing/wrong bearer including reads, payload conflicts, concurrent singleton acquisition, unique authorization consumption, durable lost acknowledgements, generation-safe release and oversized/forbidden input.

**Checkpoint**: Fake-adapter API tests prove one durable slot and replay-safe protocol; no service installation required.

## Phase 3: User Story 1 — Execute approved work automatically (P1, MVP)

**Goal**: An explicitly approved owner task runs asynchronously and yields one traceable review PR.
**Independent test**: With refinement bypassed by an approved designated fixture, observe durable reserve → Building readback → async acceptance → supervised fake agent → exact pushed SHA → one PR → Your QA → safe release. A second task remains blocked until release; invalid authorship/approval never starts.

### Tests

- [X] T011 [P] [US1] Add worker/agent contract tests in `factory/runner/tests/test_execution.py` for immutable approved inputs, revalidated issue freshness, structured outcomes, genuine check provenance, no-diff failure, single dispatch and bounded asynchronous acceptance (under 2 seconds locally; HTTP bound 10 seconds).
- [X] T012 [P] [US1] Add reservation/collection contract fixtures in `factory/tests/basic-b-execution.cjs` covering paginated approval history, non-owner/stale/ambiguous approval rejection, owner-token factory comments, Building-before-start, duplicate collection, exact PR association and release proof.

### Implementation

- [X] T013 [US1] Implement current GitHub source/authorship/approval verification with complete pagination and immutable input assembly in `factory/runner/factory_runner/github.py` and `factory/scripts/basic-b-protocol.cjs`; distinguish v2 initial/derived authorizations from historical v1 records and recheck current state before launch and push.
- [X] T014 [P] [US1] Implement outcome schema and validator in `factory/runner/schemas/agent-result.json` and `factory/runner/factory_runner/results.py`, implementing canonical `data-model.md` fields Result.id, Result.attempt, Result.done/question/stuck, Result.summary, Result.question, Result.checks, Result.unchecked criteria, Result.diagnostics, Result.pushed_sha, Result.stopped proof and Result.cancelled flag; enforce `contracts/agent-and-issue.md` conditional outcomes and public allowlist, converting malformed/nonzero/missing outcomes to stopped Stuck.
- [X] T015 [P] [US1] Implement attributable per-task Git worktrees, base/head/ancestry checks, partial snapshots and journaled runner-owned push in `factory/runner/factory_runner/git.py`, implementing canonical `data-model.md` fields Work manifest.task, Work manifest.predecessor, Work manifest.branch/base/head SHAs, Work manifest.status/patch hashes and Work manifest.retained artifact paths; retain known work and hold unknown branches/divergence/dirty provenance without reset, clean or force-push.
- [X] T016 [US1] Implement fresh noninteractive schema-output Codex invocation and transactional worker dispatch claim in `factory/runner/factory_runner/worker.py` and `factory/runner/factory_runner/codex.py`; use stdin, argument vectors, controlled environment, workspace-write, explicit configured model and no permission/model fallback; preserve criteria/discussion and trusted attempt identity, with bounded private diagnostics.
- [X] T017 [US1] Implement named-unit adapter and separate API/per-attempt templates in `factory/runner/factory_runner/services.py`, `factory/runner/systemd/factory-runner.service` and `factory/runner/systemd/factory-attempt@.service`; persist intent before unit start, wire API dispatch, retain unit/boot/invocation evidence, and enforce Type=exec, RuntimeMaxSec=1795s, TimeoutStopSec=5s, KillMode=control-group, SendSIGKILL=yes and Restart=no for workers; do not install services.
- [X] T018 [US1] Adapt `factory/scripts/reservation-runtime.cjs` and `factory/scripts/build-reserve.cjs` to reconcile global slot/orphan Building state, select eligible immutable authorization, reserve before Building, journal attempt marker/labels, read back then start with the same UUID, and release only the short workflow guard after acknowledged submission/no-work; retain fail-stop behavior.
- [X] T019 [US1] Implement replay-safe done collection in `factory/scripts/collection-runtime.cjs` and `factory/scripts/build-collect.cjs`: authenticated status polling, closure observation, journal-before-write, exact SHA/head/base/marker PR reconciliation, sanitized actual-check PR body with Refs #N, Your QA label readback and proof-based release; keep historical results readable and hold uncertain writes without blind POST retries.
- [X] T020 [US1] Add v2 result/PR association alongside historical v1 handling in `factory/scripts/tracking-runtime.cjs` and `factory/scripts/build-track.cjs`, ensuring stale QA tasks/results cannot overwrite current attempts or approval; generate `factory/workflows/reserve.json`, `factory/workflows/track.json` and `factory/workflows/collect.json` with accurate node notes, numbered stages and 60-second bounded schedules.

**Checkpoint**: US1 is independently demonstrable with fake external adapters and isolated fixtures. This MVP includes safe holds and supervision; it is not yet operational adoption.

## Phase 4: User Story 2 — Answer agent questions through the issue (P1)

**Goal**: Publish a question once, accept one matching owner answer and run a fresh authorized continuation with preserved context.
**Independent test**: Collect a question, confirm stopped Waiting release, offer valid and invalid replies, and inspect a distinct next attempt for approved spec, exact question/answer and attributable prior work; observe zero unauthorized/replayed launches.

### Tests

- [X] T021 [P] [US2] Add question/answer claim and prompt-context tests in `factory/runner/tests/test_questions.py`, covering edited/deleted/competing/stale answers, exact grammar, scope changes, factory comments, unique consumption and canonical source changes.
- [X] T022 [P] [US2] Add question collection/refinement-loop fixtures in `factory/tests/basic-b-questions.cjs` proving one question post, Waiting release, answer-derived authorization before Approved, no initial approval from answers and non-preemptive continuation priority.

### Implementation

- [X] T023 [US2] Implement question persistence and atomic answer claims in `factory/runner/factory_runner/questions.py` and `factory/runner/factory_runner/ledger.py`, implementing canonical `data-model.md` fields Question.id, Question.text, Question.context, Question.owner answer comment id/hash and Question.consumed_by_attempt; bind new authorization/attempt to prior explicit approval and unchanged source, using the exact answer grammar from `contracts/agent-and-issue.md`.
- [X] T024 [P] [US2] Extend question publication/reconciliation in `factory/scripts/collection-runtime.cjs` with trusted question IDs, exact v2 markers, decision context and answer instructions; confirm comment/Waiting state and stopped/effect proof before releasing, holding edited/deleted or conflicting markers for owner recovery.
- [X] T025 [US2] Extend `factory/scripts/refinement-runtime.cjs`, `factory/scripts/build-refine.cjs` and `factory/scripts/refinement-notes.cjs` to inspect outstanding Waiting questions and persist valid derived authorization before Approved; exclude protocol comments from refinement loops, surface missing scope confirmation and route changed scope through refinement/renewed explicit approval; regenerate `factory/workflows/refine.json`.
- [X] T026 [US2] Integrate continuation context and deterministic answer priority in `factory/scripts/reservation-runtime.cjs` and `factory/runner/factory_runner/worker.py`: fresh invocation with captured question/answer/history and preserved manifest, priority key (class, Approved-entry time, issue number), no preemption; rebuild `factory/workflows/reserve.json` and `factory/workflows/collect.json` with matching notes.

**Checkpoint**: A safely released question permits other work; an eligible answer takes priority only when the slot becomes free.

## Phase 5: User Story 3 — Recover or abandon safely (P1)

**Goal**: Preserve single execution through failures, timeouts, restart, cancellation and explicit retry.
**Independent test**: Fault-inject each acceptance/dispatch/push/publication boundary, restart API/worker/host fixtures, close issues and retry Stuck; inspect stopped-process proof, original deadline, unchanged attempt history, slot ownership and remote effects. No duplicate launch/publication or premature release is allowed.

### Tests

- [X] T027 [P] [US3] Add restart/uncertainty fault tests in `factory/runner/tests/test_recovery.py` spanning before acceptance, accepted-before-response, dispatch/unit-start-before-ledger-update, coding, push and delivered result; include missing unit evidence, PID reuse, clock uncertainty, outage, stale generation and restore hazards.
- [X] T028 [P] [US3] Add cancellation/deadline process-tree tests in `factory/runner/tests/test_cancellation.py` and `factory/runner/tests/test_systemd_deadline.py`, using fake time plus an opt-in actual configured 30-minute bound on an isolated Ubuntu user manager; verify descendants stop independently of polling/API and deadline survives API restart.
- [X] T029 [P] [US3] Add n8n recovery fixtures in `factory/tests/basic-b-recovery.cjs` covering guard release/reset versus reservation, explicit owner retry, closure before/during dispatch/push/PR, late old results, lost writes, priority ordering and Waiting/Stuck/QA release with preserved partial work.

### Implementation

- [X] T030 [US3] Implement startup and ongoing named-unit/ledger/effect reconciliation in `factory/runner/factory_runner/reconciler.py`; retain live original deadlines, convert confirmed interruptions to stopped Stuck, hold unknown process/write state and prevent new work until reconciled; never automatically replace an interrupted invocation.
- [X] T031 [US3] Implement durable cancellation and whole-cgroup stopped-proof handling in `factory/runner/factory_runner/worker.py`, `factory/runner/factory_runner/services.py` and `factory/runner/factory_runner/api.py`; suppress undispatched starts and post-observation publication, terminate active units, retain evidence for already-issued effects and prevent early release.
- [X] T032 [US3] Integrate Stuck/timeout diagnostics, partial-work references, cancellation, stale-result suppression and owner retry lineage in `factory/scripts/collection-runtime.cjs`, `factory/scripts/reservation-runtime.cjs` and `factory/scripts/basic-b-protocol.cjs`; fresh owner Approved after failure creates a distinct priority attempt only with stopped/reconciled predecessor and unchanged or renewed approved scope.
- [X] T033 [US3] Extend closure candidate discovery beyond Building/QA to Waiting/Stuck in `factory/scripts/tracking-runtime.cjs`; apply Done without implying free slot, send idempotent cancellation and coordinate collector reconciliation; rebuild `factory/workflows/reserve.json`, `factory/workflows/track.json` and `factory/workflows/collect.json` with truthful recovery notes.
- [X] T034 [US3] Provide pause/drain/inspect and coherent ledger/worktree backup/restore commands in `factory/runner/factory_runner/recovery.py` and CLI wiring in `factory/runner/factory_runner/__main__.py`; refuse snapshots/restores that forget unresolved/live work, retain manifests/history and require recorded owner recovery for ambiguity.

**Checkpoint**: Every interruption/cancellation can be explained from durable history; a label or guard reset never proves execution has stopped.

## Phase 6: User Story 4 — Preserve refinement and owner review (P2)

**Goal**: Retain Basic A refinement/review and make operational adoption an explicit owner-controlled boundary.
**Independent test**: Exercise initial refinement and approval, v1 historical records, v2 review, merged/unmerged PR closure, explicit owner QA rework and issue closure. Inspect reviewed artifact/mapping records; no merge endpoint or automated operational import exists.

### Tests

- [X] T035 [US4] Add affected Basic A/v2 review regression fixtures in `factory/tests/basic-b-review.cjs` for unchanged refinement, explicit initial approval, merge to Done, unmerged close remaining QA, owner-authorized rework with exact existing PR association and issue closure; preserve historical evidence expectations.

### Implementation

- [X] T036 [US4] Complete refinement/tracking compatibility in `factory/scripts/refinement-runtime.cjs`, `factory/scripts/tracking-runtime.cjs` and `factory/scripts/basic-b-protocol.cjs`; retain manual owner QA rework authorization without advanced feedback automation, never infer approval from bot-owned actor identity, and rebuild affected `factory/workflows/refine.json` and `factory/workflows/track.json`.
- [X] T037 [P] [US4] Update `docs/architecture.md`, `docs/workflow-mapping.md` and `docs/review.md` for four workflows, separate durable slot, versioned markers, truthful agent-reported checks, owner merge authority and unchanged Basic A history.
- [X] T038 [P] [US4] Document reviewed provisioning preflight, owner account/model inputs, Basic A pause/drain/manual-Building reconciliation, matched four-artifact manual import, private mappings, rollback without ledger loss and recovery in `docs/operations.md` and `docs/manual-coding.md`; distinguish preparation from later owner-authorized service/network changes and adoption.

**Checkpoint**: Implementation and adoption documentation preserve human authority and expose all unrun acceptance checks.

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Exercise the complete system only within verified boundaries and retain reviewable evidence.

- [X] T039 Extend isolated artifact mapping/target validation in `factory/tests/prepare-test-artifacts.cjs` and `factory/tests/test-artifacts.cjs` for collect, separate runner/control-table/credential destinations and inactive copies; refuse unknown or operational targets before any import/write.
- [X] T040 Implement `factory/tests/run-basic-b-native.cjs` and `factory/tests/check-basic-b-native-expressions.cjs` to run US1–US4 fixtures with explicit n8n 2.48.8 VM initialization, all four generator checks, affected existing checks, node/stage note checks, native Wait thresholds and workflow concurrency=1; persist source/artifact hashes and exact test-copy deltas.
- [X] T041 Run local runner/contract and generator/native validation from `specs/002-basic-b-agent/quickstart.md`, then verified isolated fake-agent scheduled exercises including outage, secret-canary/publication filtering and backup/restore rehearsal; record every edge-case row, SC-001–007 coverage, actual versions/revision, failures and unrun checks in `evidence/basic-b-validation.md` and `evidence/basic-b-results.json`.
- [X] T042 After required owner-provisioned isolated account/auth/model/network inputs exist, run the bounded real Codex smoke and actual elapsed process-tree deadline test through `factory/runner/tests/test_systemd_deadline.py`; record Ubuntu CLI/config compatibility, private reachability/unauthorized rejection, descendant stopped proof and actual elapsed lifetime in `evidence/basic-b-validation.md`; missing prerequisites remain explicitly pending, never substituted with production.
- [X] T043 Prepare the reviewable adoption record in `evidence/basic-b-adoption.md` with reviewed/source workflow fingerprints, permission changes, preflight outcomes and private mapping references; leave operational import/enablement pending until owner review, manual import of the matching four JSON revisions and paused/drained Basic A reconciliation are actually observed; provisioning requires its later owner authorization.
- [ ] T044 After the T043 owner adoption gates are satisfied, observe one genuine approved owner-authored Basic B task reaching an automated linked PR and owner review without manual agent/PR creation; capture question/answer and explicit failure/retry evidence where exercised in `evidence/basic-b-real-run.md`, retaining actual failures/interventions and separating fixture results from real-run claims.
- [X] T045 Update `evidence/index.md`, `evidence/acceptance.md` and `specs/002-basic-b-agent/quickstart.md` with actual outcomes, remaining gaps and runnable final commands; retain Basic A facts and the five-genuine-run project requirement, and do not mark missing owner/adoption/real-run checks complete.

## Dependencies & Execution Order

```text
Setup T001–T004
  → Foundation T005–T010
  → US1 T011–T020 (local MVP)
  → US2 T021–T026
  → US3 T027–T034
  → US4 T035–T038
  → integrated validation T039–T042
  → adoption preparation T043
  → owner review/provisioning/manual import gates
  → real task evidence T044 → final evidence T045
```

US2 and US3 depend on US1's dispatch/collection path. They can be tested independently with fake predecessors but their shared runtime edits must be serialized. US4 review fixtures/docs can begin after foundation; final regression waits for US1–US3 integration. Priority order is P1 US1, US2, US3, then P2 US4. No story requires a genuine operational run to implement its local behavior.

Within foundation, T005 and T006 establish ledger/contracts; T007 is independent; T008 follows T005–T006; T009 requires T005–T008; T010 verifies that increment. Within US1, T013 establishes input verification; T014 and T015 can then run together; T016 uses T013–T015, T017 wires supervision and dispatch, T018–T020 integrate workflows. T023 precedes T025–T026; T024 is independent of T023 once US1 is complete. Recovery implementation T030–T034 is sequential where modules overlap. T039 precedes isolated imports, T040 precedes T041, and T041 acceptance plus required test preflight precede T042. T043 is preparation; its completion alone grants no adoption permission.

## Parallel Execution Examples

These are scheduling opportunities, not instructions to launch agents. Complete prerequisites before each group.

| Story | Concurrent tasks | Follow-up integration |
| --- | --- | --- |
| US1 | T011 runner tests + T012 workflow fixtures; after T013, T014 outcome validation + T015 Git adapter | T016 → T017 → T018 → T019 → T020 |
| US2 | T021 runner tests + T022 workflow fixtures; after tests, T023 claims + T024 collector question effects | T025 → T026 |
| US3 | T027 recovery tests + T028 process-tree tests + T029 workflow faults | T030 → T031 → T032 → T033 → T034 |
| US4 | T037 architecture/review docs + T038 operations docs; T035 fixtures can accompany these | T036 compatibility, then integrated regressions |

T003 permission documentation can run alongside package/scaffold work. Avoid parallel edits to shared ledger, worker, protocol and runtime modules even when the stories differ.

## Implementation Strategy

1. Build setup/foundation and US1 as the local MVP. Validate with fake Codex/GitHub and reviewed isolated fixtures; safe unknown-state holds and supervision are part of this increment.
2. Add US2, demonstrating one full answer claim/context cycle and rejection cases without requiring live refinement/model runs.
3. Add US3, completing fault boundaries, cancellation, priority retry and stopped/effect-proof release before adoption consideration.
4. Preserve US4 refinement and review through affected regressions and operational documentation.
5. Run full isolated acceptance, including a real bounded Codex smoke and real deadline test when provisioned. Prepare artifacts for owner review/manual operational import. Keep gated tasks pending if owner inputs/actions are unavailable.
6. Record a genuine Basic B reviewable run after adoption and update evidence truthfully; one Basic B run does not satisfy the final five-run assignment minimum.

## Notes

All tasks start unchecked. Do not reset completed historical tasks or rewrite evidence. Publish only allowlisted sanitized outcomes, never private logs, model sessions or credentials. Agent-reported checks remain attributed; independent runner verification and advanced isolation are outside this feature. Stop on uncertain resource identity, process ownership, scope or external writes and retain the relevant reservation/recovery evidence.

US3 local implementation T027–T034: see `evidence/basic-b-us3-validation.md` for actual checks, failures and pending provisioned Ubuntu/native scheduled acceptance. The real elapsed deadline exercise remains pending T042.

US4 local implementation T035–T038: see `evidence/basic-b-us4-validation.md` for review,
manual rework and historical compatibility checks. Integrated/native acceptance and owner
provisioning/adoption remain pending T039–T045; no operational import was performed.

Integrated validation T039–T040 and adoption preparation T043/T045: see
`evidence/basic-b-validation.md`, `evidence/basic-b-results.json` and
`evidence/basic-b-adoption.md`. The initial T041 pass covered local/native checks before the later scheduled acceptance below. T044 retains its owner and real-run gates.

T042 passed on the isolated Ubuntu runner, including the real Codex smoke, owner merge, and elapsed systemd deadline. T041 passed with scheduled fake HTTP replays and separate runner fault fixtures; T044 remains open for the first operational run.
