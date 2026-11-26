# Guard validation — T005–T008

Historical `factory/tests/check-guard-skeletons.cjs` commands in this record refer to the
then-current skeleton revision. That checker and T008 bridge tools are now in the
[T008 archive](../factory/tests/historical/t008/README.md); they are not current test commands.
Recorded outcomes below are unchanged.

Date: 2026-11-24. Branch: `001-basic-a-factory`. Local implementation based on
`9db03a7b34b8dcd06e6029b7b5f1bd68f307e900` with the listed uncommitted additions. **Native guard checks now pass across all three paths: 57 primary checks and 73 held skips.
Six original-schedule checks also pass; all 11 isolated workflows are now unpublished. See
the current evidence and shutdown record below.** No schedules, production state, credentials, server deployment or labels changed.
T001–T004/model evaluation was not repeated. T009+ was not implemented.

## Current native validation — assistant-operated, 2026-11-24

Owner manually imported/published the reviewed isolated bridge:
`0ITfSwx2Yb69qfX5`, version `2c36bf8c-6531-4ec4-bc77-4402ba3b8d83`.
Export inspection confirms 83 expected nodes, no credentials or unexpected node types, and
all 43 Code bodies match the prepared source (SHA-256 of sorted name/code pairs:
`5d8f293f44d0f5ebbc8f9cbdf505c618fbb416c6eef97dcdf2070ffc1d5bf7c3`).
Fixed table IDs match the owner's two isolated tables. The main n8n engine—not standalone CLI
or an in-memory stand-in—ran these tests over SSH-local webhooks.

[Sanitized native checks and node traces](guard-bridge-results.json) record **57 primary checks,
73 held-skip checks, six original-schedule checks, and 69 explicit operator fixture operations**, all expected outcomes observed.
Errors intentionally injected by tests are preserved as errors, not relabelled successful
executions. Native metadata records **three crashed executions** for the deliberate in-flight
container-restart cases. No code/permission change or actual issue/model operation was performed.

| Case | refine | reserve | track | Actual result |
|---|---|---|---|---|
| G01/G02 no-work and synthetic acknowledged success | PASS | PASS | PASS | Verified release and native final completion |
| G03 held entry, issue 101 and null | PASS | PASS | PASS | No acquisition/release; row/effects unchanged |
| G04 exception before effect | PASS (owner run) | PASS (owner run) | PASS (owner run, corrected identity) | Existing manual-import native results preserved |
| G05 exception after native effect insert | PASS: 157 | PASS: 42 | PASS: 352 | Insert succeeded before boundary error; busy retained; repeated held requests add no effect |
| G06 missing, duplicate global, extra non-global, wrong key, invalid issue | PASS | PASS | PASS | Validate entry error, no acquire/work, fixture preserved until explicit repair |
| G07 unavailable acquisition | PASS | PASS | PASS | Acquire error; idle row/effects unchanged; work never reached |
| G08 missing acquisition receipt | PASS | PASS | PASS | Receipt validator error; acquired busy retained |
| G09 unavailable acquired reread | PASS | PASS | PASS | Read error; no work, busy retained |
| G10 invalid completion | PASS | PASS | PASS | Completion validator error; no release |
| G11 failed release update | PASS | PASS | PASS | Native update error; busy retained |
| G12 lost acknowledgement after release committed | PASS | PASS | PASS | Native error without completion report; physical row idle, inspected before continuing |
| G13 unavailable released reread | PASS | PASS | PASS | Native read error without completion report; physical row idle, inspected before continuing |
| G14 acquired execution interrupted by container restart | PASS: 533 | PASS: 546 | PASS: 559 | Interrupted HTTP response; persisted hold; execution metadata crashed; all paths later skip |
| G15 later polls against failures | PASS | PASS | PASS | 73 combined skip assertions; no context/effect changes |
| G16 release ownership mismatch | PASS | PASS | PASS | Ownership validator error; release never reached |

The inherited owner-test hold was execution 27 with one G05-refine effect. Before the first
explicit test reset, all three bridge paths skipped it unchanged. The operator then deliberately
prepared each fixture only after recording/inspecting the previous result. No automatic reset,
retry, finally cleanup or production mutation was added. Row deletion/recreation was limited to
G06's disposable isolated fixture through supported Data Table nodes. Effects are preserved:
G05-refine (owner), G05-reserve-42, G05-refine-157, G05-track-352.

