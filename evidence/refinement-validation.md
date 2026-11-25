# US1 refinement validation

**Date**: 2026-11-24; observations updated 2026-11-25. **Status**: T010–T013 implemented;
T012 native saved-credential count/inference and fixed rendering passed in execution 753.
T014 is in progress: initial refinement, unchanged polling and revision mechanics passed;
the privacy criterion is now explicit in execution 757’s output, and explicit owner approval
is verified. Post-approval execution 758 correctly returned no_work and released the guard.
Remaining native acceptance cases are pending; live 503/backoff behavior remains unexercised. Failures/recovery are retained below. No production activation
or completed issue/PR-linked build run is claimed.

## Native suite executed — pagination defect found and fixed in source

After owner publication, pilot success and retry-once passed; the suite passed 33 more cases
through conflicting states. **35 native cases passed**, including 10/30-second two-retry success,
three-attempt exhaustion, held-skip checks after each retained failure, Retry-After refusal,
HTTP/auth/quota/transport/output/count failures, source changes, exclusions, reuse and revision.
Private operator records: `factory/local/refinement-native-bridge/{pilot,suite}.jsonl`;
supported-export native traces: `traces.json`. These are synthetic remote effects through the
real native n8n graph and persisted isolated Data Table, not real provider/task runs.

The runner stopped at pagination, execution **1132**, at Plan revision with
`Invalid/duplicate discussion entries`. Synthetic request logs prove events paginated once,
but Read source comments requested pages 1 and 2 twice: upstream HTTP emits one item per page,
so the next HTTP node executes its own pagination per incoming item. This is a workflow defect,
not duplicate fixture IDs. The guard remains held by 1132; no reset or later test was attempted.

Fix: all refinement HTTP nodes now use n8n's `executeOnce=true`, so each activation sends one
logical request/pagination sequence regardless of upstream page items. Internal pagination is
preserved. 35 local groups and generator consistency pass; source/bridge rebuilt. Native rerun
is pending owner reviewed reimport. New source SHA-256
`ee3f6e782f72ec409d6e9a6cb02ca0f8b9a4b43eccbfad4dff0a9003ffe1ec38`.
Ready-mapped test bridge: `factory/local/refinement-native-bridge/workflow.json`.
Production-source mapped import: `factory/local/refine-us1-retry-mapped.json` (do not execute
or activate it for these synthetic tests). Keep all prior failure evidence. T014 remains open;
pagination, later-candidate, unknown POST, partial label, unexpected exceptions and restart
remain pending. Full UI cancellation remains separate from the helper cancellation pass.

## Remaining-test execution and prepared native suite — 2026-11-25

The owner asked the assistant to execute remaining tests. Additional checks actually performed:

- Supported encrypted execution export collected 754, 755, 757 and 758. Only execution files
  were decrypted with a disposable export-only key; no credential/instance-key access or SQL.
  Native traces confirm **754 and 758 each ran zero countTokens and zero generateContent nodes**.
  755 and 757 each counted/generated exactly once. Completion records match the owner outputs.
- Snapshots for **757/758**, workflow **zcynhzDmEAapj2dT**, match the reviewed retry artifact's
  Code bodies and connections, all **eight table mappings/filters/update values**, all **23
  HTTP URLs/methods/bodies/options/saved credential references**, and Wait parameters. The
  native editor's empty pagination `webhookNotice` is ignored as UI metadata; no behavioral
  difference was observed. Historical/current workflow IDs are deliberately distinguished.
- Installed n8n core performed **actual 10,011 ms and 30,009 ms waits**, without durable wait
  state. An actual AbortSignal cancelled a 30-second core wait after **502 ms**. These pass
  helper timing/cancellation checks; they do not establish full workflow cancellation/guard
  persistence. Reproducible helper: `factory/tests/check-refinement-native-waits.cjs`.
- A prepared credential-free native test bridge passed **335 installed native checks** (270 VM
  contexts including rewritten loopback URLs and fixture identity headers, pagination, prior
  regression and Wait boundary). This executes parameter/Wait helpers, not the imported graph.
- `check-refinement-bridge.cjs` passed graph packaging assertions, all **43 synthetic fixture
  initializations**, selective 503 response sequences, identical count/generation body digests,
  multi-page responses and an actual dropped HTTP connection. This validates the fixture
  server; **zero native bridge cases have run yet**. The initial local listener attempt was
  sandbox-blocked and rerun with approval. A too-broad assertion included sticky notes, was
  corrected to apply to operational nodes, and final preflight passed.

Prepared one manual import: `factory/local/refinement-native-bridge/workflow.json`, inactive,
85 nodes, mapped to the existing isolated US1 table, with **no credentials or schedules**.
The committed placeholder-mapped review JSON is `factory/tests/refinement-bridge.json`;
builder/manifest/runner/trace collector and full boundaries are described in
`factory/tests/refinement-bridge.md`. The suite retains source Code/connections except two
explicit fault prefixes and replaces only external HTTP destinations/auth/fixture headers.
It uses real native HTTP, Data Table, branch/loop and Wait nodes. No product workflow source
or live issue content was changed to create it.

Synthetic fixture service is running only on **127.0.0.1:18765 inside factory-guard-test**;
no new Docker port, credentials, external calls or workflow import/activation was added.
It had zero case runs at setup. Private synthetic state is retained under
`/tmp/basic-a-us1-native/` in that container. The existing US1 row has not been reset by the
assistant during preparation. Production and issue #1 remain untouched.

Full native pilot/suite/restart/held checks are pending **owner manual import/publication** of
this reviewed test bridge, required by constitution sections I/III. Prepared runner performs
explicit inspected resets only between completed known isolated cases, with row-ID/execution
comparison and logged reasons; unknown holds stop. It never resets in error/finally cleanup.
Restart testing affects only the isolated test container. A supported UI cancellation test is
separate; do not count the helper or hard-restart result as full workflow UI cancellation.
T014 stays unchecked until actual required native results exist; no model/provider or product
acceptance is inferred from synthetic fixture preflight. Existing production schedule coverage
is not expanded by this unscheduled test bridge.

