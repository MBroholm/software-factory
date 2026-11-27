# Review and result tracking

Every PR needs an isolated branch, a clear change summary, acceptance criteria showing actual
passed, failed and unrun results, checks actually executed, failures/retries and material human
intervention. Review secrets, workflow JSON and permission changes as well as the code. The
owner alone decides merge, closure or rework. Automation never merges or grants approval.

Factory-task PRs additionally require explicit owner approval of the current refined scope,
the matching marked handoff, same-repository `issue-N` head, `main` base and an explicit issue
URL or `Refs #N` in the body. Prefer `Refs` when closure should remain a separate owner decision.
A session answer allows continuation within already approved scope. Summarize material questions,
answers and decisions on the issue; expanded scope needs a fresh refinement and explicit approval.
See [manual coding](manual-coding.md) and [permissions](permissions.md).

A useful PR body is:

```text
Refs #N

Change: <concrete behavior and reason>
Acceptance:
- [x] <criterion verified, with evidence>
- [ ] <failed or unrun criterion, reason and remaining work>
Checks: <commands, actual results and tested revision>
Failures/retries/intervention: <what happened, or none>
Scope decisions: <issue comment reference and renewed approval when necessary>
```

The tracking workflow associates a unique current result with the current handoff approval.
Unchanged baseline PRs cannot complete reapproved work. A new PR or changed head on an open
baseline PR must have activity after approval; ambiguous results and unchanged reopenings hold
for owner resolution. Captured input edits/deletions invalidate the association; later session
summaries and unchanged-scope rework comments do not enter that digest automatically.

A current result gets one `factory:result:v1` comment containing approval event, PR number and
head SHA and moves Building to Your QA. Repeated polls do not duplicate that comment. An open
issue with a closed, unmerged PR stays Your QA. Verified merge or owner issue closure moves it
to Done. A newer Approved label event takes precedence; tracking never puts Approved back into
QA. To request rework, stop the previous agent, resolve the reservation while paused, explicitly
reapprove and obtain a fresh handoff. Changed scope additionally requires fresh refinement.
Changes to an already accepted result head without this new attempt require manual resolution.

A validated poll with no pending result comment or state change completes as no-work. A PR or
merge arriving after that snapshot is processed by the next poll. Read-only polls do not repeat
write-oriented snapshot comparisons; planned writes retain strict recheck and final readback.
See [the race regression evidence](../evidence/tracking-race-validation.md).

Testing may automatically import/update/execute only in the designated isolated test instance,
after T033 confirms separate storage/control tables, scoped test credentials and all destinations.
Use synthetic fixtures or explicitly designated test resources. Never process ordinary factory
tasks or replace/activate operational workflows through a test. Record source hashes, imported
revision, instance/version, mapping deltas, execution IDs and actual outcomes. Fixture results do
not count as real issue/PR runs. Unknown isolation boundaries stop native testing.

Operational adoption requires owner review of versioned workflow JSON in its PR, followed by
owner manual import of the matching reviewed revision and mapping verification. This can happen
before merge for acceptance testing or afterward. Every subsequent change renews review/import.
Manual import does not require manual execution of every test. Map every control node to the
same intended singleton and HTTP nodes to the saved role-specific GitHub credential, then verify
code, connections and schedule against the reviewed artifact before owner activation.

Keep schedules paused/drained during repairs. Unknown comment/label responses, changed markers,
conflicting labels and uncertain release retain the shared failure hold. Inspect actual GitHub
and control state, record the incident, and let the owner choose recovery. Never retry an unknown
POST, clear busy on a timer or infer successful completion. Follow [operations](operations.md).

## Basic B review and explicit manual QA rework

The collector publishes `factory:result:v2` only for a stopped done result, exact runner-pushed
SHA and uniquely marked PR. Tracking verifies the authenticated ledger and immutable attempt,
source and result identities. Open or closed-unmerged PRs remain Your QA; detailed merged evidence
moves QA to Done. New Approved state is never overwritten by an old result. A retry's current
approval event, rather than its original initial approval, governs its review association.
PR checks are **agent-reported** with actual command/outcome/revision/environment and unchecked
criteria; schema validation is not independent testing. Owner review and merge remain mandatory.

QA feedback does not start or resume a model. To perform manual rework, pause and drain all four
schedules, verify the runner slot is empty, and reconcile every previous process and effect.
The prior task must be released, stopped, done, not cancelled, with all effects confirmed. Record
owner authorization to take over that task's preserved worktree; do not allow simultaneous runner
or manual use. Keep the original v2 PR marker and historical comments intact.

Obtain a fresh explicit owner Approved event after the published QA result. Changed scope first
requires a new refinement and renewed approval. Record a new immutable `factory:handoff:v1`
using the canonical handoff fields and the current approval, with exactly one baseline: the
existing open PR number and its latest accepted result SHA. Add Building before removing
Approved and read back the singleton state. This manual handoff must postdate the v2 attempt.
An Approved label alone does not authorize reuse of an existing PR by the automated runner;
leave schedules paused until the manual Building reservation is established.

Launch manually as described in [manual coding](manual-coding.md), preserving the branch and PR.
Report actual checks in the PR and record decisions on the issue. Tracking accepts only that
same PR, same repository/branch/main base, with changed head and activity after the new approval.
An unchanged baseline yields no completion; a different/duplicate PR, changed marker, unsafe
predecessor or edited handoff holds for owner recovery. The tracker records a new v1 result for
this manual approval; original v2 runner results remain unchanged. This is an explicit manual
handoff, not a new runner invocation or automatic feedback processing. Further manual rework baselines use the latest accepted manual result SHA; keep the complete
handoff/result history and the original runner PR marker. If scope, source, process ownership or remote effects are uncertain, stay
paused. No owner approval, merge or operational import is performed by this procedure.