Tests use the real native copies of all three source guard paths; original manually imported
workflows retain the earlier owner evidence. G08/G12 inject acknowledgement faults at actual
next-node boundaries rather than claiming a real database transport failure. Separate supplemental
payload-mismatch/empty-receipt variants and UI cancellation are not claimed; hard in-flight
restart is verified. Completed-story coverage remains T014/T019/T023/T026.

A supported private entity export provided native node traces. A disposable export key, unrelated
to instance secrets, decrypted only execution files in memory; only whitelisted sanitized fields
were retained. Account/credential records and instance keys were not read or published. Temporary
archives and the export-only key were removed after extraction. Private operational JSONL logs
stay ignored under factory/local/guard-validation. No SQL against n8n internals was used.


### Original scheduled paths and final shutdown

Each already owner-imported original was published alone in isolation, observed through its
unchanged 60-second schedule, then unpublished and drained before the next original. Native
execution traces confirm **trigger mode**, the expected entry, successful completion/held exit,
and absence of acquisition/release on held polls. No new JSON was imported by the assistant.

| Original | Scheduled no-work execution | Scheduled held execution | Result |
|---|---|---|---|
| refine | 608 | 623 (preserved hold 608) | PASS |
| reserve | 661 | 676 (preserved hold 661) | PASS |
| track | 714 | 729 (preserved hold 714) | PASS |

Shutdown verification: all **11** isolated workflows have active=false, including bridge
0ITfSwx2Yb69qfX5; its published state route returns **404**, while /healthz returns **200**.
Final row: id=1, key=global, busy=true, execution_id="714", issue_number=null,
started_at=`2026-11-24T12:58:47.418Z`, createdAt=`2026-11-24T12:42:52.827Z`,
updatedAt=`2026-11-24T12:58:47.957Z`. Four effect rows remain. The held state is the deliberate
scheduled-entry fixture, not an unreported production failure. All exports/temporary keys were
removed; sanitized results and ignored private operator logs are retained.

T008 is complete for primary skeleton guard cases, including owner-manual imports, actual
native exceptions before/after persistent effects, acquisition/release failures, existing/failure
holds, restarts and original scheduled entries. Specific additional payload subvariants and
direct UI cancellation remain explicitly unrun; no blanket exhaustive-variation pass is claimed.
They remain validation inputs for T026 on completed workflows. Story contracts remain pending
T014/T019/T023; T009+ has not been started. No blocking failure was observed in primary skeleton
coverage. This does not complete the whole Phase 2 foundation or authorize production activation.

Imported current revision IDs and prepared file/code hashes are recorded here. Native execution
exports do not expose versionId in the retained workflow snapshot, so the per-execution version
field is null; it is not invented from the current version or claimed as historical proof.
No commit/push/PR/production import was performed during this validation.

The initial local-only baseline and owner-run observations below are retained as history; this
section supersedes their UNRUN statuses for the primary cases listed here.

## Initial implementation and owner gate — historical baseline

