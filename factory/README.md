# Basic A factory

This directory holds the factory's deployment and runtime refinement artifacts.
Codex and SpecKit guide interactive development on Fedora; they do not run inside these services.

- `compose.yaml`: n8n and the retained CPU-only Ollama trial service on Ubuntu. The owner adopted
  Gemini 3.5 Flash-Lite for refinement on 2026-11-24; T012 will make Ollama startup optional.
- `templates/task.md`, `templates/refinement.schema.json`, `prompts/refinement.md`: versioned
  runtime refinement contract; independent of `.specify/templates/` development templates.
- `tests/fixtures/refinement-cases.json`: five synthetic model-evaluation inputs.
- `scripts/prepare_refinement_evaluation.py`: offline request preparation only; never calls a model.
- `scripts/evaluate_gemini.cjs`: explicit bounded hosted evaluation, offline preparation and
  optional single-case rerun; not a production provider integration.
- `local/`: ignored request, response and measurement files generated during evaluation.

The pinned images were observed healthy on the actual server; digests and model trials are in
[Gemini/server evidence](../evidence/gemini-evaluation.md) and [local trials](../evidence/ollama-evaluation.md).
The API key is not stored in Compose or workflow JSON; runtime use will reference n8n credentials.
No workflows or shared-flag
implementation are supplied by T001–T003. See [operations](../docs/operations.md) for setup and
the exact server evaluation procedure. Future workflow JSON changes require PR review and owner
manual import; deployment does not import workflows automatically.
