# One-import isolated guard validation bridge

Current policy (2026-11-26): imports, updates and execution in designated isolated dev/test
n8n may be automated after T033 boundary verification, using test data, scoped credentials and
designated test resources. No operational workflow replacement/activation or ordinary factory
tasks are allowed. Record tested source/imported revision and environment. Operational adoption
requires owner PR review and manual import of the matching reviewed JSON revision, renewed for
subsequent changes, before or after merge. Manual import does not require manual execution of
every test. Historical owner imports and shutdown observations below remain evidence, not new
setup requirements. Existing scripts' limited capabilities are unchanged by this policy.

This test-only workflow reduces repeated manual fault edits/runs. It is not part of Basic A's
production workflow design, and adds no runner or product API. T008 remains incomplete until
actual native-engine results are collected; local compilation is not a runtime pass.

## Review and isolated test import

Review `build-guard-bridge.py` and generated `guard-bridge.json`. The generated workflow starts
inactive and contains three prefixed copies of the current guard graphs, with native Data Table
nodes, explicit fault injection and the same acknowledgement/ownership/release checks. Original
workflow files remain unchanged; source hashes are in `guard-bridge-sources.json`.

In **factory-guard-test at localhost:5679 only**, import (automation permitted) `guard-bridge.json` as a new
workflow. Publish that test workflow so its webhooks register. There are **no Schedule triggers**,
no GitHub/model calls, no credential references, no subworkflows and no automatic failure cleanup.
Keep all existing skeleton/test workflows unpublished. Do not import this bridge into production.
The existing Docker binding is host loopback only; no new port, public exposure, credential or
access grant is needed. Unpublish the bridge after testing.

The two fixed table IDs are the owner's disposable isolated test tables:

- control: `I1JBIePgy75Ecnlp`
- effects: `8fCAvfPK5z11XeRJ`

They were confirmed by inspection of the owner's already-imported workflow exports. The bridge
contains native fixture operations that can **update, insert and delete test control rows** on
explicit operator requests. These support missing/duplicate/invalid-row cases and known-outcome
resets. They never run from an error/finally path. Effect rows are retained as evidence. Do not
execute tests manually while the assistant is operating the bridge; tests run sequentially.

## SSH-local entry points

Requests originate on Ubuntu through the existing authorized SSH connection; no browser session
or n8n API key is required. The main n8n server executes Data Tables and Code nodes normally.
The standalone `n8n execute` CLI was tried and failed at Read control because its execution
context lacks Data Table support; it is not used for bridge tests. No direct SQL/internal-table
read or write is used.

| Method/path on `http://127.0.0.1:5679` | Purpose |
|---|---|
| GET `/webhook/basic-a-guard-test/state` | Read actual control and effect rows |
| POST `/webhook/basic-a-guard-test/refine` | Run refine's copied guard path |
| POST `/webhook/basic-a-guard-test/reserve` | Run reserve's copied guard path |
| POST `/webhook/basic-a-guard-test/track` | Run track's copied guard path |
| POST `/webhook/basic-a-guard-test/fixture` | Explicit test-row operation with required reason |

Guard request JSON is `{ "case": "G05" }`, for example. Allowed cases:

- G01/G02: no-work/synthetic acknowledged success; G03/G06/G15: ordinary path against fixture state.
- G04: unexpected exception at work boundary.
- G05: native insert into guard_effects, then boundary exception (insert is before throw).
- G07/G09/G11/G13: actual unavailable Data Table ID at acquisition/acquired-read/release/released-read.
- G08: missing acquisition acknowledgement at the next real validation node.
- G10: invalid completion; G12: exception after committed release but before receipt confirmation.
- G14_DELAY: 30-second acquired window for controlled in-flight abort/restart testing.
- G16: mismatched release-ownership input; physical guard row remains untouched by injection.

Fixture requests require action `update`, `insert` or `delete`, a nonempty `reason`, a positive
row `id` for update/delete, and complete `row` fields for update/insert. The five row fields are
key, busy, execution_id, issue_number, started_at. The operator first reads actual state, inspects
the failure/effects, verifies no execution is running, and submits a deliberate fixture request.
This is a test fixture tool, not recovery automation for production. Stop on unexpected results;
never clear a hold in unconditional cleanup. Preserve actual failure responses, row context,
effect counts and later-poll outcomes in evidence.

## Limits

This runs real n8n engine paths copied from source, not the local in-memory graph stand-in.
Keep original owner-run skeleton evidence and revision identifiers alongside bridge results.
Its HTTP entry replaces the manual trigger only for isolated testing; production schedule-path
coverage still needs the original schedules. G08/G12 are explicit downstream acknowledgement
fault injections, not proof of database transport failures. A lost release acknowledgement may
leave the physical row idle; inspect and record it rather than claiming a held flag.

Local preflight: generator compiles; all 43 Code bodies compile as async JavaScript; all 83 node
names/connection targets are unique/resolved; no retries/continue-on-failure/credentials/schedules/
remote HTTP/subworkflow nodes; original guard source hashes match. Owner imported/published bridge `0ITfSwx2Yb69qfX5`, version
`2c36bf8c-6531-4ec4-bc77-4402ba3b8d83`; assistant verified all 43 Code bodies match the prepared
source. Native bridge checks are recorded in `evidence/guard-bridge-results.json`. Rebuild with `python3 factory/tests/build-guard-bridge.py` after
source changes, inspect the resulting diff and reimport into isolated test n8n before relying on its results.

## Operator helpers and observed runs

`run-guard-bridge.py` is a standard-library operator script run on Ubuntu via SSH/stdin. Its
stages are inspect, pilot, faults, rows, restart and schedules. Every fixture change requires a
recorded reason; it stops at the first unexpected result and has no finally/reset handler.
Each error case is checked through HTTP response, actual persisted rows/effect counts and later
held polls. The restart stage deliberately terminates only factory-guard-test during an acquired
30-second window. The schedule stage publishes/unpublishes the owner's already imported originals,
one at a time, without importing or changing their JSON.

`collect-guard-traces.py` uses the supported n8n entity export, with a fresh export-only key,
and decrypts only execution files in the test container. It never reads the instance encryption
key, account records or credential files. It emits only whitelisted execution metadata, reached
node names/statuses, safe errors and guard context; temporary encrypted archives/keys are removed
after successful extraction. No direct SQL/internal table mutation is used.

Private operational logs remain ignored under `factory/local/guard-validation/`.
`summarize-guard-results.py` matches native traces to the observed HTTP/row checks and verifies
that failures stop at the intended node, forbidden downstream acquire/release nodes do not run,
post-effect inserts succeeded and interrupted executions are recorded as crashed. Sanitized,
trace-checked results are retained in `evidence/guard-bridge-results.json`.

Supplemental variants not exercised by the bridge are explicit UI cancellation apart
from hard restart, G08's separate wrong-context receipt variant, G09's separate changed-read
payload variant and G12's separate empty receipt variant. Missing acknowledgement, unavailable
reread, post-commit exception and in-flight crash are exercised. Record these distinctions; no
blanket claim that every possible fault variation or completed-workflow T026 case passed.

## Shutdown

Validation completed on 2026-11-24. All 11 isolated workflows are unpublished; the bridge route
returns 404 and test n8n remains healthy. The test row is intentionally busy at execution 714,
started_at `2026-11-24T12:58:47.418Z`, and four effect rows remain. Do not republish or clear the
hold automatically. Results include six original-schedule checks with native trigger-mode traces;
the bridge does not substitute for those schedule entries.
