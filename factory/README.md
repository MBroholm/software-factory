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
The API key is not stored in Compose or workflow JSON; runtime nodes reference saved n8n credentials.
All three workflows are implemented: `workflows/refine.json` (US1), `workflows/reserve.json`
(US2) and `workflows/track.json` (US3). Their exported artifacts remain inactive. US4 operations,
architecture, finished-graph guards and recovery/restore validation are documented in
[operations](../docs/operations.md), [architecture](../docs/architecture.md) and the
[evidence index](../evidence/index.md). Test instances are distinct from operational adoption;
all test workflows are unpublished and the restore clone is stopped.

Run source consistency checks from the **repository root**, for example:

```bash
node factory/scripts/build-refine.cjs --check
node factory/scripts/build-reserve.cjs --check
node factory/scripts/build-track.cjs --check
```

Local behavior checks are `node factory/tests/check-refinement.cjs`,
`node factory/tests/check-reservation.cjs` and `node factory/tests/check-tracking.cjs`.
Native/scheduled results are revision-specific in [refinement validation](../evidence/refinement-validation.md),
[manual-build validation](../evidence/manual-build-validation.md),
[review validation](../evidence/review-validation.md) and
[finished-graph guard coverage](../evidence/guard-validation.md). Reuse unchanged valid evidence;
local tests alone do not establish native persistence or credential behavior. The
[US4 test guide](tests/us4-validation.md) describes isolated-only fault/recovery/backup tools.
See [manual coding](../docs/manual-coding.md), [runtime design](../docs/refinement-design.md)
and [output example](../docs/refinement-example.md).
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
the exact server evaluation procedure. Automated import, update and execution are permitted only
in designated isolated development/test n8n with test data, scoped credentials and designated
test resources; no operational workflow replacement/activation or ordinary task processing.
Operational adoption requires owner PR review and manual import of the matching reviewed JSON
revision, renewed for subsequent changes, before or after merge. Manual import does not require
manual execution of every test. Record tested revision and environment; see
[permissions](../docs/permissions.md#isolated-testing-and-operational-adoption).

## SSH access

To open the existing Basic A n8n editor on the Ubuntu host, keep its server binding
at `127.0.0.1:5678` and start a tunnel from your local computer using placeholder
SSH connection details (`user@server`):

```sh
ssh -N -L 5678:127.0.0.1:5678 user@server
```

Keep the SSH session running, then open <http://localhost:5678> locally. Stop the
tunnel with Ctrl+C when finished. This uses the existing loopback-only server
binding to keep the editor private; do not expose port 5678 publicly or change
services, credentials, configuration, or workflows.
