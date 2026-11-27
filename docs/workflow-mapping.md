# Generate locally mapped n8n workflows

The offline mapper replaces placeholder control-table and saved Header Auth credential references
in reviewed workflow JSON. It writes ignored local files, leaves workflows inactive, and makes no
network calls or imports. It preserves node Code, HTTP destinations, connections and schedules.
It does not create tables/credentials or configure an n8n instance.

Use Node.js 20.12+ (for `util.parseEnv`); the current workspace uses 24.19.0. Run from repo root:

```bash
node factory/scripts/map-workflows.cjs --env factory/local/test.env
node factory/scripts/map-workflows.cjs --env factory/local/test.env --check
```

The current local `factory/local/test.env` is already populated with the isolated table and
credential IDs from the previous local reviewed export. These are historical mappings, not a
fresh API verification of existence, access or scopes. `factory/local/operational.env` is blank.
Both are ignored and mode 600. Templates for another checkout:
`factory/config/test.env.example` and `factory/config/operational.env.example`.
Copy a template to the corresponding ignored local file; do not overwrite an existing config.

## Values to fill in

For a new control table, follow the [manual setup guide](../factory/setup/README.md).
Create explicit column types and verify the singleton row before mapping
its generated ID. Reuse an existing table instead of importing another seed row.

| Variable | What to enter |
|---|---|
| `FACTORY_TARGET` | `test` or `operational`; controls the output directory only |
| `FACTORY_CONTROL_TABLE_ID` | ID of the existing `factory_control` Data Table in that instance |
| `FACTORY_GITHUB_CREDENTIAL_ID` | ID of the saved Header Auth credential with `Authorization` header |
| `FACTORY_GEMINI_CREDENTIAL_ID` | ID of the saved Header Auth credential with `x-goog-api-key` header |
| `FACTORY_GITHUB_CREDENTIAL_NAME` | Optional saved credential display name |
| `FACTORY_GEMINI_CREDENTIAL_NAME` | Optional saved credential display name |
| `N8N_BASE_URL` | API setting for separate test tooling; defaults shown for SSH-forwarded test 5679 / operational 5678 |
| `N8N_API_KEY` | n8n API key for separate authenticated test tooling; mapper ignores it |

Obtain table ID from its URL in the intended instance. Obtain credential IDs from an existing
workflow export: under a node's `credentials.httpHeaderAuth`, copy `id` and optionally `name`.
Use a normal workflow export, not a decrypted credential export. For a new credential, select
it once on a scratch inactive workflow, export that workflow and take its reference. IDs must
belong to the same instance/project and be accessible to the importing user. Credential values
stay in n8n; do not put GitHub/Gemini tokens or the encryption key into mapping fields.

The n8n API key is separate from saved GitHub/Gemini credentials. It is optional here: this
mapper does not make API calls. The separate US3 `factory/tests/tracking-api.cjs` adapter now
uses the test key for native isolated tests; it refuses operational URLs/ports. You can leave
the key blank when only generating files for manual imports. Values are parsed as dotenv text, never executed as
shell commands; there is no `$VARIABLE` expansion or implicit process-environment fallback.

## Outputs and import

Test outputs: `factory/local/mapped/test/refine.json`, `factory/local/mapped/test/reserve.json`,
`factory/local/mapped/test/track.json` and `manifest.json`. Operational outputs use
`factory/local/mapped/operational/` after running:

```bash
node factory/scripts/map-workflows.cjs --env factory/local/operational.env
```

These are the files to select during manual import. The manifest records source/mapped SHA-256
hashes and target; it contains no .env contents or API keys. Files are mode 600. Build/validate
all selected inputs before writing. Re-run after source or mapping changes; `--check` detects
stale or missing files without modifying them. To map just one workflow:

```bash
node factory/scripts/map-workflows.cjs --env factory/local/test.env --workflow track
```

Only refinement needs the Gemini reference; reserve/track do not. Single-workflow runs write a
separate `<workflow>-manifest.json`. Old outputs are retained, so verify the selected workflow
with matching `--workflow ... --check` before importing.

Mapping operational source to test IDs does **not** isolate its external writes: these JSONs
retain real GitHub/Gemini HTTP destinations. Do not execute them on ordinary factory issues as
an isolated test. Use the designated fixture copies and T033 destination/scope verification for
synthetic testing. `FACTORY_TARGET` is an output selector, not a sandbox or verified identity.

Owner PR review and manual matching-revision operational import remain required. Review the
source hash against the reviewed source; mapping changes only table/credential references and
inactive status. Confirm imported mappings before activation. This tool does not resolve the
native-access or isolation checks by itself. US3 T033/T023 subsequently passed through the
separate credential-free native test tooling; see [review validation](../evidence/review-validation.md).

## Basic B four-artifact mapping (inactive implementation)

| Artifact | Responsibility | Required private mapping |
| --- | --- | --- |
| `factory/workflows/refine.json` | Existing refinement; durable scoped answer claims before Approved | Refinement model credential, orchestrator GitHub credential, runner bearer, shared control table |
| `factory/workflows/reserve.json` | Queue selection, durable reserve, Building readback, asynchronous start | Orchestrator GitHub credential, runner bearer/address, owner allowlisted model config identifier, shared control table |
| `factory/workflows/collect.json` | Poll stopped outcomes, journal/reconcile PR/question/failure, confirm state and safe release | Orchestrator GitHub credential, runner bearer/address, shared control table |
| `factory/workflows/track.json` | Historical v1 and exact v2 review, merge/issue closure, cancellation | Orchestrator GitHub credential, runner bearer/address, shared control table |

All four use 60-second schedules and production concurrency=1. Keep generated artifacts inactive
until reviewed manual adoption. Map every guard node to the same intended singleton; the runner
ledger/task slot is a separate private SQLite database, never this Data Table. Resolve every
`OWNER_SELECT_*`, `RUNNER_PRIVATE_HOST` and `OWNER_CONFIGURE_MODEL_ID` placeholder explicitly.
Credentials stay in private stores, not exports. Record source and imported fingerprints for all
four artifacts plus instance-specific mappings in the adoption record. A mixed Basic A/Basic B
reserve/track pair is unsafe. Isolated test copies require distinct storage, control table,
runner account/database/work root, credentials and designated GitHub resources before writes.