## Execution 758 — post-approval no-work poll

After explicit owner approval, the owner ran one fresh whole-workflow isolated test and supplied
the completion output: status released, outcome no_work, busy=false, execution **758**,
issue_number=null, start `2026-11-25T11:46:58.994Z`, row updated
`2026-11-25T11:46:59.591Z`. A subsequent read-only GitHub API check confirms issue #1 remains
open, only Approved, still six comments. No Building claim, duplicate refinement or state change
is observed. This passes the owner-reported post-approval no-work/guard-release exercise with
independent public state/comment-count verification. The subsequently collected native trace confirms zero countTokens/generateContent nodes for
758, as recorded above.
The reviewed import remains inactive; no production activation/build is claimed. T014 remains
open for the outstanding native edge cases, including selective 503/backoff/exhaustion and
interruption behavior. Existing local/native synthetic retry checks remain valid within their
stated limits; successful HTTP 200 execution 757 does not exercise those retry branches.

## Explicit owner approval after execution 757

The owner reported reviewing/accepting the latest refinement and replacing Ready for approval
with Approved. Read-only GitHub API verification confirmed issue #1 is open with only Approved
and still six comments. The label event **37246567614** records Approved added at
`2026-11-25T11:45:26Z` by owner ID **202449424**; event **37246567549** removed Ready for approval
at the same time by that owner. This follows the latest refinement **7161366810** and the prior
verified Ready state. No assistant label mutation or approval inference occurred.
The explicit owner approval exercise passes. The subsequent post-approval no-work behavior
passed in execution 758, recorded above. US2 reservation/approval validation and any build remain
out of scope; T014 stays unchecked for the remaining native acceptance cases.

## Execution 757 — imported retry revision, first-attempt success

The owner reported importing/saving the bounded-retry artifact, then confirmed the global row
was busy=true, execution 756, issue 1. While the workflow remained inactive, the owner reported
restoring Ideas and reposting the pending privacy request after that transition, then deliberately
cleared only busy and ran one fresh whole-workflow execution in the isolated test container.
No assistant import, row reset, workflow run or issue write was performed.

Owner-supplied completion fields identify **757**, issue 1, start
`2026-11-25T11:41:02.932Z`, idle row updated `2026-11-25T11:41:15.512Z`.
Counted input 663 + schema allowance 456 + output reserve 768 + overhead 256 = **2143/4096**.
Payload SHA-256: `079ac34ad5cb84f1d12e482be82d402b03309b9c939c1bf9f00ec4771bc2624a`.
Generation reports one attempt, HTTP 200, no provider error status and zero wait seconds.
New refinement comment **7161366810**; busy=false. This confirms the owner-reported successful
first-attempt path of the imported retry revision, not actual 503 retries or elapsed backoff.
Saved workflow version/snapshot comparison and native delayed/cancellation/restart cases remain
unrun. Earlier successful credential/guard evidence remains valid for its recorded versions.

Independent read-only GitHub API inspection confirmed issue #1 open with only managed state
Ready for approval, original title/body unchanged, six comments. The new unedited owner-authored
marked refinement was created `2026-11-25T11:41:11Z`, prompt v3/template v1, source key
`1:28e7e3bd5b7c188e5dce4f448ed5b947110e98d9597f23e058a8ff2f5241ffe6:7161350251:v3`,
captured comment IDs `[7160648812,7161350251]`, content SHA-256
`31797e093d0d62425b690ea1d6b67b2801641285cebc95d9f2f0212388b471e9`.
Public usage records 663 input / 197 output / 860 total tokens. Content review confirms the
SSH access section, placeholder details, documentation-only constraint, no service/credential/
configuration changes and the explicit privacy acceptance criterion are all present.
See [the actual refinement](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7161366810).
No questions are pending in that output. Owner semantic review/explicit approval remains the
next acceptance step; no Approved label or build is inferred from successful generation.
T014 remains unchecked, including the selective-retry live cases.

## Owner-approved bounded retry revision — 2026-11-25

The owner subsequently instructed implementation of the policy proposed after execution 756.
This supersedes the proposal-only/no-retry status below for the new source revision. Only explicit
generation HTTP 503 UNAVAILABLE retries, after 10/30 seconds, at most three attempts total.
Count once and reuse the exact payload/budget; verify singleton guard ownership, issue/source,
captured discussion and refinement history before each attempt. Longer/invalid Retry-After stops.
Other HTTP statuses, count errors, network/timeout/lost responses and invalid output stop held.
No GitHub write retry, model/prompt/template change, billing change, guard reset or replay.

Validation: **35 local graph scenario groups PASS**, including one/two retries then success,
exhaustion, noneligible failures, changed source/state/guard, interruption and Retry-After.
**291 native synthetic checks PASS** against installed n8n 2.48.8 VM parameters and Wait helpers:
226 parameter contexts, pagination/negative-index regressions, actual Wait.execute arguments
for 10/30 seconds, threshold assertions, and zero-duration core in-process behavior. Timer waits
are stubbed for Wait.execute; these checks do not prove actual elapsed delays, cancellation,
restart or the imported workflow loop. No provider requests, live workflow execution/import,
production changes or control resets were performed for this revision. T014 remains incomplete.

The owner-import file adds Read generation guard, so **eight** table mappings must reference the
same isolated control table. Existing saved GitHub/Gemini references are retained. Operational
notes, stage overview, contracts and runbooks describe the bounded loop and held failure paths.
Execution 756 remains the last acknowledged hold; confirm the current row before any recovery.

Prepared inactive owner import: `factory/local/refine-us1-retry-mapped.json`. Source SHA-256
`5f187cf3ac2fa48a1ef8f6e423495b807648d2afd1d358547326cb35d52f872f`; mapped SHA-256
`d95779c42d1626fdd4f536f286981bc5c70ab56ef1f7787640d8232c64a35ac7`.
Mapping basis: previous owner-imported token-counting artifact; preserves seven native table
parameters/schema defaults and both saved credential references, adds the same singleton mapping
to Read generation guard, and gives the two new source-read nodes the saved GitHub reference.
All Code parameters/connections equal the new source; eight table and 23 credential references
checked. Existing table filters/values match source; only native schema/default metadata differs.
The file is ignored/private; owner manual import and saved-revision comparison remain pending.