- T005: exact isolated Data Tables provisioning instructions are in
  [operations](../docs/operations.md#t005--isolated-control-row-provisioning). Owner provisioning
  of the actual singleton row and real node output are now confirmed below; T005 is complete.
- T006: [guard scenarios](../factory/tests/guard-scenarios.md) define setup, fault points,
  assertions, cleanup and future lifecycle/refinement/handoff fixtures. Complete as a test
  specification; no fixture expectation is presented as a real workflow result.
- T007: inactive `refine`, `reserve`, `track` guard skeletons implemented. Same guarded entry,
  update receipt + reread acquisition verification, acknowledged completion/no-work release,
  receipt + reread release verification. Existing holds have a separate unchanged exit.
  Errors stop; no error/cleanup release path, retry, expiry, upsert or remote work.
- T008: **in progress; most isolated engine cases and revision evidence remain pending**. The
  constitution requires owner manual import even for bootstrap JSON; no assistant/API/CLI
  import was performed. The isolated table ID and refine no-work output are supplied below; imported workflow
  IDs/revisions and executed fault/restart cases are not yet supplied. Do not activate production or claim the foundation gate passed.

The skeletons intentionally contain `OWNER_SELECT_ISOLATED_CONTROL_TABLE` in each Data Table
node. Owner must map every node to the same isolated table ID after manual import. Success in
a synthetic boundary is not a refinement, reservation or tracking story success.

## Local checks actually run

| Check | Result | Limit |
|---|---|---|
| SpecKit prerequisites | PASS: feature directory and tasks resolved | Readiness metadata only |
| Requirements checklist | PASS: 16 checked, 0 unchecked | Requirements quality, not implementation acceptance |
| Prior work / branch inspection | Clean initial tree on 001-basic-a-factory; T001–T004 already checked | Existing completed work preserved |
| Ignore-file verification | Existing Git/Docker exclusions cover current secrets, runtime data and used tooling | No setup/ignore changes needed for JSON/Node checks |
| `node --check factory/tests/check-guard-skeletons.cjs` | PASS | Syntax only |
| `node factory/tests/check-guard-skeletons.cjs` | PASS: **75 local scenarios**, all three exported graphs | Code nodes and exported routes exercised with an in-memory table stand-in; **not n8n engine validation** |
| `git diff --check` | PASS | Whitespace check only |
| Pinned Data Table node source inspection | Parameter names, 1.1 node version, row mapping/filter shapes checked against n8n 2.48.8 | Not an import or runtime compatibility pass |
| Pre/post extension hooks | No `.specify/extensions.yml`; none registered | No hooks dispatched |

The local check reads the committed-form JSON directly; it follows exported edges and runs the
embedded Code bodies. It checks inactive/no-pinned-data/no-credentials/no-retries/error-stop
boundaries, successful manual/schedule entry, held context including null issue, missing/duplicate/
malformed rows, acquisition failure, unexpected exceptions, synthetic post-effect failure,
missing acquisition confirmation, invalid completion, ownership loss, failed release and
post-release uncertainty. Its persistence/filter/trigger behavior is a deliberately small
stand-in and does not establish native n8n operation, durability, server permissions or restart
behavior. Native success/no-work/error routing tests cannot be replaced by these checks.

## Reviewed artifact candidates

These are current local file hashes, **not owner-reviewed or imported revisions**. Record the
reviewed Git revision after review; no commit/push/import was made by this implementation.

| File | SHA-256 |
|---|---|
| `factory/workflows/refine.json` | `827ee269d717e41e252c2b599b48bde97c32dda780449c0f99b27608dbce731e` |
| `factory/workflows/reserve.json` | `91390fb588fa82332b37b8ed211b612c0a9ae31589979a7b9e7e16f02be90ec4` |
| `factory/workflows/track.json` | `aae6801096ef03ac1af061f1f942c5c20cce80192e0284384ad528ba3226fb3d` |

## Early owner-run observations — historical partial-status snapshot

| Required evidence | refine | reserve | track |
|---|---|---|---|
| Owner review and isolated manual import, mapped table ID / imported revision | Owner confirms import/mapping; workflow ID/revision pending | Owner-run imported path; workflow ID/revision pending | Owner-run imported path; workflow ID/revision pending |
| G01 no-work and G02 acknowledged synthetic success, acquired/after row snapshots | G01 PASS (execution 4); G02 synthetic success PASS (execution 9); acquisition snapshots pending | G01 PASS (execution 10); G02 synthetic success PASS (execution 12) | G01 PASS (execution 11); G02 synthetic success PASS (execution 13) |
| G03 existing hold unchanged, null-issue variant | PASS for supplied held output/null issue; non-null variant and independent row refresh pending | UNRUN | UNRUN |
| G04 unexpected pre-effect / G05 post-effect failure, failed execution and held row | G04 PASS from owner error/busy execution 6; G05 PASS: post-write exception 22, one effect row, busy retained; full row pending | G04 PASS: owner reports boundary error/hold 18; G05 UNRUN | G04 PASS: boundary error/hold 14, owner corrected workflow identity; G05 UNRUN |
| G06 malformed/missing/duplicate row and G07–G09 failed/unconfirmed acquisition | UNRUN | UNRUN | UNRUN |
| G10 invalid/error completion; G11 failed release; G12/G13 uncertain release | UNRUN | UNRUN | UNRUN |
| G14 persisted crash/restart/abort with busy set | PASS: restart with existing G04 hold, later skip; in-flight crash/abort variants UNRUN | UNRUN | UNRUN |
| G15 later executions skip failed hold and G16 ownership mismatch | G15 PASS: skips refine hold 6, track hold 14 and reserve hold 18; G16 UNRUN | G15 PASS: skips track hold 14 and reserve hold 18; G16 UNRUN | G15 PASS: skips track hold 14 and reserve hold 18; G16 UNRUN |
| One isolated scheduled no-work/held poll, then deactivate/drain | UNRUN | UNRUN | UNRUN |

Owner provisioning and refine G01 before/final output are recorded below. Exact n8n version,
imported revision, acquisition snapshot, fault/skipped runs, cleanup and restart results remain pending. Append observations using the
per-run record in the test guide; retain failures rather than replacing this table with a blanket
pass. A lost release acknowledgement may leave a physically idle row: record the real state and
pause/inspect; do not assert the busy flag is certainly true after the update committed.

Full refinement, handoff and result contract tests remain pending T014/T019/T023; completed
workflow guard coverage remains T026. T008 skeleton results alone cannot close those tasks.

## Owner setup update — 2026-11-24

Owner reports reaching the empty isolated test dashboard at `http://localhost:5679`, then
creating and saving the instructed control row through the Data Tables UI.
Reported project ID: `2XRnl6HthFPhSSBt`.
Reported control table ID: `I1JBIePgy75Ecnlp`.
This is owner-reported provisioning, not an assistant-observed node read. Actual string/null
representations, schema output and n8n version/imported revisions still require confirmation.
T005 remains open until the first real read verifies the required row fields. T008 remains unrun.

## Owner-run refine G01 — 2026-11-24

Owner confirmed saving the manually imported refine skeleton after mapping all six Data Table
nodes to `I1JBIePgy75Ecnlp`, then provided actual Read control and Report completion output.
Workflow remains instructed inactive; no schedule activation was reported. Operator: project
owner in chat. Imported workflow ID/revision and exact runtime version not yet recorded.

| Application field | Read control (before) | Report completion control (after) |
|---|---|---|
| id | 1 | 1 |
| key | global | global |
| busy | false | false |
| execution_id | "3" | "4" |
| issue_number | null | null |
| started_at | 2026-11-24T10:30:38.773Z | 2026-11-24T10:31:08.697Z |
| updatedAt | 2026-11-24T10:30:38.808Z | 2026-11-24T10:31:08.730Z |

Both outputs have createdAt `2026-11-24T10:12:45.274Z`. Final status is `released`, outcome
`no_work`. **G01 refine: PASS for the reported full-run no-work completion**. This verifies the
row's required string/boolean/number/null representations and owner provisioning, completing
T005. Execution 3 is prior row context only; no separate test outcome is inferred for it.
Acquisition-node output was not supplied; no failure/restart/success-case result is inferred.
This observation supplements the initial unrun baseline above and does not complete T008.

## Owner-run refine G03 — 2026-11-24

Owner reports changing only busy to true and executing the full refine workflow. It ended at
Report existing hold with `status: skipped_held`. Supplied control: id 1, key global, busy true,
execution_id "4", issue_number null, started_at `2026-11-24T10:31:08.697Z`, createdAt
`2026-11-24T10:12:45.274Z`, updatedAt `2026-11-24T10:36:31.292Z`, guard_action held.
Execution/start/issue context matches the preceding G01 final row. updatedAt differs after the
owner's manual busy edit; it is not evidence of a workflow write. guard_action is output-only.
**G03 refine nullable-issue variant: PASS for reported held exit and supplied context**.
Independent refreshed persisted-row output, skipped-node trace and held-test execution ID were
not supplied; do not claim separate observations for them. Non-null-issue variant remains unrun.
Owner was instructed to leave the row held after this check. No recovery/reset is inferred.

## Owner-run refine G04 — 2026-11-24

Following the instructed inactive exception-test duplicate, owner supplied a failure at Skeleton
work boundary: `injected unexpected guard fault [line 1]`. Error metadata confirms
`n8nVersion: 2.48.8 (Self Hosted)`, binaryDataMode filesystem. The stack identifies the Code
node/task-runner execution path; no credentials or raw private execution payload are retained.
Owner reports the refreshed control row is busy with execution ID 6.
**G04 refine: PASS for the observed boundary exception and retained busy/execution context**.
Full after-row output (including issue/start), duplicate workflow ID/revision/export hash and
explicit downstream-node trace remain pending. The failing execution was not retried or reset
by the assistant. Next-poll skip against this failed hold remains unrun. G05 is not covered.

## Owner-run refine G15 after G04 — 2026-11-24

Owner executed the original refine skeleton while the exception test's hold remained set.
Report existing hold output: status skipped_held; id 1; key global; busy true; execution_id "6";
issue_number null; started_at `2026-11-24T10:44:59.344Z`; createdAt
`2026-11-24T10:12:45.274Z`; updatedAt `2026-11-24T10:44:59.352Z`; guard_action held.
Owner independently refreshed the table and confirmed busy true and execution ID 6 remain.
**G15 refine-after-refine-G04: PASS for reported skipped path and persisted hold**.
The supplied output also records the G04 hold's issue/start context; no output is inferred for
unexecuted reserve/track or other failure cases. Downstream unexecuted-node trace was not
explicitly supplied. Original refine's skipped execution ID remains unrecorded (6 is the hold
owner, not the skipped execution ID). Row remains held pending restart validation.

