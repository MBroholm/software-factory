# Runtime refinement design — draft v1

## Ownership and scope

`.specify/templates/` guides development specifications, plans and tasks. It is not a runtime
source for the factory. Runtime artifacts are `factory/templates/task.md`,
`factory/prompts/refinement.md` and `factory/templates/refinement.schema.json`. The schema is a
machine-readable copy of the approved refinement contract, not an additional output format.
The draft remains subject to T004's actual server evaluation and T012's final integration.

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

## Small local-model trial

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

Record prompt/template/schema hashes, candidate model digest and image digests in T004 evidence.
If the prompt/template changes materially, repeat the bounded trial before integration. The
first validated output example belongs to T014; none has been generated here.
When workflow JSON exists, changes are reviewed in a pull request and the owner manually imports
it, verifying these runtime versions. No automatic workflow importer, runner or recovery engine
is added. The single shared guard and manual-recovery tradeoff remain later implementation work.
