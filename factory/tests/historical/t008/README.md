# Historical T008 guard tooling

Archived 2026-11-26 after all three story workflows replaced the guard-only skeletons.
These files preserve the original implementation and evidence provenance. They are excluded
from the current preparation/test commands and are not maintained for today's workflow graphs.

| Material | Status and current replacement |
|---|---|
| `check-guard-skeletons.cjs` | Retired. Assumes no credentials/HTTP story nodes and a skeleton work boundary; fails against current tracking. Use the three story checkers in `factory/tests/`. |
| `build-guard-bridge.py`, `guard-bridge.json`, `guard-bridge-sources.json` | Frozen historical generator/artifact pair. The generator expects `Skeleton work boundary` and old fixed table IDs. Use current US1/US2/US3 test copies and the US4 guard harness. |
| `run-guard-bridge.py` | Historical native operator runner for the old bridge and schedules. Use the current story runners and US4 guide. |
| `collect-guard-traces.py`, `summarize-guard-results.py` | Historical evidence-processing tools for the old workflow IDs, local logs and export format. Their committed results remain in the evidence directory. They do not create new evidence without the matching historical records. |
| `guard-bridge.md` | Historical setup and observations, prefaced with archive status. Original commands and paths remain for context. |

Scripts and JSON were moved without changing their contents. Their original path assumptions
are deliberately frozen: do not execute them from this archive or rebuild them from current
sources. To investigate historical behavior, inspect the matching Git revision in a separate
checkout at the original paths, then verify the isolated boundary and mappings before any run.
The bridge artifacts entered Git at `f593c2e`; source fingerprints in the archived manifest and
revision-specific evidence identify what was actually tested. That commit is not a substitute
for verifying the revision and environment of a particular observed run.

[Current offline preparation](../../test-preparation.md),
[finished-workflow guard/recovery tests](../../us4-validation.md) and
[guard coverage specification](../../guard-scenarios.md) are the maintained entry points.
The coverage matrix stays outside the archive because current T026 coverage still uses it.

[Historical and finished guard evidence](../../../../evidence/guard-validation.md),
[original bridge results](../../../../evidence/guard-bridge-results.json) and
[finished-graph results](../../../../evidence/us4-guard-results.json) remain versioned and
unchanged in their recorded outcomes. Earlier persisted-row tests are still reused where
explicitly documented; archival does not remove that coverage or justify repeating it.
