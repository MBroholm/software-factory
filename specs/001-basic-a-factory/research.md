# Research: Basic A — Manual Software Factory

**Updated**: 2026-11-23 | **Status**: Architecture decisions resolved as recommendations;
local hardware/model suitability must be validated before activation.

## Context and method

Read the brief, constitution v1.1.1, approved spec, original draft and checklist. The original
artifacts remain in commit `920399e`. A research agent checked official deployment, GitHub and
Ollama references; the primary agent reviewed the complexity against FR-001–016. Existing public
repository and labels were verified by anonymous GitHub API reads on 2026-11-22. No server was
accessed and no runtime/model benchmark was executed.

## R1 — Separate manual development from always-on orchestration

**Decision**: Recommend n8n and local Ollama on Ubuntu in Compose, with interactive Codex on Fedora.

**Rationale**: Matches owner preferences and leaves only issue/PR operations crossing machines.
The brief requires n8n and manual agent launch, not a custom bridge into Fedora. Compose is a
user preference, not a course mandate.

**Alternatives considered**: Laptop-only n8n loses always-on operation. A runner, remote shell
launcher, worker pool and current optional n8n Assistant sandbox services exceed Basic A.
Do not copy a full hosted Assistant stack. [n8n Compose installation](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md).

## R2 — Remove task ledger; retain one fail-stop flag

**Decision**: GitHub is the sole task record. Remove Data Table task cursors, reservation rows,
approval journals and pending-operation replay. Keep exactly one `factory_control` row with a
busy flag and execution/issue context for manual diagnosis.

**Rationale**: FR-006/007 need a persistent occupied slot, supplied by `Building`. FR-004/016
need repeat suppression, supplied by marked refinement source identifiers. FR-005 needs current
explicit approval, not an approval database. However, FR-016/SC-005 need unattended polls not to
repeat unknown writes: acquire the shared busy flag before side effects, clear only after
success. Error/crash leaves it held. Recovery is manual, with no automatic journal replay.

