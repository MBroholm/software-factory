# T004 — final bounded local comparison: qwen2.5:7b

The owner selected another local candidate after the qwen3:4b-instruct v1 semantic failures and
v2 truncation. This trial changes **only** the requested model, retaining prompt v2, template,
schema, five fixtures, helpers and runtime settings. It is not another prompt-tuning iteration.
No quality or speed claim is made before actual server results and owner review.

Local preparation produced five requests under ignored `factory/local/evaluation-qwen25-7b/`.
Comparison with v2 confirmed only each request's `model` property differs. Prompt SHA-256 stays
`d6c770e8bde34d5a4ef95ad137dac3293916ce83641523f5b371e9c7cb32da18`.
Nothing in this preparation called a model or marked T004 complete.

## Server preparation

On Ubuntu, use the same checkout, containers and installed v2 prompt. No new Git pull or file
transfer is needed: the existing request helper accepts `--model`. Stop any earlier memory
sampling with Ctrl-C first, retaining its files. Do not overwrite the v1/v2 requests or results.

```bash
cd /opt/docker/software-factory
sha256sum factory/prompts/refinement.md
```

Confirm the hash matches above, then:

```bash
docker compose --env-file factory/.env -f factory/compose.yaml \
  exec -T ollama ollama stop qwen3:4b-instruct &&
docker compose --env-file factory/.env -f factory/compose.yaml \
  exec -T ollama ollama pull qwen2.5:7b &&
python3 factory/scripts/prepare_refinement_evaluation.py \
  --model qwen2.5:7b --output-dir factory/local/evaluation-qwen25-7b
```

Stop if preparation fails. The fresh directory is required; the helper refuses existing results.
The older candidate remains downloaded as baseline evidence; only its loaded state is stopped.

Record the new model's actual digest through the private connection (safe interactive quoting):

```bash
docker compose --env-file factory/.env -f factory/compose.yaml \
  exec -T n8n node -e \
  'fetch("http://ollama:11434/api/tags").then(r=>{if(r.ok===false)throw Error(r.status);return r.text()}).then(console.log).catch(e=>{console.error(e.message);process.exitCode=1})' \
  > factory/local/evaluation-qwen25-7b/model-tags.json

python3 - <<'PY'
from pathlib import Path
import json
for model in json.loads(Path('factory/local/evaluation-qwen25-7b/model-tags.json').read_text())['models']:
    if model['name'] == 'qwen2.5:7b':
        print(model['name'], model['digest'])
        break
else:
    raise SystemExit('Requested local model not found; stop.')
PY
```

## Fresh memory sampling

In a separate Ubuntu terminal, leave this running until the trial stops or finishes:

```bash
cd /opt/docker/software-factory
docker stats --no-trunc --format '{{json .}}' \
  software-factory-basic-a-n8n-1 software-factory-basic-a-ollama-1 \
  >> factory/local/evaluation-qwen25-7b/memory.jsonl
```

## First cold case

```bash
(
set -euo pipefail
set -o noclobber
docker compose --env-file factory/.env -f factory/compose.yaml \
  exec -T ollama ollama stop qwen2.5:7b
docker compose --env-file factory/.env -f factory/compose.yaml \
  exec -T n8n node -e "$(cat factory/scripts/measure_refinement_request.cjs)" \
  < factory/local/evaluation-qwen25-7b/clear-task.request.json \
  > factory/local/evaluation-qwen25-7b/clear-task.cold.result.json \
  2> factory/local/evaluation-qwen25-7b/clear-task.cold.error.txt
)
cat factory/local/evaluation-qwen25-7b/clear-task.cold.result.json
cat factory/local/evaluation-qwen25-7b/clear-task.cold.error.txt
```

Review this result before continuing. A technically valid response still needs the original
semantic checks; do not merely increase tokens/timeouts when a response fails. Stop and preserve
the first failure, as in the prior trials. No automatic retries or provider fallback.

If the first case is acceptable, continue with its warm request without stopping the model.
Then use the cold/warm loop in the [v2 guide](ollama-v2-trial.md#4-evaluate-all-five-changed-prompt-inputs--main-ubuntu-terminal),
changing the directory to `evaluation-qwen25-7b`, the model to `qwen2.5:7b`, and excluding the
already-completed `clear-task` case from the remaining-case loop. The other four cases are
`ambiguous-task`, `owner-revision`, `conflicting-constraints`, `injected-instructions`.

All five original cases must pass; previous candidates' successful outputs do not count toward
the replacement model's gate. Keep context 4096, output limit 768, temperature 0, deadline 120
seconds and no tools unchanged. Semantic quality, resource measurements and owner judgement
remain required before marking T004 complete. If this candidate fails, stop local tuning and
discuss a hosted approach with an explicit budget; no paid usage is authorized implicitly.
