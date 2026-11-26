# US2 manual-build validation

Historical `factory/tests/check-guard-skeletons.cjs` commands in this record refer to the
then-current skeleton revision. That checker and T008 bridge tools are now in the
[T008 archive](../factory/tests/historical/t008/README.md); they are not current test commands.
Recorded outcomes below are unchanged.

**Date**: 2026-11-25. **Status**: T015–T019 complete for US2. Real reservation/build, native fault/interruption/restart, scheduled held-skip and owner shutdown checks pass.
Branch: `001-basic-a-factory-us2`. Source development is bootstrap work; the owner subsequently
manually imported the reviewed reserve/refine JSON and ran real task exercises. The source export
remains inactive with placeholders and no launcher; saved test workflows use private mappings.
The dated sections below record actual imports, executions, writes, restart and manual build.
No production activation, autonomous launch/merge or US3 tracking implementation is claimed.

## Reused evidence and source boundaries

Reuse [US1 validation](refinement-validation.md), including real issue
[1](https://github.com/MBroholm/software-factory/issues/1), latest refinement
[7161366810](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7161366810)
and explicit owner approval event **37246567614**, actor **202449424**, at
**2026-11-25T11:45:26Z**. These are historical US1 observations, not fresh approval/reservation
validation. The live workflow must reread current GitHub evidence before reserving.

US1 source file remains byte-identical, SHA-256
`ee3f6e782f72ec409d6e9a6cb02ca0f8b9a4b43eccbfad4dff0a9003ffe1ec38`.
Its native/live evidence is retained without repeating model calls. Reservation packages its
unchanged canonical-source, SHA-256, marker/history and pagination helpers, plus new pure
`factory/scripts/reservation-runtime.cjs` policy. The offline builder
`factory/scripts/build-reserve.cjs` uses the unchanged track skeleton as the common guard template;
track behavior is not implemented or changed. Rebuild/check from repository root.

Reserve export SHA-256:
`ea6760fb5787dd216418596d93c37be981079aca8cc20f9a7f5ec2cab88930b6`.
Owner accepted commit `ec5a2de` in [PR #3](https://github.com/MBroholm/software-factory/pull/3)
for isolated testing and manually imported it. Final mapped reserve workflow `EIF8Urpa0tCkd2DI`,
version `6c5cfd0e-8a3a-435b-9cf5-1ff1585fd410`, is source-matched by native execution Code/graph
fingerprints. Refine reimport `zcynhzDmEAapj2dT`, version `915ef856-75d2-40e8-8968-932636abcf5d`,
contains the reviewed pagination fix. Both remain unpublished. Full chronology follows.

## Actual checks

| Check | Observed result and limit |
|---|---|
| `node factory/scripts/build-reserve.cjs --check` | PASS: reproducible inactive export, source-maintained node notes and numbered stage layout |
| `node factory/tests/check-reservation.cjs --native-fixtures` | PASS: 36 local policy/exported-graph scenario groups. Actual exported Code and connections run with in-memory HTTP/Data Table stand-ins; no native persistence or live GitHub claim |
| Native n8n 2.48.8 VM parameter check | PASS: 140 checks, 74 synthetic parameter contexts plus pagination. Executed checker against installed packages in existing `factory-guard-test` container over owner-approved SSH; no imports, runtime credentials, HTTP calls, DB access or guard reset |
| Native checker first attempt | FAIL: harness supplied execution ID `test` where fixtures expected `reserve-test`. Corrected checker context, then reran successfully. No workflow fix needed |
| Additional scheduled-entry fixtures | The additional source contexts subsequently passed as part of the 252-check synthetic native bridge parameter run below; no native scheduled execution is implied |
| `node factory/scripts/build-refine.cjs --check` | PASS: US1 artifact matches existing reviewed sources |
| `node factory/tests/check-refinement.cjs` | PASS: 35 existing local scenario groups; prior US1 native/live evidence reused |
| `node factory/tests/check-guard-skeletons.cjs` | PASS: 25 remaining track skeleton scenarios; reserve now uses its dedicated story checker |
| `git diff --check` | PASS |

Local reserve coverage: owner approval ID/actor/time; no approval history/wrong actor/later removal;
latest unedited refinement with current captured source; missing/edited comments and changed title;
content digest and duplicate history; unrelated-label preservation; lowest eligible number;
closed/non-owner/conflicting Building blocks; PR baseline in handoff; duplicate attempt rejection;
manual and scheduled graph entry; idle/no-work/occupied-slot release; successful busy release with
Building persistent; pre-held row unchanged/no HTTP; missing row/failed acquisition prevents work;
unexpected failures before/after Building/remove/comment effects; held next poll; partial/error
pagination; no retries, automatic approval, launch, merge or import paths.

To prepare/check VM fixtures after further parameter changes:

```bash
node factory/tests/check-reservation.cjs --native-fixtures
```

This writes only ignored `factory/local/reservation-native-expression-fixtures.json`.
`factory/tests/check-reservation-native-expressions.cjs` reads that JSON on stdin and uses installed
n8n packages (default `/usr/local/lib/node_modules/n8n`, optional package-root argument). It explicitly
initializes VM evaluation, retaining the expression-engine lesson from US1. Run it only in the
approved environment; parameter evaluation is not a full-workflow execution.

## Concrete owner review/import handoff — T019

1. Review the US2 source/JSON in a PR and record the reviewed commit. Artifact:
   `factory/workflows/reserve.json`. The constitution requires reviewed JSON and **owner manual
   import**; the assistant must not import or activate it automatically.
2. Pause/drain all relevant schedules and inspect existing held rows before touching them.
   US1 evidence records deliberate isolated holds; elapsed time is not permission to clear them.
   Use [operations](../docs/operations.md) for any inspected owner recovery.
3. Owner manually imports the reviewed reserve JSON into isolation, retaining `active=false`.
   Select the SAME isolated `factory_control` table in all seven Data Table nodes. Map all
   GitHub HTTP nodes to the saved Authorization header credential privately. No Gemini credential
   belongs to reserve. Keep redirects/retries off and no pinned data. Never execute individual
   mutation nodes, retry/resume failed executions or run alongside mutating schedules.
4. Record imported workflow ID, saved revision/version UUID, n8n version, reviewed commit/export
   digest and mapping-only differences. Verify source Code/connections/parameters against the
   reviewed artifact. Separately inspect the active refine workflow revision and compare against
   its reviewed source; historical US1 evidence alone does not verify today's active deployment.
5. Execute only the scenarios below in isolation or paused/drained live operation, following
   [quickstart section 6](../specs/001-basic-a-factory/quickstart.md#6-end-to-end-and-edge-case-validation)
   and the existing [guard fault protocol](../factory/tests/guard-scenarios.md). Record execution
   IDs, node traces, before/after singleton rows, issue/PR/comment URLs and owner interventions.
   Synthetic fault copies must be explicitly identified; never present them as real task runs.
6. Owner manually launches the approved real task using [manual coding](../docs/manual-coding.md).
   Obtain one real result-changing session question, answer and sanitized issue decision summary,
   issue-specific branch and linked PR with actual checks/unchecked criteria. Do not invent a
   question or post comments without owner authorization. US3 review/tracking is separate.

| Required T019 exercise | Expected observation | Actual result |
|---|---|---|
| Reviewed owner import + refine revision | Recorded reviewed commits/imported revisions and mapping verification | PASS: ec5a2de acceptance/manual import; reserve 6c5cfd0e; refine reimport 915ef856, details below |
| Approved current owner task, laptop idle | Building added before launch, Approved removed, exact handoff, busy=false; no process launched | PASS: real issue #1, native 1275 and public handoff 7169659105 |
| Second approved issue | First Building blocks second regardless of owner/closed/conflicting state; ordinary busy release | PASS: real #4 waits at 1279; native closed/non-owner/conflicting Building variants 1291/1295/1299 |
| Repeated full polls | No new handoff, no second reservation, Building unchanged and no-work releases | PASS: native 1276; public labels/all comments unchanged |
| Restart with reservation and idle guard | Building survives restart; later polls cannot claim another task | PASS: isolated restart then native 1277/no-work, GitHub unchanged |
| Unexpected exception before/after effect | busy=true persists, Building/partial labels retained as applicable, subsequent schedule skips with identical context | PASS: native faults/held webhook skips 1331/1339 and 1334/1342; scheduled held skips 1376/1378 |
| Interrupted reservation between add/remove/post | Partial state stays visible with held guard; no automatic repair/retry or second claim | PASS: 1347/1350 partial label case; controlled in-flight restart 1369, metadata limits below |
| Restart while busy | Neither guard nor reservation auto-clears; later schedule skips | PASS: restart/held webhook 1369/1372 and native scheduled held skips 1376/1378 |
| Manual build + real question/answer | Owner launch, actual answer/decision on issue, scope status/renewed approval if needed, issue-N linked result PR | PASS: issue-1/PR #5, decision 7170400632; owner review/merge remain pending |

T019 is complete after the source-matched real/native observations and verified owner shutdown
recorded below. Existing US1 evidence was reused; it was not substituted for US2 runtime checks.
No US3/T020+ work, result tracking, owner acceptance decision or completed Basic A loop is claimed.

## Hooks

`.specify/extensions.yml` is absent at pre-implementation and post-implementation inspection;
no hooks are registered to dispatch.

## Owner acceptance and first import inspection — 2026-11-25

Owner explicitly accepted commit `ec5a2de` in PR #3 for isolated testing and reported manual
import completed. Supported CLI workflow export over approved SSH then identified the imported
workflow in `factory-guard-test`:

- Workflow ID `EIF8Urpa0tCkd2DI`, name `Basic A reserve — US2 INACTIVE`.
- Saved version `83f257ce-aec2-4c5b-900b-4114963019a1`; saved at
  `2026-11-25T17:09:01.758Z`; active=false, activeVersionId=null; 53 nodes.
- All 20 Code bodies and the connection graph match the accepted source. n8n omits default
  parameters when saving; the first raw parameter comparison therefore reported differences.
  Full normalized parameter verification remains pending after mappings, not a claimed failure
  of the Code/source comparison. Saved HTTP timeout remains 30000 ms.
- All seven Data Table nodes still reference `OWNER_SELECT_ISOLATED_CONTROL_TABLE`.
  All 17 HTTP nodes lack selected credential references. No execution is authorized by this
  incomplete mapping state; no workflow was run or guard reset during inspection.
- All 19 saved workflows in the isolated instance are inactive. Existing US1 bounded-retry
  workflow `zcynhzDmEAapj2dT` is inactive, saved version
  `bee7bc2a-371a-4737-a21c-4ce2f11d8ce4`; connections match the current refinement source.
  Its table reference is `IgWCIu94ieyHQRHS` (`factory_control_us1` in prior US1 evidence).
- Separate production-container supported export reported no saved workflows. There is no
  active production refine workflow to verify there; do not infer current-source deployment.
- Browser access host was unavailable. Inspection used supported workflow export only; raw
  workflow exports remain ignored under `factory/local/us2/`, not public evidence.

Next owner step: select the same isolated table in all seven US2 Data Table nodes, then select
existing GitHub header-auth credentials in HTTP nodes and save without publishing/executing.
Inspect existing held row/context before any reset or test. T019 remains unchecked.

Owner reported mappings saved. Read-only supported export confirmed saved version
`983bf0b4-bebd-4513-865c-3ff68fede32e` at `2026-11-25T17:25:04.512Z`, inactive.
All seven US2 Data Table nodes now reference the existing isolated table `IgWCIu94ieyHQRHS`.
Zero of 17 HTTP nodes have credential mappings yet. The existing US1 workflow uses saved
credential name `Basic A GitHub Authorization`; only its reference/name was inspected, not
its secret. No execution, publication or control-row change occurred.

Owner reported GitHub mappings complete. Supported read-only export confirmed US2 saved
version `6c5cfd0e-8a3a-435b-9cf5-1ff1585fd410`, saved at `2026-11-25T17:28:08.433Z`.
All 17 HTTP nodes reference the same existing GitHub header-auth credential as US1; no
credential secrets were read/decrypted. Workflow and all isolated workflows remain inactive.
Remaining source parameter differences are omitted n8n defaults (including nested condition
and pagination defaults) plus the intended table/credential mappings; Code/connections match.
Control-row inspection is the next pre-execution step. No execution or reset occurred.

Owner reported pre-test control row: busy=false, execution_id=1274, issue_number=null,
started_at=`2026-11-25T16:28:22.354Z`. No reset is needed or performed. Fresh read-only
GitHub API discovery found one open owner task (#1) with sole state Approved and no Building
issue. The packaged approval validator passed against current paginated events/comments:
approval 37246567614, actor 202449424, latest refinement 7161366810 unchanged, matching
captured source digest. No prior handoff exists for that approval. Owner was guided to execute
the complete inactive imported US2 workflow once for initial delayed-launch reservation.
Actual reservation result remains pending; these preflight reads are not execution evidence.


## First real reservation — execution 1275

Owner supplied whole-workflow completion output: status=released, outcome=success;
control row id=1/key=global, busy=false, execution_id=1275, issue_number=1,
started_at=`2026-11-25T17:32:42.529Z`, updatedAt=`2026-11-25T17:32:52.658Z`.
The owner has not been instructed to launch Codex yet: this is the delayed-launch reservation
exercise, not a completed build. Native execution trace collection remains pending.

Fresh read-only GitHub API verification confirms issue #1 is open with sole label Building.
Building addition event **37280535181** at `2026-11-25T17:32:47Z` precedes Approved removal
event **37280537537** at `2026-11-25T17:32:48Z`, both actor 202449424.
Exactly one marked handoff exists:
[7169659105](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7169659105),
created/updated `2026-11-25T17:32:51Z`. Its approval event, exact refinement ID/URL/digests,
source, branch `issue-1` and empty existing-result PR baseline match current source policy and
read-only PR discovery. The packaged approval validator passes for the resulting Building state.
Issue has seven comments total. Thus real GitHub reservation/comment effects are verified and
owner output confirms successful busy release; persistence across restart, repeated poll,
second approved issue and native fault cases remain separate pending checks. No agent launch
or second task claim is inferred.

## Repeated poll — execution 1276 and native trace confirmation

Owner supplied released/no_work output, busy=false, execution_id=1276, issue_number=null,
started_at=`2026-11-25T17:36:52.793Z`, updatedAt=`2026-11-25T17:36:53.370Z`.
Read-only GitHub verification found sole Building label and all seven comments unchanged,
including exactly one handoff. No Codex launch has been requested yet.

Sanitized supported-export native traces for **1275/1276** are preserved in
[reservation-native-results.json](reservation-native-results.json). Both are successful manual
whole-workflow executions. Every Code-body hash and connection hash matches accepted reserve
source. Execution 1275 records Building POST 200, Approved DELETE 200 and handoff POST 201,
followed by final validation and persisted release/readback. Execution 1276 records acquisition,
slot discovery, No work, release/readback and no GitHub writes. This confirms native finished
reserve-path success/no-work wiring, beyond the earlier stand-in tests. No credentials were
decrypted; the collector decrypts execution entities using a new disposable export key and
removes only its own temporary artifacts. No internal SQL, imports, state resets or execution
retries were used.

With completed execution 1276 and all isolated workflows inactive, the assistant restarted
only `factory-guard-test` for the planned T019 persistence exercise. The production container
and GitHub issue were untouched. Post-restart control-row inspection and the next whole-workflow
poll remain pending; restart alone is not a passing persistence/no-replay result.

## Post-restart reservation poll — execution 1277

Owner supplied released/no_work output with busy=false, execution_id=1277, issue_number=null,
started_at=`2026-11-25T17:41:44.833Z`, updatedAt=`2026-11-25T17:41:45.479Z`.
The isolated container restart was verified running with start time
`2026-11-25T17:39:07.125213972Z`. Supported-export native trace 1277 is successful, matches all
source Code/connection hashes, records acquired no-work release/readback and zero GitHub writes.
Fresh GitHub API reads confirm Building and every one of the seven issue comments unchanged,
with exactly one original handoff. This passes the idle-guard restart/reservation persistence
exercise; a crash with busy=true and interrupted label/comment outcomes remain pending.
The owner did not separately supply the intermediate pre-poll row; do not claim its exact
fields were independently observed immediately after restart.

Before introducing another task, current-source deployment verification found the existing
inactive refine workflow retains all 31 current Code bodies and matching connections but
omits executeOnce=true on all 23 HTTP nodes. This is the pre-pagination-fix saved version;
normal defaults do not supply executeOnce=true. T019's revision verification therefore does
not pass for that saved copy yet. No model call or new task was launched through it.

Prepared ignored owner-import artifact `factory/local/us2/refine-reviewed-mapped.json`, SHA-256
`d76e02671e0d17d8c2f14dda3cea0dd01c1f48032c4574599a5d1c23a260337d`.
It uses unchanged reviewed `factory/workflows/refine.json` (source hash above), preserving
existing isolated table mapping and all saved GitHub/Gemini credential references, with an
isolated descriptive name and active=false. No secrets decrypted, source/runtime policy changes
or automatic import/activation. Owner manual reimport/save and verification remain pending.

## Refinement revision verification after owner reimport

Owner reported save complete. Supported read-only export verifies existing workflow
`zcynhzDmEAapj2dT`, now named `Basic A refine — US1 reviewed pagination fix test`, saved version
`915ef856-75d2-40e8-8968-932636abcf5d` at `2026-11-25T17:45:08.185Z`, inactive.
All 31 Code bodies and connections match reviewed refinement source; every one of 23 HTTP
nodes now retains executeOnce=true, and all existing saved credential and isolated table
references are preserved. All isolated workflows remain inactive. This resolves the observed
saved pagination-revision mismatch without new source changes, model calls or activation.
The separate production instance has no saved workflows; there is no active refine deployment
there to claim as verified. Subsequent tests use this verified inactive isolated copy.

## Second task intake — issue #4

Owner created [issue #4](https://github.com/MBroholm/software-factory/issues/4), “Document
pre-build Git checks”, and supplied its number. Fresh API reads verify open, authored by
owner 202449424, sole Ideas label and zero comments. Body requests only a Before coding
README section describing read-only `git status --short`/`git worktree list`, with no service,
credential, configuration or workflow changes. Issue #1 still has sole Building label.
Owner is guided to confirm the shared row remains idle and execute the verified inactive
refine workflow once; refinement and subsequent explicit approval are not yet observed.

## Second real task refinement — execution 1278

Owner supplied whole-workflow released/success output for issue #4, control busy=false,
execution_id=1278, issue_number=4, started_at=`2026-11-25T17:49:56.787Z`,
updatedAt=`2026-11-25T17:50:10.744Z`. Counted input 577; schema allowance 456 plus
768 output/256 overhead reserves = 2057/4096; one successful HTTP 200 generation attempt.
Fresh GitHub API reads confirm #4 has sole Ready for approval label and exactly one valid,
unedited refinement [7170065286](https://github.com/MBroholm/software-factory/issues/4#issuecomment-7170065286).
Its source digest matches current title/body and empty captured comment set. The refinement
preserves the requested documentation-only scope, Before coding section, exact two Git commands
and read-only explanation; no service/credential/configuration/workflow change is authorized.
Issue #1 remains Building. Owner approval of #4 and the subsequent blocked reserve poll are
pending; this model output is not approval. Native trace collection for 1278 remains pending.

## Second explicit approval blocked by first reservation — execution 1279

Owner supplied released/no_work output: busy=false, execution_id=1279, issue_number=null,
started_at=`2026-11-25T17:53:45.296Z`, updatedAt=`2026-11-25T17:53:45.886Z`.
Fresh API reads verify issue #4 has sole Approved label with current owner approval event
**37282443851**, actor **202449424**, at `2026-11-25T17:52:54Z`, following unchanged refinement
7170065286. The packaged approval validator passes against current issue/source/comments/events.
Issue #1 retains sole Building label. Its seven comments, including original handoff, are
unchanged; #4 retains exactly one refinement comment and has no handoff. Whole-repository
selection returns no candidate because the Building slot is occupied, despite valid queued work.
Native execution 1279 is successful, matches all source Code/connection hashes, acquires/releases
the persisted guard through the no-work path and records zero GitHub writes. Results are in
`reservation-native-results.json`. Thus the real second-approved-task blocking case passes.
No Codex launch, second reservation, state reset or automatic activation has occurred.
Next owner-only step is manual Codex launch for #1 on issue-1; real session decision/linked PR
and controlled unexpected-failure/interruption/held-restart cases remain pending for T019.


## Real manual build result — issue #1 / PR #5

Owner manually launched a separate Codex session in the isolated issue-1 worktree and supplied
its result [PR #5](https://github.com/MBroholm/software-factory/pull/5). Fresh GitHub API reads and
read-only local branch inspection confirm same-repository head **issue-1**, base **main**, head
**d0101c4011a1b1a2f29a2b3bc17a7828008a348f**, open/unmerged, with exactly one changed file:
`factory/README.md` (+15 lines). No service, credential, configuration or workflow changes.
PR body explicitly includes `Refs #1`, exact approved refinement/handoff links, actual checks,
the initial SSH config-permission failure and isolated parse fallback, and unrun live SSH/browser
checks. Its four acceptance boxes remain unchecked for owner review; no merge/acceptance is inferred.

The new session asked which existing editor instance/endpoint to document. Owner answered standard
Ubuntu-host Basic A editor **127.0.0.1:5678**, placeholder SSH target `user@server`, local forwarded
port 5678 and existing loopback-only binding. Owner explicitly confirmed unchanged scope.
[Decision comment 7170400632](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7170400632)
records the question, answer, resulting example and scope status. The missing manual-coding guide
in the origin/main checkout was explained by the unmerged US2 branch; the task did not add it or
expand scope. No real question/answer was fabricated as a synthetic test.

Independent read-only checks pass: `git diff origin/main...HEAD --check`, clean issue-1 worktree,
one-file diff, dedicated SSH access section, exact approved command/URL, privacy guidance and
balanced Markdown fences. Source PR's reported `ssh -F /dev/null -G` parse was not repeated;
its explicit environment limitation and unrun live connection remain visible. This passes T019's
manual launch/branch/question-summary/linked-result evidence, not US3 tracking or owner acceptance.

## Native faults — initial preparation before owner import

Prepared `factory/tests/reservation-bridge.json` and source/check/runner described in
[reservation-bridge.md](../factory/tests/reservation-bridge.md). The concrete ignored import copy
is `factory/local/us2/native-bridge/workflow.json`, reusing only the inspected isolated table ID.
Source reserve JSON and runtime are unchanged. All source Code/connections are preserved except
two explicit unexpected-exception prefixes and replacement entry/operator fixture paths. Native
HTTP requests are redirected to fixed container loopback 127.0.0.1:18766, with no credentials,
redirects or retries. Source schedule is initially disabled. The separate operator fixture reset
is never connected to failure or finally paths and preserves unknown/interrupted holds.

Actual pre-import checks:
- Local bridge/package/fixture checks PASS: 14 fixture initializations, source Code/graph
  preservation, approval failures, full synthetic reservation, lost POST response, partial-label
  side effect and persisted fixture reload. Initial sandbox EPERM on loopback bind was resolved
  by approved local-network test execution; no application change was needed.
- Native n8n 2.48.8 VM parameter/pagination checks PASS: **252 checks**, comprising **186 contexts**
  (102 existing source contexts + 84 fixture-header contexts), plus 66 pagination checks. No native
  workflow import, guard changes or HTTP requests occurred in this parameter-only run. Later sticky
  note clarification changes no execution parameters/connections, so this result remains applicable.
- Generator consistency and JS/Python syntax checks PASS. Native fault suite, in-flight restart
  and scheduled held-skip checks are **UNRUN**, pending owner review/manual import/publication of
  only the isolated test bridge. The final failure hold is intentionally preserved after testing.

## Test bridge owner import verified — before native faults

Owner reported the new bridge saved after the review/import handoff for commit 030c7d1.
Supported read-only export identifies `bHUN2AuZtUysarZI`, name
`TEST ONLY — Basic A US2 native fault bridge`, saved version
`ae08106e-6b30-4f3b-8310-c0cfe593c890` at `2026-11-25T18:21:16.907Z`, inactive.
All source/fixture Code bodies and connections exactly match the reviewed mapped bridge;
all nine Data Table nodes select isolated `IgWCIu94ieyHQRHS`, and all 17 HTTP nodes retain
fixed loopback URLs, no credentials/authentication and executeOnce=true. Poll inactive is
disabled. All saved isolated workflows are inactive. No workflow was run or row changed.

With approved SSH, assistant staged the reviewed fixture JS/config in container-only
`/tmp/basic-a-us2-native/` and the explicit operator runner at NAS
`/tmp/run-reservation-bridge.py`. Setup refuses existing fixture state/different files, does not
mount production data, and starts only the credential-free loopback fixture on 127.0.0.1:18766.
Health check confirms synthetic=true and accepted reserve source hash. Zero workflow runs;
owner publication of only this bridge (schedule still disabled), followed by guard inspection,
remains required before native tests. No automatic import/publication/activation occurred.


## Native fault suite and controlled interruption — results

Owner published bridge `bHUN2AuZtUysarZI` at accepted saved/active version
`ae08106e-6b30-4f3b-8310-c0cfe593c890`. Export confirmed it was the sole active isolated
workflow and Poll inactive remained disabled. Preflight read verified exact idle singleton
context 1279, staged operator-runner hash and loopback fixture source hash before any case.

**13 regular native cases PASS**, with **7 subsequent held-skip polls** and **7 explicitly
recorded inspected fixture resets between completed expected-failure cases**. No failure path
released busy and no automatic reset/replay occurred. Native error statuses are expected test
outcomes, not successful application executions. See
[reservation-fault-results.json](reservation-fault-results.json) and source-match traces in
[reservation-native-results.json](reservation-native-results.json).

| Case | Primary execution | Native outcome / observed effect | Held skip |
|---|---|---|---|
| success | 1283 | success, busy=false; synthetic 101 Building, one handoff; 102 remains Approved | — |
| occupied | 1287 | success/no_work, busy=false; zero posts | — |
| closed Building | 1291 | success/no_work, busy=false; zero posts | — |
| non-owner Building | 1295 | success/no_work, busy=false; zero posts | — |
| conflicting Building | 1299 | success/no_work, busy=false; zero posts | — |
| non-owner candidate | 1303 | success/no_work, busy=false; zero posts | — |
| missing approval | 1307 | expected error at Validate approval; busy=true; zero posts | 1310 |
| wrong approval actor | 1315 | expected error at Validate approval; busy=true; zero posts | 1318 |
| captured source edited | 1323 | expected error at Validate approval; busy=true; zero posts | 1326 |
| unexpected before writes | 1331 | injected error at Prepare handoff; busy=true; zero posts | 1334 |
| unexpected after side effect | 1339 | injected error after one handoff; Building/busy retained | 1342 |
| partial label acknowledgement | 1347 | expected error after synthetic Building addition; Approved+Building/busy retained | 1350 |
| lost POST response | 1355 | one accepted synthetic handoff, HTTP response lost; Building/busy retained; zero retry | 1358 |

Each held skip preserved the entire control row (including updatedAt) and fixture effects exactly,
with no HTTP work or release node. All 27 collected source/bridge execution snapshots match
respective reviewed Code and connection fingerprints. Export data collection succeeded; the local
summary initially assumed every failed/crashed record had a completion field and raised KeyError.
That display-only assumption was corrected; sanitized records already existed and no workflow
was rerun because of it. Collector now labels recovered event metadata explicitly.

### Restart monitoring failures retained, then persistence verified

The first restart-monitor attempt **1363** did not restart the container. The operator used a
state webhook that queued behind the serialized main execution; the delayed synthetic reservation
therefore completed normally after 25 seconds and released busy. This was a runner coordination
failure, **not** a passing restart test or a failure to retain a guard after an actual interruption.
Read-only inspection verified idle context 1363 and its one completed synthetic handoff. The
operator runner was corrected using the existing US1 lesson: observe persisted fixture effects
outside n8n, select a new execution ID, assert the request is still pending, then restart and read
the guard afterward. A restart-only stage preserves the completed regular-case evidence.

Corrected case **1369** observed the accepted synthetic Building addition while native Add Building
was in flight, with Approved+Building and zero handoff posts, then explicitly restarted only
`factory-guard-test`. The first readiness read hit ConnectionResetError during startup; the
operator catch was broadened to transient OS/network startup errors. No second restart or guard
reset occurred. A subsequent read-only verification and held poll completed the observation.

**PASS restart retention**: persisted singleton id=1/key=global, busy=true,
execution_id=1369, issue_number=101, started_at=`2026-11-25T18:30:27.005Z`,
updatedAt=`2026-11-25T18:30:27.104Z`. The synthetic issue retains Approved+Building, zero posts,
and its exact pre-restart fixture effects. Native **1372** succeeds as skipped_held and preserves
all row fields/effects. No resumed write, extra handoff or second claim occurred.

Native entity 1369 is **crashed**. n8n recovered node-event metadata through **Add Building**,
marked that node crashed, and replaced outputs with `isArtificialRecoveredEventItem` placeholders;
this is not a complete original payload trace. Code/connection snapshot hashes still match.
The generic native crash text mentions a possible memory issue, but the observed cause here was
our deliberate container restart; no OOM is inferred. Persistence/effect assertions rely on the
operator's saved fixture snapshot, post-restart row and full held-skip trace, with this limitation
visible. The pre-restart busy row was not separately read through the queued webhook.

Fresh real GitHub reads confirm #1 still Building, #4 still Approved, and all comments on both
issues unchanged from before the synthetic suite. No real GitHub/provider calls, imports,
production changes or service/credential modifications occurred in these cases. The fixture
server stopped with the isolated restart; its persisted files and busy hold are retained.

**Remaining**: owner enables only the bridge's Poll inactive node, saves/publishes for a native
scheduled held-skip observation, then unpublishes the bridge after verification. T019 remains
unchecked until that planned check and shutdown are complete. Do not reset busy=1369.

## Native scheduled held skip — PASS, shutdown pending

Owner enabled Poll inactive and published the test bridge. Read-only workflow export confirms
saved/active version `770bb2b7-3285-4a52-b074-3b867f2aac9b`, saved at
`2026-11-25T18:39:10.020Z`, with enabled 60-second interval. Code and connections remain the
reviewed bridge's; it is the sole active isolated workflow. No source workflow was activated.

Native executions **1376** and **1378** are successful **mode=trigger**, both reporting
skipped_held. Each reaches exactly Poll inactive → Read control → Validate entry → Already held
→ Report existing hold. Neither acquires/releases the flag or reaches HTTP. Full persisted
control context (including createdAt/updatedAt) matches the final restart hold 1369, with the
runtime-only guard_action=held annotation excluded from the physical row comparison. The
fixture process is stopped and all persisted synthetic effects remain unchanged. Source/bridge
fingerprint verification now covers **29** native execution records; raw sanitized results and
the fault/schedule summary are in the linked JSON evidence files.

Execution snapshots omit a version UUID (workflowVersion=null). The verifier's initial assumption
that this field would be populated was corrected without rerunning anything: provenance uses the
explicit saved/active version readback, matching complete Code/connection hashes and actual
enabled 60-second schedule metadata in each snapshot. This limitation is retained in the summary.

All required T019 behavioral observations now pass. Final owner step is **unpublish the test
bridge**, followed by read-only verification that no isolated workflows remain active and the
known busy hold/effects are preserved. Until that shutdown is observed, T019 remains unchecked.
No reset, automatic production activation, tracking implementation or merge is authorized by this
scheduled test result. Real #1 remains Building and #4 remains Approved.


## Owner shutdown and T019 closeout — PASS

Owner reported the bridge unpublished. Supported workflow export confirms bridge
`bHUN2AuZtUysarZI` inactive, activeVersionId=null, saved version
`770bb2b7-3285-4a52-b074-3b867f2aac9b`; **all 20 isolated workflows are inactive**.
Its registered test state webhook now returns **404**. Real #1 remains Building, #4 Approved;
all real issue comments are unchanged and PR #5 remains open/unmerged for owner review.

Since the bridge's read-only webhook is no longer registered, the final physical row was
independently inspected through n8n's **supported encrypted Data Table export**, with execution
history excluded. Only Data Table files were decrypted in container memory using a disposable
export key; no direct SQL, instance encryption key, credential decryption or runtime reset.
The first helper attempt failed because Docker stdin was closed; keeping stdin open corrected
that readback helper without any state change. Its temporary exports/key were removed in both
attempts. Target registry ID/name and all five column types were verified before interpreting
the raw SQLite Boolean busy=1 as logical true; metadata UTC strings were normalized to the
previously observed API representation for comparison.

Exactly one row in `factory_control_us1` is unchanged: id=1, key=global, busy=true,
execution_id=1369, issue_number=101, started_at=`2026-11-25T18:30:27.005Z`,
createdAt=`2026-11-25T08:55:42.755Z`, updatedAt=`2026-11-25T18:30:27.104Z`.
The complete persisted synthetic fixture state has unchanged canonical SHA-256
`0a8d9e2931c118e10cc5f5544cba523929dc15b145af85088824b5ad8c8ea1c6`.
The deliberately held row and fixture files remain as failure evidence; the fixture HTTP process
was stopped by the controlled restart and was not restarted. No cleanup reset or resumed
execution was performed. Final shutdown assertions are included in `reservation-fault-results.json`.

**T019 complete**: reviewed owner import and refine revision, real delayed-launch reservation,
second approved task waiting, repeated/no-work release, idle and busy restart behavior, unexpected
before/after effects and interrupted/uncertain writes, native scheduled skips, and a real owner-
launched issue branch/question/decision/linked PR are recorded with actual checks and limitations.
Operator monitoring/readiness/formatter/readback issues are retained above; none required changing
the reviewed reserve runtime or production JSON. Final generator/syntax/JSON/link/diff checks pass.
US1 source/evidence remain unchanged; US3+ tasks and full Basic A/course acceptance remain pending.
Production activation, owner PR acceptance/merge and any later recovery are separate owner actions.
No SpecKit extension registry exists; no post-implementation hooks are registered.


## T032 scheduled-reservation checkpoint — prepared, native execution unrun

Convergence identified one US2 validation gap: real reservation 1275 and occupied polls
1276/1277/1279 used manual entry; native trigger-mode 1376/1378 prove held skips only.
Existing real/native observations remain valid within those limits.

Prepared `factory/tests/build-reservation-schedule.cjs`, its public schedule JSON/manifest,
`run-reservation-schedule.py` and the review/import protocol in
`factory/tests/reservation-schedule.md`. Source reserve SHA-256 remains
`ea6760fb5787dd216418596d93c37be981079aca8cc20f9a7f5ec2cab88930b6`.
Packaging assertions verify all 20 source Code bodies and existing non-manual connections,
exact 60-second trigger, no credentials, loopback-only HTTP and inactive export.
Session 32001 persists across ticks using the existing success fixture; its separate state
file must preserve the historical fault fixture. The read-only observer never starts a
workflow or resets the guard.

Actual checks: schedule build and --check PASS; unchanged reserve generator --check PASS;
Python observer compilation PASS; git diff --check PASS. These are offline checks, not
native n8n execution or scheduled acceptance evidence. No remote runtime action, import,
publication, guard reset or real issue change was performed for this checkpoint.

Next gate: owner reviews and manually imports
`factory/local/us2/native-bridge/schedule-mapped.json` as a new isolated workflow, initially
unpublished. Verify the saved source/mappings and inspect the retained busy=1369/issue101
hold before any deliberate isolated recovery. Then prepare the fixture, publish only this
schedule, observe successful reservation plus occupied-slot waiting, collect native trigger
traces and verify owner unpublication/drain/final state. T032 remains unchecked.
No extension registry exists; no implementation hooks are registered.


### T032 owner import verified; fixture ready, publication pending

Owner reported manual import. Supported workflow export identifies schedule copy
`RByomITdtfRHZ74Z`, saved version `06387d3e-9ca6-40ec-bf43-3b990ee8ebad`, inactive;
all 21 isolated workflows are inactive. Full node parameter comparison passes after restoring
omitted n8n defaults (Code mode, Data Table resource/filter defaults, HTTP GET/no-auth and
pagination defaults). All source Code bodies and connections match; nine table mappings and
17 loopback HTTP nodes have no credentials. The initial overly strict comparison stopped at
omitted Code mode; normalization resolved it without workflow changes or execution.

Supported encrypted Data Table export verifies the exact historical busy=1369/issue101 row,
including timestamps, still retained in factory_control_us1. Old bridge state route is 404;
historical fixture canonical hash remains
`0a8d9e2931c118e10cc5f5544cba523929dc15b145af85088824b5ad8c8ea1c6`.
Only Data Table files were decrypted with a disposable export key; temporary export/key removed.
The initial sandbox SSH attempt failed on local system SSH configuration permissions; the
approved external SSH invocation succeeded.

Prepared/started a separate loopback-only schedule fixture on container port 18766 with
`/tmp/basic-a-us2-schedule-state.json`; readiness/source hash pass and inspect returns empty.
Historical fixture file and busy row were not changed. No scheduled exercise has run.
Owner publication of this copy alone is next; held ticks may skip safely before the deliberate
inspected reset. Native success/occupied observations and shutdown remain pending; T032 unchecked.


### T032 native scheduled paths PASS — owner shutdown pending

Owner published RByomITdtfRHZ74Z, active/saved version
06387d3e-9ca6-40ec-bf43-3b990ee8ebad; supported export verifies it is the sole active
isolated workflow with matching source Code/connections and credential-free loopback HTTP.
Initial trigger 1382 skipped the retained 1369 hold unchanged. Operator then rechecked the
exact known row and empty new fixture, recorded the recovery reason, and deliberately reset
only busy through the separate inspected fixture endpoint. Historical fault state was preserved.

Native mode=trigger **1411**, 2026-11-25T20:38:23Z, succeeded: synthetic 101 Approved ->
Building, one handoff, all three writes acknowledged, final busy=false while Building persists.
Native mode=trigger **1439**, 20:39:23Z, succeeded with released/no_work: synthetic 102 remains
Approved, zero writes, unchanged comments/events/labels and exactly one handoff overall.
Read-only observer recorded both actual row snapshots and persisted synthetic effects.
All 20 source Code hashes and complete connection hashes match the reviewed test artifact;
both enabled schedules retain the exact 60-second rule. Native snapshots add empty notice to
Schedule parameters; the verifier initially rejected that harmless default, then normalized it.
No workflow fix or rerun was needed. Snapshot version UUID remains unavailable; saved/active
version readback plus complete Code/connection hashes provide provenance.

See `reservation-scheduled-results.json`. These HTTP effects are synthetic, not a second real
run. They close the scheduled-entry gap when combined with real manual-entry reservation 1275,
real occupied polls 1276/1277/1279 and owner-launched issue #1 / decision 7170400632 / PR #5.
No actual agent launch, GitHub write, production action or US3 behavior occurred in this test.
Owner must now unpublish/drain the schedule; final inactive/404/idle/fixture verification and
fixture-service shutdown are pending. T032 remains unchecked until those are observed.


### T032 owner shutdown verified — complete

Owner reported unpublication. Supported export verifies all 21 isolated workflows inactive;
RByomITdtfRHZ74Z activeVersionId=null, saved version unchanged. State webhook returns 404.
Supported encrypted Data Table export verifies one mapped global row, busy=false (typed SQLite
0), execution 1442, issue_number=null, started_at=2026-11-25T20:41:23.573Z,
updatedAt=2026-11-25 20:41:23.625. Two additional read-only fixture polls occurred after the
required occupied poll; no additional reservation, label/event change or comment was produced.
Exactly one handoff persists, synthetic 101 remains Building and 102 Approved. Historical
fault fixture hash still matches the retained 1369 evidence. Only the exact disposable T032
fixture process was stopped; both old and new persisted fixture files remain.

Schedule build --check, unchanged reserve generator --check, observer Python syntax and
whitespace checks pass. No runtime fix was required. T032 is complete: native scheduled
success/occupied observations augment, rather than replace, the real issue #1/manual-build
and PR #5 evidence. This does not claim owner PR acceptance, a complete Basic A loop or a
new real task run. No production activation, agent auto-launch, merge or US3 work occurred.
No .specify/extensions.yml exists; no post-implementation hooks are registered.


## T034 owner-decision evidence update — 2026-11-26

Fresh read-only GitHub inspection confirms that the owner `MBroholm` (ID `202449424`)
merged [PR #5](https://github.com/MBroholm/software-factory/pull/5) at
`2026-11-25T19:04:05Z`, accepting head `d0101c4011a1b1a2f29a2b3bc17a7828008a348f`
as merge commit `bb474bda2544fcc8c19695460c1f2ad1dea6c055`. All four PR acceptance boxes
are checked. Earlier pending/open observations remain historical; the actual owner merge
supplies the previously unrecorded acceptance decision. See the
[T034 review closeout](review-validation.md#t034-real-task-owner-review-closeout--2026-11-26)
for approval/linkage/branch/content/secret/permission checks and explicit failed/unrun limits.
Issue #1 remains open/Building; this update does not claim a real tracking execution,
operational workflow adoption or another real task run.