## Owner-run restart with existing refine failure hold — 2026-11-24

Following the instructed `docker restart factory-guard-test`, owner confirms refreshed persistent
row still busy true with execution ID "6". Executing original refine afterward again ends at
Report existing hold, preserving execution ID "6" and started_at
`2026-11-24T10:44:59.344Z`.
**Restart with pre-existing failure hold: PASS (owner observed)**. No automatic clear or work
resumption observed. This covers restart durability of the existing G04 hold, not an in-flight
crash/abort during an acquired execution. Those G14 variants, reserve/track restart paths and
skipped execution IDs remain pending. Row remains held after this observation.

## Owner-run refine G02 — 2026-11-24

Following the instructed inactive success-test copy with a synthetic acknowledged success at
Skeleton work boundary, owner supplied Report completion output: status released, outcome
success; control id 1, key global, busy false, execution_id "9", issue_number null, started_at
`2026-11-24T10:55:41.705Z`, createdAt `2026-11-24T10:12:45.274Z`, updatedAt
`2026-11-24T10:55:41.749Z`.
**G02 refine synthetic success: PASS from supplied native workflow output**. The prior inspected
hold was manually cleared per the test instructions; no automatic recovery is inferred. No
GitHub/model work was exercised. Acquisition snapshot, copied workflow ID/revision/hash and
independent final table refresh remain pending. Latest reported guard output is idle.

