# US3 result tracking validation — 2026-11-26

T020–T023 are complete, and T033 passed for credential-free US3 fixture testing. Native
validation below supersedes the initial source-only checkpoint. No operational adoption, real
factory-task processing, GitHub issue/comment write or merge occurred.

Initial source-only checkpoint (historical; native closeout follows below):

- `factory/workflows/track.json` SHA-256: `d739916089873846b8f7a61aee71edfd0b7bee411cb727f3aefec54ff63b64b8`.
- `factory/tests/tracking-test.json` SHA-256: `bc3ed25bc8929dda514e27a518fef8954906b77e098e73131bfc5547f1372dc0`.
- Imported revision/execution IDs: none. Do not treat source hashes as imported evidence.

## Actual local checks

`node factory/tests/check-tracking.cjs`: 22 exported-graph/policy groups passed. The harness
executes the actual packaged Code, IF parameters, Data Table filters/updates and HTTP expressions
with synthetic responses; it does not emulate the native expression VM or prove main-engine
Data Table behavior. Cases cover QA, repeat suppression, authoritative merge detail, owner issue
closure, unmerged closure, no work, reapproval precedence, captured input/session distinctions,
ambiguous PRs, stale baselines/new heads/reopen, acquisition failure, pagination errors and
before/after-effect exceptions with retained hold and later skip.

`node factory/tests/check-reservation.cjs`: 36 groups passed after extracting the unchanged
T007 template to `factory/scripts/guard-template.json`. `build-reserve.cjs --check` confirms
reserve.json is unchanged. Refinement and tracking generator consistency checks pass.
`build-tracking-test.cjs --check` verifies unchanged source Code/connections, fixed loopback
HTTP, no credentials and disabled test schedule. Fixture-server syntax check passes; remote
service startup and end-to-end fixture HTTP checks remain unrun. `git diff --check` passes.

The generated source has operational notes and numbered stage notes. HTTP reads paginate with
bounded page counts and reject incomplete/error responses; detailed PR reads verify merge.
No write retries, automatic approval/merge, failure-release edge or automatic recovery is added.
Tracking rotates candidates by UTC minute so persistent unchanged QA does not starve other issues.
A changed accepted head without a new approved handoff conservatively requires owner resolution.

## T033 partial read-only environment inspection

SSH container inventory confirmed both instances run pinned n8n 2.48.8. Docker inspection showed:

| Instance | Volume at /home/node/.n8n | Published port |
|---|---|---|
| factory-guard-test | factory_guard_test_data | 127.0.0.1:5679 |
| software-factory-basic-a-n8n-1 | software-factory-basic-a_n8n_data | 127.0.0.1:5678 |

A supported CLI export **inside the test container only** wrote private
`/tmp/us3-before-workflows.json`. Metadata inspection showed all 21 isolated workflows inactive,
with historical tables `I1JBIePgy75Ecnlp`/`8fCAvfPK5z11XeRJ` and story table
`IgWCIu94ieyHQRHS`. Existing real-API test copies still reference header credentials, so they
must remain inactive and are not authorized test targets for US3. No credential values were
exported or read. New US3 test copy has no credentials; every HTTP destination is fixed container
loopback port 18767 and must use the synthetic fixture service, never a GitHub proxy.

Current table contents, active/queued execution drain, unused saved-credential scopes and native
authenticated access are not yet verified. Historical idle-at-1442 evidence is not a fresh row
observation. Browser inventory returned “browser access host is unavailable”. Existing
[guard evidence](guard-validation.md) documents standalone CLI Data Table context failure;
no CLI run was substituted for main-engine acceptance. User was asked to restore signed-in
isolated browser access or supply an approved test API access method. Unknown boundaries stop
native import/execution as required by T033; this is an access/boundary gap, not an owner manual
test-import approval requirement.

## Initial pending acceptance (superseded by native closeout)

All T023 native cases in [tracking-test.md](../factory/tests/tracking-test.md) remain UNRUN,
including native repeated polls, rework, merged/closed results, failures and scheduled entry.
Use the prepared credential-free test copy only after T033 passes. Record tested source/imported
revision, instance, mappings, actual traces/control rows/effects and shutdown state. Do not
count synthetic fixtures as additional real issue/PR runs. Operational adoption separately
requires owner PR review and manual import of the matching reviewed revision.


## T023 native closeout — 2026-11-26

Tested operational source: commit `db20bc67ff459e69abe3a02ab57581f667fc23b2`,
`track.json` SHA-256 `d739916089873846b8f7a61aee71edfd0b7bee411cb727f3aefec54ff63b64b8`.
The source is unchanged from that commit. Test helpers/package are worktree changes on that
base. Exact public/mapped package hashes, imported references, native traces and control rows
are summarized in [review-native-results.json](review-native-results.json).

T033's fresh check passed before the new import: known isolated n8n 2.48.8, separate volume and
loopback port, typed idle singleton, all 21 historical test workflows inactive and no running
or waiting executions. The previously missing API key is now available in ignored local
`factory/local/test.env`; the adapter authenticates directly to verified test port 5679.
No browser connection was needed and no credential value was exported. GitHub/Gemini saved
credentials are unused: every test HTTP node uses fixed synthetic container loopback 18767.

