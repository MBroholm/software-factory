# Guard and contract scenarios — T006

This matrix remains the coverage specification. The skeleton setup and T008 procedures below
are historical; current finished-workflow setup is in [US4 validation](us4-validation.md).
The [T008 archive](historical/t008/README.md) preserves the superseded tools and original artifacts.

Current policy (2026-11-26): imports, updates and execution in designated isolated dev/test
n8n may be automated after T033 boundary verification, using test data, scoped credentials and
designated test resources. No operational workflow replacement/activation or ordinary factory
tasks are allowed. Record tested source/imported revision and environment. Operational adoption
requires owner PR review and manual import of the matching reviewed JSON revision, renewed for
subsequent changes, before or after merge. Manual import does not require manual execution of
every test. Historical owner imports and shutdown observations below remain evidence, not new
setup requirements. Existing scripts' limited capabilities are unchanged by this policy.

Status: specified before story implementation. Owner-run skeleton checks and assistant-run
native bridge evidence are now recorded in `evidence/guard-validation.md` and
`evidence/guard-bridge-results.json`. Local graph checks alone do not establish Data Table
persistence, engine routing or restart behavior.
Repeat every G case on **refine, reserve and track**, recording each separately. T026 completes missing/change-affected coverage on finished workflows; actual completed story
and guard outcomes are recorded in the linked evidence, while the tables below remain the original test specification.

## Isolated setup and exact entry path

1. Inspect the three `factory/workflows/*.json` files and import them (automation permitted) into an
   isolated n8n **2.48.8** instance/project with a separate persistent volume and no production
   workflows, secrets or GitHub/Gemini credentials. Record reviewed Git revision/file SHA-256,
   imported workflow ID/revision and n8n version. Keep all schedules inactive. Automated isolated import is permitted after T033 verification.