Recovery must preserve pending input: after inspecting markers and restoring Ideas, repost the
still-pending privacy acceptance request as a new owner comment before a fresh execution. A
comment posted before the new Ideas event is excluded by stage-relative source capture. Existing
captured section-title requirements remain part of the previous refinement history. Do not
resume execution 756 or run isolated provider nodes. Native retry coverage and owner approval
remain pending; previous successful traces are retained below for the versions they exercised.

## Reviewed/imported revision record

Development base: `2cd4fc0ab5070a21f54eef7a78fb955a0a0326dd` on `001-basic-a-factory`.
Owner reviewed the US1 changes and authorized commit/push on 2026-11-25. Reviewed implementation
commit: `855033ef619202e6c549833bbaba322d8ff50531`. The owner subsequently reported manual import
into the isolated test container, a fresh `factory_control_us1` table with all seven mappings,
and both saved/mapped credentials. These are owner-reported setup observations; imported version
comparison remains pending. Owner-supplied native no-work execution evidence is recorded below;
Saved Gemini countTokens/inference passed in execution 753 after the 752 provider 503. Execution 751 reached the acknowledged GitHub
Refining transition before the old size check stopped it. Later sections supersede earlier snapshots.

| Item | Recorded value |
|---|---|
| Reviewed US1 commit / PR | `855033ef619202e6c549833bbaba322d8ff50531`; owner review accepted; PR not recorded |
| Owner manual import timestamp | Owner reported import on 2026-11-25; exact time not captured |
| Isolated n8n workflow ID / imported version ID | Current token-counting workflow `sPrdMHSQ1Eubs5Oh`, successful execution 753; saved version ID still pending |
| Isolated control table mapping | Fresh `factory_control_us1`, seven mappings; 747 confirms no-work release, 751 reaches acknowledged selected-issue context and Refining transition |
| GitHub header credential mapping | Owner reports saved/mapped; execution 747 completed the workflow's issue-discovery/no-work path; credential identity/write permissions not independently verified |
| Gemini header credential mapping | Native countTokens and generateContent both HTTP 200 in 753; one generation, requested/returned model gemini-3.5-flash-lite, 576 input / 106 output tokens |
| Active project free tier / quota check | Pending owner verification before HTTP check |
| Native runtime versions | Successful output identifies prompt v3 / template v1; counted-payload digest matches the reviewed unchanged original-issue request |
| Production activation | Not performed; workflow JSON is inactive |

Prompt SHA-256: `23e9c6b21f3f31d4548d38addec6447390d3597e171fd739feee9e1403f89749`.
Template SHA-256: `027af6cfe20c7cecf09a27abb7deebf24eaffba77889a807f9636dc7fd2eae06`.
Schema file SHA-256: `a053f09d05bfa335919e3e1fd2940171e38275260e6842827db461937b652152`.
Run `sha256sum factory/workflows/refine.json` after review and record its hash with the imported
revision. The JSON's `meta.basicA` additionally fingerprints the embedded prompt, template,
canonical schema and runtime code. Mapping table/credential IDs changes the imported JSON;
record those owner-only mapping differences separately, without credential values.

## Local checks actually performed

| Check | Observed result | Limit |
|---|---|---|
| `node factory/tests/check-refinement.cjs` | PASS, 35 scenario groups including token preflight and selective retry | Exported Code bodies/connections; HTTP/Data Table stand-ins |
| `check-refinement-native-expressions.cjs` in installed test runtime | PASS, 291 native synthetic checks | 226 VM contexts, regression, pagination and stubbed Wait/core checks; no live workflows/API calls |
| `node factory/scripts/build-refine.cjs --check` | PASS | Offline packaging consistency only |
| `node factory/tests/check-guard-skeletons.cjs` | PASS, 50 scenarios | Remaining reserve/track skeletons only; no new native claim |
| Compose `config --quiet`, default and `--profile local-model-trials` | PASS with nonsecret placeholder key | Configuration only; no server rollout |
| Five requests prepared by `evaluate_gemini.cjs --prepare` compared to runtime `request()` | All five exactly equal | Offline, ignored `factory/local/us1-runtime-payload-review`; no key read or API call |
| SHA-256 known/Unicode/multiblock vectors vs Node crypto | PASS | Local transform correctness |
| Accepted output example through validator/renderer/marker parser | PASS | Offline reuse of accepted result; no new inference |
| Markdown destinations/fences and `git diff --check` | PASS, 25 local link destinations | Documentation/whitespace checks only |

Scenario groups cover owner-only intake/PR exclusion, LF canonicalization, page completeness,
captured IDs/edits/deletions, marked-comment integrity, prior revisions, later-stage discussion
exclusion, unchanged polling, next-candidate progress, reuse, strict final JSON/token/size checks,
escaped Markdown, source changes during inference, add-before-remove state transitions, unrelated
labels, no autonomous approval, failure retention and held-skip behavior. A failed release receipt
cannot report completion even if the stand-in update already committed.

The prompt v3, template v1 and schema are unchanged. Request content/configuration for the five
evaluation fixtures is identical to the existing evaluation layout. Reuse the accepted
[v3 quality evidence](gemini-v3-review.md), earlier clear-task/server evidence and unaffected
v2 injection evidence in [the evaluation](gemini-evaluation.md); no new five-case v3 model pass
is claimed. Rendering and workflow integration changed, so they receive local checks and the
pending native tests below. The [output example](../docs/refinement-example.md) renders the actual
accepted evaluation result offline; it does not substitute for a real posted workflow example.

## Concrete owner import handoff