**Alternatives considered**: No durable error flag leaves the next scheduled poll free to retry
a timed-out operation. A per-operation journal plus automatic reconciliation adds substantially
more code without creating a transaction with GitHub. Static workflow data has save/manual-test
limitations and is not an appropriate cross-workflow fail-stop control. n8n Data Tables already
provide small persistent records, but do not promise a distributed mutex.
[Data Tables](https://docs.n8n.io/build/work-with-data/data-tables.md),
[static workflow data](https://docs.n8n.io/build/code-in-n8n/cookbook/built-in-methods-and-variables-examples/getworkflowstaticdata.md).

## R3 — Serialize workflow writes; pause for manual recovery

**Decision**: One n8n instance in regular mode, `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`, no manual
production-mutating execution while schedules run. No parallel manual recovery. All workflows
use the single flag. Set target label before removing source; preserve unrelated labels.

**Rationale**: The setting serializes production trigger executions but excludes manual,
subworkflow, error and CLI execution. The flag detects incomplete previous work; it is not the
manual-build slot. Label updates and comment writes are not atomic together, and human edits
remain outside n8n serialization. Conservative halts/manual normalization are proportionate.
[Concurrency control](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/control-concurrency.md).

**Alternatives considered**: Labels alone do not serialize concurrent workflow executions.
Distributed locks/transaction services are unnecessary under a single writer. If FR-016 is
intended to mean exactly-once across all remote failures and independent concurrent editors,
clarify that stronger requirement rather than silently promising it. The plan explicitly covers
normal repetition and stops after ambiguity, not arbitrary distributed exactly-once execution.

## R4 — Explicit approval and light build association

**Decision**: Latest owner `Approved` event, current refinement ID/content times/source digest,
and a marked handoff comment referencing both. Owner checks the exact task at manual launch.
For rework, handoff records prior PR numbers/head SHAs; old results never override newer approval.

**Rationale**: Meets FR-005/008/010/011 without reconstructing all edit history or automatic scope
classification. Ambiguous history, multiple result PRs, changed approved inputs or unchanged
reopened results require manual resolution/fresh approval. Digest validation uses the captured comment IDs, not every later owner comment: session
summaries and unchanged-scope QA rework must remain compatible with reapproval. A hash detects
changed inputs; it is
not a semantic scope judgement or an immutable authorization token.

**Alternatives considered**: Labels without actor/revision checks are too weak. Cryptographic
signatures, approval journaling, reconstructing deleted versions and a general attempt database
are not needed for this manual launch loop. Owner-authorized handoff gives future Basic B an
input contract without implementing its runner now.

GitHub endpoints support comments, timeline and PR state. Issues listings include PRs; paginate
and exclude them. Use a single-repository fine-grained token with Issues write, Pull requests
read and required Metadata access. n8n gets no Contents write/PR write/merge capability.
An owner-owned token shares actor identity, so exclude known factory markers when watching owner
comments. GitHub has no per-label approval permission; the policy remains code/operationally
bounded. [Timeline](https://docs.github.com/en/rest/issues/timeline),
[labels](https://docs.github.com/en/rest/issues/labels),
[comments](https://docs.github.com/en/rest/issues/comments),
[pull requests](https://docs.github.com/en/rest/pulls/pulls).

## R5 — Local refinement first, bounded evaluation

**Decision**: Recommend Ollama with `qwen3:4b-instruct` as the first small candidate; benchmark
before activation, record model digest and tested settings. One inference at a time, explicit
4096-token context and bounded output. No paid fallback is activated automatically.

**Rationale**: The user has Plus and asks whether local refinement suffices. This is a narrow
rewrite/question task with human review, so local inference is worth trying; sufficient quality
and latency on unknown hardware are hypotheses to test, not established facts. Plus does not
include ordinary OpenAI API usage. [OpenAI Plus explanation](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus).

Use Ollama native `/api/chat`, `stream:false`, JSON schema in `format`, no tools. Validate final
`message.content`; discard thinking output. Schema validity does not prove acceptance criteria
are meaningful or that the model preserved scope. [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs),
[chat API](https://docs.ollama.com/api/chat).

**Alternatives considered**: A hosted API minimizes hardware dependence but requires separately
approved account/billing and spend limit; it is the fallback decision if the local trial fails.
Do not automate Codex on the server to reuse a subscription. Generic `qwen3:4b` currently maps to
a thinking variant; the distinct instruct tag avoids assuming every model can disable thinking.
Inspect `/api/show`, pin the downloaded digest; model tags can change.
[Qwen3 tags](https://ollama.com/library/qwen3/tags),
[thinking controls](https://docs.ollama.com/capabilities/thinking).

CPU-only Docker is supported; GPU setup is optional if existing hardware makes it useful. Model
file size is not RAM needed at a particular context size. Ask for CPU/RAM/GPU before choosing
larger models; bound context/concurrency and measure alongside n8n. Do not purchase hardware as
part of this plan. [Ollama Docker](https://docs.ollama.com/docker),
[Ollama FAQ](https://docs.ollama.com/faq).

## R6 — Private editor via existing SSH

**Decision**: Resolved by owner's confirmed Fedora-to-Ubuntu SSH access. Recommend server
`127.0.0.1:5678` binding and Fedora local forwarding to the same loopback port; owner login remains.
No public editor, TLS termination, domain, inbound GitHub webhook or VPN deployment.

**Rationale**: Editor traffic goes through the encrypted SSH connection. The factory continues
polling when the laptop/tunnel is off. Ollama is accessible only by Compose service name, with no
published host port. Keep outbound access for GitHub/model downloads; do not mark the only n8n
network internal without a separate egress network.
[Compose networking](https://docs.docker.com/compose/how-tos/networking/).

**Alternatives considered**: Reuse an existing VPN/proxy if desired later. A public HTTPS editor
adds setup with no Basic A requirement. The server alias is a runbook parameter, not a blocker.

## R7 — Persistence, evidence and limited validation

**Decision**: Default SQLite, named volumes, backup stopped n8n data with the encryption key,
private execution pruning and sanitized public evidence. Recommend 14-day execution retention,
60-second schedules, bounded REST calls and no automatic write/model retries.

**Rationale**: One owner and three low-volume workflows do not need another DB service. The final
five-run evidence must outlive transient n8n execution logs. Runtime failures are retained until
summarized without secrets; backup restores must inspect the busy flag before resuming.
[Database support](https://docs.n8n.io/deploy/host-n8n/configure-n8n/choose-n8ns-database.md),
[execution data](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/manage-execution-data.md).

**Alternatives considered**: PostgreSQL if real operational need appears; unlimited logs risk
payload/secret retention. A large mocked integration platform is unnecessary: use small fixtures,
critical failure-window tests and real issue/PR demonstrations.

## Remaining deployment checks and owner decisions

Architecture is specified; no unresolved scope question blocks Phase 1. Before activation:
confirm CPU/RAM/GPU and usable candidate model; pin tested software/model versions; configure
repository token and SSH alias; review recommended FR-016/SC targets. If model quality/resource
checks fail, owner chooses a different local candidate or approves a hosted budget; do not guess.
The instructor-confirmation requirement remains outstanding and unchanged. No automated
resumption is planned. No extension registry/hooks exist.
