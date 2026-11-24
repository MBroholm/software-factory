# Quickstart and Validation: Basic A

**Date**: 2026-11-24. This is a post-implementation guide, not a claim the planned files exist
or tests have passed. No deployment is performed by planning. Use only reviewed artifacts on
`001-basic-a-factory` initially; factory-run tasks later use their own issue branches.

## 1. Prerequisites and preflight

Owner verifies on Ubuntu: CPU/RAM/GPU, free disk, supported Docker Engine/Compose, SSH access,
no conflicting local ports and enough headroom for n8n. Gemini 3.5 Flash-Lite is the owner-selected
refinement provider on the confirmed free tier; no GPU purchase or paid billing is authorized. On Fedora: Git, interactive Codex/SpecKit, SSH, GitHub CLI and Python 3
for lightweight contract tests. Configure GitHub credentials locally, never in chat or tracked files.

```bash
# Fedora
ssh ubuntu-server 'uname -m; free -h; df -h; docker --version; docker compose version'
gh auth status
gh api repos/MBroholm/software-factory/labels --paginate --jq '.[].name'
```

Replace `ubuntu-server` with the actual existing SSH alias/user@host. Confirm all existing state
labels, public repository and stable owner ID. Do not recreate labels or treat write access as
proven by a successful read. Create a repository-scoped fine-grained n8n credential with Issues
write, Pull requests read and required Metadata access. Separately retain human/agent push/PR
permissions on Fedora; no factory Contents write or merge authority.

## 2. Prepare the reviewed deployment

The implementation will provide `factory/compose.yaml` and `factory/.env.example`. Inspect
reviewed changes before installing. Server-local secrets/environment remain outside Git; use
restricted file permissions, and never paste resolved configuration containing secrets into
issues. Pin the tested n8n image rather than a floating production tag. Preserve existing volumes.

```bash
# Ubuntu, from the checked-out repository root; after implementation
cp factory/.env.example factory/.env
chmod 600 factory/.env
# Edit server-local values and credential/encryption configuration privately.
docker compose --env-file factory/.env -f factory/compose.yaml config --quiet
docker compose --env-file factory/.env -f factory/compose.yaml up -d n8n
docker compose --env-file factory/.env -f factory/compose.yaml ps
```

Record the n8n image digest, requested Gemini model ID, returned model version and runtime
prompt/template hashes. The hosted alias is not an immutable model digest. n8n requires outbound
HTTPS to GitHub and Google; no additional inbound port is required. The existing Compose file
still includes unused Ollama from the trials; T012 will make startup optional. Starting only n8n
does not stop an already-running Ollama service. Do not delete caches/volumes or use `down -v`.

## 3. Access the private editor

```bash
# Fedora; leave this SSH process running while using the editor
ssh -N -L 5678:127.0.0.1:5678 ubuntu-server
```

Open `http://localhost:5678` on Fedora, create/use n8n owner login, and verify session cookies work
with the pinned release's loopback editor settings. Bind the server's published port to
`127.0.0.1:5678`, never all interfaces. If the local port is occupied, forward another local port
and configure the expected editor origin consistently. Disconnecting SSH closes browser access;
the server factory continues polling. No public editor/domain/reverse proxy is required.

## 4. Verify the adopted provider, then provision guard and import manually

The owner adopted Gemini 3.5 Flash-Lite on 2026-11-24 after unsuccessful local trials,
a versioned hosted comparison and a successful Ubuntu-container API smoke check. See
[actual evidence](../../evidence/gemini-evaluation.md). The alternative-model choice checkpoint
is satisfied; T004 evidence closeout and owner acceptance are complete. Do not repeat local-model loading or
full benchmark tests merely to reconfirm the verified network path.

Runtime inputs remain `factory/templates/task.md` and `factory/prompts/refinement.md`;
`.specify/templates/` guides development artifacts only. Use the exact
[Gemini request/output contract](contracts/refinement.md), including bounded input/output,
JSON schema, pending decisions, 120-second timeout and no automatic retries or paid fallback.
Before activation:

