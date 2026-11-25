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
`workflows/refine.json` implements US1; `workflows/reserve.json` implements US2 approval,
reservation and handoff. Reviewed copies were manually imported and tested in isolation;
all test workflows are now unpublished. `workflows/track.json` remains a guarded skeleton for US3.
US2 source packaging: `node factory/scripts/build-reserve.cjs --check` from the repository root;
local policy/graph checks: `node factory/tests/check-reservation.cjs`.
See [manual coding](../docs/manual-coding.md) and
[US2 validation/import handoff](../evidence/manual-build-validation.md). US2 native/live results and the deliberate final test hold are recorded there.
See [refinement validation and import handoff](../evidence/refinement-validation.md),
[runtime design](../docs/refinement-design.md) and [output example](../docs/refinement-example.md).
Run `node scripts/build-refine.cjs --check` from this directory to verify source packaging;
run tests from repository root with `node factory/tests/check-refinement.cjs` and
`node factory/tests/check-guard-skeletons.cjs`. Native checks remain required.
For parameter-expression changes, `node factory/tests/check-refinement.cjs --native-fixtures`
prepares synthetic contexts for `tests/check-refinement-native-expressions.cjs`. That checker
requires installed n8n packages and explicitly uses the VM evaluator; ordinary standalone
`n8n-workflow` evaluation uses legacy semantics and missed the explicit negative-index defect.
It evaluates parameters and installed Wait behavior with synthetic contexts; full native live
workflow and credential checks remain separate.
Refinement now calls Gemini countTokens before inference and gates the unchanged 4096-token
application budget on the provider count plus reserves. The count node reuses the saved Gemini
credential; exact-output reuse skips both provider calls. See the amended refinement contract
for the independent transport cap and schema allowance. Explicit generation 503 UNAVAILABLE
responses now permit at most two retries after 10/30-second in-process waits, with identical
counted payload and guard/source rechecks. Other failures/exhaustion retain busy; no replay.
See [operations](../docs/operations.md) for setup and
the exact server evaluation procedure. Future workflow JSON changes require PR review and owner
manual import; deployment does not import workflows automatically.
