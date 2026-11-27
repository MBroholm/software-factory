# Basic B Setup, Foundation and US1 validation

Validated 2026-11-27 on branch `002-basic-b-us1`, based on
`c7b24f2f7c6b4b29954e8ea860af85cd134258ce`, with the uncommitted implementation identified by
[per-file source fingerprints](basic-b-us1-sources.json). T001–T020 are complete for this increment.
T021 onward remain unchecked. This record adds no genuine project task run and changes none of
the historical Basic A evidence.

## Implemented boundary

Private Python package, hash-locked dependencies/build backend, SQLite singleton/authorization/
attempt/effect ledger, authenticated bounded API, owner/source verification, attributable Git
worktrees, structured Codex outcomes, named worker supervision templates and inactive generated
reserve/collect/track workflows. Approval and source are independently re-read before model
spawn and runner-owned non-forced push. A slot release requires matching generation, stopped
invocation/cgroup proof and confirmed exact push/PR/publication effects. Historical v1 tracking
remains available beside authenticated v2 result association.

The demonstrated path is initial explicit approval through asynchronous dispatch, supervised fake
agent, exact pushed revision, one linked PR, QA and safe release. Derived authorizations and
existing-work continuations fail closed until subsequent story-specific authorization code is
implemented. Existing/unknown branches are retained and held rather than overwritten. Questions,
failures, uncertain dispatch/push and cancellation retain the slot. Active cancellation, restart
reconciliation, continuation/retry/backup and operational adoption are later stories. Occupied-slot
API startup fails preflight; it cannot dispatch a replacement. This increment is not ready for
operational activation.

## Checks actually run

| Check | Outcome and limits |
|---|---|
| Python `unittest discover -s factory/runner/tests` | 29 passed, including concurrent singleton claims, authorization identity, lost-ack durability, start replay/conflicts, authentication on reads/writes, size/override rejection, unknown-effect reconciliation, release predicates, immutable prompts, changed-source suppression, malformed/missing/nonzero outcomes, invocation proof and no-diff failure. Real temporary Git worktrees exercise ancestry/provenance/dirty retention; transport/model/service adapters remain fake. |
| `node factory/tests/basic-b-execution.cjs` | Passed pure approval/pagination/marker/exact-PR/duplicate/closure fixtures. |
| `node factory/tests/basic-b-workflows.cjs --native-fixtures` | Six generated-graph scenarios passed using actual SQLite and the complete ASGI API through a local stdin bridge, with fake GitHub/model/service effects. Proves Building before start, guard release while slot persists, exact one-PR collection/QA/release, lost PR acknowledgement reconciliation, closure suppression, non-owner/stale approval refusal, orphan Building holds and stale-result refusal. |
| `python3 factory/tests/run-basic-b-us1-expressions.py` | 214 reserve + 157 collect + 138 track = 509 native VM expression/pagination checks passed using synthetic contexts. Read-only node processes in the verified `factory-guard-test` n8n 2.48.8 container; no workflow import, HTTP call, table access or credential use. |
| Existing refinement and historical v1 tracking checks | 35 refinement and 25 tracking scenario groups passed. No unrelated historical model evaluation repeated. |
| Four generator `--check` commands | Refine/reserve/track/collect match their source-maintained generators. Operational nodes have notes, numbered stages, 60-second inactive schedules, explicit credential references and no generic HTTP retry. Shared fail-stop guard retained. Production concurrency=1 remains an adoption prerequisite. |
| Hash-locked clean install | Downloaded all locked wheels with hash verification, installed in a separate empty venv using only those wheels, built/installed runner with pinned backend, ran all 29 tests and checked installed CLI help. No undeclared HTTP test-client dependency required. |
| Codex CLI help | Confirmed fresh exec, stdin, workspace-write, explicit model, never-approval config, schema/final-output and ignore-config/rules options on local CLI 0.172.0. No model invocation/authentication performed. |
| `git diff --check` | Passed. |

Development environment: Python 3.15.2, Git 2.56.1, Node 24.19.0; FastAPI 0.165.0,
Uvicorn 0.54.0, jsonschema 4.26.0, setuptools 84.2.1, pip-tools 7.7.0 for lock generation.
Exact transitive pins and artifact hashes are in `factory/runner/requirements.lock`.
Ubuntu/Python 3.12 compatibility is declared but not exercised on that interpreter here.

## Retained failures and corrections

- Test-first execution initially failed on missing contract/ledger/worker modules.
- Python 3.15's threaded Starlette/httpx test client stalled in this environment. Tests now use
a small dependency-free ASGI driver that exercises authentication, parsing, routing and ledger
without sockets or client-library threads.
- Sandbox child-process stdin failed to close even for `/bin/cat`. Generated graph fixtures were
run with separately approved unsandboxed execution; all writes stayed in temporary fixture state.
- PyPI DNS was blocked in the sandbox; dependency download/locking used explicit approved network
access. No runtime credentials were provisioned.
- Native VM evaluation rejected adjacent closing braces in nested JSON parameter expressions,
although the plain-JavaScript harness accepted them. The shared generator now separates nested
object closings from n8n's expression terminator. All 509 native checks passed after correction.
- Local CLI rejected `--ignore-user-config` before the `exec` subcommand. Invocation now places
exec-specific flags after that subcommand; help validation succeeds.

## Isolated boundary and unrun acceptance

Read-only inspection verified `factory-guard-test` image n8n 2.48.8, editor bound to
127.0.0.1:5679 and separate `factory_guard_test_data` volume. The operational container uses
127.0.0.1:5678 and a different volume. Only the test container's installed expression libraries
were used. No workflow import/update, schedule activation, control-row mutation or ordinary
GitHub issue/PR write occurred. Credentials and private fixture dumps are not evidence artifacts.

Actual Ubuntu account/auth/model provisioning, private bridge/firewall enforcement, installed
user-service/cgroup lifecycle, real Codex execution, full native workflow runs, the elapsed
30-minute process-tree bound, restart/active cancellation/restore exercises, owner operational
import and genuine Basic B task acceptance remain unrun. These belong to subsequent tasks and
owner adoption gates. The owner retains review, manual import, permission-expansion and merge
authority. No extension hooks were present in `.specify/extensions.yml` (file absent) before or
after implementation.
