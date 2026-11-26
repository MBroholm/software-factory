# US3 result tracking validation — 2026-11-26

**Subsequent tracking fix, 2026-11-26:** the [no-work race record](tracking-race-validation.md)
documents production execution 133, the revised tracking source hash and focused local/native
checks. Earlier T023 results below remain evidence for their recorded source revision; the owner has subsequently imported the fix and its version/mappings were verified read-only.
Owner recovery/publication and real QA/Done are subsequently verified in that record, including
Done trigger execution 191 and public label/merge timestamps.

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


## T034 real-task owner review closeout — 2026-11-26

**Complete.** Fresh read-only GitHub REST observations at approximately
`2026-11-26T13:47:29Z` establish an existing owner acceptance decision for the genuine
[issue #1](https://github.com/MBroholm/software-factory/issues/1) /
[PR #5](https://github.com/MBroholm/software-factory/pull/5) manual build.
The earlier local pending-review statements above and in the US2 record are historical.
The convergence finding used those older statements without checking current GitHub state;
no additional owner decision or new real run was necessary.

**Owner decision reference:** PR #5 reports `merged=true`, `merged_by.login=MBroholm`,
`merged_by.id=202449424`, `merged_at=2026-11-25T19:04:05Z`, and merge commit
`bb474bda2544fcc8c19695460c1f2ad1dea6c055`. The accepted head is
`d0101c4011a1b1a2f29a2b3bc17a7828008a348f`. The owner's actual merge is the explicit
acceptance decision; the reviews endpoint contains no formal PR review submissions.
Do not infer a separate formal review or undocumented owner testing from the merge.

| Review gate | Evidence observed and assessment |
|---|---|
| Explicit task approval | Owner event `37246567614`, actor `202449424`, after unedited refinement `7161366810`; current packaged approval validator passes against the live issue/comments/events and captured source digest. |
| Issue linkage | PR body contains `Refs #1`, exact refinement and handoff links; handoff `7169659105` records the same approval, refinement and source. |
| Branch isolation | Same-repository `issue-1` head, `main` base, accepted head above; GitHub files endpoint and local committed diff show only `factory/README.md`, +15/-0. |
| Acceptance evidence | All four PR acceptance boxes are now checked. Read-only content assertions pass for the SSH access section, exact placeholder command/URL, privacy text and balanced fences. The PR heading still says “left unchecked for review”; the actual boxes are checked. |
| Secret exclusion | Manual inspection of the complete added patch finds only `user@server` placeholders and loopback addresses; targeted token/private-key pattern screen passes. This is a check of the changed patch, not a repository-wide secret audit. |
| Workflow JSON/permissions | No workflows, services, credentials, configuration or permission files change; no operational import is needed for this documentation-only result. |
| Questions and scope | [Decision 7170400632](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7170400632) preserves the real session question, owner-selected endpoint/command and explicit unchanged-scope answer. See [US2 real manual build](manual-build-validation.md#real-manual-build-result--issue-1--pr-5). |

**Checks actually performed for T034:** on the local Fedora development workspace, read-only
GitHub REST reads of the PR, changed files, reviews, PR comments, issue, comments, approval
history, head check runs and commit statuses; local `git show` at the accepted head and
`git diff a47222a47d6e15edf0fccfee2cb296434418263f...d0101c4011a1b1a2f29a2b3bc17a7828008a348f --check`
(PASS); Node assertions for the gates above (PASS). GitHub reports zero check runs and zero
commit statuses (`pending` aggregate with no statuses); this is not a CI pass.

**Retained failures/unrun checks:** the original PR records an SSH configuration-permission
failure and successful `ssh -F /dev/null -G` parse fallback. That parse is reused as reported,
not rerun here. Live SSH/browser connectivity and controlled failure tests remain unrun for
this result; acceptance checks establish documentation content, not live connectivity.
An initial T034 Python wrapper could not reach GitHub from the sandbox; direct approved
`gh api` reads succeeded. A Node child-process wrapper reported `spawnSync git EPERM`;
standalone read-only `git show` followed by file-based Node checks succeeded. Neither wrapper
failure changed source, GitHub or runtime state.

**Limits and scope:** this closes SC-002's real manual build-to-owner-decision evidence gap
and supplies the US3/AC2 review evidence. The real issue is still open with `Building` and
no result marker was present in the observed comments. No current tracking execution or
real QA/Done transition is claimed: US3 behavior remains supported by the separately recorded
native/scheduled fixtures. Those fixtures are reused without rerunning unchanged suites and
are not counted as additional real tasks. No issue/PR comment, label, merge, workflow import,
execution or operational adoption was performed in T034. US4, final acceptance, five-run
project evaluation and operational owner review/manual import remain separate.