**Documentation update, 2026-11-25**: Added explanatory notes to all operational nodes, selected
canvas subtitles and six numbered stage summaries; grouped the canvas layout by stage. Notes
are packaged from `factory/scripts/refinement-notes.cjs` so rebuilds retain them. All 21 local
refinement scenario groups and packaging consistency passed again. Comparison with the prior
JSON confirmed execution nodes, parameters, credential references, connections and workflow
settings are unchanged; differences are documentation, sticky notes and positions. The updated
At that documentation-update checkpoint JSON remained inactive and unimported. Subsequent owner
import/mapping reports are recorded above; native/live execution checks below are still UNRUN.

The constitution requires reviewed JSON and **owner manual import**, including bootstrap.
See [constitution III](../.specify/memory/constitution.md) and
[owner activation contract](../specs/001-basic-a-factory/contracts/manual-handoff.md).
No assistant import/activation, automatic deployment or bypass through a test bridge is authorized.

1. Review the diff, runtime sources, source metadata format, request bounds and tests; record
   the reviewed commit/PR above. The workflow is `factory/workflows/refine.json`, name
   **Basic A refine — US1 INACTIVE**. Do not import the reserve/track skeletons as completed stories.
2. Pause/drain all schedules. Use isolation and the existing owner editor login through SSH.
   Manually import the reviewed refine JSON; keep it unpublished/inactive. Provision a fresh
   singleton test control row or follow documented reconciliation before reusing an old hold.
   Map **every** Data Table node, including **Set issue context**, to that same isolated table.
3. Save/select two private **Header Auth** credentials: GitHub `Authorization` with the owner's
   repository-scoped token using the documented GitHub authorization scheme, and Gemini
   `x-goog-api-key` with the confirmed free-tier project key. Map GitHub's credential on every
   GitHub HTTP node and the same Gemini credential on **Gemini countTokens** and
   **Gemini generateContent**. Never paste values into JSON.
   This implementation uses an owner-owned GitHub token, so marker authors/POST receipts must
   have stable ID `202449424`. Do not substitute an automation identity without reviewed policy changes.
4. Verify the imported revision and embedded prompt/template hashes. Record n8n's workflow ID,
   version ID, manual import time and mapping-only differences. Confirm quotas before a request.
5. Run the **whole workflow** from its manual trigger, one execution at a time, while all
   schedules remain paused. Running an individual mutation/model node bypasses the guard.
   This is the actual saved-credential HTTP check; the previous container smoke test is distinct.
6. Record actual execution IDs, issue/comment/event URLs, returned model version and token counts,
   state/guard observations and sanitized errors in the matrix below. Owner judges the output's
   fidelity/checkability. No raw execution exports, headers or keys belong in this public record.

## Native observations — 2026-11-25

**Execution 747, ordinary no-work: PASS (owner-reported native output).** After confirming no
open repository issues, the owner executed the entire imported workflow in the isolated test
container and supplied its Report completion JSON. Result: `status=released`, `outcome=no_work`.
The singleton row had `id=1`, `key=global`, `busy=false`, `execution_id="747"`,
`issue_number=null`, `started_at="2026-11-25T09:19:31.403Z"` and
`updatedAt="2026-11-25T09:19:32.029Z"`. Execution context was retained after release.
This confirms the imported workflow's normal no-work exit and receipt/reread checks from the
reported final output. No raw native node trace or workflow/version ID has yet been collected;
this is not a Gemini call, selected-issue context check, write-permission proof or fault-path pass.