1. Verify n8n owner login through SSH. Save the free-tier API key privately as a dedicated
   header-auth credential (`x-goog-api-key`), never a workflow literal or URL query parameter.
2. Confirm active project quotas in AI Studio; do not enable billing or switch models.
3. Assess existing v2/v3 evidence and run only missing/change-affected prompt checks; don't
   claim the four v2 outputs were tested against v3. Keep public results sanitized.
4. After owner manual import of reviewed JSON, verify saved-credential use in the actual HTTP
   Request node with the reviewed runtime versions (T012/T014). The earlier Node-in-container
   smoke test did not exercise n8n's credential store or workflow engine. Keep schedules inactive.
5. Verify API/quota errors stop and retain the shared flag, with redacted evidence and manual
   recovery; no silent retry/model fallback. Reuse the appropriate guard/story checks.

In the n8n Data Tables UI, create `factory_control` with the exact columns in
[data-model.md](data-model.md), and one `global` row with `busy=false`. This is not a task ledger.
Map the table and credential references in the three reviewed workflow JSONs during manual
import. Keep schedules inactive until isolation, credentials and model checks pass. The owner
imports JSON by hand after review; CLI/deployment automation must not replace this quality gate.

If small automated fixture checks are implemented, run them as follows; otherwise report them
as unrun/not implemented and execute the required workflow-level matrix below. An empty test
discovery result is not evidence that the guard works.

```bash
# Fedora/repository root, only after implementation provides actual test cases
python3 -m unittest discover -s factory/tests -p 'test_*.py'
```

These tests cover parsing/transition guards with fixtures, not mocked proof of a real factory.
Implementation should provide only enough tests for the risky rules and failure windows below.
Avoid a generic integration platform. Logs/pinned data must contain no credentials. Verify any
exported JSON before commit; remove execution data and pinned/private test payloads.

## 5. Activate production deliberately

Verify exactly one factory instance and `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`. All three workflows
must acquire the shared flag before mutation. Never execute a manual mutating run while any
production schedules are active: the concurrency limit does not cover editor/CLI executions.
Owner activates the three schedules after reviewing imported revision IDs and credential/table
mappings. Polling default is 60 seconds; inspect backlog/actual runtime before tuning.

## 6. End-to-end and edge-case validation

Use small real issues in the existing repository, with the owner's explicit approval for any
build. A useful first task is a bounded documentation/factory improvement, not a newly chosen
product implementation. Deliberately crafted failure tests run only in an isolated instance or
while all production schedules are paused/drained. Never manufacture a non-owner approval by
sharing credentials; use fixtures where a second identity is unavailable and report that limit.

