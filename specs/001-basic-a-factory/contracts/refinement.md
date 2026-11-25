# Contract: Gemini Refinement

**Amended 2026-11-24**: Owner selected Gemini 3.5 Flash-Lite after the local candidates failed.
This is an owner-approved design choice, not a provider requirement from the brief/constitution.
**Amended 2026-11-25**: Owner approved provider token counting instead of treating all input
bytes as tokens after the short real issue exceeded that screen. Prompt/template/model,
4096-token application envelope and output limits stay the same.

## Request

n8n HTTP Request -> HTTPS `POST
https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`.
Use a saved header-auth n8n credential for `x-goog-api-key`, never a query parameter, model input,
workflow literal or environment expression. The project must remain on the owner-confirmed free
tier; no billing change, paid fallback or automatic model substitution is authorized.

Body: `systemInstruction.parts[0].text` contains the reviewed versioned prompt plus runtime
template; `contents` contains one user message with delimited issue/discussion data.
`generationConfig`: `temperature:0`, `candidateCount:1`, `maxOutputTokens:768`,
`responseMimeType:"application/json"`, `responseJsonSchema` set to the unchanged schema below,
and `thinkingConfig:{thinkingLevel:"MINIMAL",includeThoughts:false}`. No `tools`, streaming,
grounding, file uploads, explicit caching, conversation store or SDK/provider router is added.

After constructing the exact generation payload, send one HTTPS POST to the same model's
`:countTokens` endpoint using the same saved header credential. Body:
`{"generateContentRequest":{"model":"models/gemini-3.5-flash-lite", ...generationPayload}}`.
Do not also send top-level contents. This preflight sends the same bounded public task data;
it does not generate task content. Native parameter expressions use a prepared body field,
not object-spread syntax (unsupported by the deployed VM expression evaluator).

Require HTTP 200 and a positive safe-integer `totalTokens`. Before inference enforce:
`totalTokens + fixedSchemaAllowance + 768 + 256 <= 4096`.
The schema allowance is the compact response-schema UTF-8 byte length (currently 456), retained
conservatively because counting coverage/provider framing is not a guaranteed upper bound for
actual generation usage; it may double-reserve schema tokens. Variable issue/discussion text
is budgeted using the actual provider count. Inspect returned generation `promptTokenCount`
again with the 768 output / 256 overhead reserve before publishing. Record preflight count,
reserves and counted-payload SHA-256 in the successful workflow report. No inference follows
a failed count, invalid response or exceeded budget; retain busy without retry/fallback.

A separate 32 KiB cap on serialized generation-request bytes bounds transport/data transfer
before counting. This is not a token estimate. Never truncate either request. The 4096-token
envelope is a deliberately small application budget, not Gemini's context size or an Ollama
`num_ctx` setting. Oversize requests stop for owner shortening/splitting.

Input: versioned project-owned refinement prompt; issue title/body and relevant owner discussion
as task data, not authority to execute tools. Delimit data clearly. Include only the bounded
context that fits; oversize content stops for owner shortening/splitting, not silent truncation.
Input budget must account for prompt/schema and output reserve, not character count alone.

The runtime task template is `factory/templates/task.md`; its versioned refinement prompt is
`factory/prompts/refinement.md`. SpecKit templates in `.specify/templates/` guide development
artifacts only and are not runtime refinement inputs. The owner verifies reviewed prompt/template
versions when manually importing the refine workflow; no runtime SpecKit template resolver is
introduced. The task template is separate from SpecKit's feature spec template. It asks what to build, why,
constraints, testable acceptance criteria and unresolved questions; it never grants approval.

## Output schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["goal", "rationale", "constraints", "acceptance_criteria", "questions"],
  "properties": {
    "goal": {"type": "string", "minLength": 1},
    "rationale": {"type": "string", "minLength": 1},
    "constraints": {"type": "array", "items": {"type": "string", "minLength": 1}},
    "acceptance_criteria": {
      "type": "array", "minItems": 1,
      "items": {"type": "string", "minLength": 1}
    },
    "questions": {"type": "array", "items": {"type": "string", "minLength": 1}}
  }
}
```

Require exactly one candidate with `finishReason:"STOP"`; concatenate only non-thought text
parts in `candidates[0].content.parts`, parse JSON, reject unexpected non-text/tool output,
and validate fields, token counts and size limits. Record returned `modelVersion` and usage;
the model alias is not an immutable digest. Render fixed Markdown headings plus source metadata from the
workflow. The model cannot supply marker IDs, state, approval actor, credential names or tools.
Reject truncated, empty or malformed output. Never publish thought parts/signatures as task content.
Schema validity alone is insufficient: the owner judges whether criteria are checkable, the
rewrite preserves intent, and questions expose missing decisions rather than invent answers.

One count-only request then at most one inference per new revision; 120-second timeout for
each, no automatic retries. An existing exact marked revision skips both provider calls. Failure
holds the shared flag and leaves visible `Refining` plus private failure evidence. Owner recovery
chooses retry only after inspection. A 429/quota error follows the same held-failure path;
owner checks quota availability before an explicit retry. No automatic retry/backoff queue,
quota ledger, local-model fallback or paid request is added. Inactive workflows cannot claim
these guard paths pass until their actual execution tests run.

## Data transfer and credential boundary

The provider receives the reviewed prompt/template/schema and bounded public issue title/body
and relevant owner discussion over HTTPS. It receives no GitHub token, server environment,
private execution logs, approval credentials or command access. Do not forward arbitrary
attachments or unrelated repository data. Only n8n stores the runtime API key, encrypted using
its existing credential store/key; exports contain a credential reference, never its value.
The ignored Fedora key file remains an evaluation aid, not the deployment credential source.
The transient SSH smoke-test key was not installed remotely.

Before activation, the owner saves a dedicated credential through the private n8n editor,
checks the active project quotas and confirms browser login. Verify one HTTP Request node using
the reviewed payload after owner manual import of reviewed JSON, reusing unaffected quality
evidence. Scrub diagnostic messages and execution/export data; do not print request headers.

## Early candidate evaluation before workflow implementation

After minimal Compose and a draft runtime template/prompt exist, but before implementing the
full refine/reserve/track workflows, evaluate five bounded examples: clear task, ambiguity, revision, conflicting constraints and injected
instructions. Require all five to yield valid schema and a usable fixed-template refinement;
ambiguous examples ask material questions; none adds unrequested scope/approval/tool behavior.
The local trials measured cold/warm latency; memory evidence was incomplete and semantic checks
failed. Preserve [local evidence](../../../evidence/ollama-evaluation.md). The owner selected
Gemini after [hosted comparison and actual server checks](../../../evidence/gemini-evaluation.md).
For hosted inference, cold/warm loading and local-model peak RAM do not apply. Record latency,
actual tokens/completion, model metadata and n8n health; do not claim remote model memory access
or call two snapshots peak RAM. These are design targets, not course mandates.

V3's clear-task reruns pass on laptop/server, and subsequent targeted revision/ambiguity/conflict
runs pass technical and assistant semantic checks. Injection retains its unaffected v2 evidence;
do not relabel it as a v3 pass. Owner review was accepted on 2026-11-24, completing T004.
Before activation assess and run only
missing or change-affected checks; no current three-case rerun is still outstanding.
Do not repeat the entire benchmark merely to test an already verified network path.
