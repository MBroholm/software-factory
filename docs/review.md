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
