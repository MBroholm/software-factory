# US3 native validation

Source: `factory/workflows/track.json`; generator: `factory/scripts/build-track.cjs`.
T033 boundary verification and actual T023 results are in
[evidence/review-validation.md](../../evidence/review-validation.md) and
[evidence/acceptance.md](../../evidence/acceptance.md). These tests use the main n8n engine,
not the standalone CLI Data Table context.

## Offline preparation

```bash
node factory/tests/check-tracking.cjs --fixtures
node factory/tests/tracking-cases.cjs
node factory/scripts/build-track.cjs --check
node factory/tests/build-tracking-test.cjs
node factory/tests/build-tracking-test.cjs --mapped
node factory/tests/build-tracking-test.cjs --check
node factory/tests/build-tracking-test.cjs --mapped --check
```

The scenario generator reads the ignored seed fixture produced above and writes
`factory/local/us3/scenarios.json`. The 18 named cases are
synthetic, including fresh rework/new head/new PR, unchanged baseline, reopen ambiguity,
owner closure, unmerged closure, pagination and injected failures. The fixture server only
serves these records and never proxies to GitHub.

The versioned test copy retains a table placeholder. `--mapped` reads
`FACTORY_CONTROL_TABLE_ID` from `factory/local/test.env` and writes the ignored mapped copy.
All production Code bodies and existing connections remain identical. Differences are fixed
container-loopback HTTP 18767 with NO credentials, mapped test table, test name/notes,
disabled schedule and separate private run/fixture/inspection/explicit-reset webhook paths.
The operator paths are never connected to work/error cleanup. They are test tools, not a
factory recovery framework. Never import these copies into operational n8n.

## Native sequence

After verifying container identity, separate volume/port, correct typed singleton, no other
active workflow and no running/waiting executions:

```bash
node factory/tests/tracking-api.cjs inspect
python3 factory/tests/deploy-tracking-fixture.py start
node factory/tests/tracking-api.cjs import
node factory/tests/tracking-api.cjs publish
node factory/tests/run-tracking-native.cjs case open-result
node factory/tests/run-tracking-native.cjs repeat open-result
node factory/tests/run-tracking-native.cjs suite
```

The API adapter loads the test n8n key privately and refuses destinations other than verified
loopback test port 5679. No API key enters JSON. It creates a NEW registered test workflow;
subsequent mutations target that recorded ID only. Existing workflow IDs are not replaced.
The deployment tool checks the isolated image/port/volume and refuses to overwrite fixture state.
A second run needs deliberate new private registration/state paths or inspection, not blind retry.

The runner executes one case at a time, checks native traces and Code/connection fingerprints,
inspects actual control/fixture effects and stops on any assertion failure. Each expected
failure must leave busy true; a later webhook poll must preserve the row/effects with no HTTP.
Before the next independent scenario, the runner explicitly inspects the known completed
synthetic error and drained executions, records a reason, then calls the separate fixture reset.
No finally cleanup or unknown-hold reset is allowed. Six such deliberate resets occur when
running the suite followed by scheduled preparation; the last suite failure otherwise stays held.

Native scheduled acceptance uses the exact original 60-second Schedule Trigger:

```bash
node factory/tests/run-tracking-native.cjs prepare-schedule
node factory/tests/tracking-api.cjs unpublish
node factory/tests/tracking-api.cjs schedule
node factory/tests/tracking-api.cjs publish
node factory/tests/run-tracking-native.cjs observe-schedule
node factory/tests/run-tracking-native.cjs collect-schedule
node factory/tests/tracking-api.cjs unpublish
node factory/tests/tracking-api.cjs shutdown-check
python3 factory/tests/deploy-tracking-fixture.py stop
node factory/tests/collect-tracking-evidence.cjs
```

Prepare while the test copy's schedule is still disabled. During scheduled observation, only
read operations run; no manual work entry or fixture mutation. Require two native mode=trigger
successes: QA transition with one marker, then unchanged poll with no additional writes. The
observer deadline does not auto-unpublish on failure: inspect and stop the test schedule explicitly.
After unpublishing verify zero active/running/waiting workflows and test routes return 404;
stop only the matching loopback fixture PID, preserving state/logs. Record revision/hash,
execution IDs, node traces, actual row/effects, interventions and limitations. Fixture runs do
not count as genuine issue/PR runs. Operational adoption still requires owner PR review/manual
matching-revision import. Broad completed-workflow guard/restart coverage remains T026.

## No-work arrival regression

`check-tracking.cjs` covers a PR arriving after a read-only snapshot and a merge arriving after
unchanged QA: release this poll without writes and process the change on the next poll. Planned
writes retain strict Recheck/Final validation. `tracking-cases.cjs` adds `arriving-result`; its
synthetic loopback server returns the empty list once, then exposes the PR to subsequent reads.

After fresh T033 verification, prepare `--fixtures`, cases and `build-tracking-test.cjs --mapped`
as above. Run `node factory/tests/run-tracking-race.cjs` only after starting the fixture service
on the verified test container loopback 18767, using fresh private fixture/state paths. It creates
a separately named credential-free test copy with disabled schedules and a unique webhook path,
verifies actual Code/connection fingerprints, tests arrival/next-poll/unchanged and unknown-POST
hold/later skip, then unpublishes/drains. It refuses an existing run registry and **never resets
busy automatically**. Inspect a deliberate completed fixture hold and reconcile it explicitly
before resetting only that test row; preserve its marker and traces, then stop only this fixture
process. See `evidence/tracking-race-validation.md` for the executed run and remaining operational
owner import/recovery steps. Production must never be targeted by this runner.
