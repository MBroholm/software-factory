# US4 finished-workflow guard and recovery checks

These are T026/T027 test tools, not a runner or operational recovery mechanism. Verify T033
before use: only the designated n8n 2.48.8 instance `factory-guard-test`, its separate volume,
loopback 5679, typed singleton and no active/running/waiting workflows. `tracking-api.cjs`
reads the ignored local test API configuration and refuses operational ports/URLs. No API key
or credential value is embedded in a workflow or public result.

`us4-guard.cjs` packages three new isolated copies of the **finished** source graphs. Every source
Code body is identical. Schedules are disabled, HTTP is credential-free container loopback
18768, and Data Table IDs select only the verified test table (or a deliberate nonexistent ID
for G07/G09/G11/G13). Additional native Code adapters inject G06/08/09/10/12/16 outputs at the
actual next-node boundary; they do not modify the source validator. G14 adds a 30-second live
in-process delay after acquisition. There are no retries, error edges or finally resets.

The fixture HTTP service reuses `tracking-fixture-server.cjs`, with an explicit port restricted
to 18767/18768. Its `/repair` operator endpoint exists only on US4 port 18768 and requires the
expected known scenario/reason. It is never connected to workflow error paths. It operates only
on synthetic labels/comments; it cannot contact GitHub or the model.

The scripts deliberately preserve private mapped JSON, execution snapshots and effects under
ignored `factory/local/us4/`. Import refuses an existing local registry; inspect existing test
copies rather than duplicating them. The first import's Wait-node engine-generated `webhookId`
is the only allowed save-time metadata normalization. Source Code and all executed connections
are verified from actual execution snapshots, not just saved workflow names.

Use explicit commands only after inspection:

```bash
node factory/tests/us4-guard.cjs inspect
node factory/tests/us4-guard.cjs install
node factory/tests/us4-guard.cjs publish
node factory/tests/us4-guard.cjs case refine G08-empty
node factory/tests/us4-guard.cjs reset-known
node factory/tests/us4-guard.cjs unpublish
```

`case` runs the whole native graph, verifies its status/row/reached nodes, then tests every
finished graph against a resulting hold. `reset-known` is a separate operator action: it checks
the exact known completed failed execution, preserved row and drained state before a conditional
supported Data Table API update of busy only. Unknown/running holds stop. A case sequence uses
this inspected reset between independent fixtures; it never clears on an error/cleanup path.
Keep original story evidence for G02/G04/G05 and all ordinary early returns; run only missing
cases. Full helper suite is 17 guard cases per graph; do not repeat it without a reason.

`crash refine|reserve|track` restarts only `factory-guard-test` after confirming a new acquired
native execution is running. It records crashed status, persisted row and three unchanged held
polls. It terminates the test HTTP fixture process, so restarting that fixture is deliberate.
Do not run these commands against an operational instance or during other test work.

`us4-recovery.cjs start` verifies container/volume/port and starts the container-loopback fixture
with its existing state. `case unexpected-before|partial-label|unknown-post` preserves error
and held-skip evidence; pauses/unpublishes and drains all test copies; inspects exact effects;
records an explicit fixture repair; conditionally resets busy; publishes only the tracking copy
with schedules still disabled; requires registered webhook HTTP 200 and a **fresh** resumed
execution; verifies QA and one result marker; and unpublishes/drains. No blind failed POST replay.
A registration/assertion failure stops for inspection; do not advance to another case.

`us4-backup.cjs` requires every test workflow inactive/drained and busy false. It creates one
disposable synthetic Header Auth credential in the test instance and invokes `us4-backup.py`
over existing SSH with private API input. The remote helper stops only the test instance, copies
its complete volume and matching environment into a mode-0700 private backup, records hashes,
then starts the original instance unchanged. It restores into a **new** volume/container,
`factory_us4_restore_data` / `factory-us4-restore`, using the same image ID, `--network none`
and no published ports. It verifies every stopped file hash, workflow identity/inactivity,
exact control row, drain and a native loopback-only request using the backed-up disposable
credential. Historical GitHub/Gemini credentials remain encrypted/unused. The clone is stopped;
private backup and original volume remain intact. It refuses existing clone/volume names;
inspect a previous rehearsal rather than overwrite or delete it. No internal SQL is used.
The source test fixture process stops when its container stops; private logs/state remain.

Finally `collect-us4.cjs SOURCE_COMMIT` whitelists actual rows/statuses/node names/errors and
source fingerprints into `evidence/us4-guard-results.json`, including real held execution IDs.
Raw traces and backups are never published. Record actual failed attempts and limits in
`evidence/guard-validation.md` and `evidence/recovery-validation.md`.