**Execution 748, first real issue attempt: FAILED before refinement.** Owner created
[issue #1](https://github.com/MBroholm/software-factory/issues/1), open, author `MBroholm` /
`202449424`, sole managed label `Ideas`, no comments at preflight. Native n8n 2.48.8 failed in
Read stage events at `2026-11-25T09:29:43Z` with `URL parameter must be a string, got undefined`.
Using the existing supported encrypted entity-export method, the assistant collected only a
sanitized execution trace/workflow snapshot from the isolated `factory-guard-test` container.
No credential files or instance encryption key were read and no workflow/control row was changed.
Imported workflow ID: `LCWxAPCdWrtjrRIn`; imported version ID was absent from the execution
snapshot and remains unverified. The trace confirms the loop emitted issue number 1, acquisition
context had `busy=true`, execution `748`, `issue_number=null` and start time
`2026-11-25T09:29:42.635Z`. No release, issue-write or Gemini node was reached. The owner
subsequently confirmed the current persisted row still has `busy=true` and `execution_id=748`;
this verifies failure retention for this run. A subsequent whole-workflow poll returned
`status=skipped_held` with `busy=true`, execution `748`, `issue_number=null` and unchanged start
time. Its reported row `updatedAt` remained `2026-11-25T09:29:42.650Z`; the output included
`guard_action=held`. **Post-failure held skip: PASS (owner-supplied output)**. The new poll's own
execution ID was not supplied; `748` in its control output identifies the original failed hold.
No reset, fix import or successful inference retry is claimed by this observation.

**Targeted source repair prepared, not yet imported/retried.** Read stage events now builds
its URL directly from incoming `$json.number`, avoiding the unnecessary loop-output lookup.
The generator and node note are updated; a regression checks candidate numbers 1, 2 and 123
without allowing any cross-node lookup. All 22 local scenario groups and packaging consistency
pass. The simpler expression evaluates to the expected URL in the installed test container's
native n8n expression engine using both fabricated data and execution 748's saved graph/data.
The original expression also evaluates correctly in these offline diagnostics: the precise
live-context cause is unresolved, so this is a simplification of the failing dependency, not
a claim of a proven n8n defect or successful workflow retry. A null unused loop output caused
a distinct error in a supplemental fabricated diagnostic; actual execution 748 had an empty
array there, so that hypothesis was ruled out for this run.

An ignored owner-import artifact, `factory/local/refine-us1-url-fix-mapped.json`, was prepared
from execution 748's actual workflow snapshot. It preserves all seven table mappings and 20
credential references, existing Code bodies and connections. Only the Read stage events URL
and explanatory note change in its nodes; the file is forced inactive with no pinned data.
This avoids repeating the owner's mapping work. It is not a replacement for the public source
JSON or owner review/manual import, and has not been imported or executed by the assistant.
Prepared public source SHA-256:
`698c034772095b16a9888c8d1be1630cdcac007b0d972d5a9dd8a862de6c57fe`.
Prepared mapped import artifact SHA-256:
`fd1f65629872d9df93c28dd8856f760c9829e062de5df7a4427449e9394066bc`.
The owner subsequently confirmed manual import/save of this mapped fix in the isolated test
container as a new workflow (guided name: `Basic A refine — US1 URL fix test`). Source repair
commit `e32a8d3` is pushed on `001-basic-a-factory`. New workflow/version IDs and imported revision
comparison remain pending. Immediately before recovery instructions, an authenticated GitHub
read again confirmed issue #1 open, sole state `Ideas`, zero comments. The assistant has not
reset the guard or executed the imported workflow; the deliberate owner reset/retry is pending.
Keep the failed hold until schedules are paused/drained, the issue and execution are inspected,
and the owner deliberately records/resets it for a new whole-workflow attempt. Do not resume
the failed execution or run individual nodes.

## Pending native/live acceptance matrix

### Execution 756 — repeated provider 503; bounded retry proposed

After owner feedback requesting an explicit privacy acceptance criterion, execution **756**
failed at Validate and render. Sanitized native trace confirms workflow `sPrdMHSQ1Eubs5Oh`,
start `2026-11-25T11:13:02.500Z`, stop `2026-11-25T11:13:09.186Z`, countTokens HTTP 200 with
661 tokens and reserved total 2141/4096. Counted-payload digest:
`fc2aba2d84a8f808058653fa4e07995aee2a557b00f0f7d817185f43e7eb19f1`.
Exactly one generation run returned HTTP **503 UNAVAILABLE**. No comment-post or release node
was reached; last acknowledged selected-issue context was busy, execution `756`, issue 1,
start `2026-11-25T11:13:02.603Z`. The row has not been reset by the assistant; persisted current
row confirmation remains owner-controlled. Privacy-content correction has not yet produced a
successful output and T014 remains incomplete.

The owner asked whether automatic wait/retry would make sense for provider unavailability.
The proposed narrow policy is at most two additional generation attempts after short increasing
delays, only for an explicit HTTP 503 / UNAVAILABLE response, within the same live guarded
execution. Keep busy held, use the same counted payload, check source/state before retry, never
retry GitHub writes or restart the entire workflow. Exhaustion/other failures retain the manual
hold; no automatic restart recovery, quota fallback, model switch or billing change. Attempt
counts/statuses/delays must remain visible. This is a proposal, **not an implemented or adopted
policy**: current refinement/lifecycle contracts still specify no automatic retries. A user
instruction to implement would require amending those contracts, node notes and failure tests
before reviewed owner manual import. Provider guidance on transient backoff supports considering
the change; it does not itself authorize expanding workflow behavior.

### Execution 755 — revision mechanics passed; content correction requested

The owner posted unmarked Ready-stage comment
[7160648812](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7160648812) at
`2026-11-25T11:08:33Z`: `Put the example in a dedicated section titled "SSH access"`.
Execution **755** reported released/success, issue `1`, busy false, start
`2026-11-25T11:09:37.142Z`, updated `2026-11-25T11:09:49.136Z`; provider count 604, reserved
total 2084/4096, counted-payload digest
`16592684634fc98b1d473409b283e28e1c287274e7a3cf808488d67daef689eb`.
The new [refinement 7160675431](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7160675431)
was created/updated `2026-11-25T11:09:45Z`, usage 604 input / 175 output / 779 total tokens.
It captures exactly `[7160648812]`, last included ID 7160648812, prompt v3/template v1, source
key `1:e600fc9925319701eb82d2c7ee42956531a43e019676e8a007933193bad07088:7160648812:v3`;
recomputing from the exact original issue and owner comment agrees. Rendered-body digest is
`7335f4764952548a1c86d0455e689f108d5e0639294347210612db8e7f2786ab`.

GitHub readback confirms open issue, sole Ready for approval label and three comments (initial
refinement, owner revision, new refinement). The initial refinement's body/marker and original
created/updated time remain intact. Constraints preserve privacy, placeholders, documentation-only,
no service/credential/configuration changes and the new SSH access section requirement. The
revision trigger, captured input, history preservation, output and guard-release mechanics pass
from owner native output plus independent public readback; its full reached-node trace remains
to be collected with the final acceptance traces.

Assistant content review found an explicit privacy acceptance check was lost: privacy remains
in Constraints, but the new criteria cover the section, tunnel/placeholder example and no config
changes without explicitly checking that the editor stays private. This is recorded as a model
content gap, not a successful full semantic acceptance or transport/schema failure. Do not
silently approve it or change prompt/model/budget automatically. Next owner feedback requests
an explicit privacy acceptance criterion while retaining every existing constraint and the
SSH access section. Successful follow-up content review/approval remain pending.

### Execution 754 — unchanged poll passed

The owner supplied native Report completion: `status=released`, `outcome=no_work`, row busy
false, execution `754`, issue context null, start `2026-11-25T11:06:06.418Z`, updated
`2026-11-25T11:06:07.843Z`. Independent GitHub readback confirms issue #1 remains open with
sole state Ready for approval and exactly one comment. The existing marked comment was authored
by the owner credential, so this exercises repeat suppression despite shared human/factory
actor identity. No new issue input or output was introduced. The exported native reached-node
trace for 754 has not yet been collected; explicit omission of count/generation nodes can be
confirmed with the remaining acceptance traces before T014 closeout. Next: owner adds a new,
unmarked Ready-stage revision comment; do not edit the issue body or previous refinement.

### Execution 753 — initial real refinement passed

After owner-directed recovery from the 503, **execution 753 succeeded** in isolated workflow
`sPrdMHSQ1Eubs5Oh` from `2026-11-25T10:50:13.241Z` to `2026-11-25T10:50:25.254Z`. The owner
supplied Report completion and independently observed `busy=false`, execution `753` in the row.
Supported sanitized native trace collection confirms both provider nodes returned HTTP 200,
**one** generation ran, all comment/label acknowledgement checks passed, and release receipt,
persisted idle reread and Report completion were reached. Count was **576**; reserved total
**2056 / 4096**; counted-payload digest remained
`7a9d928a58b735097db615109efb0ac5da4bfbd6b50066413e7678b3f5f0f1fe`.
Returned model version: `gemini-3.5-flash-lite`; usage 576 input, 106 candidate, 682 total tokens.

Live output: [issue #1 refinement comment 7160240711](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7160240711),
created/updated `2026-11-25T10:50:21Z`, author `MBroholm` / `202449424`. GitHub readback confirms
issue open, exactly one comment and sole managed state **Ready for approval**, no Approved.
Marker source key:
`1:42ae956a6c1578a3a61849dfdda95d95c048f08bc4569138ac2bb9c552ebabd8:0:v3`;
captured IDs empty, last included ID 0, prompt v3/template v1; rendered-body digest
`36ad6e8c25d7d71675579272c40ecacc5a1172c53c30eceb2b0566acb947262a`.
Final control: key global, busy false, execution `753`, issue `1`, start
`2026-11-25T10:50:13.292Z`, updated `2026-11-25T10:50:25.212Z`.

Assistant semantic assessment: goal and all supplied privacy/placeholder/documentation-only/
no-service-credential-config-change constraints are preserved; four acceptance criteria cover
them, no scope or approval was invented, and no material question is evident in this bounded
input. The owner's content review remains separate from the technical execution result.
This completes **T012**'s actual saved-credential/HTTP/validated-rendering integration checkpoint;
the unchanged prompt/template quality evidence and optional Ollama source configuration were
already checked. It does not complete T014 or count as a completed manual build/PR run.
Next exercise is a whole-workflow unchanged poll with no issue edits: expect no provider calls,
no additional comment, unchanged Ready state and acknowledged no-work release.

### Execution 752 — native count succeeded, provider generation unavailable

Owner reported Validate and render stopped after Gemini generateContent returned HTTP 503 /
`UNAVAILABLE`. Supported sanitized execution export confirms **752**, current workflow
`sPrdMHSQ1Eubs5Oh` (`Basic A refine — US1 token counting test`), from
`2026-11-25T10:42:55.287Z` to `2026-11-25T10:43:05.914Z`. Native countTokens returned **HTTP 200,
576 tokens**; Check token budget passed at **2056 / 4096**, including schema 456, output 768,
overhead 256. Its payload digest was
`7a9d928a58b735097db615109efb0ac5da4bfbd6b50066413e7678b3f5f0f1fe`, matching the standalone
count-only check of the original unshortened issue. This is actual saved-credential/native HTTP
count validation, not a synthetic fixture or standalone substitution.

Exactly **one** native generation node run is recorded. It returned HTTP 503 /
`UNAVAILABLE`; Validate and render threw as designed. No comment-post or release node was
reached. Last acknowledged selected-issue guard context was busy, execution `752`, issue `1`,
start time `2026-11-25T10:42:55.361Z`. Current persisted row confirmation is pending owner
inspection; no reset was performed. Fresh GitHub readback confirms issue #1 open, sole state
`Refining`, zero comments. No false Ready, duplicate output, automatic retry, model switch,
billing change or assistant inference call occurred.

The provider [troubleshooting guide](https://aistudio.google.com/docs/troubleshooting#retry-strategy)
treats 503 as a transient failure. No wider service incident was verified: the status page did
not expose usable incident information through the read tool. Keep this recorded as a provider
503 response rather than claiming a confirmed global outage or changing workflow code/credentials.
The existing fail-stop policy still applies despite generic provider advice about automatic
backoff. Owner may wait, inspect the hold and GitHub state, restore Ideas and explicitly reset
only busy for one fresh whole-workflow attempt. Do not resume failed execution 752 or run an
individual provider node. Successful inference/output and T012/T014 completion remain pending.

### Owner-approved token-counting revision — 2026-11-25

After the input-screen stop, the owner explicitly approved replacing whole-input bytes-as-tokens
with a real provider count. The prior suggestion to shorten issue #1 is withdrawn for the next
test: its original wording is acceptable under the new token preflight. Prompt v3, template v1,
output schema, requested model, generation payload and 4096-token application ceiling are unchanged.

Subsequent sanitized export, selected by reached-node history rather than missing error-node
metadata, identified **execution 751** in workflow `MoMw34RHi9qqfEIB`, stopped at Prepare Gemini
with the size error. Acquisition started `2026-11-25T10:12:30.106Z`; its acquisition receipt
was busy with execution `751`. The trace reaches Set issue context and its check, acknowledged
add Refining/remove Ideas checks, then the source rereads and Prepare Gemini. It does not reach
inference or release. No row reset or state repair was performed by the assistant.

The new runtime sends the complete prepared payload under `generateContentRequest`, including
`model=models/gemini-3.5-flash-lite`, to countTokens with the existing Gemini header credential.
It requires positive safe-integer `totalTokens` and gates inference on count + 456 fixed schema
allowance + 768 output + 256 overhead <= 4096. The fixed allowance remains conservative because
public explanations of schema counting differ and do not establish an upper-bound guarantee;
actual generation prompt/output usage is still checked before publishing. A separate 32 KiB
serialized-generation-payload transport cap bounds data transfer without estimating tokens.
Nothing is silently truncated. Count failures, invalid counts and oversized budgets retain busy;
there is no fallback or retry. Reused output skips count and inference. Successful completion
reports the preflight budget and counted-payload digest.

**Provider format/sizing check: PASS.** One HTTPS countTokens-only request using the original
public issue text and the existing private evaluation key returned HTTP 200 at
`2026-11-25T10:28:00.257Z`, with **576 counted input tokens**. With schema/output/overhead
reserves, total admission is **2056 / 4096**. No inference request, billing change, GitHub/n8n
mutation or automatic retry occurred. The preceding sandboxed attempt failed before a response;
it is recorded as a connectivity attempt, not a provider retry/pass. The actual saved n8n
credential/node path remains pending owner import and execution. Only sanitized count/budget
results are retained in this public record; private request/result files remain ignored.

The new tests were first run against the old graph and failed because token preflight was
absent. After implementation, **27 local groups pass**, including the original issue unchanged,
exact equality of counted/generated payloads, the 4096 boundary, schema/output reserves,
missing/invalid/oversized counts, count errors/response loss, no inference on failure, held skip,
transport oversize and existing-output reuse. **223 native VM expression checks pass**, covering
the new count body and existing paths. The first VM check caught object-spread syntax in an HTTP
expression; request wrapping was moved into Prepare Gemini Code and the HTTP node now reads
only `$json.count_payload`. No defective revision was imported. The checker now reports exact
node/parameter context on a diagnostic error. Full native count/inference/issue exercises remain
pending. Existing five-case semantic evidence is reused because inference inputs are unchanged.

Prepared owner-import artifact: `factory/local/refine-us1-token-counting-mapped.json`.
It uses the current public source, preserves all seven Data Table mappings and 20 existing
credential references from execution 751, and maps the new count node to the same saved Gemini
credential (21 references total). Owner table schemas/settings are preserved; all Code bodies
and connections match the current source. It is inactive with empty pinned data. Public JSON
SHA-256: `2e88e9b7d5418b97082736f35edeef1aeb2cb05a13cfcb5cc61a827261cac4d2`.
Mapped artifact SHA-256: `7d4ea93cc0b7dad4d7195e46183e77a4fa78bd9da8248da3ecf1dc49be5339af`.
Earlier URL/VM-only mapped files are superseded for the next attempt. Owner review/manual import,
current held-row confirmation and deliberate recovery of stranded Refining still precede retry.

The owner subsequently confirmed manual import/save of the token-counting artifact in the
isolated test container (guided name: `Basic A refine — US1 token counting test`) and that the
control row still identifies execution 751. Source revision `2f64f85` is committed/pushed;
new workflow/version IDs remain pending. Fresh readback confirms issue #1 open, sole state
`Refining`, zero comments. The assistant has not reset the row, changed labels or executed the
workflow. Owner recovery must first replace stranded Refining with Ideas, preserving the original
source, then reset only busy while schedules are paused/drained and start a fresh whole-workflow
attempt. Actual saved-credential count/inference results are not yet observed.

API format checked against the [Google API definition](https://github.com/googleapis/googleapis/blob/master/google/ai/generativelanguage/v1beta/generative_service.proto).
Public schema-counting caveats are discussed in the [model-specific clarification](https://discuss.ai.google.dev/t/gemini-3-5-flash-lite-counttokens-pricing-quota-schema-coverage-and-thinking-cap/189068)
and [general clarification](https://discuss.ai.google.dev/t/gemini-api-counttokens/188451). The
conservative schema allowance is an application choice, not a claimed provider upper bound.

### Input-screen stop after the VM fix

The owner reported the next execution stopped in Prepare Gemini with
`Oversize input; owner must shorten/split, no truncation`. Execution ID/current guard context
are not yet supplied; an attempted sanitized export filtered by error-node metadata returned no
matching record and is not treated as a native trace. GitHub readback confirms issue #1 is open,
sole state `Refining`, with zero comments: unlike the earlier URL failures, this attempt reached
the Refining transition. The size exception occurs before Gemini generateContent; no model call
or successful output is claimed. The owner is instructed to leave state/guard held for recovery.

Local reproduction using the exact public issue text and unchanged runtime artifacts yields
3,147 input bytes against the deliberately conservative 3,072-byte screen (4096 comparison
envelope minus 768 output / 256 overhead reserve). System prompt/template account for 2,271
bytes; schema 456; issue data/delimiter 420. The assistant-provided issue wording therefore
exceeds this screen by 75 bytes. The guard is working as configured; do not silently raise
limits, truncate input or misrepresent bytes as Gemini's actual input-token count.

A proposed owner shortening retains the path, short SSH tunnel example, existing editor,
privacy/placeholders and documentation-only/no service/credential/config-change constraints:
title `n8n SSH docs`; body `factory/README.md: short SSH tunnel example for existing n8n editor. Private editor; placeholders; docs only; no service/credential/config changes.`
The actual runtime request builder accepts it at 3,004 bytes. A bounded later owner comment,
`Add an SSH access heading.`, also fits at 3,058 bytes with a conservative 11-digit comment ID.
These are offline input-screen checks only; the owner has not yet edited the issue, restored
Ideas, reset the inspected hold or retried. No workflow/code/model-limit change is needed for
this bounded test. Larger useful inputs remain constrained by the current conservative policy;
replacing it with provider token counting would require a separately reviewed design change.

### Execution 750 — root cause reproduced and repaired

The owner reported another failure, this time in Read source comments at
`2026-11-25T09:51:14Z`. Supported encrypted export confirmed execution `750`, workflow
`5SviHhy3LypzrSTl`, acquired busy with start time `2026-11-25T09:51:13.793Z`. The corrected
Read stage events node succeeded, then Read source comments failed with
`URL parameter must be a string, got undefined`. No issue-write, Gemini or release node was
reached. The owner subsequently confirmed the persisted row still has `busy=true` and
`execution_id=750`, verifying retention for this second failure. Held-skip was already verified
after execution 748; a separate held-skip poll after 750 has not been requested or claimed.

The earlier diagnostics imported `n8n-workflow` without initializing its service expression
engine; standalone evaluation defaults to **legacy**, while installed n8n 2.48.8 service
configuration defaults to **VM**. This explains why those diagnostics accepted the old lookup.
With VM explicitly initialized, the real node-parameter resolver reproduced the failure:
`.first(1, -1)` returned undefined, including without URL parentheses. `.first(1)` returned the
expected URL, including with parentheses. Direct `$json` and legacy `$node` alternatives also
worked. Thus the previous unresolved-cause statement is superseded: the explicit negative
run-index argument is the reproduced VM compatibility problem. No engine configuration change,
service restart, relaxed sandbox, additional workflow node or provider change is required.

The generator now uses `.first(1)` for the remaining candidate URL and for Plan revision.
The node note and persistent workflow instructions document this compatibility rule. Local tests
reject explicit negative run indices in node parameter expressions. Synthetic fixture generation
preserves multiple loop-iteration histories and covers initial refinement, empty/unchanged polls,
later candidates, owner revision, reused output and held skip. The new native checker explicitly
initializes VM and calls the installed node-parameter resolver for **164 parameter contexts**,
including later issue-label/comment writes, Gemini request body and selected-issue table fields.
The old failing lookup is also asserted to return undefined, the corrected lookup to return the
expected URL, and all paginated HTTP nodes' page/completion expressions are checked. **220 native
VM expression checks passed**, alongside 23 local groups and packaging consistency. These run
in a separate diagnostic process with synthetic data: no workflow/node execution, HTTP/model
request, credential access, import, guard reset or change to the running service occurred.

Generate the synthetic fixtures from repository root with
`node factory/tests/check-refinement.cjs --native-fixtures`. On a host with the pinned n8n
packages installed, run the checker with the n8n installation root as its optional argument
and `factory/local/refinement-native-expression-fixtures.json` on stdin. This session bundled
the checker and synthetic fixtures temporarily and ran them via SSH/stdin in the existing
isolated container. Do not treat standalone legacy evaluation as a VM regression pass.

The new ignored owner-import artifact is `factory/local/refine-us1-vm-fix-mapped.json`, prepared
from execution 750's workflow snapshot. Only Read source comments and Plan revision parameters/
notes change; all seven table mappings, 20 credential references and connections are preserved.
All Code bodies match the current source after the fix. It is inactive with empty pinned data,
not yet imported or retried. Public JSON SHA-256:
`61d904ea12789dbfbe988bbdb0d989c9322f566ca15d7f7adb8193b37d1476f6`.
Mapped artifact SHA-256:
`3dc9592c6e3c02778a4ebe4ee3c52b789d9a1132db33c4c800b34a49a6587394`.
The earlier `refine-us1-url-fix-mapped.json` is superseded and must not be used for the next
attempt. Owner manual review/import and deliberate inspected-hold recovery still gate retry;
actual Gemini credential use and a successful refinement remain unvalidated.

The owner confirmed manual import/save of the VM fix in the isolated test container (guided
name: `Basic A refine — US1 VM fix test`), then confirmed the row is held by execution 750.
Source revision `d4db51b` is committed/pushed. New workflow/version IDs and snapshot comparison
remain pending. A fresh GitHub read before recovery instructions confirmed issue #1 remains
open, sole state `Ideas`, zero comments. No assistant reset or workflow execution occurred;
the owner is being guided to reset only busy, preserve diagnostic context and start a new
whole-workflow execution. Successful runtime inference and the rest of T012/T014 remain pending.

Follow [quickstart section 6](../specs/001-basic-a-factory/quickstart.md#6-end-to-end-and-edge-case-validation)
and [guard fault setup](../factory/tests/guard-scenarios.md). Use isolated test copies for deliberate
faults, not production. No fixture-only test below counts as a real owner issue/approval exercise.

| Exercise | Required observation | Actual evidence / outcome |
|---|---|---|
| Empty repository, acquired no-work release | Whole-workflow poll reports released/no_work and idle row with retained context | PASS: owner-supplied execution 747 output, 2026-11-25; details above |
| Owner Ideas issue + actual saved Gemini credential | Refining before one count + at most one inference, marked valid output, Ready, idle guard; model version/usage recorded | PASS execution 753, native trace + owner row/output + public comment. Prior 748/750/751/752 failures retained above |
| Owner revision while Ready | One new output; captured source IDs and previous output preserved; guard released | PASS revision mechanics 755; corrected privacy criterion and previous constraints verified in 757 output, subsequently accepted by owner |
| Unchanged poll + owner-authored factory marker | No inference/duplicate output/loop; idle guard | PASS 754 owner no-work/idle output + public unchanged state/comment count; native trace now confirms zero count and generation calls |
| Non-owner/PR/closed input; non-owner discussion | No processing/trigger; ordinary acquired no-work releases | UNRUN; identify native vs fixture inputs honestly |
| Multiple pages; first candidate unchanged | Later eligible candidate processed once; no missed pages | UNRUN |
| Captured edit/deletion or source change during inference | Visible failure/held guard; no stale publication or inferred approval | UNRUN |
| Malformed output / quota/API failure | Failed execution and held flag, no Ready success or retry | Native 752 API-503 stop with no post/release reached; current persisted hold confirmation pending. Malformed output and quota variants remain unrun |
| Unknown comment POST / partial label transition | Hold; later poll skips with unchanged context; owner reconciles before reset | UNRUN |
| Unexpected exception before/after side effect | Guard remains busy; next whole-workflow poll skips; no unconditional release | UNRUN |
| Stranded Refining / conflicting labels | No auto-resume or guessed transition; held failure | UNRUN |
| Initial explicit approval | Before owner action: Ready only. Owner removes Ready and explicitly adds Approved; record owner event ID/time and latest refinement URL | PASS: owner event 37246567614 at 2026-11-25T11:45:26Z, actor 202449424, latest refinement 7161366810; details above |
| Poll after approval | Refine leaves Approved alone; no Building claim (US2 not implemented) | PASS: 758 owner released/no_work/idle output; public issue remains Approved with six comments |

Approval validation/reservation belongs to US2 T015+, which remains out of scope. This story
demonstrates explicit owner approval and that refinement never grants it. Append a real posted
output/example URL after the native run. Mark T012 and T014 complete only once their required
credential/import/live evidence actually exists. Retain failures, retries and manual interventions.

## Source checks

HTTP pagination/full-response and loop-output configuration were checked against primary
[n8n HTTP node source](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts),
[loop source](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/SplitInBatches/v3/SplitInBatchesV3.node.ts)
and [GitHub label API](https://docs.github.com/en/rest/issues/labels).
These source checks are not execution proof for the pinned deployment.