2. Owner provisions the test `factory_control` table and singleton row as described in
   [operations](../../docs/operations.md#t005--isolated-control-row-provisioning).
   In **every** Data Table node select that same table by ID, replacing
   `OWNER_SELECT_ISOLATED_CONTROL_TABLE`. Never point a test at the production table.
   Keep Get's limit 2, no filters, and Always Output Data enabled: zero rows must reach validation
   as an empty item; two rows must raise an error. Do not pin node data.
3. Use **Execute Workflow**, entering `Manual isolated test -> Read control -> Validate entry`.
   Do not execute an individual acquire/release node or resume/retry a failed execution.
   `Already held` true ends at `Report existing hold`; false acquires, checks the update receipt,
   rereads/verifies, reaches `Skeleton work boundary`, validates completion, checks ownership,
   releases, checks its receipt and rereads before reporting idle. Errors have no release edge.
4. For fault cases, duplicate the reviewed imported skeleton into an inactive test copy and edit
   **only the named fault point** below. Record the edited node/code and exported test-copy hash.
   Execute the entire copy through the same entry. Restore the original wiring before the next
   case. No continue-on-error, error output, retries, finally cleanup or mutating error workflow.
5. Inspect the complete control row and execution node trace before/after each run. Record actual
   errors, reached nodes, writes, execution IDs and next-poll result. Use sanitized evidence only.
   After retained failures, run an unmodified skeleton in each of the three workflows without
   resetting the row; all must skip and preserve it. Reset manually **between** independent
   cases only after stopping/draining tests and inspecting side effects. Never erase failures.

Initial idle fixture (n8n also supplies `id`, `createdAt`, `updatedAt`):

```json
{"key":"global","busy":false,"execution_id":"","issue_number":null,"started_at":""}
```

Existing-hold fixture: `busy=true`, `execution_id="held-fixture"`, `issue_number=101`,
`started_at="2026-11-24T10:00:00.000Z"`. Repeat with `issue_number=null`; null is valid before
issue selection. Execution/timestamp columns are strings; empty strings are valid idle context.

## Workflow guard matrix

The table below is the test specification; actual per-case/variant status is in the evidence,
not inferred from the expected assertions here. Apply cases to each workflow independently.

| ID | Setup / injected fault point | Assertions | Cleanup |
|---|---|---|---|
| G01 no-work | Idle row; original skeleton | Work boundary returns `no_work`; acquire receipt and reread show this execution, null issue and ISO start; release receipt and reread show false; final `released/no_work`; next full run proceeds | Retain execution evidence; idle needs no reset |
| G02 acknowledged success | Idle; replace boundary with `return [{json:{outcome:'success',acknowledged:true}}];` | Same verified release as G01, `released/success`; synthetic completion only, no claim of GitHub/model success | Restore boundary |
| G03 pre-held | Existing-hold fixture, including nullable-issue variant | Only read/validation/held report execute; **all five context fields and row ID unchanged**, no acquire, boundary or release; no comment | Preserve fixture for cross-workflow skip check, then manual reset |
| G04 unexpected exception before effect | Idle; replace boundary with `throw new Error('injected unexpected guard fault');` | Execution fails after verified acquire; busy remains true with failing execution context; no release node reached | Cross-workflow skips, inspect, manual reset, restore |
| G05 exception after acknowledged effect | Idle; at boundary insert a Data Table **Insert row** node targeting a separate test-only `guard_effects` table (`case_id` string, value `G05-<workflow>`), followed by Code `throw new Error('injected after effect');`; remove original boundary connection so there is exactly one path | Exactly one effect row exists; execution fails; busy true; release not reached; subsequent polls in all three workflows skip and add zero effect rows | Record effect and hold first; drain, manually remove test effect/reset; restore wiring |
| G06 missing / duplicate / invalid | Separately: delete singleton; add second `global`; add non-global second row; wrong key; null busy or invalid context where UI permits | Visible entry error, no acquisition or work; no automatic create/upsert/reset; unreadable table likewise blocks | Manually restore one valid idle row; retain error evidence |
| G07 acquisition failure | Idle; set **Acquire control only** to an unavailable table ID | Failed acquisition; no boundary or release; original row untouched; do not report acquired | Restore ID; inspect before next run |
| G08 acquisition receipt missing/mismatched | Idle; insert Code between Acquire and Check acquire receipt: `return [{json:{}}];`; repeat returning the acquired row with `execution_id:'wrong'` | Receipt check fails; no boundary/release; actual acquired row stays busy | Cross-workflow skips, inspect, reset, remove injection |
| G09 acquisition reread unavailable/mismatch | Idle; change Read acquired control to unavailable ID; separately insert Code before Verify acquisition returning `{}` | No boundary/release; actual row stays busy; no assumed acquisition from update receipt alone | Same held-failure cleanup |
| G10 invalid completion / error output | Idle; boundary returns `{outcome:'success',acknowledged:false}`; repeat `{error:'synthetic error output'}` | Require acknowledged completion throws; no release, busy remains true | Same held-failure cleanup |
| G11 failed release | Idle; set Release control only to unavailable table ID | Release fails; original row remains busy; no final idle report; later polls skip | Inspect before reset; restore ID |
| G12 uncertain release acknowledgement | Idle; insert Code after Release and before Check release receipt: `throw new Error('lost release acknowledgement');`; separately return `{json:{}}` | Execution fails and never reports released; physical row may already be idle. **Do not assert busy=true after a committed release**; pause all tests and inspect actual row. No automatic re-hold or assumed success | Record actual outcome; restore wiring only after inspection |
| G13 release reread unavailable | Idle; make Read released control unavailable | Release may have committed, but execution fails without idle report; operator treats release as unknown pending inspection | As G12 |
| G14 crash/restart | Idle; in inactive test copy insert Code after Verify acquisition: `await new Promise(resolve => setTimeout(resolve, 30000)); return $input.all();`. Start entire workflow, observe busy in UI, then owner restarts isolated n8n while delay is running; repeat stopping execution instead | Persistent row remains busy after restart/abort; new full executions of all three originals skip with unchanged context. Restart must not auto-clear or resume remote work | Save failure/cancellation and restart evidence; drain, inspect and reset; remove delay |
| G15 failed holds block later polls | After G04/G05/G08/G09/G10/G11/G14 run each unmodified skeleton without reset | All skip, no acquisition/release/effect; original failed context remains byte-for-byte equal in application fields | Only then manual recovery/reset |
| G16 pre-release ownership loss | Idle; insert Code before Verify release ownership returning the reread row with a different execution ID | Ownership check fails; Release not reached; no unconditional reset | Inspect actual row; manual reset and remove injection |

For a true persisted/acknowledgement fault G08/G12's output injection tests the **actual next
workflow node's handling** of missing acknowledgement; it does not simulate a database/network
failure in the Data Table implementation. Record this limitation. G07/G09/G11/G13 exercise actual
Data Table failures. A committed release and a lost acknowledgement cannot be atomic; operators
must pause and inspect an unknown outcome. No distributed mutex or exactly-once guarantee is claimed.

For schedule-path confirmation, owner enables **one isolated copy at a time** at its unchanged
60-second interval, first idle (one successful no-work poll) then with an existing hold (one
skipped poll). Deactivate/drain before edits or manual runs. Record trigger and executions.
This supplements manual-entry tests; do not enable production schedules for T008.

## Contract fixtures defined before user-story code

Use owner `202449424`, repo `MBroholm/software-factory`, unrelated label `documentation`, issue
101 and PR 201 as synthetic identifiers, not as claims about real repository objects. Fixtures
below are inputs/expected results for later isolated workflow tests, **all pending**. Model
fixtures reuse `fixtures/refinement-cases.json` and `../templates/refinement.schema.json`.
T014/T019/T023 execute the relevant story cases; T026 checks all finished guard paths.

| ID / contract | Fixture input or variation | Expected result / later task |
|---|---|---|
| L01 lifecycle intake | Open owner issue 101, Ideas, documentation; repeat non-owner and PR-object variants | Owner issue alone eligible; preserve documentation; others no-work release; T010/T014 |
| L02 lifecycle revision | Ready issue with a new unmarked owner comment; repeat unchanged; add each `factory:*:v1` marked comment authored by owner | One revision, no repeat or self-trigger; T011/T014 |
| L03 lifecycle source | Captured comment ID 11; later session comment 12; then edit/delete 11 | 12 alone does not invalidate captured scope; captured edit/deletion holds; T011/T015 |
| L04 lifecycle state | Missing/multiple managed states or stranded Refining | Fail closed for conflicting known task; no auto-resume; T013/T014 |
| L05 approval | Latest owner Approved event 31 after refinement 21; variants non-owner actor, missing history, later removal, edited refinement or source | Only unchanged current owner approval valid; never add Approved automatically; T015/T019 |
| L06 reservation | Eligible Approved issues 101/102; variants Building issue 99 closed/non-owner/conflicting | Lowest eligible wins only with free slot; any Building blocks; success/no-work release keeps Building; T016/T019 |
| L07 partial write | Lose response after add Building or handoff POST | Retain busy; later polls skip; inspect marker before any retry; T017/T019 |
| L08 result match | PR 201 same repo, issue-101 head, main base, `Refs #101`, newer than handoff; variants wrong repo/head/base/link or two candidates | Only unique current match enters QA; ambiguity holds; T020/T023 |
| L09 result age | Baseline PR 201 SHA a before approval; unchanged reopen; changed SHA b on open PR after new approval | Ignore stale result; unclear reopen holds; accept uniquely attributable new head; T020/T023 |
| L10 result outcome | Current open PR; then closed/unmerged with issue open; then merged; separately owner closes issue | QA; stay QA; Done only confirmed merge/closure; repeated polls no duplicate marker; T021/T023 |
| R01 refinement quality | Five existing clear/ambiguous/revision/conflict/injection cases, reviewed version hashes | Schema-valid bounded candidate preserves constraints; material questions survive; injected authority ignored; reuse unaffected existing model evidence, T012/T014 |
| R02 refinement output | Canned candidate valid schema; variants 0/2 candidates, non-STOP, thought-only/tool parts, extra key, empty required field, invalid JSON, oversize/missing usage | Reject invalid output, hold without false Ready; T012/T014 |
| R03 refinement API | Canned 429, timeout, transport error; source changes during call | No retry, paid/provider fallback or publication of stale content; hold; T012–T014 |
| H01 manual handoff | Approval 31/refinement 21; deterministic marker, URL/digests, branch issue-101, PR baseline and timestamp | One complete handoff; Building survives laptop off/restart, no agent launch; T017/T019 |
| H02 manual launch | Approved snapshot versus changed scope/missing handoff; session question affects result | Verify before manual launch; material answer summarized on issue; changed scope waits for fresh explicit approval; T018/T019 |
| H03 review | Same-repo issue-101 PR to main, explicit issue link, actual checks and unchecked criteria | Owner alone reviews/merges; rejected unmerged/open issue stays QA; operational JSON owner-manually imported after PR review; T022/T023 |

## Evidence record per run

Record: case/workflow, reviewed revision + file hash, imported revision, test-copy delta/hash,
instance/version/isolation, trigger, execution ID/status/reached fault node, before/acquired/after
row, effect observations, next-poll IDs/results, cleanup/operator, actual pass/fail/unrun and limits.
Use `evidence/guard-validation.md`. Keep raw exports/execution payloads private. No story contract
case counts as passed because a guard-only skeleton released successfully.

## Assisted native execution option (T008)

The owner requested assistance because individual UI fault edits/runs were taking substantial
time. The [isolated validation bridge](historical/t008/guard-bridge.md) provides a single isolated test import (automation permitted),
then SSH-local requests through the real n8n server. It copies the same three guarded paths,
uses native Data Table operations, records persistent effects and never imports/activates the
production workflows. Keep the manual source evidence and report bridge results separately.
No helper-only result or standalone CLI failure substitutes for engine-path validation.


## Finished-workflow T026 result — 2026-11-26

All required guard paths now have finished-workflow evidence or explicitly justified reuse of
unchanged current-source story checks. See [T026 coverage](../../evidence/guard-validation.md#t026-finished-workflow-closeout--2026-11-26),
[actual native results](../../evidence/us4-guard-results.json) and the
[US4 harness boundary](us4-validation.md). Historical skeleton successes alone were not used
for completed story behavior. Supplemental UI cancellation remains unrun; all three acquired
in-flight restart cases passed. Do not rerun unchanged suites just because the old setup text
calls the then-current workflow a skeleton.
