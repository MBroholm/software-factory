# Prepare test inputs from a clean checkout

Run from the repository root with Node.js 20.12 or newer. No npm install, previous run outputs,
server export, API key or n8n instance is needed for offline preparation:

```bash
node factory/tests/prepare-test-artifacts.cjs
node factory/tests/prepare-test-artifacts.cjs --check
node factory/tests/check-refinement-bridge.cjs
node factory/tests/check-reservation-bridge.cjs
```

Preparation checks all three source generators, runs the local exported-graph checks and
regenerates synthetic expression inputs, tracking scenarios, US1/US2 bridges and scheduled
copies, and the US3 tracking copy. Bridge checks start disposable loopback HTTP simulators;
they do not execute n8n. These checks do not establish native persistence or credential behavior.

Default preparation uses explicit table placeholders and reads no local configuration. It
writes ignored fixtures/packages under `factory/local/` and deterministic public review JSON
under `factory/tests/`. It replaces generated inputs at their standard paths; it does not clear
logs, result files or import registries. Archive prior generated packages first if needed.
`--check` regenerates synthetic seed inputs and checks package bytes instead of overwriting
package outputs; it expects a preceding preparation with the same mapping options.

## Map an isolated instance

Copy `factory/config/test.env.example` to ignored `factory/local/test.env` without overwriting
an existing config. Set `FACTORY_TARGET=test` and the actual isolated `FACTORY_CONTROL_TABLE_ID`.
Only these two values are needed for offline test packaging. Saved GitHub/Gemini credentials
are not included in the credential-free fixture packages. The separate native API tools need
`N8N_BASE_URL` and `N8N_API_KEY` as documented in the story guides.

```bash
node factory/tests/prepare-test-artifacts.cjs --mapped
node factory/tests/prepare-test-artifacts.cjs --mapped --check
```

`--env PATH` selects a different explicit test config and implies mapped preparation. Mapping
rejects missing/placeholder table IDs and non-test targets before preparation. It is an offline
selection, not proof of isolation or permission. The native tracking API tools still use the
standard `factory/local/test.env`; use matching configuration when running those tools.

Mapped output paths are `factory/local/refinement-native-bridge/workflow.json`,
`factory/local/us2/native-bridge/workflow.json`, their respective `schedule-mapped.json` files,
and `factory/local/us3/tracking-test-mapped.json`. Default bridge outputs contain placeholders;
never import them until mapped and reviewed. Public JSON/source manifests remain independent
of the selected machine/table. Private mapped hashes live in local manifests.

Before native import or execution, verify instance identity, distinct volume/control table,
scoped credentials, fixture destinations, inactive competing workflows and drained executions.
See [US1](refinement-bridge.md), [US2](reservation-bridge.md), [US3](tracking-test.md) and
[US4](us4-validation.md). Import only into the designated isolated test instance. No preparation
command imports, activates, resets control state or calls GitHub/Gemini/n8n.

## Individual builders and session records

The bridge builders accept `--mapped`, `--env PATH` and `--check`. To produce US2 native
expression fixtures individually, first run `check-reservation.cjs --native-fixtures`, then
`build-reservation-bridge.cjs --native-fixtures`; a missing seed reports the generating command.
Scheduled-copy builders read the committed placeholder bridge for operator helper definitions,
not a prior mapped local workflow. Rebuild the bridge first after changing its builder.

`imported.json`, execution observations, shutdown records and server-side fixture state describe
a particular native session. They cannot be recreated offline as evidence of a real import or
run. Archive them with the old session; fresh native setup must record a new import after boundary
verification. Evidence collectors intentionally require that session's actual observations.

The offline regression `node factory/tests/check-test-preparation.cjs` exercises preparation
in a disposable checkout without any historical `local/` files, plus explicit fake mappings
and invalid/missing configuration. It makes no remote calls or native imports.

## Retired skeleton tooling

The obsolete skeleton checker and original T008 bridge generator, artifact, runner and
evidence collectors are in the [historical archive](historical/t008/README.md). They are
not part of preparation or the current regression commands. The
[guard coverage matrix](guard-scenarios.md) remains maintained because finished-workflow
validation still maps to its cases and explicitly reuses some historical observations.

## Basic B four-workflow fixtures

Use a new private config based on `factory/config/test.env.example`; retain existing mappings.
Fill all Basic B fields, including operational IDs to exclude, separate test role credential IDs,
and separate loopback fixture service ports. The mapper accepts only `factory-guard-test` on
loopback editor 5679. It rewrites GitHub/model/runner HTTP bases to explicit loopback simulators,
leaves all four copies inactive and records source/mapped hashes and exact node deltas privately.
It does not import, execute, provision, or prove live isolation. Verify container identity,
separate storage/table and actual saved credential scope before any later import.

```bash
node factory/tests/check-basic-b-preparation.cjs
node factory/tests/prepare-test-artifacts.cjs --basic-b --env factory/local/basic-b-fixtures.env
node factory/tests/prepare-test-artifacts.cjs --basic-b --env factory/local/basic-b-fixtures.env --check
node factory/tests/run-basic-b-native.cjs
# Read-only VM checks using a local installed n8n 2.48.8:
node factory/tests/run-basic-b-native.cjs --n8n-root /path/to/n8n
# Or existing designated test container over the established SSH alias:
node factory/tests/run-basic-b-native.cjs --remote-vm
```

The combined command runs fake-adapter US1–US4 graphs, retained affected policy checks and all
four generators. Native mode explicitly initializes the VM and checks actual core Wait behavior.
Results/hashes are in `factory/local/basic-b-native/validation.json`. Before scheduled tests,
verify workflow concurrency=1 in the target instance; exported JSON cannot establish that setting.
Missing native installation/access fails native mode and does not select an operational fallback.
