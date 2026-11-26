# Basic A acceptance — T029

**2026-11-26. T029 complete; T030 complete on owner-reported manual import/publication evidence.**
Assessment base: `c359fbde6a1b15335d596bc44f4792f9c4994234` (merged US4 PR #7).
This consolidation changes documentation only. It reuses valid unchanged-artifact evidence;
no new native workflow execution, provider call, import, activation or recovery was performed.
PASS below names the demonstrated environment; owner-reported operational adoption is recorded separately below.
Historical failures remain in the linked records. The real task has owner acceptance, while
its real automated QA/Done transition is **UNRUN**. One genuine run counts toward five.

## Tested revisions and evidence chain

| Task | Status and evidence | Tested revision / environment |
|---|---|---|
| T004 | PASS owner-adopted Gemini, quality review and server API smoke; failed local trials retained in [Gemini evaluation](gemini-evaluation.md), [v3 review](gemini-v3-review.md), [Ollama evaluation](ollama-evaluation.md) | Prompt v3/template v1; clear task on laptop/Ubuntu container, targeted v3 ambiguity/revision/conflict; injection retains v2 evidence, no five-case v3 claim |
| T014 / T031 | PASS real refinement/revision/unchanged/approval plus native synthetic faults and original scheduled entry; [US1](refinement-validation.md) | US1 855033e, token preflight 2f64f85, retries 81008dd, pagination fix eb1ccb8, schedule copy 21f421f; saved-credential real runs 753/755/757, no-work 754/758; trigger 1232/1234/1263. Partial old-version cases reused explicitly |
| T019 / T032 | PASS reservation, delayed launch, second-task wait, manual coding/question/PR and isolated fault/schedule checks; [US2](manual-build-validation.md) | ec5a2de / PR #3; mapped reserve EIF8Urpa0tCkd2DI version 6c5cfd0e-8a3a-435b-9cf5-1ff1585fd410; real reserve 1275, schedule 1411/1439; source hashes below |
| T023 / T034 | PASS native synthetic result rules and real owner acceptance decision; [US3](review-validation.md), [native results](review-native-results.json) | db20bc67ff459e69abe3a02ab57581f667fc23b2; isolated 3SmlqLqhRDB5S5e9, 19 main-engine cases, six held skips, trigger 1538/1542; genuine issue #1 / PR #5 owner merge bb474bda2544fcc8c19695460c1f2ad1dea6c055 |
| T026 | PASS completed-workflow guard matrix; [guard closeout](guard-validation.md#t026-finished-workflow-closeout--2026-11-26), [exact imports/traces](us4-guard-results.json) | 219e351f77cd6be3534f297d1df2d95421f10f5d; separate n8n 2.48.8 test instance, 55 new primary guard executions, reused story coverage, three crashes; not a second guard pass in T029 |
| T027 | PASS simulated outage/partial-label/unknown POST recovery and stopped-volume restore; [recovery](recovery-validation.md), [results](us4-recovery-results.json) | Same source as T026; recovery 1685/1689, 1690/1694, 1695/1699; network-disabled restore credential execution 1700; nine file hashes matched |
| T028 | PASS evidence assembled, one genuine task counted; [index](index.md) | Issue #1 / issue-1 / PR #5 head d0101c4011a1b1a2f29a2b3bc17a7828008a348f; four more real runs required for final project |

Current workflow files match T026 byte-for-byte (SHA-256):

| Artifact | SHA-256 |
|---|---|
| refine.json | `ee3f6e782f72ec409d6e9a6cb02ca0f8b9a4b43eccbfad4dff0a9003ffe1ec38` |
| reserve.json | `ea6760fb5787dd216418596d93c37be981079aca8cc20f9a7f5ec2cab88930b6` |
| track.json | `d739916089873846b8f7a61aee71edfd0b7bee411cb727f3aefec54ff63b64b8` |

Exact mapped test-package hashes and imported version UUIDs are retained in the linked JSON;
source fingerprints do not replace imported-version evidence. All native fixtures use the
separate test instance/storage. Synthetic HTTP responses are not real GitHub/model results.

## Quickstart acceptance matrix

Rows map [quickstart sections 1–8](../specs/001-basic-a-factory/quickstart.md) to actual evidence.

| Check | Status | Evidence / practical limit |
|---|---|---|
| Preflight, private editor, provider, guard provisioning (§1–4) | PASS recorded setup | [Setup](local-setup-checks.md), T004/T014 above; role-needed permissions documented, current operational token grants not independently audited |
| Owner-only intake | PASS real + fixture | T014 owner idea; non-owner, closed and PR-object native fixtures |
| Refinement/revision/unchanged | PASS real + scheduled fixture | T014 753/755/757/754/758; T031 trigger path; no scheduled real GitHub mutation claimed |
| Explicit approval | PASS real + fixture | Owner event 37246567614; invalid/stale actor/source cases in T019; no AI approval |
| Reservation/one slot | PASS real + fixture | T019 real 1275, #4 waits behind #1; restart/held/no-work and T032 schedule checks |
| Manual coding/question | PASS real | [Decision 7170400632](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7170400632), issue-1, PR #5; owner manual launch and unchanged-scope answer |
| PR/review | PASS fixture + real owner decision | T023 native QA and T034 owner merge; real automatic QA transition UNRUN |
| Rejected attempt | PASS fixture | T023 closed-unmerged/open issue stays QA without duplicate result comment; real rejection UNRUN |
| Rework | PASS fixture | T023 fresh approval/baseline/new head and ambiguity cases; real rework run UNRUN |
| Completion | PASS fixture; UNRUN real tracking | T023 merge/closed-issue Done; real PR #5 merged but last real issue observation remains Building |
| Workflow change / operational adoption | PASS owner-reported import/publication | Owner confirmed manual import/publication after PR #8 handoff: refine 67fcc2fa, reserve 399ebb5e, track 943b51b9; independent imported-byte/mapping readback not performed |
| Successful flag release | PASS | T026 completed-graph G02, reuses acknowledged real/story results |
| Every no-work flag release | PASS | T026 G01, including unchanged/occupied/no-result exits |
| Existing hold | PASS | T026 G03/G15 cross-workflow skips preserve context/effects |
| Unexpected failure retention | PASS | T026 G04/G05 before/after effects and G14 crashes, subsequent skips |
| Release/acquisition failure | PASS | T026 G06–G13/G16; lost release can leave physical idle, outcome remains unconfirmed until inspected |
| Model/API failure | PASS fixture; historical real failures | T014 count/output/auth/quota/transport/retry/exhaustion; real 503s 752/756 retained; short Wait/restart/cancellation evidence distinguished |
| Interrupted reservation | PASS fixture | T019 partial Building/Approved/comment failures; T026 crash/held checks; no second claim |
| Unknown comment POST | PASS fixture | T014/T019/T023 failure holds; T027 1695/1699 marker inspection, explicit repair, no blind duplicate POST |
| Conflict/ambiguity | PASS fixture | T014/T019/T023 source/state/PR ambiguity and T026 invalid/missing acquisition; no guessed progression |
| Restart/restore (§7–8) | PASS isolated | T026 three crash traces, T019 persistent Building; T027 stopped-volume restore and encrypted disposable credential check |
| SC-002 real run/question/PR/owner decision | PASS | T028/T034 issue #1 / PR #5; fixture tracking supplements rather than inflates this run |
| Final-project five real runs | UNRUN remaining four | T028 index counts one; Basic B runner, report and submission remain outside Basic A scope |
| Deliberate operational activation (§5) | PASS owner-reported publication; UNRUN independent preflight/readback | Same three published version prefixes; no post-publication execution or fresh concurrency/guard/mapping inspection claimed |

## Failures and retained limitations

FAILED historical observations include local-model quality trials, real provider 503s and
US1 pagination 1132 (fixed and affected path passed at 1140). T027's initial resume observer
read an old execution; its corrected independent outage exercise passed. The T029 export
checker initially required `notes` on sticky notes; corrected it to apply the AGENTS rule to
operational nodes, then passed without changing workflows. These are recorded failures with
subsequent outcomes, not current failed workflow criteria. The linked records retain details,
manual resets and test-copy deltas. T026 uses restart evidence; it does not claim new direct UI
cancellation coverage for reserve/track. Exactly-once/distributed-lock guarantees are not claimed.

## Additional checks actually run for T029

These checks address final artifact identity and publication/review gaps, not a repeated
behavior acceptance suite. Local environment: repository on Fedora; base c359fbd and this
documentation review branch. No parameters, code, connections or workflow JSON were changed.

- PASS all three `factory/scripts/build-{refine,reserve,track}.cjs --check` commands: current
  exports still match reviewed generators; SHA-256 matches T026, justifying evidence reuse.
- PASS Python standard-library export inspection: all three exports inactive, no pinned/static
  or execution payloads, credential IDs remain OWNER placeholders, operational nodes have notes.
- PASS credential-signature scan of 161 tracked files: no Google/GitHub token or private-key
  signatures found. This heuristic plus manual review of export credentials/URLs, Compose mounts,
  permission docs and changed public prose does not prove every possible secret absent.
- PASS setup-ignore review: `.env*` with example exception, private `factory/local/`, logs,
  Python cache and editor artifacts excluded; Docker excludes private inputs. No npm publishing,
  ESLint/Prettier/Terraform/Helm setup requiring additional ignore files was found.
- PASS read-only GitHub PR history: #2/#3/#5/#6/#7 merged; PR #7 base c359fbd.
  Initial sandbox network read failed; approved network read succeeded. No GitHub write occurred
  during evidence collection. Prior T034 preserves real task approval/branch/review facts.

- PASS 107 relative file links and balanced code fences across six changed documents;
  `git diff --check` passed and `git diff -- factory/` is empty. No extension registry exists,
  so no before/after implementation hooks are registered.

Current saved operational credential scopes and independent imported-version/mapping verification
remain UNRUN. The owner subsequently supplied manual import/publication evidence below. No runtime
retest is needed for unchanged artifacts; future changes require only affected checks.

## T033 isolated boundary verification — 2026-11-26

T033 passed for credential-free US3 fixtures. Fresh Docker/API checks confirm test n8n 2.48.8,
separate `factory_guard_test_data` volume on loopback 5679 versus operational 5678/separate
volume, all 21 known test workflows inactive, zero running/waiting executions and the typed
singleton story row idle at execution 1442. No row was reset. The configured table is
`IgWCIu94ieyHQRHS`; all pagination cursors were exhausted. Private readback is retained in
`factory/local/us3/boundary-inspection.json`.

The new US3 fixture copy has no GitHub/Gemini credentials and fixed container-loopback HTTP
18767 only; old credential-bearing workflows remain inactive. The test API key is used only
by the adapter against verified localhost:5679, never in workflow JSON. Synthetic resources
cannot proxy to GitHub or process ordinary factory issues. See [operations](../docs/operations.md)
for mappings, operator reset limits and separate owner manual operational adoption. This
boundary check is not a T023 native acceptance result; native outcomes follow in
[review validation](review-validation.md). Operational workflows remain untouched.

This retained T033 record supports the consolidated matrix above. Existing
US1/US2 evidence is retained in their story validation records.


## US3 story evidence — T023 complete

Source commit `db20bc67ff459e69abe3a02ab57581f667fc23b2`; unchanged track source hash is
recorded in [review validation](review-validation.md). New isolated workflow
`3SmlqLqhRDB5S5e9` passed 19 webhook main-engine cases (18 scenarios plus one repeat), six
held skips and scheduled mode=trigger QA/unchanged ticks 1538/1542. Test-only source/mapping
hashes, per-execution revisions, rows, effects, six deliberate inspected fixture resets and
observer corrections are in [native results](review-native-results.json). All 22 isolated
workflows are inactive/drained; final row idle at 1542, private route 404, fixture service
stopped. No operational adoption, real GitHub/model call or extra genuine task run occurred.
This historical US3 closeout reuses unaffected US1/US2 results; T026 and T029 are assessed above.


## T030 owner operational adoption closeout — 2026-11-26

After the PR #8 review handoff at `0c13c6e`, the owner confirmed manual import and publication:
refine **67fcc2fa**, reserve **399ebb5e**, track **943b51b9**. The
[operations ledger](../docs/operations.md#t030-reviewed-artifacts-and-operational-adoption-ledger--2026-11-26)
records the owner report and its precision limits. T030 is complete on that owner-reported
basis; no full version UUID, operational workflow ID, exact timestamp, independent imported-byte
comparison, mapping readback or successful operational execution is inferred. No runtime change
or check was performed by the agent. This does not add a genuine task run or demonstrate real
QA/Done processing. Four more final-project runs remain required. Subsequent source changes
still renew owner review/manual import. PR #8 remains for the owner's merge decision.
