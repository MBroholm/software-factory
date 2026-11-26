# Isolated US2 native fault bridge — T019

Current policy (2026-11-26): imports, updates and execution in designated isolated dev/test
n8n may be automated after T033 boundary verification, using test data, scoped credentials and
designated test resources. No operational workflow replacement/activation or ordinary factory
tasks are allowed. Record tested source/imported revision and environment. Operational adoption
requires owner PR review and manual import of the matching reviewed JSON revision, renewed for
subsequent changes, before or after merge. Manual import does not require manual execution of
every test. Historical owner imports and shutdown observations below remain evidence, not new
setup requirements. Existing scripts' limited capabilities are unchanged by this policy.

This is a test harness for the finished reserve graph, not a runner or production workflow.
Import the test JSON (automation permitted) into `factory-guard-test` only after T033 verification.
Existing US1 evidence is retained; real issue #1/PR #5 and queued #4 are not modified by this
harness. Do not import into production or use real GitHub/Gemini credentials.

## Source boundary and prepared artifact

- Runtime source: `factory/workflows/reserve.json`. All 20 source Code bodies remain unchanged
  except explicit unexpected-exception prefixes at **Prepare handoff** and **Check handoff
  receipt**. Existing source connections remain unchanged apart from replacing manual entry
  with the whitelisted test webhook. Native HTTP/Data Table/IF/Code nodes remain real n8n nodes.
- Every HTTP destination is fixed to **127.0.0.1:18766**, with authentication removed and no
  redirects/retries. Fixture headers identify case, native execution ID and source node.
  Issue/refinement URLs inside evidence bodies are synthetic input strings, never destinations.
- Source Schedule Trigger **Poll inactive** remains **disabled** during all manual cases.
  Enable it only for the final held-schedule check, with busy=true and no manual runs in flight.
- Source/build/checker: `build-reservation-bridge.cjs`, `reservation-fixture-server.cjs`,
  `check-reservation-bridge.cjs`, `run-reservation-bridge.py`, in this directory.
- Public review artifact: `factory/tests/reservation-bridge.json`, with table placeholders.
  Concrete isolated-test import artifact: `factory/local/us2/native-bridge/workflow.json`, using only
  the previously inspected isolated table ID. It has **no credential references or secrets**.
- Separate state/read/reset webhooks support explicit operator inspection between completed
  cases. The reset is never on a run/error/finally path. It compares singleton ID/key, busy and
  inspected execution ID, clears only busy and requires an operator reason. It is a disposable
  test fixture action, not automatic production recovery.

Prepare/check from repository root:

```bash
node factory/tests/check-reservation.cjs --native-fixtures
node factory/tests/build-reservation-bridge.cjs
node factory/tests/check-reservation-bridge.cjs
node factory/tests/build-reservation-bridge.cjs --check
```

The builder reads the existing ignored `factory/local/us2/import-readback.json` solely for
previously inspected table mapping. It never imports, activates or executes anything. Generated
synthetic VM contexts are ignored under `factory/local/us2/native-bridge/expression-fixtures.json`;
feed them to `check-reservation-native-expressions.cjs` in the approved installed n8n environment.
Local fixture/package checks and native parameter checks do not count as full native executions.

## Isolated test import/publication

1. Review the test-only source and generated JSON in the US2 PR, including the two exception
   prefixes, loopback-only destinations, disabled schedule and separate inspected-reset endpoint.
2. All existing test/production schedules must be inactive and previous executions complete.
   Preserve the known real Building reservation and queued Approved issue. Inspect the current
   shared row before any reset; an unknown hold stops setup.
3. Import (automation permitted) `factory/local/us2/native-bridge/workflow.json` as a **new** workflow named
   `TEST ONLY — Basic A US2 native fault bridge`. Do not overwrite reserve or refine.
4. All nine Data Table nodes must select the same existing isolated `factory_control_us1`
   table (source's seven plus fixture-state get and explicit fixture reset). Prepared mappings
   already select it. All 17 HTTP nodes must have Authentication=None and fixed loopback URLs.
   `Poll inactive` must remain disabled. Keep pinned data empty.
5. Save, then publish **only this isolated test bridge** so its private test webhooks register.
   Publication does not enable its disabled schedule. The assistant verifies imported source,
   mappings and disabled schedule before starting a whitelisted case.

## Native execution and assertions

The assistant installs only the fixture JS/config under `/tmp` in the isolated container,
listening on container loopback. Persistent fixture state is
`/tmp/basic-a-us2-fixture-state.json`; no credential/data volume is mounted into the fixture.
The runner executes explicitly, sequentially on NAS:

```bash
python3 /tmp/run-reservation-bridge.py --restart
```

| Case | Expected native observation |
|---|---|
| success | Lowest synthetic issue 101 reserved before launch, one exact handoff, second synthetic approval waits, busy releases |
| occupied / closed-building / nonowner-building / conflicting-building | All Building variants block; no-work releases |
| non-owner | No candidate; no-work releases |
| no-approval / wrong-approval / captured-edit | No reservation or handoff; failed execution holds busy |
| unexpected-before | Deliberate exception before any synthetic write; busy holds |
| unexpected-after | One acknowledged synthetic handoff before deliberate exception; Building persists and busy holds |
| partial-label | Fixture adds Building then returns 500; Approved+Building remain visible, busy holds, no auto repair |
| unknown-post | Fixture accepts exactly one handoff then drops response; busy and Building persist, no retry |
| restart-reservation | Observe persisted synthetic Building addition while the native HTTP response is pending; restart only factory-guard-test; partial labels and native busy row persist; no resumed side effects |
| held skip after every failure/restart | Whole-workflow webhook poll skips; exact guard row and fixture effects unchanged |

For each completed expected-failure case, the operator runner inspects the known fixture effects
and row, records the reason and calls the separate fixture reset before the next case. Unexpected
results stop the script with the hold preserved. The final in-flight restart hold is deliberately
**not reset**. The runner never imports/publishes workflows or calls real GitHub/provider APIs.
State webhooks queue behind the serialized main execution. During in-flight restart monitoring,
read the persisted fixture file outside n8n, require a new execution ID and a still-pending
request, then read the guard after restart. The runner's `--restart-only` stage supports running
only this remaining case after inspected completed regular cases. Readiness catches transient
OS/network startup errors; it never resets the guard or retries an interrupted native execution.

Restart may lack a completed node trace; retain row/fixture observations and native entity status
without claiming missing runData exists. n8n can reconstruct node statuses with artificial
recovered-event placeholders; distinguish that metadata from original node output payloads. Supported-export traces and source fingerprints are
collected by `collect-reservation-traces.py`; no SQL or instance encryption-key access is used.

## Final scheduled held check and shutdown

After successful suite completion with final busy=true, the fixture HTTP process is stopped by
the controlled container restart. The owner enables **Poll inactive**, saves/publishes the bridge,
and leaves manual cases stopped. Wait for a native 60-second scheduled execution. It must report
skipped_held before HTTP, preserving exact guard context and synthetic effects. Inspect/export
its mode, reached nodes and output. Owner then unpublishes the bridge, preserving final hold and
fixture files; do not clear busy or remove Building because time elapsed. If the guard unexpectedly
became idle, stop and inspect instead of enabling the schedule. Restore normal operation only
through the separately documented owner-controlled recovery process after schedules are drained.
