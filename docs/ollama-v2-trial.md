# T004 — one bounded v2 prompt trial

The owner approved preparing a prompt-only revision after the v1 semantic failures. This guide
does not claim a passing trial. Preserve `factory/local/evaluation/` as the v1 baseline. T004
stays unchecked, with dependent workflow integration stopped until evaluation/owner decision.

## What changes

Only `factory/prompts/refinement.md` changes, from prompt v1 to v2. It now requires explicit
constraint extraction, pending-decision criteria for unknown/conflicting requirements, preservation
of restriction strength/ordering, and no invented policy, quality standard or rationale.
There are no fixture-specific expected answers in the prompt.

Model `qwen3:4b-instruct`, its existing digest, template v1, schema, five fixtures, helper code,
4096-token context, 768 output limit, temperature 0, 120-second deadline and no-retry behavior
remain unchanged. Do not pull a new model/image or change limits during this comparison.

Prepared v2 prompt SHA-256:
`d6c770e8bde34d5a4ef95ad137dac3293916ce83641523f5b371e9c7cb32da18`.

Local preparation passed for all five requests. Comparison with the v1 requests confirmed only
the system-prompt text changed. Byte screens including schema were 2938–3051 bytes, within the
existing conservative limit; actual model token counts/quality still need server validation.
These were offline checks, not model calls.

## 1. Transfer only the prepared prompt — Fedora

The v2 edit is currently uncommitted. Transfer it explicitly rather than assuming a server
`git pull` will retrieve it. No `.env`, secret or generated response file is transferred.

```bash
scp /home/broholm/EK-projects/AI-agents/software-factory/factory/prompts/refinement.md \
  broholm@nas:/opt/docker/software-factory/factory/local/refinement-v2.md
```

## 2. Preserve v1, install v2 and prepare fresh requests — Ubuntu

The following block verifies the staged v2 hash and checks that the current prompt matches the
original evaluation's manifest before replacing it. Any unexpected modification stops the step.
The original prompt is backed up next to the unchanged v1 requests/results.

```bash
cd /opt/docker/software-factory

python3 - <<'PY'
from pathlib import Path
import hashlib, json

def digest(data):
    return hashlib.sha256(data).hexdigest()

baseline = Path('factory/local/evaluation')
expected_v1 = json.loads((baseline / 'manifest.json').read_text())['artifact_sha256']['factory/prompts/refinement.md']
target = Path('factory/prompts/refinement.md')
original = target.read_bytes()
candidate = Path('factory/local/refinement-v2.md').read_bytes()
if digest(candidate) != 'd6c770e8bde34d5a4ef95ad137dac3293916ce83641523f5b371e9c7cb32da18':
    raise SystemExit('Staged v2 hash differs; stop and inspect the transfer.')
if digest(original) != expected_v1:
    raise SystemExit('Current prompt differs from the v1 baseline; stop without overwriting it.')
backup = baseline / 'refinement-v1.md'
if backup.exists():
    if digest(backup.read_bytes()) != expected_v1:
        raise SystemExit('Existing v1 backup differs; stop.')
else:
    with backup.open('xb') as output:
        output.write(original)
target.write_bytes(candidate)
print('Preserved v1 and installed verified prompt v2; no inference ran.')
PY
```

If that succeeds:

```bash
python3 factory/scripts/prepare_refinement_evaluation.py --output-dir factory/local/evaluation-v2
git diff -- factory/prompts/refinement.md
```

The server checkout now has a deliberate prompt-only change over `f4a8427`; the new manifest
records its exact hashes. The request generator refuses a nonempty directory. Do not delete or
overwrite earlier results to retry; report any failure and preserve its evidence.

## 3. Start fresh memory sampling — separate Ubuntu terminal

```bash
cd /opt/docker/software-factory
docker stats --no-trunc --format '{{json .}}' \
  software-factory-basic-a-n8n-1 software-factory-basic-a-ollama-1 \
  >> factory/local/evaluation-v2/memory.jsonl
```

Leave this running during the trial, then stop it with Ctrl-C. Retain v1 memory samples separately.

## 4. Evaluate all five changed-prompt inputs — main Ubuntu terminal

All five require regression checks because the prompt changed. Cold/warm pairs retain the
original measurement method. Infrastructure setup and unrelated acceptance checks are not rerun.

```bash
(
set -euo pipefail
set -o noclobber
factory_measure_code=$(cat factory/scripts/measure_refinement_request.cjs)

for factory_case in clear-task ambiguous-task owner-revision conflicting-constraints injected-instructions
do
    docker compose --env-file factory/.env -f factory/compose.yaml \
        exec -T ollama ollama stop qwen3:4b-instruct
    for factory_run in cold warm
    do
        printf '\nRunning v2 %s — %s\n' "$factory_case" "$factory_run"
        factory_result="factory/local/evaluation-v2/$factory_case.$factory_run.result.json"
        factory_error="factory/local/evaluation-v2/$factory_case.$factory_run.error.txt"
        docker compose --env-file factory/.env -f factory/compose.yaml \
            exec -T n8n node -e "$factory_measure_code" \
            < "factory/local/evaluation-v2/$factory_case.request.json" \
            > "$factory_result" 2> "$factory_error"
        cat "$factory_result"
    done
done
)
```

A failed request stops the subshell without closing the interactive SSH shell. Share its result
and corresponding error file before retrying; no automatic retry is authorized by this guide.

## 5. Review against the unchanged rubric

Use the original fixtures' owner-review checks, not a weaker v2 rubric. Explicit constraints
belong in their field; undecided policies stay questions/pending criteria; contradictory behavior
is not a settled criterion; restrictions are not broadened. Both cold/warm outputs matter.
Injection resistance must not regress. Schema validity alone does not pass the trial.

Record v2 hashes/measurements/content review separately in the evaluation evidence. Image digests,
sampled resource maxima and OOM/restart observations from the server still need to be supplied.
If this bounded revision fails, stop and choose the next model approach with the owner rather
than extending prompt tuning indefinitely or enabling a paid fallback. Do not mark T004 complete
or implement T005+ based solely on successful request generation or valid JSON.
