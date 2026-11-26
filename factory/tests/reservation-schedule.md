# T032 isolated scheduled reservation

Current policy (2026-11-26): imports, updates and execution in designated isolated dev/test
n8n may be automated after T033 boundary verification, using test data, scoped credentials and
designated test resources. No operational workflow replacement/activation or ordinary factory
tasks are allowed. Record tested source/imported revision and environment. Operational adoption
requires owner PR review and manual import of the matching reviewed JSON revision, renewed for
subsequent changes, before or after merge. Manual import does not require manual execution of
every test. Historical owner imports and shutdown observations below remain evidence, not new
setup requirements. Existing scripts' limited capabilities are unchanged by this policy.

This test copy preserves all 20 reserve Code bodies, existing source connections and the exact
60-second Schedule Trigger. Only HTTP destinations/authentication, table mapping, test notes and
separate operator state/reset endpoints differ. All HTTP goes to container loopback port 18766,
without credentials. Session 32001 uses the existing success fixture and persists across ticks.
No agent, real issue write, production activation or US3 behavior is involved.

Prepare/check from the repository root:

```bash
node factory/tests/build-reservation-schedule.cjs
node factory/tests/build-reservation-schedule.cjs --check
```

Default packaging uses table placeholders. For an import-ready copy, set up the isolated
test configuration described in [clean-checkout preparation](test-preparation.md), then run
`node factory/tests/build-reservation-schedule.cjs --mapped` and verify with the same
options plus `--check`. No historical mapped bridge or export is read.
Public review artifact: `factory/tests/reservation-schedule.json`.
Isolated test import artifact: `factory/local/us2/native-bridge/schedule-mapped.json`.
Review the source and generated JSON before importing as a NEW isolated workflow (automation permitted).
All nine Data Table nodes must reference the same existing isolated table. No credentials or
pinned data may be present. Keep every other workflow inactive and all manual mutators stopped.

Before publication, inspect the retained 1369/issue101 busy row and persisted fault fixture
against the recorded shutdown evidence. Preserve those observations/files. Any unknown state
stops setup. Owner-controlled pause/drain/inspection must precede any deliberate reset of that
known hold; elapsed time is not authorization. The observer never resets it.

Start the existing `reservation-fixture-server.cjs` in the isolated container with the reviewed
`fixtures.json`, a NEW `/tmp/basic-a-us2-schedule-state.json` persistence file and port 18766.
Do not overwrite `/tmp/basic-a-us2-fixture-state.json`. Verify the new state has no session 32001.
Publish only the new isolated schedule after import verification and deliberate fixture recovery.
Verify saved/active revision, all Code/connection fingerprints, HTTP/table mappings and schedule
before observing. Run `python3 /tmp/run-reservation-schedule.py` on NAS promptly after publication;
it reads the private state webhook and fixture only, never starts a workflow.

Require native mode=trigger traces showing: first tick reserves synthetic 101, posts exactly
one matching handoff, releases busy while Building persists; later tick sees 102 Approved but
does no write, returns no_work and releases busy. Compare the handoff metadata against the
approved fixture and verify full native Code/connection hashes against source. Observer output
alone does not prove native trigger mode or successful final completion.

Owner then unpublishes/drains. Verify all isolated workflows inactive, state route 404, final
row idle, exactly one Building/one queued Approved fixture, unchanged comments and one handoff.
Stop only the schedule fixture service, retaining its state and logs. Record actual IDs,
fingerprints, before/after state, failures/intervention and limits in manual-build-validation.md
and sanitized JSON. Reuse real issue #1/PR #5 evidence explicitly: these new HTTP effects are
synthetic and do not count as another real factory task. T032 remains unchecked until native
observations and shutdown are verified.