## Owner-run reserve/track G01 — 2026-11-24

After instructions to manually import/map/save reserve and track, then execute reserve followed
by track, owner supplied two successful native workflow outputs in that order, without explicit
workflow labels. Association below follows that requested order; imported workflow IDs/revisions
and explicit per-output workflow identification remain pending.

| Field | Reserve (first supplied output) | Track (second supplied output) |
|---|---|---|
| status / outcome | released / no_work | released / no_work |
| id / key / busy | 1 / global / false | 1 / global / false |
| execution_id | "10" | "11" |
| issue_number | null | null |
| started_at | 2026-11-24T11:29:08.206Z | 2026-11-24T11:29:59.693Z |
| updatedAt | 2026-11-24T11:29:08.247Z | 2026-11-24T11:29:59.723Z |

Both have createdAt `2026-11-24T10:12:45.274Z`. **G01 reserve and track: PASS for supplied
full-run no-work completion, associated by requested order**. Final node output reports idle;
independent refreshed rows and acquisition snapshots were not supplied. No story behavior,
failure-path or schedule result is inferred. T008 remains incomplete.

## Owner-run reserve/track G02 — 2026-11-24

After instructions to duplicate reserve/track into inactive synthetic-success test copies and
execute reserve then track, owner supplied two Report completion outputs in that requested
order (not explicitly labelled by workflow).

| Field | Reserve (first supplied output) | Track (second supplied output) |
|---|---|---|
| status / outcome | released / success | released / success |
| id / key / busy | 1 / global / false | 1 / global / false |
| execution_id | "12" | "13" |
| issue_number | null | null |
| started_at | 2026-11-24T11:33:52.554Z | 2026-11-24T11:34:39.442Z |
| updatedAt | 2026-11-24T11:33:52.583Z | 2026-11-24T11:34:39.479Z |

Both have createdAt `2026-11-24T10:12:45.274Z`. **G02 reserve/track synthetic success: PASS
for supplied full-path output, associated by requested order**. No actual reservation/tracking
side effect was exercised. Workflow IDs/revisions/test-copy hashes, acquisition snapshots and
independent final-row refresh remain pending. Latest supplied guard output is idle. All three
skeletons now have owner-run G01/G02 completion output; T008 fault coverage remains incomplete.

## Initially attributed reserve G04 and cross-workflow G15 — 2026-11-24 (corrected below)

