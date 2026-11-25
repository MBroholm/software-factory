# Runtime refinement design — template/schema v1, prompt v3

## Ownership and scope

`.specify/templates/` guides development specifications, plans and tasks. It is not a runtime
source for the factory. Runtime artifacts are `factory/templates/task.md`,
`factory/prompts/refinement.md` and `factory/templates/refinement.schema.json`. The schema is a
machine-readable copy of the approved refinement contract, not an additional output format.
T004's actual evaluation and owner review are complete; T012's final integration remains unrun.
The owner-approved prompt v2 trial addresses v1's observed loss of explicit constraints and
invented policies/criteria. It changes no schema, template, fixture or runtime limit. See
[baseline evidence](../evidence/ollama-evaluation.md) and [v2 trial steps](ollama-v2-trial.md).
The owner then approved prompt v3's targeted clarification: acceptance criteria must include
observable checks for the goal and each constraint. The existing rule keeps unresolved checks
pending owner decisions. A single Gemini clear-task rerun passed, covering the privacy check
missing from v2. Subsequent targeted ambiguity/revision/conflict runs passed v3; the unaffected
injection case retains v2 evidence. See the versioned results in
[Gemini evaluation](../evidence/gemini-evaluation.md). The owner adopted Gemini 3.5 Flash-Lite
on 2026-11-24; provider choice is now resolved, with deployment integration still pending.
This is a design choice rather than a course requirement. The unchanged runtime fields and
human review boundary apply equally to hosted refinement; no provider framework is added.

## US1 runtime integration (2026-11-24)

T012 retains the accepted v3 prompt, v1 template and schema byte-for-byte. All five fixture
requests match the evaluation layout/configuration; no additional model benchmark was needed.
Native saved-credential/node verification and live owner review remain pending in
[refinement validation](../evidence/refinement-validation.md). The
[example](refinement-example.md) renders an actual accepted evaluation result offline.

`factory/scripts/refinement-runtime.cjs` contains deterministic transforms;
`factory/scripts/build-refine.cjs` embeds them and the reviewed runtime artifacts in inactive
`factory/workflows/refine.json`. `--check` detects stale packaged sources without changing them.
There is no server-side file/template loader, module allowlist expansion or tool-enabled model.
`factory/scripts/refinement-notes.cjs` supplies owner-facing notes for every operational node,
selected short canvas subtitles and six numbered stage summaries. The builder preserves this
documentation when regenerating JSON and groups the node layout by stage. Notes explain each
node's purpose, relevant branch/write behavior and failure implications; they do not alter execution.
HTTP Request nodes alone perform authenticated API calls, with no automatic retries/redirects.
Non-success HTTP statuses reach explicit checks and throw; they never fall through to release.

The workflow selects open owner tasks in issue-number order, excludes PRs, and reads complete
paginated lists (100 items/page; a 100-page cap fails closed rather than accepting partial data).
One unchanged Ready candidate does not block a later idea; at most one revision is processed per
execution. No-work releases the acquired short-lived guard. A selected issue number is written
to its guard context and validated on release. A stranded Refining or conflicting task state
holds rather than resuming. Unlabelled ordinary issues are outside labelled factory intake.

Canonical JSON has field order `title`, `body`, `owner_comments`; comments sort numerically by
ID and have field order `id`, `body`. Text uses LF and UTF-8 SHA-256. A first Ideas revision
includes unmarked owner comments since its current Ideas label event. Further revisions retain
the previous captured set and add only newer owner comments posted during the current
Ideas/Ready label stage. Comments from intervening coding/QA stages do not automatically become
source. Missing stage history, changed/deleted captured source or malformed/edited output
evidence requires owner recovery. Title/body edits to captured scope also stop conservatively.

The first comment line is `<!-- factory:refinement:v1 {JSON metadata} -->`. Metadata records
issue number, canonical source digest, sorted captured IDs, last captured ID (0 if none),
prompt/template versions, key `issue:digest:last-id:prompt-version`, and SHA-256 of the remaining
rendered body. These are evidence fields, not a ledger or cryptographic owner authorization.
Factory-prefixed v1 comments are excluded even when authored by the owner's PAT. Old revisions
remain intact. An exact source match can be reused after deliberate owner return to Ideas;
Refining never auto-resumes. No path adds Approved or executes model-supplied instructions.

