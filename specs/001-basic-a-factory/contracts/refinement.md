# Contract: Local Refinement

## Request

n8n HTTP Request -> `POST http://ollama:11434/api/chat` on the private Compose network.
Use configured tested model/digest (initial candidate `qwen3:4b-instruct`), `stream:false`, no
`tools`, `format` set to the JSON schema below, temperature 0, explicit 4096-token context and
bounded output (initial recommendation 768 generated tokens). Inspect model metadata before
using optional thinking controls; do not assume all Qwen variants can disable thinking.

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

Parse final `message.content` as JSON, require `done:true` and successful completion, validate
fields and size limits, and render fixed Markdown headings plus source metadata from the
workflow. The model cannot supply marker IDs, state, approval actor, credential names or tools.
Reject truncated, empty or malformed output. Never publish `message.thinking` as task content.
Schema validity alone is insufficient: the owner judges whether criteria are checkable, the
rewrite preserves intent, and questions expose missing decisions rather than invent answers.

One request per new revision; 120-second initial timeout, no automatic inference retry. Failure
holds the shared flag and leaves visible `Refining` plus private failure evidence. Owner recovery
chooses retry only after inspection. No hosted fallback or API spending is authorized implicitly.

## Early candidate evaluation before workflow implementation

After minimal Compose and a draft runtime template/prompt exist, but before implementing the
full refine/reserve/track workflows, run five bounded examples: clear task, ambiguity, revision, conflicting constraints and injected
instructions. Require all five to yield valid schema and a usable fixed-template refinement;
ambiguous examples ask material questions; none adds unrequested scope/approval/tool behavior.
Measure cold/warm wall time and peak RAM alongside n8n; each must fit the request deadline without
out-of-memory errors. These are proposed evaluation targets, not course mandates. If the local
candidate fails, tune within one bounded evaluation session, then ask the owner to select an
alternative rather than spending project time on model infrastructure.
