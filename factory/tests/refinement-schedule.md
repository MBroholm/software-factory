# T031 — scheduled US1 validation

Current policy (2026-11-26): imports, updates and execution in designated isolated dev/test
n8n may be automated after T033 boundary verification, using test data, scoped credentials and
designated test resources. No operational workflow replacement/activation or ordinary factory
tasks are allowed. Record tested source/imported revision and environment. Operational adoption
requires owner PR review and manual import of the matching reviewed JSON revision, renewed for
subsequent changes, before or after merge. Manual import does not require manual execution of
every test. Historical owner imports and shutdown observations below remain evidence, not new
setup requirements. Existing scripts' limited capabilities are unchanged by this policy.

This test copy addresses the scheduled-entry gap found by US1 convergence. It reuses the
native HTTP/Data Table refinement graph and existing synthetic fixture service, preserving all
31 source Code bodies, the exact Schedule Trigger, its 60-second interval and direct connection
to Read control. No manual/webhook entry can initiate refinement. Separate operator endpoints
only inspect/reset the isolated control row; they never trigger main work.

Build/check from project root:

```
node factory/tests/build-refinement-schedule.cjs
node factory/tests/build-refinement-schedule.cjs --check
```

Review the committed `refinement-schedule.json` and `refinement-schedule-sources.json` with
the builder, fixture-server changes and `run-refinement-schedule.py`. The ready-mapped private
isolated test import is `factory/local/refinement-native-bridge/schedule-mapped.json`. It retains the
existing isolated US1 table mapping. No credentials are present; all external HTTP URL bases
point only to 127.0.0.1:18765 inside factory-guard-test. Production-source JSON is unchanged.

Import this (automation permitted) as a **new**, initially inactive workflow into the test container
at localhost:5679, named `TEST ONLY — US1 scheduled refinement`. Keep every other schedule and
the earlier fault bridge unpublished. Preserve the known 1218 cancellation hold for inspection.
Do not import into production. Constitution I/III permit automated import after isolated-boundary verification. The operator
verifies the imported graph, publishes only this copy and starts the observer. The row stays
held until an explicitly inspected fixture reset for this independent test.

The fixture service keeps synthetic session 31001 across ticks. HTTP fixture headers use that
stable session ID and separately log each actual n8n execution ID. This is test-only state;
no task ledger or persistence is added to the product. The observer:

1. Inspects the 1218 row and retained cancellation evidence; deliberately clears only busy with
   row-ID/expected-execution comparison and a reason. An unknown held context stops the test.
2. Observes the first scheduled refinement: Ideas -> Refining -> one marked output -> Ready,
   one count/generation, acknowledged idle guard.
3. Explicitly injects one synthetic owner revision after that tick has completed. The internal
   `/schedule/revision` endpoint requires an inspection reason, Ready state, exactly one prior
   generation/post and no prior injection; invalid/repeated requests fail without changing state.
4. Observes a second scheduled refinement retaining the first output and capturing the new
   owner comment, then an unchanged scheduled poll with no further count/generation/post.
5. Stops; the assistant unpublishes/drains the schedule, verifies idle control and collects
   supported-export native trigger-mode traces, source/import fingerprints and output evidence.

Run the observer on NAS through the existing SSH connection with Python on stdin, keeping its
JSONL under ignored `factory/local/refinement-native-bridge/`. It never sends a main workflow
request or publishes workflows. Unexpected results halt with evidence preserved, without an
automatic reset/finally repair. Polling native state endpoints is read-only; only real scheduled
activations modify the main guard or synthetic issue state.

Use the current fixture service's `/schedule/inspect` and supported execution export to verify
actual scheduled IDs, mode, source Code/connections, outcomes and zero calls on the unchanged
poll. Unpublish promptly after the third tick; extra no-work ticks, if any, are retained honestly.
Stop only the fixture service after final inspection. Record failed/unrun outcomes and operator
interventions. Do not mark T031 complete from generator/fixture checks alone.

Mapping to real-task evidence: original issue #1 refinement 753, owner revisions 755/757,
unchanged polls 754/758 and owner approval event 37246567614 already cover real API/credential/
semantic behavior. This test supplies the missing actual Schedule Trigger integration using
synthetic inputs, without additional Gemini calls or real issue writes. Describe this combined
evidence explicitly; synthetic scheduled polls are not new real task/build runs.
