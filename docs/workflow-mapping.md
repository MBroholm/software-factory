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

For an operational Basic B package, set `FACTORY_RUNNER_CREDENTIAL_ID` to the
saved Header Auth credential ID. Set `FACTORY_RUNNER_URL` to the approved private
HTTP origin with its port, and `FACTORY_RUNNER_MODEL_CONFIG` to the runner's
`model_config` value. Use the package commands from the repository root.

```bash
node factory/scripts/map-workflows.cjs --env factory/local/operational.env
node factory/scripts/map-workflows.cjs --env factory/local/operational.env --check
```

Select the four inactive JSON copies in `factory/local/mapped/operational/basic-b/`
for owner manual import. This directory preserves older Basic A packages. Its
private manifest records source and mapped SHA-256 hashes and the exact node
mapping changes. The mapper reads saved IDs and a private address. Bearer values,
tokens, and API keys stay in their credential stores. Use `--workflow collect`
or another individual workflow only when inspecting a mapping. For adoption,
generate and verify the four as a single package.

For synthetic workflows, use the separate Basic B fixture mapper documented in
`factory/tests/test-preparation.md`. The operational mapper rejects test targets
for Basic B exports, which retain operational GitHub and Gemini destinations.

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
