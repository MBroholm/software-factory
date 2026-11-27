# Basic B data model

Store runner state in its own SQLite database. GitHub remains the public task/decision/result
record; private ledger snapshots never contain credential values. Enable foreign keys and use
explicit BEGIN IMMEDIATE transactions for slot/attempt updates. No direct access to n8n's DB.

| Entity | Fields and identity | Rules |
| --- | --- | --- |
| Task | repository, issue_number (unique pair), owner_id, branch issue-N, current attempt, manifest | Allowlisted repository and owner author; issue state alone is not permission to run |
| Authorization | id, kind initial/answer/retry/rework, initial approval event, specification/source digests, comment/event references, approved_entered_at | Initial approval always owner-originated; answer derives from prior initial approval and outstanding question; changed specification requires new approval |
| Attempt | UUID, task, predecessor, authorization_id, immutable payload hash, base_sha, status, accepted/start/deadline/stop times, unit_name, unit invocation identity, result_id | Unique authorization consumption; new answer/retry has a new attempt; same UUID cannot change payload; never reuse completed worker identity |
| Reservation | singleton id=1, attempt_id, generation, reserved_at, hold_reason, release evidence | Claimed transactionally before Building/submission; never TTL-expired; release only by compare-and-set matching attempt/generation |
| Question | id derived from attempt, text, context, owner answer comment id/hash, consumed_by_attempt | One outstanding question per attempt; owner answer matches exact id and unchanged-scope grammar; edits invalidate captured answer |
| Result | id, attempt, done/question/stuck, summary, question, checks, unchecked criteria, diagnostics, pushed_sha, stopped proof, cancelled flag | Immutable terminal result once reconciled; cancellation suppresses publication; schema validation is not independent test verification |
| Effect | id unique (attempt/kind), intent hash, pending/confirmed/unknown, external id/SHA, observed_at | Intent committed before write; unknown cannot be blindly repeated; marked comments/PRs must match attempt and expected content |
| Work manifest | task, predecessor, branch/base/head SHAs, status/patch hashes, retained artifact paths | Only trusted runner observations attribute partial work; conflicts or missing provenance require owner recovery |

## Internal lifecycle

`reserved → accepted → dispatching → running → terminal → reconciled → released`.
Unknown dispatch/process/write state adds a hold, not a successful terminal transition.
Reserve commits before Building; accepted commits after Building is read back; dispatch intent
commits before unit start. A crash with dispatching never implies not-started. If a named unit
has no reliable completion/process proof, retain hold and request owner recovery.

A terminal question/done/stuck result requires confirmed stopped process group. Cancellation is
a durable flag at any stage: prohibit start if not dispatched, otherwise terminate the unit;
retain outcome/history but suppress normal result publication. Close issue to Done independently
of process state, but do not release reservation until stopped and all uncertain effects resolved.

## Issue state transitions

| Input | Required evidence | Result |
| --- | --- | --- |
| Approved → Building | Current initial approval or valid derived authorization; free reservation; owner author; immutable input | Reserved then label verified before acceptance |
| Building → Waiting for you | Valid structured question, stopped proof, confirmed question post | Release only after transition/effects reconciliation |
| Waiting for you → Approved | Matching owner answer, explicit unchanged scope, source unchanged | Durable unique answer claim; priority continuation |
| Building → Stuck | Failure/timeout/confirmed interruption/malformed outcome; stopped proof | Reason/partial-work context recorded; safe release |
| Stuck → Approved | Explicit owner event after failure, same approved scope or renewed approval | New priority retry attempt; no replay |
| Building → Your QA | Done result, confirmed push and one linked PR, stopped proof | Release after effects/labels reconcile |
| Your QA → Approved | Explicit owner rework action | Existing manual rework behavior retained; no advanced autonomous feedback loop |
| Your QA → Done | Verified merge | Owner merge authority preserved |
| Any → Done | Issue closure | Cancel work, reconcile effects; Done label does not prove slot is free |

## Guard and queue invariants

n8n factory_control owns only short-lived workflow mutation access; preserve its existing
fail-stop recovery and no-expiry behavior. Runner reservation survives n8n guard release,
restart, stale labels or manual guard reset. Guard-held failures can block further collection;
worker timeout must operate independently and owner pause/drain/reconcile recovery remains valid.

Selection key: (priority class, Approved-entry time, issue number); answers and Stuck retries
have class 0, all other approvals class 1. Never displace a reservation. The runner rejects a
second reservation even if a workflow read was stale. Orphan Building labels/manual Basic A
builds block activation/selection until owner reconciliation, even when runner ledger is empty.

## Storage and recovery

Persist DB and task work together on local disk, restrictive account ownership. Private logs are
bounded; retain manifests, attempt identities, cancellation and effect history across retries.
Backup only after pause/drain and stopped/reconciled workers; restore ledger and worktree bundle
together, never restore an old empty slot over potentially live execution. Record recovery
revision, environment and owner decisions without raw secrets or model session transcripts.
