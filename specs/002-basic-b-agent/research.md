# Basic B research decisions

**Date**: 2026-11-27. These are design decisions, not claims of deployment or passing tests.
Five owner policy answers in [spec.md](spec.md) are authoritative.

## Durable reservation and asynchronous work

**Decision**: Python service with separate SQLite ledger; a reservation API precedes Building,
then a start request authorizes dispatch after Building is verified. Commit attempt/slot before
acknowledgement. Every operation has stable identity and payload hash; hold on unknown outcomes.
**Rationale**: HTTP response loss and process creation are not a transaction. Separate reserve
and start prevents launch before the observable label while preserving a reservation through
crashes. SQLite suits one local writer; use explicit short transactions and unique constraints.
**Alternatives considered**: n8n execution as ledger loses durable task ownership; GitHub labels
alone cannot atomically claim local execution; Redis/worker queues add unnecessary services.
[Python sqlite3 documentation](https://docs.python.org/3.12/library/sqlite3.html) documents explicit
transaction controls; application-level constraints/reconciliation are still required.

## Worker supervision and restart

**Decision**: Named per-attempt Type=exec systemd user services, Restart=no, with cgroup termination and
a bounded runtime; API is a separate unit. Persist dispatch intent before invoking systemd,
query named unit before any repeat, and never re-dispatch a previously started/interrupted unit.
**Rationale**: PID existence alone is unsafe after PID reuse; the unit/cgroup identifies process
ownership and can terminate descendants. API restart cannot reset worker deadline. If the host
reboots or execution is interrupted, report Stuck and require owner retry. Unknown process/unit
state holds the slot. The API's own auto-restart is allowed; agent auto-restart is not.
**Alternatives considered**: background thread loses supervision with API death; saved Codex
sessions conflict with the owner's fresh-invocation choice; cron timeout depends on polling.
See [systemd service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
and [kill behavior](https://www.freedesktop.org/software/systemd/man/latest/systemd.kill.html).

## Codex execution contract

**Decision**: Fresh `codex exec` invocation, prompt via stdin, `--output-schema`, explicit working
directory and final-message file; separate private JSONL diagnostics. No resume command. Set
noninteractive approval policy to never through tested configuration; use workspace-write,
explicit task-local configuration and no bypass flag. If required work is blocked by permissions,
report Stuck rather than silently broadening access. Trusted runner owns Git push after exit.
**Rationale**: Local read-only inspection found codex-cli 0.172.0 supports these exec inputs.
Validate exact Ubuntu binary/config semantics before adopting; do not install or authenticate now.
**Alternatives considered**: parse free text (rejected by owner), remote agent server (unneeded),
unrestricted personal account (rejected by owner). Owner chooses/provisions Codex authentication;
use its dedicated auth store, never personal login reuse by assumption.
[Official noninteractive guide](https://developers.openai.com/codex/noninteractive/) supports schema
output; schema compliance alone does not prove the task or tests succeeded.

## Authentication and private reachability

**Decision**: Role-separated repository-scoped fine-grained GitHub credentials; n8n Issues write
and Pull requests write/read, runner Contents write plus Issues read for launch/closure checks.
Codex auth belongs to the dedicated runner account. Runner bearer secret is a separate saved n8n
HTTP credential, not embedded workflow JSON. On Linux, bind runner to a dedicated host-side
Docker bridge address reachable only by the factory network and host; firewall denies other
interfaces. Container localhost cannot reach a host loopback listener. No public port or Docker
socket mount. Test runner uses a separate bridge/address, DB, secret and account.
**Rationale**: Implements owner policy without imposing advanced restricted agent networking.
Credentials are private files; no token in remote URLs, prompt, process arguments or logs.
Basic B account separation is not protection from malicious code executing as that same account.
**Alternatives considered**: public listener/shared personal credentials (unnecessary exposure),
agent container isolation (advanced, out of scope), adding SSH transport (unneeded).
[GitHub token guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
and [PR endpoint permissions](https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request)
support this role mapping; verify actual grants during implementation. Do not grant Workflows
write by default; a task needing it stops for owner permission review.

## Workflow integration and ordering

**Decision**: Retain existing shared fail-stop guard and single production execution. Add collect
as fourth workflow; all mutations use that guard. Durable runner slot survives guard release.
Priority class 0 is applicable question answers and explicit Stuck retries; class 1 is initial
approvals and owner-directed QA rework. Within class use Approved-entry timestamp then issue
number. No preemption or ageing override; repeated urgent work can delay ordinary work.
**Rationale**: Owner chose priority without interruption. Deterministic within-class tie rules
are delegated planning details. Existing approval() and trackingPlan() cannot treat automated
Approved transitions as initial owner approval; add v2 input/authorization records.
**Alternatives considered**: hold slot through human waiting (owner rejected), FIFO without priority
(owner rejected), automatic advanced QA feedback continuation (out of scope).

## External effects, publication and partial work

**Decision**: Record intent before GitHub writes or push; reconcile markers, exact branch SHA and
PR head/base/attempt before repeating. Unknown writes do not trigger blind POST retries. Use
preserved per-task checkout, snapshot uncommitted changes privately after stop and record hashes;
only manifest-attributable work can be reused. No automatic clean/reset/rebase/force-push.
**Rationale**: Exactly-once external effects are not guaranteed by REST. At-most-once publication
under uncertainty requires conservative holds and owner recovery. Pull-request creation reports
actual agent checks with provenance; no independent runner test pass claim.
**Alternatives considered**: retries on all network failures risk duplicate effects; discard all
partial work loses owner-approved context; independent verification is advanced scope.

Spawn commands as argument vectors with shell=False and controlled environment; stream into bounded private logs. Do not rely on subprocess communication timeout alone to kill descendants. See [Python subprocess](https://docs.python.org/3.12/library/subprocess.html).

No unresolved policy remains. Ubuntu versions, secrets, instance IDs and model identity are
implementation preflight inputs, not invented research facts. Missing/unsupported preflight
stops adoption; it does not silently choose a different host, model or security policy.
