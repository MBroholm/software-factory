# US1 refinement validation

**Date**: 2026-11-24. **Status**: T010/T011/T013 implemented and locally checked;
T012 source integration prepared, saved credential/native HTTP check **UNRUN**;
T014 owner manual import and live issue/revision/approval exercises **UNRUN**.
This document is a handoff for review, not evidence of activation or a completed real run.

## Reviewed/imported revision record

Development base: `2cd4fc0ab5070a21f54eef7a78fb955a0a0326dd` on `001-basic-a-factory`.
The US1 changes are a working-tree diff, not yet a reviewed commit. Before import, record the
actual reviewed commit here; the base commit must not be described as the imported US1 version.

| Item | Recorded value |
|---|---|
| Reviewed US1 commit / PR | Pending owner review |
| Owner manual import timestamp | UNRUN |
| Isolated n8n workflow ID / imported version ID | UNRUN |
| Isolated control table mapping | UNRUN; do not reuse/reset the deliberately held T008 row blindly |
| GitHub header credential mapping | UNRUN; private credential reference only |
| Gemini header credential mapping | UNRUN; private credential reference only |
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
| `node factory/tests/check-refinement.cjs` | PASS, 21 scenario groups | Exported Code bodies/connections; HTTP/Data Table stand-ins |
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
JSON remains inactive and unimported; native/live checks below are still UNRUN.

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

## Pending native/live acceptance matrix

Follow [quickstart section 6](../specs/001-basic-a-factory/quickstart.md#6-end-to-end-and-edge-case-validation)
and [guard fault setup](../factory/tests/guard-scenarios.md). Use isolated test copies for deliberate
faults, not production. No fixture-only test below counts as a real owner issue/approval exercise.

| Exercise | Required observation | Actual evidence / outcome |
|---|---|---|
| Owner Ideas issue + actual saved Gemini credential | Refining before exactly one HTTP call, marked valid output, Ready, idle guard; model version/usage recorded | UNRUN |
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
