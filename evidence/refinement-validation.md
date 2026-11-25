# US1 refinement validation

**Date**: 2026-11-24. **Status**: T010/T011/T013 implemented and locally checked;
T012 source integration prepared, saved credential/native HTTP check **UNRUN**;
T014 owner manual import/mappings reported complete; live issue/revision/approval exercises **UNRUN**.
This document is a handoff for review, not evidence of activation or a completed real run.

## Reviewed/imported revision record

Development base: `2cd4fc0ab5070a21f54eef7a78fb955a0a0326dd` on `001-basic-a-factory`.
Owner reviewed the US1 changes and authorized commit/push on 2026-11-25. Reviewed implementation
commit: `855033ef619202e6c549833bbaba322d8ff50531`. The owner subsequently reported manual import
into the isolated test container, a fresh `factory_control_us1` table with all seven mappings,
and both saved/mapped credentials. These are owner-reported setup observations; imported version
comparison remains pending. Owner-supplied native no-work execution evidence is recorded below;
Gemini credential use and actual issue writes remain unrun.

| Item | Recorded value |
|---|---|
| Reviewed US1 commit / PR | `855033ef619202e6c549833bbaba322d8ff50531`; owner review accepted; PR not recorded |
| Owner manual import timestamp | Owner reported import on 2026-11-25; exact time not captured |
| Isolated n8n workflow ID / imported version ID | Pending capture/verification |
| Isolated control table mapping | Owner reports fresh `factory_control_us1`, all seven mappings saved; execution 747 confirms no-work acquisition/release, selected-issue context path unrun |
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
| `node factory/tests/check-refinement.cjs` | PASS, 22 scenario groups after execution-748 URL fix | Exported Code bodies/connections; HTTP/Data Table stand-ins |
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
   GitHub HTTP node and Gemini's only on **Gemini generateContent**. Never paste values into JSON.
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
this verifies failure retention for this run. Later held-skip behavior remains unchecked.

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
Keep the failed hold until schedules are paused/drained, the issue and execution are inspected,
and the owner deliberately records/resets it for a new whole-workflow attempt. Do not resume
the failed execution or run individual nodes.

## Pending native/live acceptance matrix

Follow [quickstart section 6](../specs/001-basic-a-factory/quickstart.md#6-end-to-end-and-edge-case-validation)
and [guard fault setup](../factory/tests/guard-scenarios.md). Use isolated test copies for deliberate
faults, not production. No fixture-only test below counts as a real owner issue/approval exercise.

| Exercise | Required observation | Actual evidence / outcome |
|---|---|---|
| Empty repository, acquired no-work release | Whole-workflow poll reports released/no_work and idle row with retained context | PASS: owner-supplied execution 747 output, 2026-11-25; details above |
| Owner Ideas issue + actual saved Gemini credential | Refining before exactly one HTTP call, marked valid output, Ready, idle guard; model version/usage recorded | FAILED execution 748 on issue #1 at Read stage events, before inference/writes; source repair prepared, owner import/retry pending |
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
