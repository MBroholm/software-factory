# Basic A factory

This directory holds the factory's deployment and runtime refinement artifacts.
Codex and SpecKit guide interactive development on Fedora; they do not run inside these services.

- `compose.yaml`: one n8n and one CPU-only Ollama service on Ubuntu.
- `templates/task.md`, `templates/refinement.schema.json`, `prompts/refinement.md`: versioned
  runtime refinement contract; independent of `.specify/templates/` development templates.
- `tests/fixtures/refinement-cases.json`: five synthetic model-evaluation inputs.
- `scripts/prepare_refinement_evaluation.py`: offline request preparation only; never calls a model.
- `local/`: ignored request, response and measurement files generated during evaluation.

The initial images are exact upstream release candidates, not server-tested claims. Runtime
versions/digests and model suitability must be recorded in T004. No workflows or shared-flag
implementation are supplied by T001–T003. See [operations](../docs/operations.md) for setup and
the exact server evaluation procedure. Future workflow JSON changes require PR review and owner
manual import; deployment does not import workflows automatically.