Owner supplied the expected Skeleton work boundary error from the instructed inactive reserve
exception-test copy: `injected unexpected reserve fault [line 1]`. Metadata confirms n8n
`2.48.8 (Self Hosted)`, filesystem binary mode. Sanitized error retained here rather than full
internal stack. Owner reports control row execution ID 14, all three original workflows then
reporting skipped_held, and row execution ID/timestamp remaining unchanged afterward.
**Reserve G04 and refine/reserve/track G15 against reserve failure hold 14: PASS from owner
observations**. The skipped_held results establish the row was held; no timestamp value or full
row payload was provided for this case. Individual skipped execution IDs, imported/test-copy
revision identifiers and hashes remain pending. No reset was reported; row remains held by 14.
This covers pre-effect failure in reserve and shared later-poll blocking, not G05 post-effect
faults or track's own unexpected-failure path.

## Owner correction: execution 14 was track, not reserve — 2026-11-24

Owner clarified that the preceding exception test actually injected the error into the **track**
workflow rather than reserve. The error message text `injected unexpected reserve fault` does
not identify the source workflow. Preserve the initial report above as history; this correction
supersedes its source-workflow attribution.

Execution 14 therefore counts as **track G04 PASS**, not reserve G04. The owner-observed hold
and skipped_held behavior of all three original workflows remain valid **G15 against track's
failure hold 14**. Reserve G04 remains UNRUN. Do not repeat track G04 solely to correct the test
name/message. No additional execution or reset is inferred from the correction; latest reported
hold remains execution 14. Imported/test-copy IDs/revisions would improve source traceability.

## Owner-run reserve G04 and shared G15 — 2026-11-24

After the workflow-identity correction, owner followed the reserve exception-test instructions
and reports an error, a busy control row owned by execution 18, and all three original workflows
reporting skipped_held without a reset. **Reserve G04: PASS; refine/reserve/track G15 against
reserve hold 18: PASS (owner reported)**. Full error/row payload, unchanged timestamp confirmation,
individual skipped execution IDs and workflow revision identifiers were not supplied this time.
Do not infer those missing details. All three skeletons now have reported pre-effect unexpected
exception retention: refine 6, track 14 (corrected attribution), reserve 18. Post-effect failures
remain UNRUN. Latest reported row remains held by execution 18.

## Owner-run refine G05 — 2026-11-24

Following instructions to create a separate guard_effects table (case_id string), duplicate
original refine, insert a Data Table row-write between Verify acquisition and the throwing
Skeleton work boundary, and execute the whole inactive test copy, owner reports execution ID
22, exactly one guard_effects row and control still busy.
**Refine G05 post-effect failure: PASS for owner-reported persisted effect and retained hold**.
The instructed effect value was G05-refine; the row value, full control row, exact error output,
test-copy exported wiring/hash and workflow revision were not supplied, so those details remain
unverified. No external GitHub/model side effect was exercised. Later-poll/effect-count check
against this failure hold remains pending. No effect cleanup or guard reset has been reported;
latest reported hold is execution 22, with one effect row.

## Owner-confirmed later polls after refine G05 — 2026-11-24

Owner confirmed the complete requested check without editing either table: rerun the same
refine post-effect exception test copy, then original refine/reserve/track sequentially; all
four ended at Report existing hold with skipped_held. Refreshed control remained busy, owned
by execution 22 with unchanged timestamp; guard_effects remained exactly one row.
**Refine G05 duplicate-effect suppression under retained hold and G15 on all three originals:
PASS (owner confirmation)**. Individual skipped execution IDs and full row/output payloads were
not supplied. No recovery/reset or cleanup is inferred. Latest reported state: hold 22, one
persistent test effect. Reserve/track G05 remain UNRUN.

## Reserve G05 first attempt — wiring fault, 2026-11-24

Owner reports that the reserve post-effect test did not add a guard_effects row: the exception
ran in Skeleton work boundary **before** a subsequent Data Table node. guard_effects still has
only the prior refine test row. **Reserve G05: NOT PASSED; test-copy wiring correction required**.
This attempt does not establish post-write failure retention. Preserve it as a failed test-setup
attempt rather than silently replacing it with a later retry. Attempt execution ID, full error
and actual control-row state were not supplied. No guard reset or retry is inferred.

