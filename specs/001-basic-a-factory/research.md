# Research: Basic A Manual Software Factory

**Date**: 2026-11-22
**Status**: Phase 0 draft — D1/D2 require owner answers. Phase 1 is blocked until resolved.

## Evidence and scope

Read the local brief, constitution v1.1.1, approved spec, quality checklist, ignore rules and
SpecKit plan template. No application or deployment code exists locally. Anonymous REST calls
confirmed the existing public repository and all nine state labels; no remote changes were made.
Source URLs: [repository](https://api.github.com/repos/MBroholm/software-factory),
[labels](https://api.github.com/repos/MBroholm/software-factory/labels).

The mandated Phase 0 research agent investigated n8n deployment, persistence, concurrency,
retention and GitHub permissions using official documentation. The conclusions below are planning
recommendations; claims about product capabilities are distinguished from design inferences.

## R1 — One n8n instance under Compose

**Decision (recommendation)**: Run only n8n in regular mode on Ubuntu; Codex stays interactive on
Fedora. Pin a tested supported image and persistent data volume. The owner imports reviewed JSON.

**Rationale**: It separates always-on polling from laptop availability without developing a
runner. Compose is the owner's preference. The current official Compose guide includes optional
Assistant facilities; those are unrelated to this project's bounded refinement step and should
not be copied into this prototype. [Official Compose guide](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md).

**Alternatives considered**: Entire factory on laptop (not always on); hosted n8n (different hosting
preference); queue workers/Redis, Assistant sandboxes, runner container (unnecessary Basic A scope).
Exact image pin is a tested deployment artifact, not a researched claim that an untested tag works.

## R2 — SQLite and built-in small ledger

**Decision (recommendation)**: SQLite for n8n's database, small Data Tables for processing state,
plus GitHub as the human-facing system of record. Back up the data volume and encryption key;
test restart and restore before relying on them. No application DB schema or direct SQL against
n8n internals.

**Rationale**: n8n supports SQLite by default and PostgreSQL optionally. Data Tables persist data
across workflows, including duplicate-prevention markers; they suit this small workload. These
capabilities do not prove atomic distributed locking. [Database support](https://docs.n8n.io/deploy/host-n8n/configure-n8n/choose-n8ns-database.md),
[Data Tables](https://docs.n8n.io/build/work-with-data/data-tables.md).

**Alternatives considered**: PostgreSQL adds a service and backup procedure; reconsider if the owner
already operates it or deployment tests show need. Workflow static data alone is inappropriate:
it is experimental and has save/testing limitations. [Static data documentation](https://docs.n8n.io/build/code-in-n8n/cookbook/built-in-methods-and-variables-examples/getworkflowstaticdata.md).

## R3 — Serialize scheduled writes and separately reserve the build slot

**Decision (recommendation)**: Set `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`; keep one factory instance.
The build reservation persists independently of workflow execution completion. Stop and reconcile
conflicting ledger/label states. Pausing schedules and draining active executions is required
before manual production mutation tests.

**Rationale**: n8n serializes production trigger executions with this setting, but manual,
subworkflow, error and CLI executions bypass it. This is not a GitHub transaction or a distributed
lock. The persistent reservation supplies the much longer manual-build occupancy. These last two
points are design inferences. [Concurrency documentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/control-concurrency.md).

**Alternatives considered**: Only checking `Building` labels fails on overlap/crash; distributed
locking/queue services are disproportionate. Data Table upsert alone has no documented guarantee
sufficient to claim exactly-once mutation. Use event IDs, comment markers and pending operations
for crash reconciliation, with explicit failure-window tests.

## R4 — GitHub REST, approval provenance and minimal credentials

**Decision (recommendation)**: Use existing GitHub/HTTP Request nodes and paginate REST reads.
Fine-grained repository token: Issues write, Pull requests read, required metadata. Review actual
endpoint requirements when configuring credentials. Use issue timeline actors to verify owner
approval and comment IDs/content snapshots to bind it to the refined scope.

**Rationale**: GitHub exposes issue comments, labels, timeline actors and PR merge state. Issue
listings also contain PRs and must be filtered. Issue permission does not enforce label-specific
approval authority; that is a policy/code boundary. An owner-owned token shares the owner's actor
identity, so factory markers/known IDs must suppress self-triggered refinement. These guard rules
are design decisions, not guarantees provided by GitHub.
[Labels](https://docs.github.com/en/rest/issues/labels),
[comments](https://docs.github.com/en/rest/issues/comments),
[timeline](https://docs.github.com/en/rest/issues/timeline),
[pull requests](https://docs.github.com/en/rest/pulls/pulls).

**Alternatives considered**: GitHub App provides stronger automation attribution but more setup;
classic broad token grants excessive access; public inbound webhooks are not required for polling.
No factory PR-write, contents-write, merge, or GitHub Actions workflow-management permission.
A distinct automation identity remains optional; do not create one without owner agreement.

## R5 — Minimal operational policy

**Decision (recommendation)**: Poll every 60 seconds, process a bounded number of items per run,
order valid approvals by timestamp then issue number. Use deterministic idempotency markers and
bounded REST retries; never blindly retry a comment POST with uncertain outcome. Store durable
sanitized course evidence outside ephemeral execution logs.

**Rationale**: These are proportionate defaults, not source requirements. Record actual API usage
and tune during validation. Paginate all relevant issue, timeline, comment and PR reads. Use
execution pruning rather than unlimited payload retention; retain errors privately long enough
to diagnose, and publish only sanitized evidence. [Execution data documentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/manage-execution-data.md).

**Alternatives considered**: Webhooks, high-frequency polling, custom dashboards and a general
recovery engine increase setup without improving the course's manual loop. Never auto-expire a
build reservation based on the deferred Basic B timeout.

## D1 — Model access: owner answer required

**Recommendation**: One hosted API refinement call with structured goal/constraints/acceptance
criteria/questions output and no tools; validate output deterministically before posting it.
Preserve the rough issue and prior comments. Treat their content as untrusted task data, never
instructions to disclose credentials or invoke tools. Keep model/provider settings configurable
and the prompt versioned, without building a multi-provider framework.

**Tradeoff**: Hosted access minimizes server requirements but needs a usable account, paid quota,
data-sharing acceptance and an owner-approved spending boundary. A local model avoids hosted
inference charges but requires hardware and output-quality validation that have not been provided.
Codex's interactive coding-agent role does not select the refinement provider.

**NEEDS CLARIFICATION**: Existing model access or permission to recommend a hosted provider;
provider/model, spending boundary and suitability for public task content must be confirmed.
No secrets are requested in chat. Model-node and credential selection cannot be finalized yet.

## D2 — Editor access: owner answer required

**Recommendation**: Bind the editor to server loopback and use SSH forwarding from Fedora; use
n8n owner login. Scheduled outbound GitHub requests do not need a public editor or webhook.

**Tradeoff**: SSH forwarding avoids domain/TLS/reverse-proxy operation but requires usable SSH
access. Reuse an existing private VPN or protected proxy if present. Public HTTPS requires
additional network/authentication configuration and is not assumed.

**NEEDS CLARIFICATION**: Confirm private SSH access or describe the existing access path.

## Research gate and next step

D1 and D2 are pending, not resolved by inventing credentials, account access, costs or network
infrastructure. Under the speckit-plan requirement to error on unresolved clarifications, stop
before Phase 1 until answers are available. Then finalize the plan; generate data-model.md,
contracts/ and quickstart.md; re-run the constitutional design check. No runtime validation is
claimed by this research. No extension hooks are registered.
