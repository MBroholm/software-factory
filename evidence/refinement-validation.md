# US1 refinement validation

**Date**: 2026-11-24. **Status**: T010/T011/T013 implemented and locally checked;
T012 source integration prepared, saved credential/native HTTP check **UNRUN**;
T014 owner manual imports/mappings and failed live attempts recorded; successful refinement,
revision and approval exercises remain **UNRUN**. Token-counting revision is prepared, not imported.
This document is a handoff for review, not evidence of activation or a completed real run.

## Reviewed/imported revision record

Development base: `2cd4fc0ab5070a21f54eef7a78fb955a0a0326dd` on `001-basic-a-factory`.
Owner reviewed the US1 changes and authorized commit/push on 2026-11-25. Reviewed implementation
commit: `855033ef619202e6c549833bbaba322d8ff50531`. The owner subsequently reported manual import
into the isolated test container, a fresh `factory_control_us1` table with all seven mappings,
and both saved/mapped credentials. These are owner-reported setup observations; imported version
comparison remains pending. Owner-supplied native no-work execution evidence is recorded below;
Saved Gemini credential use remains unrun; execution 751 reached the acknowledged GitHub
Refining transition before the old size check stopped it. Later sections supersede earlier snapshots.

| Item | Recorded value |
|---|---|
| Reviewed US1 commit / PR | `855033ef619202e6c549833bbaba322d8ff50531`; owner review accepted; PR not recorded |
| Owner manual import timestamp | Owner reported import on 2026-11-25; exact time not captured |
| Isolated n8n workflow ID / imported version ID | Latest failed VM-fix workflow `MoMw34RHi9qqfEIB`, execution 751; saved version ID still pending |
| Isolated control table mapping | Fresh `factory_control_us1`, seven mappings; 747 confirms no-work release, 751 reaches acknowledged selected-issue context and Refining transition |
| GitHub header credential mapping | Owner reports saved/mapped; execution 747 completed the workflow's issue-discovery/no-work path; credential identity/write permissions not independently verified |
| Gemini header credential mapping | Owner reports saved/mapped; actual generateContent check UNRUN |
| Active project free tier / quota check | Pending owner verification before HTTP check |
| Native runtime versions | Prompt v3 / template v1; verification UNRUN |
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
| `node factory/tests/check-refinement.cjs` | PASS, 27 scenario groups including token preflight | Exported Code bodies/connections; HTTP/Data Table stand-ins |
| `check-refinement-native-expressions.cjs` in installed test runtime | PASS, 223 VM checks | 167 synthetic parameter contexts, regression and pagination; no nodes/workflows/API calls executed |
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
| Owner Ideas issue + actual saved Gemini credential | Refining before exactly one HTTP call, marked valid output, Ready, idle guard; model version/usage recorded | FAILED 748 at Read stage events, then 750 at Read source comments; both before inference/writes. VM cause reproduced and source repaired; manual import/retry pending |
| Owner revision while Ready | One new output; captured source IDs and previous output preserved; guard released | UNRUN |
| Unchanged poll + owner-authored factory marker | No inference/duplicate output/loop; idle guard | UNRUN |
| Non-owner/PR/closed input; non-owner discussion | No processing/trigger; ordinary acquired no-work releases | UNRUN; identify native vs fixture inputs honestly |
| Multiple pages; first candidate unchanged | Later eligible candidate processed once; no missed pages | UNRUN |
| Captured edit/deletion or source change during inference | Visible failure/held guard; no stale publication or inferred approval | UNRUN |
| Malformed output / quota/API failure | Failed execution and held flag, no Ready success or retry | UNRUN |
| Unknown comment POST / partial label transition | Hold; later poll skips with unchanged context; owner reconciles before reset | UNRUN |
| Unexpected exception before/after side effect | Guard remains busy; next whole-workflow poll skips; no unconditional release | UNRUN |
| Stranded Refining / conflicting labels | No auto-resume or guessed transition; held failure | UNRUN |
| Initial explicit approval | Before owner action: Ready only. Owner removes Ready and explicitly adds Approved; record owner event ID/time and latest refinement URL | UNRUN |
| Poll after approval | Refine leaves Approved alone; no Building claim (US2 not implemented) | UNRUN |

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
