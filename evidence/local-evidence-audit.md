# Local evidence dependency audit — 2026-11-26

The repository can support review without publishing `factory/local/`, but private paths alone
are insufficient evidence. This audit reviewed all Markdown and JSON in `evidence/`, checked
explicit local-file references and the committed records supporting their claims, and inspected
related test/runbook path dependencies. It did not repeat runtime tests, inspect current remote
state, authenticate historical provider responses or certify every historical assertion against
raw traces. No local files were moved or deleted.

## Findings and corrections

| Evidence family / private references | Committed basis and audit disposition |
|---|---|
| Gemini evaluation: `evaluation-gemini-*`, `server-verification-gemini-v3/` | **Gap corrected.** [Evaluation](gemini-evaluation.md) already recorded method, timing, usage, findings and limits; [owner review](gemini-v3-review.md) preserved three v3 outputs. [New sanitized records](gemini-evaluation-results.json) preserve all five successful v2 outputs, four executed local v3 outputs, the Ubuntu v3 output, technical outcomes and historical hashes. This makes the semantic assessments inspectable without the local files. Initial credential rejection remains a recorded failure in the prose, not a published provider receipt. |
| Historical Ollama trials: `evaluation/`, `evaluation-v2/`, `evaluation-qwen25-7b/` | **Qualified historical record.** [Ollama evaluation](ollama-evaluation.md) explicitly attributes results to owner-pasted observations and records failures, excerpts and missing resource/hash evidence. Local directories in this checkout contain preparation records, not the ten server baseline responses. Do not describe their manifests as verified server-run provenance. No successful local-model gate depends on these trials; they remain reported failed comparisons, not independently replayable measurements. |
| Initial setup: `setup-check-requests/` | **Sufficient recorded summary; historical observation.** [Setup checks](local-setup-checks.md) records commands/assertions and separates offline preparation from server tests. Generated requests are reproducible from the matching historical source revision, not necessarily current sources. A fresh run would validate current behavior, not authenticate the original observation. |
| US1 runtime payload comparison: `us1-runtime-payload-review/` | **Recorded assertion, no independent diff receipt.** [US1 validation](refinement-validation.md) records five-case equality and its offline scope. Retained request files alone do not prove the runtime comparison happened; the original comparison transcript is not published. Treat this row as an assistant-recorded offline check, not independently authenticated execution evidence. |
| US1 traces, bridge and old mapped imports: `refinement-native-bridge/`, `refine-us1-*-mapped.json`, expression fixtures | **Committed summaries available.** [US1 validation](refinement-validation.md), [native results](refinement-native-results.json) and [scheduled results](refinement-scheduled-results.json) retain results, source identity, execution observations and crash/version limitations. Mapped JSON paths are historical import destinations, not public artifacts. Expression fixtures are generated test inputs. Private traces permit deeper operator inspection but are unnecessary to read the published results. |
| US2 exports/imports/bridge: `us2/`, reservation expression fixtures | **Committed summaries available.** [US2 validation](manual-build-validation.md), [native](reservation-native-results.json), [fault](reservation-fault-results.json) and [schedule](reservation-scheduled-results.json) results retain revision/trace checks, queue/restart outcomes and observation limitations. Genuine-task links are in the [index](index.md). Private mappings/exports are not publishable proof of current configuration. |
| US3 isolation and tracking: `us3/`, `test.env` | **Committed summaries available.** [Acceptance](acceptance.md) records the T033 boundary observations; [review validation](review-validation.md) and [native results](review-native-results.json) retain environment, hashes, cases, rows/effects and shutdown. API keys are configuration inputs, not evidence. Historical isolation observations do not establish today's server state. |
| Guard skeleton and finished graphs: `guard-validation/`, `us4/` | **Committed summaries available.** [Guard validation](guard-validation.md), [early bridge results](guard-bridge-results.json) and [finished-graph results](us4-guard-results.json) retain counts, checks, revision identity, rows and limitations. Earlier partial observations remain historical, not additional completed passes. |
| Recovery and stopped-volume restore: `us4/` and server-private backup | **Sufficient sanitized outcome; independent restore not possible from checkout.** [Recovery](recovery-validation.md) and [results](us4-recovery-results.json) record case IDs, interventions, archive hash, nine-file comparison outcome, restored row and credential test 1700. Full per-file hashes, backup bytes, keys and credential values are not public. The archive hash identifies the private archive; it does not prove the reported equality or let a reviewer repeat the restore. This is a recorded isolated rehearsal, not a public backup or operational recovery guarantee. |
| Production incident: `production-review/` | **Gap corrected.** [Race validation](tracking-race-validation.md) previously described the diagnosis with only a private filtered export as detailed support. [New incident extract](tracking-incident-133.json) retains metadata, reached nodes, checked write-node names and selected before/final plan fields. The missing execution-version UUID remains explicitly unknown. |
| Race regression: `tracking-race/` | **Committed summaries available.** [Race results](tracking-race-results.json) retain imported/source identity, four native execution observations, held/reset/shutdown facts and later operational observations. Per-node successful production QA/Done traces were not captured; public events and owner observations support the more limited completion claim. No missing trace is inferred from local filenames. |

The evidence README's stale count of one genuine task was corrected to two. The acceptance
count remains two, with three more required toward the final-project minimum. No PASS was
upgraded on the strength of this audit, and no historical failure or missing observation was
removed.

## Meaning of the published records

A committed sanitized extract makes recorded results inspectable; it does not independently
prove that a remote system produced them. Source/request hashes identify bytes when those bytes
are available. They do not replace response records, execution observations or source provenance.
Public issue/PR links independently expose task history, but cannot authenticate private n8n
node execution, credential grants or backup contents. Owner reports and assistant observations
retain their stated attribution.

The new model extract uses an explicit field allowlist: synthetic case outputs, review checks,
source/request hashes, completion/validation status, timings and numeric usage. All five request
hashes in each included local trial manifest were checked against retained request bytes. Only
cases with actual result files are included; prepared-only cases are not represented as executed.
The Ubuntu request hash comes from its historical run marker, not a newly reconstructed request.
The incident extract excludes workflow payloads, HTTP bodies/headers, credential references and
unrelated instance records. No new provider request or workflow execution was made.

## Cleanup implications

The raw history may be privately archived after preserving its original relative paths and
appropriate access restrictions. Keep `test.env`, `operational.env` and any needed current mapped
imports available to the operator. The standalone evaluation key is a secret used by the trial
helper; its retention is a separate operator decision.

Subsequent test-setup remediation removes the historical US1 mapped-copy and US2 readback
inputs from the builders. [Clean-checkout preparation](../factory/tests/test-preparation.md)
regenerates fixtures and test packages from versioned sources, with explicit configuration for
mapped outputs. Native execution still requires fresh isolation verification, test credentials
and a newly recorded import registry. Historical execution logs/registries remain records of
previous sessions; they are not regenerated as proof of a new import or test run.

No deletion or archive was performed during this audit. Retain raw history until the proposed
archive has been verified; do not commit environment files, API keys, full exports or backups.
