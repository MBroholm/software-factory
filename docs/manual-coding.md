# Manual coding on Fedora — Basic A

A `Building` label reserves the single build slot, including while the laptop is idle.
It does not mean Codex started. Only the owner launches Codex. Follow the marked handoff
on the issue; absent, duplicate, edited or inconsistent evidence requires
[pause/drain/inspection and recovery](operations.md), never an invented approval or retry.

Before launch, open the issue, its latest refinement and its `factory:handoff:v1` comment.
Verify the issue is open and owner-authored, its sole factory state is `Building`, and no
other issue (including closed/non-owner issues) has `Building`. Compare the handoff's issue
number, owner approval event ID/actor/timestamp, exact refinement ID/URL and created/updated
times, content/body SHA-256 and source digest with the current evidence. Confirm that the
refinement predates the explicit owner approval, remains unedited and still describes the
intended work. Captured source comments and current title/body must be unchanged; later
in-scope session summaries alone do not invalidate captured source. Check the recorded PR
baseline so an old result is not mistaken for this attempt. If evidence differs, stop and
inspect while paused; request fresh refinement/explicit approval for changed scope.

See [approval and handoff fields](../specs/001-basic-a-factory/data-model.md#approval-event)
and the [manual handoff contract](../specs/001-basic-a-factory/contracts/manual-handoff.md).
No timeout releases a reservation. Do not start another factory build while one is reserved.
Unrelated interactive bootstrap work follows the constitution's separate bootstrap boundary.

From the repository on Fedora, inspect the local working tree first. Keep any existing work
intact, fetch `origin/main` and create a separate worktree on the exact handoff branch. For
issue 123, for example:

```bash
git status --short
git fetch origin main
git worktree list
git branch --list issue-123
git worktree add ../software-factory-issue-123 -b issue-123 origin/main
cd ../software-factory-issue-123
codex
```

Replace 123 with the actual issue number. If the branch/worktree already exists, inspect it
and the baseline before reusing it for owner-authorized rework. Do not force-reset or overwrite
it. Start Codex yourself in the worktree and supply the issue URL, exact approved refinement
URL/body, handoff comment and scope constraints. Ask it to check repository instructions,
implement only approved scope on `issue-N`, preserve changes, run relevant checks and return
a linked pull request to `main`. SpecKit is available where useful; small tasks do not require
a full new specification pipeline. No n8n runner, auto-launch or automatic resume is involved.

When an unresolved choice would change the result, Codex asks in its session before implementing
that choice. An in-scope answer permits continuation within existing approval. An expanded
scope stops the changed work: record the proposed revision, obtain fresh refinement/explicit
owner approval and follow controlled state recovery for a new handoff. A session answer alone
is not initial or expanded-scope approval. Do not remove Building merely to start a second task.

Before completion/review, the owner or explicitly authorized agent posts a concise issue summary
of each material question, owner answer and resulting choice, identifying whether scope changed.
For expanded scope include the exact renewed approval reference, not a claim that an answer
implicitly approved it. Use this suggested comment format:

```text
Decision from manual coding session
Question: <result-changing choice>
Owner answer: <sanitized answer>
Resulting choice: <what will be implemented>
Scope changed: no / yes
Renewed explicit approval: not required for unchanged scope / <event and refinement link>
Checks, failure or intervention: <what actually occurred>
```

This records the [Decision record fields](../specs/001-basic-a-factory/data-model.md#decision-record).
Keep secrets, tokens and private session logs out of comments; summarize only the relevant
reasoning. If posting through an assistant, explicitly authorize that issue comment. An interrupted
session leaves Building reserved: inspect agent/worktree/remote writes and record failure or
intervention before owner-directed recovery. No blind POST retries, automatic state repair or
agent restart. Unchanged-scope continuation is accepted policy; no instructor confirmation is
required. Only the owner grants initial approval or renewed approval for expanded scope.

Return changes on `issue-N` in the same repository with base `main`. Owner or authorized agent
may push/open the PR. Include an explicit `Refs #N` or full issue URL in its body, the approval
and handoff references, change summary, actual checks and outcomes, failures/retries/intervention,
and unchecked acceptance criteria. Distinguish new commits from the handoff's existing PR/head
baseline. Never mark unrun tests passed. Owner reviews and decides merge/close; workflow JSON
still needs owner PR review and manual import of the matching reviewed revision for operational
adoption, before or after merge; subsequent changes renew this gate. Isolated automated testing
follows [permissions](permissions.md#isolated-testing-and-operational-adoption), and manual
import does not require manual execution of every test. Result tracking/review automation is US3 work,
not proof of US2 completion.

## Manual rework of a Basic B QA result

Basic B normally launches a fresh runner invocation automatically after validated approval.
Its QA feedback remains owner-controlled. Use the explicit manual takeover procedure in
[review](review.md#basic-b-review-and-explicit-manual-qa-rework): pause/drain, prove released stopped
work and confirmed effects, record fresh owner approval and a new v1 handoff for the exact
existing PR/baseline, then establish Building before any manual agent launch. Record exclusive
worktree ownership. Do not start a personal session against a potentially active runner worktree.

Preserve the original v2 attempt/result/PR markers and runner ledger. Push ordinary commits to
the same issue branch without reset/force-push, retain the same PR, and update its check report
truthfully. Scope changes require new refinement and explicit approval. Tracking can recognize
this separately authorized manual result without rewriting the prior runner outcome. Uncertain
baseline, missing takeover history or remote divergence requires owner recovery. This procedure adds
no automatic review-comment processing and authorizes no service/network provisioning or
operational workflow import; follow the separate [adoption gates](operations.md).
