# Basic A factory

This directory holds the factory's deployment and runtime refinement artifacts.
Codex and SpecKit guide interactive development on Fedora; they do not run inside these services.
Workflow documentation conventions for future changes are recorded in [AGENTS.md](AGENTS.md).

- `compose.yaml`: n8n and the retained CPU-only Ollama trial service on Ubuntu. The owner adopted
  Gemini 3.5 Flash-Lite for refinement on 2026-11-24. Ollama now requires profile `local-model-trials`;
  its existing volume/cache are preserved. No server rollout is performed by this change.
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
`workflows/refine.json` now implements US1 and remains inactive pending owner review/manual
import and native tests. Reserve/track remain guarded skeletons for later stories.
See [refinement validation and import handoff](../evidence/refinement-validation.md),
[runtime design](../docs/refinement-design.md) and [output example](../docs/refinement-example.md).
Run `node scripts/build-refine.cjs --check` from this directory to verify source packaging;
run tests from repository root with `node factory/tests/check-refinement.cjs` and
`node factory/tests/check-guard-skeletons.cjs`. Native checks remain required.
See [operations](../docs/operations.md) for setup and
the exact server evaluation procedure. Future workflow JSON changes require PR review and owner
manual import; deployment does not import workflows automatically.
