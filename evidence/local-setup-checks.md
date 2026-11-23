# Local setup checks — T001–T003

**Date**: 2026-11-23. **Branch**: `001-basic-a-factory`.
These are observations from the current development workspace. They are not Ubuntu-server
evaluation evidence and do not count as a real factory task run.

## Repository and prerequisites

| Check | Actual outcome |
|---|---|
| Spec-quality checklist | PASS: 16 checked, 0 unchecked; markers left unchanged |
| Git branch / repository | PASS: current feature branch, expected origin |
| Public repository and owner | PASS: anonymous REST response confirmed public `MBroholm/software-factory`, `main`, owner ID `202449424` |
| Existing state labels | PASS: all nine expected labels found; none created/changed |
| Git / SSH / Python / Node | Available: Git 2.56.1, OpenSSH 10.5p1, Python 3.15.2, Node 24.19.0 |
| Docker / Compose CLI | Available: Docker 29.10.0, Compose 5.8.0; daemon/container startup not tested |
| Codex / SpecKit | Available: Codex CLI 0.171.0, Specify CLI 1.4.4.dev0 |
| Codex version command | Returned version with a read-only PATH-alias warning; login/model access not tested |
| GitHub CLI authentication | Initially not logged in; after owner authentication, authenticated `gh api user` succeeded as `MBroholm` / `202449424`. Repository API confirmed pull/push and administrative access. No write operation was attempted. |
| Ubuntu SSH/hardware | UNRUN: no server alias/session was supplied to this workspace |

Some subsequent sandboxed piped HTTP checks returned empty input and failed JSON parsing.
The read-only checks were retried with approved external network access and succeeded; those
successful JSON responses supplied the repository/label verification above. After the owner authenticated GitHub CLI, sandboxed `gh api` checks hit network restrictions;
an approved external-network retry confirmed the authenticated identity and repository access.
This CLI login does not provision the separately scoped n8n GitHub credential. No write API was used.

## Deployment configuration

The upstream GitHub release metadata returned `n8n@2.48.8` (published 2026-11-23) and
`v0.40.17` for Ollama (published 2026-11-10). Exact image version candidates are recorded in
Compose and `.env.example`. Release verification is not a container/image compatibility test;
actual pulls, digests and startup are T004 server work.

| Local check | Actual outcome |
|---|---|
| Compose rendering with a dummy, nonproduction key | PASS: exit 0, parsed JSON configuration |
| Compose missing/empty encryption key | PASS negative test: nonzero exit with required-key error |
| Rendered deployment assertions | PASS: exactly n8n/Ollama; one loopback-only editor mapping; no Ollama host port; serial production/inference settings; named volumes; outbound bridge; no host/socket/build mounts |
| Image reference assertions | PASS: version-pinned image references, no floating `latest` |
| Actual image pulls/startup/health | UNRUN: no containers started by this change |

Compose checks used `docker compose --env-file factory/.env.example -f factory/compose.yaml
config --format json` with a transient dummy `N8N_ENCRYPTION_KEY`, never a real secret. Validation
captured the resolved configuration privately and printed only assertion outcomes. Do not publish
resolved production configuration or copy the dummy validation value to a real server.

## Runtime artifacts and evaluation preparation

| Local check | Actual outcome |
|---|---|
| Schema equality with approved refinement contract | PASS: parsed JSON schemas match exactly |
| Fixture parsing/categories | PASS: five distinct clarity/ambiguity/revision/conflict/injection cases, each with owner-review assertions |
| Runtime template slots | PASS: expected model fields and workflow-only source/version metadata slots present |
| Python helper syntax | PASS: `python3 -m py_compile factory/scripts/prepare_refinement_evaluation.py` |
| Node helper syntax | PASS: `node --check factory/scripts/measure_refinement_request.cjs` |
| Offline request preparation | PASS: five requests generated under ignored `factory/local/setup-check-requests/`; no network/model call |
| Request/artifact integrity | PASS: manifest/request SHA-256 values match current artifacts; separate system/data messages; owner-review assertions excluded from model input |
| Request bounds | PASS: all five pass the conservative byte screen and use `num_ctx=4096`, `num_predict=768`, temperature 0, non-streaming schema output and no tools |
| Existing-output protection | PASS negative test: helper rejects nonempty output directory without overwriting |
| Output-path protection | PASS negative test: helper rejects a directory outside ignored `factory/local/` |
| Measurement helper with synthetic fetch responses | PASS: valid completion is schema-valid but semantic review remains pending; seven invalid outputs/completions are rejected; tool-bearing input rejected before fetch; no retries |
| Private/generated ignore checks | PASS: real `.env`, local responses/backups and Python bytecode ignored; `.env.example`, prompt/template and fixture inputs remain trackable |
| Whitespace, new-document links and task-state scope | Verified in final local validation; only T001–T003 are marked complete |

Synthetic measurement-helper cases covered non-JSON, empty required string, extra field, empty
acceptance criteria, truncated completion, insufficient context headroom and unexpected tool
calls. They exercised the actual helper with stubbed responses; they were not real inference or
evidence of model quality, memory consumption, n8n startup or workflow behavior.

## Pending T004

The owner must perform the [server steps](../docs/operations.md#t004-step-1--preflight-and-transfer-owner-on-fedoraserver),
record actual model/image digests, cold/warm results and sampled memory, then judge each output.
No actual output example, schema-completion result from Ollama, semantic score, latency or server
memory result exists yet. T004 stays unchecked, and full workflow implementation remains gated.
