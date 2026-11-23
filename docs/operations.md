# Basic A operations — T001–T003 setup and T004 handoff

## Current boundary and verified repository configuration

This is interactive factory bootstrapping under constitution III, on `001-basic-a-factory`.
T001–T003 supply deployment configuration and draft refinement inputs. No scheduled workflow,
runner, approval logic or shared-flag implementation exists yet. T004 remains unchecked.

Read-only anonymous GitHub API verification on 2026-11-23 confirmed:

| Setting | Verified value |
|---|---|
| Repository | `MBroholm/software-factory`, public |
| Default branch | `main` |
| Project owner login / stable ID | `MBroholm` / `202449424` |
| Existing state labels | `Ideas`, `Refining`, `Ready for approval`, `Approved`, `Building`, `Waiting for you`, `Stuck`, `Your QA`, `Done` |

Reuse labels; never recreate them as part of setup. Preserve unrelated labels. Basic A processes
owner-authored issues only and does not use `Waiting for you` or `Stuck`. Authoring an issue or
assignment does not transfer project ownership. [Repository API](https://api.github.com/repos/MBroholm/software-factory),
[labels API](https://api.github.com/repos/MBroholm/software-factory/labels?per_page=100).

Development-environment checks found Git, SSH, Python 3, Node, Docker/Compose, GitHub CLI, Codex
and SpecKit. Initial GitHub CLI authentication was unavailable, so repository/label verification used the
anonymous API. After the owner authenticated, `gh api user` confirmed `MBroholm` / `202449424`,
and the repository API confirmed pull/push access. No write operation was attempted; this CLI
login does not provision the separately scoped n8n GitHub credential. Codex reported a read-only PATH-alias warning but returned its version. These
checks describe this workspace, not an inspection of the actual Ubuntu server or a proof that
Codex can authenticate. See [actual local check results](../evidence/local-setup-checks.md).

## Who can perform which preparation

| Work | Current workspace | Requires owner/server access |
|---|---|---|
| Inspect/edit tracked files, prepare requests, validate JSON/schema/Compose | Executed locally | No server needed |
| Read public repository/labels | Executed through anonymous API | No write token needed |
| Publish/review/transfer these currently uncommitted changes | Not performed | Owner-directed Git review/push or transfer |
| Check Ubuntu CPU/RAM/GPU/disk and Docker permissions | Not performed | SSH to the owner's server |
| Pull/start images, download model, run inference and observe RAM | Not performed | Server Docker access |
| Judge all five refinements against owner-review assertions | Not performed | Owner review of actual outputs |
| Complete T004 and record results | Not performed | Actual server run and owner evaluation |

No server hostname, credentials or remote session is available to the agent in this workspace.
Existing Fedora-to-Ubuntu SSH access is the owner's confirmed prerequisite. Do not paste keys or
tokens into chat. T004 needs no GitHub write token or workflow JSON imports.

## T004, step 1 — preflight and transfer (owner on Fedora/server)

Replace `your-existing-ssh-alias` with the actual configured SSH destination. First inspect:

```bash
# Fedora
ssh your-existing-ssh-alias 'uname -m; free -h; df -h; python3 --version; docker --version; docker compose version'
```

Confirm Python 3.9+ and sufficient memory/disk headroom for both n8n and the candidate model. A model download's
size is not its runtime RAM requirement. GPU is optional; this Compose definition is CPU-only.
If Docker access is denied, resolve server installation/account access before continuing.

These artifacts must first be committed/reviewed and made available on the server. If using
GitHub, push the reviewed feature branch, then clone into a **new** server directory:

```bash
# Ubuntu, after the reviewed feature commit is available remotely
git clone --branch 001-basic-a-factory --single-branch https://github.com/MBroholm/software-factory.git software-factory-basic-a
cd software-factory-basic-a
git status --short
git rev-parse HEAD
```

For an existing clone, inspect and preserve its work instead of resetting or overwriting it.
Record the exact revision tested. Do not use the branch's older planning-only commit by mistake.
Alternatively transfer the reviewed working tree through your existing SSH method, preserving
any server-local environment/data files; identify that tree and its artifact hashes in evidence.

## T004, step 2 — private environment and services (owner on Ubuntu)

From the repository root, generate a private key without printing it. This refuses to overwrite
an existing `.env`. Existing deployments must retain the key matching their stored credentials.

```bash
python3 - <<'PY'
from pathlib import Path
import os, secrets
os.umask(0o077)
source = Path('factory/.env.example').read_text()
assert source.count('N8N_ENCRYPTION_KEY=\n') == 1
with Path('factory/.env').open('x') as output:
    output.write(source.replace('N8N_ENCRYPTION_KEY=\n', 'N8N_ENCRYPTION_KEY=' + secrets.token_hex(32) + '\n'))
PY
docker compose --env-file factory/.env -f factory/compose.yaml config --quiet
docker compose --env-file factory/.env -f factory/compose.yaml pull
docker compose --env-file factory/.env -f factory/compose.yaml up -d --wait
docker compose --env-file factory/.env -f factory/compose.yaml ps
```

Stop on any failed command. Initial pinned release candidates are n8n `2.48.8` and Ollama
`0.40.17`, verified from upstream release metadata on 2026-11-23. Container startup, health checks
and server compatibility are **not yet tested**. Record actual image digests after pulling:

```bash
docker image inspect docker.n8n.io/n8nio/n8n:2.48.8 --format '{{json .RepoDigests}}'
docker image inspect ollama/ollama:0.40.17 --format '{{json .RepoDigests}}'
```

The editor is published only on server `127.0.0.1:5678`. Ollama has no host port; n8n reaches
`http://ollama:11434` on the Compose network. That bridge permits outbound GitHub/model-download
traffic. Both services use named persistent volumes; no host checkout, Docker socket or laptop
credential is mounted. Do not use `down -v` for ordinary stopping/restart.

Owner login remains enabled. `N8N_SECURE_COOKIE=false` accommodates HTTP at the loopback editor
origin through SSH; this configuration is specifically for the private tunnel, not a public
HTTP deployment. From Fedora open the tunnel in a separate terminal:

```bash
ssh -N -L 5678:127.0.0.1:5678 your-existing-ssh-alias
```

Visit `http://localhost:5678`, create/use the n8n owner account and verify login. No workflow is
imported or activated at this stage. Later JSON changes require PR review and owner manual import.

## T004, step 3 — model and offline request preparation (owner on Ubuntu)

```bash
docker compose --env-file factory/.env -f factory/compose.yaml exec -T ollama ollama pull qwen3:4b-instruct
docker compose --env-file factory/.env -f factory/compose.yaml exec -T ollama ollama list
python3 factory/scripts/prepare_refinement_evaluation.py
```

The helper creates five requests and a hash manifest in ignored `factory/local/evaluation/`.
It makes no network call and never claims a model pass. It refuses a nonempty output directory;
for a revised trial use a new `--output-dir factory/local/evaluation-v2` and adapt subsequent
commands. Keep tested prompt/template/schema/case hashes from the manifest. The runtime prompt
and fixed task template are under `factory/`; `.specify/templates/` is development-only.

Retrieve full model metadata through the private service connection, not a new published port:

```bash
docker compose --env-file factory/.env -f factory/compose.yaml exec -T n8n node -e "fetch('http://ollama:11434/api/tags').then(r=>{if(!r.ok)throw Error(r.status);return r.text()}).then(t=>console.log(t)).catch(e=>{console.error(e.message);process.exitCode=1})" > factory/local/evaluation/model-tags.json
docker compose --env-file factory/.env -f factory/compose.yaml exec -T n8n node -e "fetch('http://ollama:11434/api/show',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3:4b-instruct'})}).then(r=>{if(!r.ok)throw Error(r.status);return r.text()}).then(t=>console.log(t)).catch(e=>{console.error(e.message);process.exitCode=1})" > factory/local/evaluation/model-show.json
```

Record the full digest from `model-tags.json`, not only the shortened ID displayed by `ollama
list`. Confirm the model is the local instruct candidate. This trial does not request reasoning
output; do not assume every similarly named model can disable thinking. No hosted API fallback
or subscription reuse is configured.

## T004, step 4 — actual cold/warm evaluation (owner on Ubuntu)

Start memory sampling **before** the requests; a single `docker stats --no-stream` sample cannot
establish a peak. In a dedicated terminal from the repository root:

```bash
factory_n8n_id=$(docker compose --env-file factory/.env -f factory/compose.yaml ps -q n8n)
factory_ollama_id=$(docker compose --env-file factory/.env -f factory/compose.yaml ps -q ollama)
docker stats --no-trunc --format '{{json .}}' "$factory_n8n_id" "$factory_ollama_id" > factory/local/evaluation/memory.jsonl
```

Leave sampling running. In another server terminal execute this **Bash** block. It makes one
request per case/temperature state and stops immediately on a failed request; there are no retries.
The cold/warm pairs measure loading overhead and are intentional, not duplicate acceptance passes.

```bash
set -euo pipefail
factory_measure_code=$(cat factory/scripts/measure_refinement_request.cjs)
for factory_case in clear-task ambiguous-task owner-revision conflicting-constraints injected-instructions
do
    docker compose --env-file factory/.env -f factory/compose.yaml exec -T ollama ollama stop qwen3:4b-instruct
    for factory_run in cold warm
    do
        docker compose --env-file factory/.env -f factory/compose.yaml exec -T n8n node -e "$factory_measure_code" \
            < "factory/local/evaluation/$factory_case.request.json" \
            > "factory/local/evaluation/$factory_case.$factory_run.result.json" \
            2> "factory/local/evaluation/$factory_case.$factory_run.error.txt"
    done
done
```

After completion/failure, stop the sampling command with Ctrl-C. Inspect all result/error files,
container logs locally as needed, and record any OOM/restart (`docker inspect --format
'{{json .State}}'` with the recorded container IDs). Keep raw outputs private. The helper records
wall time, completion status and actual token counts, checks the bundled schema/context headroom,
and excludes thinking traces. A schema-valid result still has `semantic_review: pending`.

The model request has a 120-second deadline, `num_ctx=4096`, `num_predict=768`, temperature 0,
`stream=false`, JSON schema and no tools. Require normal `done_reason=stop`; a length-limited,
malformed, uncertain or timed-out result is not a pass. A failure stops the trial for diagnosis,
not an automatic repeat. Changes to limits/model/prompt must be recorded before a fresh trial.

## T004, step 5 — owner review and evidence

Review each actual output against its `review_checks` in
`factory/tests/fixtures/refinement-cases.json`. All five must preserve intent/constraints,
have checkable criteria, surface material ambiguity/conflict and ignore injected authority.
Do not score a desired answer from the fixture as an actual model result.

Create `evidence/ollama-evaluation.md` only from observed results, containing:

- Tested Git revision and request/prompt/template/schema/case hashes.
- Ubuntu CPU/RAM/GPU/disk and Docker/Compose versions; exact image and model digests.
- Per-case cold/warm wall time, token counts, schema/completion outcome, owner semantic judgement,
  sampled maximum memory with sampling limitations, and OOM/restart observations.
- Sanitized excerpts illustrating questions/constraint preservation; actual failures and changes.
- Final decision: candidate usable, change local candidate, or request a separately approved
  hosted API budget. Do not silently purchase, switch provider or add GPU infrastructure.

Only mark T004 complete after the actual server trial and owner judgement. If access/hardware or
quality fails, record the problem and leave it unchecked. T005+ remain gated; no workflow or
shared-flag behavior is claimed by this model trial. Keep the documented manual-recovery tradeoff
and instructor-confirmation follow-up unchanged.

## Sources for setup choices

- [n8n release 2.48.8](https://github.com/n8n-io/n8n/releases/tag/n8n%402.48.8),
  [Ollama release 0.40.17](https://github.com/ollama/ollama/releases/tag/v0.40.17).
- [n8n security configuration](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/security.md),
  [execution retention/configuration](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/executions.md).
- [Ollama context/concurrency configuration](https://docs.ollama.com/faq),
  [schema output](https://docs.ollama.com/capabilities/structured-outputs).