Required corrected order: Verify acquisition -> effect Insert row -> Skeleton work boundary
(throw). Remove any direct Verify acquisition -> Skeleton work boundary bypass and any
Skeleton work boundary -> effect Insert row edge. Keep the downstream completion chain after
the throwing boundary; do not connect the effect node directly to release/completion.
Before another full run, inspect the failed execution and row, confirm no active execution and
only the one existing effect row, then owner manually clears only busy. Successful retry must
insert G05-reserve before throwing, leave hold, and produce two total effect rows.

## Assistant access and assisted-test preparation — 2026-11-24

Owner clarified that the preceding post-effect confusion arose from switching refine/reserve,
then asked whether the assistant could perform the time-consuming tests. No successful reserve
G05 retry is inferred from that clarification.

- Browser inventory failed: browser access host unavailable. No browser actions or test changes.
- Existing SSH to broholm@nas works with sandbox escalation. Isolated container CLI help/list/
  export inspection succeeded; **all 10 saved workflows are inactive and have no credentials**.
- Direct `n8n execute --id=Gussyro70lhzF3WT --rawOutput` in factory-guard-test, with separate
  loopback task-broker port 5681 for that process only, **FAILED at Read control**:
  `Attempted to use Data table node but the module is disabled`. It reached no acquisition or
  remote work. This is a CLI-context limitation, not a pass/failure of the guard release logic.
  No direct SQL, credential extraction or workflow import was performed.
- Export inspection confirms refine post-effect path inserts before throwing; reserve post-effect
  path still throws before its insert, matching the reported failed setup. Track's copy named
  success test currently contains the reserve-worded throw, corroborating the owner's earlier
  workflow-identity correction. Names alone are not evidence of current test behavior.
- Prepared one inactive test-only `factory/tests/guard-bridge.json` (now archived as `factory/tests/historical/t008/guard-bridge.json`), generated from unchanged
  source skeletons. Native fixture/test webhooks avoid standalone CLI Data Table limitations.
  Owner must review/manually import and publish **only in isolation** before assistant runs.
  No bridge import/publication/execution has yet occurred.
- Local preflight PASS: 83 unique nodes, 43 async Code bodies compile, references resolve, source
  hashes match, no schedules/credentials/remote HTTP/subworkflow nodes, no continue-on-error/retry.
  Python generator compilation and git diff whitespace checks PASS. Native bridge validation UNRUN.

Current imported original workflow IDs/revisions (read-only export inspection):

| Original | Workflow ID | versionId | SHA-256 of compact exported JSON object |
|---|---|---|---|
| refine | Gussyro70lhzF3WT | 324e11ac-069d-4edb-ade7-8d147ee8550c | 0b8d5c88f8380ab080bd584eadfe764114ff20fa17fbf9ab8f0965633feead93 |
| reserve | NdYJRhC6UWLHW8Vb | f6487e11-b9bc-4401-9361-d697d2e15f1a | aa235be0b19f222734a3e79084ce5eaea210c27db9e58269741d7d03b6a3ec45 |
| track | CEGJ4lmhzku75vUr | afe6a056-21ac-4eee-a375-bfd010db8017 | c520922e4d3fc04a86711b53699b5718b1155fdc5ed150fd8a6db252b86d30d9 |

These are current imported-revision observations, not proof that every historical execution used
that revision or that an owner-reviewed Git commit has been recorded. All reference the confirmed
control table I1JBIePgy75Ecnlp. Both post-effect copies reference effects table 8fCAvfPK5z11XeRJ.
No test row was reset or modified by these assistant actions; current persistent row was not
read because the CLI's first Data Table operation failed. Owner-run evidence remains intact.


## T026 finished-workflow closeout — 2026-11-26

**Complete.** This section assesses all three finished workflows, not the historical skeletons.
Operational source at `219e351f77cd6be3534f297d1df2d95421f10f5d` is unchanged: refine
`ee3f6e782f72ec409d6e9a6cb02ca0f8b9a4b43eccbfad4dff0a9003ffe1ec38`, reserve
`ea6760fb5787dd216418596d93c37be981079aca8cc20f9a7f5ec2cab88930b6`, track
`d739916089873846b8f7a61aee71edfd0b7bee411cb727f3aefec54ff63b64b8` (SHA-256).
[Actual sanitized traces](us4-guard-results.json) record imported IDs/versions, exact executed
package hashes, before/after rows, reached nodes, errors and native held-poll IDs.

