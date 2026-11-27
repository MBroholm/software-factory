# Runner HTTP contract v1

Private server-local authenticated JSON HTTP. All endpoints require `Authorization: Bearer`
using a dedicated secret, including reads. No secret in URLs. Reject unknown repository,
absolute checkout path, command/model override or arbitrary shell instruction fields. Paths
are runner-controlled. Validate strict schemas, 256 KiB request cap and bounded string fields;
oversized context holds for owner/refinement rather than silent truncation. No public listener.

## Endpoints

| Method/path | Input | Response and effects |
| --- | --- | --- |
| GET /v1/health | none | 200 healthy or 503 recovery required; authenticated, no secret detail |
| GET /v1/slot | none | Current reservation/generation or empty; includes unresolved holds |
| PUT /v1/attempts/{uuid}/reservation | immutable task/authorization/input snapshot | 201 first durable reservation, 200 same payload replay, 409 other slot/payload conflict; no agent launch |
| POST /v1/attempts/{uuid}/start | reservation generation, Building observation/source proof | 202 accepted after commit, 200 same already accepted/terminal attempt; no waiting for coding |
| GET /v1/attempts/{uuid} | none | 200 stable status/result/effects; 404 unknown does not prove no earlier effects after restore/incomplete reconciliation |
| PUT /v1/attempts/{uuid}/cancellation | stable reason and closure reference | 202 cancellation recorded or 200 replay; not proof the process stopped |
| PUT /v1/attempts/{uuid}/effects/{kind} | expected intent/content digest then external confirmation | 200 journal update with compare-and-set; conflicting confirmation is 409 and hold |
| POST /v1/attempts/{uuid}/release | generation, stopped proof and confirmed publication/state references | 200 safe idempotent release; 409 if running, uncertain, mismatched generation or required effects unresolved |

Unauthorized reads/writes return 401, malformed schema 422, over-limit body 413. Busy/conflicting
requests never mutate the existing attempt. All request timeouts are unknown outcomes until
reconciled. Do not create a new UUID after a timeout. Stable attempt UUID is derived from repository,
issue and unique authorization reference using a fixed UUID namespace, then stored durably.

## Immutable reservation input

Fields: contract_version=1, repository, issue_number, owner_author_id, authorization object
(kind/id/initial approval evidence, optional question/answer or retry event), refinement source
references and SHA-256 digests, approved specification text, discussion references/text/hashes,
previous attempt and partial-work manifest references, expected branch/base, requested model
configuration identifier (allowlisted runner configuration only). Context includes all approved
criteria/constraints and unresolved decisions; do not let discussion override approved scope.
Canonical sorted-key JSON UTF-8 serialization is hashed; never accept caller-supplied hash alone.

n8n validates complete paginated GitHub history. Runner independently reads current issue author,
closure/state and referenced immutable input before launch, using Issues read. Start requires
Building and matching approval lineage. Re-read before spawning and before runner push. Failure
to confirm freshness prevents launch/publication; it cannot broaden approved scope.

## Dispatch, deadline and restart

Persist accepted/dispatch intent then start the named systemd unit exactly once. Worker claims
its persisted dispatch state transactionally before any Codex spawn. Duplicate service starts
cannot acquire that claim. Record unit identity and boot id; never rely on PID alone. On API
restart, inspect unit and ledger before accepting new work. API availability is not worker health.
Keep completed unit evidence until its terminal result is durably reconciled; do not use automatic unit collection to erase dispatch evidence. An interrupted execution becomes Stuck, not automatically restarted. A still-live unit retains
its original deadline. Unknown status holds the reservation for owner recovery.

Use per-attempt Type=exec (not oneshot), RuntimeMaxSec=1795s, TimeoutStopSec=5s, KillMode=control-group, SendSIGKILL=yes,
Restart=no. Start the execution budget at worker activation, conservatively including preparation.
Record deadline before spawn. Clock uncertainty never grants extra runtime. Confirm empty unit
cgroup before declaring stopped; descendants must not escape supervision. No privileged tasks,
daemonization or service-manager access is part of the agent's authorized work.

## Publication and release

Runner owns Git push; n8n owns issue comments, labels and PR creation. For each effect, write an
intent before performing it; reconcile remote exact SHA/marker/head/base after uncertain writes.
No blind repeat POST. If a completed response is lost, later GET returns the same immutable
result. Result reads do not consume or acknowledge it. Collection is replay-safe until explicit
release; retain result after release for stale-poll reconciliation.

For done, require successful push confirmation, matching result SHA and PR association before
QA/release. An empty branch/no PR diff is Stuck with actual diagnostic, not claimed independent
code verification. For question/stuck, confirm comment and target labels then release. Closure
supersedes publication: record cancellation before further writes, stop worker, reconcile any
already-issued writes and release without creating a new PR. If GitHub is unavailable, retain
slot and private diagnostic; do not claim issue visibility until its write succeeds.

A token grants the trusted n8n orchestrator these ledger mutations; no runner credential or
control API is supplied to the model prompt. Basic B same-account execution is not a malicious
agent isolation guarantee. A manually observed state change can race an in-flight REST request;
reconcile already-issued effects rather than claiming a cross-system atomic transaction.

## US2 additive question endpoints

Both endpoints use the same bearer, body limits and fail-closed parsing as the v1 API.
`GET /v1/questions` returns current unconsumed question attempts with their durable question and
optional answer claim; released historical attempts remain readable through their UUID endpoint.
It does not consume an answer, reserve a task or change labels.

`PUT /v1/attempts/{uuid}/answer` takes the strict immutable claim: `authorization_id`,
`predecessor`, `initial_approval_event`, unchanged `source`, and `continuation` with exact
published question identity/text/context/comment hash/time and owner answer id/body/text/hash/times.
The runner independently rereads current Waiting issue/source, approval lineage, exact published
question and complete owner comment history before committing. Return 200 for the first durable
claim or exact replay; 409 for stale/edited/deleted/competing/unverifiable input, 422 for malformed
input and 503 when no independent verifier is configured. No Approved label is written by the
runner. Orchestration must confirm this claim before deriving Approved and must read that label
back before reservation.

Answer reservation inputs add `authorization.kind=answer`, `approval_event` for the new derived
Approved entry, `predecessor`, the exact ledger-retained `manifest`, `continuation` and ordered
`history` of earlier question/answer pairs. Authorization id is
`answer:<predecessor-uuid>-q1:<owner-comment-id>` and references preserve the original explicit
approval plus owner answer. The same answer claim creates only one deterministic attempt UUID.
`approved_entered_at` binds the actual derived Approved event, not the earlier answer time.
Reservation consumes the claim atomically; neither an automated label event nor an answer without
a durable released predecessor can act as initial approval. An interrupted or conflicting
continuation remains held for later owner recovery rather than discarding retained work.