Before mutation/inference/publication the workflow re-reads source and state; edits or new
discussion during the call hold for inspection. It validates one STOP candidate, final JSON,
schema keys/types/size, actual tokens and model version. Only the trusted template renders
headings/checkboxes; model text is escaped to prevent injected markers, headings and mentions.
Returned thought parts are excluded. Comment/label receipts and final source/state are checked
before guard release. Unknown writes and partial add-before-remove label transitions hold;
the existing manual recovery protocol applies. This follows the supported single-writer/manual
operator discipline and does not promise atomic GitHub updates against concurrent human clients.

## Why these fields

| Field | Purpose | Source |
|---|---|---|
| Goal | State the requested outcome plainly | Brief; constitution II; FR-003 |
| Why / rationale | Preserve the reason supplied by the owner; do not invent business needs | Brief's suggested template; chosen field, required by the approved output contract |
| Constraints | Keep scope and limits visible to the coding agent and reviewer | Constitution II; FR-003 |
| Acceptance criteria | Give the owner observable checks for the result | Brief; constitution II; FR-003 |
| Questions | Expose material missing choices/conflicts instead of silently deciding | Brief; constitution II; FR-003/008 |
| Source metadata | Identify the revision that approval refers to | Planned traceability design; supplied by trusted workflow code, not the model |

Array output makes constraints, criteria and questions predictable to validate and render. Empty
constraint/question arrays mean none applies; acceptance criteria may not be empty. The output
schema forbids extra fields. These formatting choices come from the approved contract, not a
mandate to run SpecKit per factory task. A valid JSON shape does not prove a useful refinement.

## Why these instructions

The prompt confines the model to rewriting and asking questions. Task text is untrusted data;
it cannot authorize tools, secret access, state changes or approval. Missing information stays a
question. Explicit prior constraints survive an owner revision unless changed explicitly.
This implements human control and avoids using an LLM to infer approved scope.

The model returns JSON; trusted workflow code will render the fixed Markdown template and add
source-key/digest/comment references and version identifiers. `{{...}}` tokens in the template
are intentional rendering slots, not unresolved feature decisions. Lists will render as bullets;
empty constraints/questions will render a plain "None stated" / "None" rather than invented items.
T011/T012 will implement that rendering and metadata; T003 supplies only its reviewed inputs.

## Historical local-model trial

The initial candidate is local `qwen3:4b-instruct`, not the similarly named thinking tag. The
draft trial uses one inference at a time, 4096-token context, 768 output-token limit,
temperature 0, non-streaming schema output and a 120-second request deadline. These are measured
recommendations, not claims of suitable hardware or quality. No tools or paid fallback are used.

The five synthetic fixtures check a clear task, missing decisions, an owner revision, conflicting
constraints and injected instructions. Each includes owner-review assertions that are not sent
to the model. The preparation helper only builds requests and artifact hashes offline. The
measurement helper runs only when explicitly invoked in the server's n8n container; it checks
the bundled schema/completion and emits timing/token counts, never a semantic pass decision.

The preparation helper conservatively screens UTF-8 input size with output/overhead reserve;
it is not a model-specific tokenizer. T004 must inspect actual token counts, valid completion,
memory and content. A large advertised model context does not justify silently truncating input.
If any case cannot fit, shorten/split it or deliberately revise and retest the limits.

## Review and change control

Record prompt/template/schema hashes and tested image digests in T004 evidence. For the adopted
Gemini API record requested model ID, returned version, token usage and latency; no hosted model
digest or remote peak RAM is available. Keep original failed local-model digest/results as evidence.
If the prompt/template changes materially, assess and run missing/change-affected checks before
integration, preserving unchanged evidence and tested versions. The first workflow-generated
validated output example belongs to T014; current synthetic examples are model trials only.
When workflow JSON exists, changes are reviewed in a pull request and the owner manually imports
it, verifying these runtime versions. No automatic workflow importer, runner or recovery engine
is added. The single shared guard and manual-recovery tradeoff remain later implementation work.