Fresh T033 checks: n8n 2.48.8 `factory-guard-test`, separate `factory_guard_test_data`,
loopback 5679; operational instance remains on 5678 and a different volume. Initially all 22
historical workflows were inactive/drained; singleton idle at 1542. Three new credential-free
copies raise the count to 25. All HTTP stays on synthetic container loopback 18768 and all
source Code bodies are unchanged. Native Data Table/HTTP/IF/Code paths are used. Test-only
adapters and exact edge changes are described in [the test guide](../factory/tests/us4-validation.md).

### Coverage and evidence reuse

| Guard/exit obligation | Finished-workflow evidence |
|---|---|
| G01 all no-work early returns | New native no-candidate checks on all three graphs. Refine's no eligible discovery and exhausted Ready/discussion loop reuse current US1 non-owner/PR/closed/Approved/Ready-unchanged/non-owner-discussion/factory-marker cases. Reserve no candidate/occupied slot (including malformed/closed/non-owner Building) reuses 1287/1291/1295/1299/1303 and scheduled 1439. Track no candidate/no result/reapproval/stale baseline/unchanged QA reuses 1448/1456/1460/1468/1480/1542. All acquired no-work exits release. |
| G02 real story success | Reuse real refine 753/757 and scheduled 1232/1234; real reserve 1275 and scheduled 1411; native tracking 1445/1488/1492 and scheduled 1538. Exact unchanged source hashes and explicit mapping differences are retained in story evidence. |
| G03/G15 pre-held, issue context and null context | New native cross-workflow held polls preserve the full row, never acquire/release or reach HTTP. Both nullable pre-selection context and story issue context are represented. |
| G04/G05 unexpected before/after effect | Reuse current US1 unexpected-before/after and unknown-post, reserve 1331/1339/1347/1355, track 1517/1524/1531. Source validation exceptions and uncertain acknowledged effects retain busy; later native polls skip. |
| G06 invalid entry | Each finished graph rejects empty, duplicate, wrong-key and invalid-context inputs at native entry. Output injection preserves the historical singleton; actual persisted invalid/missing row variants remain in the unchanged-validator skeleton evidence. No auto-provisioning. |
| G07 acquisition failure | Each graph's native Acquire control targets a nonexistent table; original row stays unchanged and no HTTP runs. |
| G08/G09 unconfirmed acquisition | Empty/wrong update receipt, missing acquired reread and nonexistent reread table each fail before HTTP; actual acquired row stays busy. |
| G10 invalid completion | Unacknowledged success/error-shaped output fails at native completion validator; no release. |
| G11 failed release | Native nonexistent-table update fails; row stays busy; all graphs subsequently skip. |
| G12/G13 uncertain release | Lost/empty release receipt or unavailable final reread fails without completion; committed row is physically idle. The operator inspects this actual result; no false busy=true assertion, retry or automatic re-hold. |
| G14 restart | Native running/acquired executions refine 1669, reserve 1673 and track 1677 were interrupted by restarting only the isolated container. Metadata reports crashed; exact row persists and all three finished graphs skip unchanged. Historical US1 backoff and US2 partial-reservation restarts retain their additional story-effect evidence. |
| G16 ownership loss | Changed ownership input fails before release on each graph; real row stays held. |

There are **55 new guard primary executions** (51 specified variants, one initial no-work
preflight and three crashes). The combined collector also includes four recovery error
executions and **93 actual native held skips** across guard/recovery exercises. Intentional
errors remain error/crashed executions; the pass is their asserted failure behavior.
Separate scheduled checks are reused from T031/T032/T023, not blanket repeated.

Known completed synthetic holds were explicitly inspected/reset only between independent
cases, with reason, exact row/execution filter and drain checks. No workflow error path resets.
G08/G12 output injections establish downstream acknowledgement handling, not a database-network
fault; unavailable-table cases exercise native Data Table failures. Direct UI cancellation
remains unrun; restart is demonstrated. No exactly-once/distributed-lock claim is made.

First readback rejected n8n's generated Wait `webhookId`; the same inactive import was reused
with that metadata field explicitly normalized. No source fix was required. Recovery observer
and activation-boundary failures are retained in the collector and recovery evidence. Later
clarification of test-only node notes changes no execution parameter/connection or source Code.

Final test/restore shutdown and real-state preservation are recorded in
[recovery validation](recovery-validation.md). US4 tests do not count as real issue/PR tasks,
activate operational workflows, or replace owner review/manual matching-revision import.
