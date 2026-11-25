# US2 manual-build validation

**Date**: 2026-11-25. **Status**: T015–T018 complete; T019 in progress. Real reservation/build evidence passes; native fault/interruption/scheduled-hold checks remain pending.
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
| Second approved issue | First Building blocks second regardless of owner/closed/conflicting state; ordinary busy release | PASS normal real second approval: #4 waits, native 1279; adversarial variants remain pending native fixtures |
| Repeated full polls | No new handoff, no second reservation, Building unchanged and no-work releases | PASS: native 1276; public labels/all comments unchanged |
| Restart with reservation and idle guard | Building survives restart; later polls cannot claim another task | PASS: isolated restart then native 1277/no-work, GitHub unchanged |
| Unexpected exception before/after effect | busy=true persists, Building/partial labels retained as applicable, subsequent schedule skips with identical context | UNRUN native; local exported graph PASS |
| Interrupted reservation between add/remove/post | Partial state stays visible with held guard; no automatic repair/retry or second claim | UNRUN native |
| Restart while busy | Neither guard nor reservation auto-clears; later schedule skips | UNRUN native |
| Manual build + real question/answer | Owner launch, actual answer/decision on issue, scope status/renewed approval if needed, issue-N linked result PR | PASS: issue-1/PR #5, decision 7170400632; owner review/merge remain pending |

T019 must remain unchecked until required observations exist. Existing US1 approval and guard
skeleton evidence do not substitute for completed reserve-path persistence/restart/live checks.
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

## Remaining native faults — prepared, not executed

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