| Check | Steps | Expected outcome / requirement |
|---|---|---|
| Owner-only intake | Submit owner `Ideas` issue; compare non-owner fixture | Only owner issue refines; FR-002 |
| Refinement/revision | Observe refinement; owner adds discussion at Ready; poll again unchanged | New revision once, preserved history; no bot-comment loop; FR-003/004/016, SC-001/005 |
| Approval | Owner explicitly adds Approved to current refinement | Valid actor/current source required; missing/edited approval input holds, never AI approval; FR-005 |
| Reservation | Approve two tasks; leave laptop agent unstarted after first claim | One Building only; second waits across polls and restart; FR-006/007 |
| Manual coding | Follow handoff, launch Codex manually on issue-N, resolve question in session | No auto-start; material answer summarized on issue; changed scope reapproved; FR-008/015 |
| PR/review | Open linked same-repo PR to main with actual-check summary | Next eligible poll enters QA; owner reviews approval/link/branch/evidence/secrets/permissions; FR-009/010 |
| Rejected attempt | Close PR unmerged, leave issue open | Remains QA; no repeated QA comments; FR-011 |
| Rework | Owner comments and reapproves; observe fresh handoff, then new PR or new commits | Ordinary in-scope rework comment/session summary does not invalidate captured source; old PR does not overwrite Approved/Building; ambiguity holds; FR-010/011 |
| Completion | Owner merges current result, or closes task issue | Done only for confirmed merge/issue closure; FR-011 |
| Workflow change | Review JSON change and merge if accepted | Owner manually imports; no automatic activation; FR-012 |
| Successful flag release | Exercise acknowledged work in each of refine/reserve/track | Acquired flag returns to idle; next scheduled execution can run; Building reservation persists where appropriate |
| No-work flag release | Exercise each workflow with no eligible work, unchanged input or occupied build slot | Acquired flag returns to idle without repeated comments or global deadlock |
| Existing hold | Enter each workflow with busy already true | Skip preserves busy and original context; no remote mutations |
| Unexpected failure retention | Inject an unanticipated exception before and after a side effect in each workflow | Busy remains true; failure visible; next scheduled execution skips until manual repair |
| Release/acquisition failure | Fail/lose acknowledgement of guard release or acquisition | No assumed idle; no forced reset or remote work without confirmed acquisition |
| Model/API failure | Return invalid output or unavailable service in test instance | No false Ready/Done; failure retained and guard held; FR-016 |
| Interrupted reservation | Stop test execution between add Building and remove Approved/comment | Guard remains held; no second task claimed; owner normalizes labels manually; FR-006/016 |
| Unknown comment POST | Simulate response loss after comment accepted | Guard held; later polls skip; owner checks marker before retry; no blind duplicate POST; FR-016 |
| Conflict/ambiguity | Supply conflicting states, missing control row or multiple plausible PRs | Visible safe hold; no guessed progression; FR-016 |
| Restart/restore | Restart with busy flag true and Building occupied | Neither auto-clears; manual inspection before resume; FR-007/016 |

For success SC-002, at least one real approved run must include a real question/issue summary,
isolated branch, PR and owner decision. Other fixtures exercise failure behavior but do not count
as real task runs. Record every outcome as passed, failed or unrun; do not mark planned checks as
passed. The final assignment still requires at least five real issue/PR-linked runs.

## 7. Manual failure recovery

1. Pause all three schedules and drain active executions. Do not launch more Codex tasks.
2. Inspect `factory_control` context and the failed n8n execution. Check whether the laptop agent
   is still working; do not free its Building slot while it remains active.
3. Inspect current labels, latest owner approval, refinement/handoff markers and PR state. After
   any unknown write, verify the actual outcome before doing another POST. If outcome remains
   unclear or GitHub unavailable, retain the hold and wait; do not guess.
4. Record sanitized failure, known side effects and recovery decision on the issue. If GitHub
   was unavailable, private execution evidence is the temporary fallback; summarize when restored.
5. Normalize a partial label transition, retain an already-posted matching output, or explicitly
   start a fresh refinement as appropriate. A stranded Refining state never resumes automatically.
   For unchanged scope owner may explicitly reapprove retry; changed scope requires fresh explicit
   approval. Removing/readding Approved creates a distinguishable new approval event for rework.
6. Verify no duplicate comments/results and at most one Building issue. If the rejected PR is
   closed unmerged while its issue stays open, retain QA unless the owner explicitly reapproves.
7. Reset the one control row to idle only after reconciliation. Resume schedules and watch one
   poll. Capture the intervention in evidence. Never reset by elapsed time alone.

This is an intentional manual operating procedure, not a promise of automatic crash repair or
exactly-once operations under arbitrary remote/human races. If a stronger guarantee is required,
clarify FR-016 and revisit the design before implementation.

## 8. Backup and evidence

Stop n8n before making a consistent volume copy; preserve its encryption key securely alongside
the backup. Restore privately, inspect busy state and workflows while schedules remain inactive,
then run the same review/reset protocol. Never commit the database, keys, raw private execution
payloads or backup archives. Preserve the optional historical Ollama cache separately; Gemini
access is restored through the encrypted n8n credential store, not a copied evaluation key file.

Implementation produces architecture/operation/permission docs, prompt/template/example and a
sanitized evidence index. For each run include issue/PR URLs, revision/approval, actual checks,
failures/retries and human intervention. Pruned n8n logs are not the permanent course evidence.
The instructor-confirmation requirement remains unconfirmed; do not claim its resolution.