A NEW isolated workflow `3SmlqLqhRDB5S5e9` was imported automatically and read back inactive.
Initial version: `84c351e0-0e3e-41dc-a58b-81da72721b3c`.
Mapped package SHA-256: `426d85d6ce0af0bd440902647dd76c10094c21b7cf058f06d937bbfff3d2972c`.
All 30 operational Code bodies and existing source connections match; only test mapping,
HTTP/authentication, name/notes, disabled schedule and separate private operator webhooks differ.
The public test artifact uses a placeholder rather than an instance-specific table ID.
The test copy uses `IgWCIu94ieyHQRHS`; all workflow executions report
`usedPrivateCredentials=false`. Source Code and full mapped connections were checked against
actual execution snapshots, not just the saved workflow.

| Native case | Execution | Observed result |
|---|---|---|
| Open result | 1445 | Building -> Your QA, one exact approval/PR/head marker, idle release |
| Repeated QA poll | 1448 | No additional marker/label writes, idle release |
| Closed unmerged PR, open issue | 1452 | Your QA, never Done |
| No result / no candidate | 1456 / 1460 | No writes, idle release |
| Session/in-scope rework summary | 1464 | Captured digest remains valid, QA succeeds |
| New handoff, unchanged baseline | 1468 | Old result ignored, Building retained, idle release |
| Fresh rework head / new PR | 1472 / 1476 | New approval 10 associates PR 7/head b… / PR 8; old attempt retained |
| New Approved state | 1480 | Old result cannot overwrite approval, no writes |
| Actual pagination | 1484 | Issues/comments/events/PRs each return two native pages, first 100 items |
| Verified merged current result | 1488 | Done with detailed PR evidence, idle release |
| Owner-closed issue | 1492 | Done without requiring PR/handoff |
| Multiple current PRs | 1496 | Failed held before writes; later poll preserves row/effects |
| Edited captured source | 1503 | Failed held; later poll preserves row/effects |
| Unchanged reopened baseline | 1510 | Ambiguity failed held; later poll preserves row/effects |
| Unexpected pre-write HTTP failure | 1517 | Failed held with no result write; later poll skips |
| Successful POST, lost valid receipt | 1524 | Marker effect retained, no retry/release; later poll skips |
| Label addition, lost valid receipt | 1531 | Partial state retained, no removal/release; later poll skips |

Nineteen primary executions cover 18 distinct scenarios and one unchanged repeat. Six expected
error executions plus their held-skip polls passed the assertions. Between independent cases,
the operator adapter inspected each known completed synthetic error and drained executions,
recorded the reason, then explicitly reset only busy through a separate fixture endpoint.
Six deliberate resets include preparation after 1531; there is no finally cleanup, automatic
error-path reset or unknown-hold recovery. Before/after rows and reasons remain in the results.
Historical US1/US2 fixtures and earlier failure evidence were preserved.

### Original scheduled-entry acceptance and observer correction

The same isolated workflow was unpublished, its unchanged source 60-second Schedule Trigger
enabled, then imported/read back as version `53ab3ae8-7cb7-488f-abe4-cbbae7164f62` and published
alone. Native mode=trigger 1538 moved the fresh synthetic result to QA and released busy;
1542 observed unchanged QA, no additional POST/label writes, one marker and idle release.
Both actual execution versions, trigger interval, Code and connections match the scheduled
readback. These supplement webhook cases, not real task evidence.

The first observer attempt rejected an extra empty `parameters.notice` inserted by n8n in the
Schedule Trigger execution snapshot, after native 1538 had already succeeded. The schedule was
paused, the harmless empty-field difference explicitly normalized, and the original successful
trace retained. An inspection attempt while unpublished correctly received 404; this was an
adapter sequencing error, not a workflow pass/failure. The same scheduled revision was
republished to observe 1542. No operational workflow or source behavior change was required.
Version IDs come from actual `execution.workflowVersionId`, not the workflow snapshot (which
does not include a versionId). Collector checks preserve this distinction.

### Shutdown and limits

At `2026-11-26T11:08:33.399Z`, all 22 isolated workflows were inactive, running=0, waiting=0,
and the US3 inspection webhook returned 404. The singleton row was busy=false, execution 1542,
issue 1, start `2026-11-26T11:07:45.876Z`. The synthetic fixture service was stopped and a
container-loopback connection check returned ECONNREFUSED; its state/logs remain preserved.
Only the US3 fixture PID was stopped. Operational containers/workflows and real issues/PRs
were untouched. These fixture runs do not count toward the five genuine task runs.

T023 is complete. T026's broader finished-workflow guard matrix (including remaining release,
acquisition and crash/restart checks) and other US4 tasks remain pending. Operational adoption
still requires owner PR review and manual matching-revision import; no operational activation
or full Basic A acceptance is claimed. Existing local checks and source-only limits above are
retained as historical checkpoints rather than evidence of a native failure.
