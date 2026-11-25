# Contract: Owner, Codex and Review Handoff

## Factory to owner

A successful reservation puts the task in `Building` and posts a marked handoff with:
issue URL, approval event ID, exact refinement comment URL/digest, source digest, branch `issue-N`,
PR baseline and manual-launch instructions. `Building` alone does not prove a process started.
If handoff is absent or inconsistent, owner pauses and repairs; do not manually invent approval.

## Owner to interactive agent

On Fedora fetch current `main`, use an isolated issue branch/worktree, open Codex manually and
supply the issue plus the exact approved refinement. Check approval still applies before launch.
One factory task may build at a time, even if the owner also does unrelated interactive work.
Use SpecKit where useful for project development; no mandatory full SpecKit pipeline per small
factory task is imposed by this contract.

Agent asks in its session before unresolved result-changing decisions. Material answers and
resulting choices are summarized on the issue. If scope expands, stop the changed work; owner
records the revised scope and explicitly reapproves before continuation. If workflow state needs
manual correction, follow pause/drain/recovery, not automatic resumption. The constitutional
instructor-confirmation follow-up remains unchanged and unconfirmed.

## Agent/owner to pull request

Result branch `issue-N`, base `main`, same repository. PR body contains an explicit issue reference,
change summary, acceptance criteria with actual checked/unchecked status, checks actually run and
outcomes, failures/retries and any human intervention. Owner or agent may open it. Do not claim
unrun tests passed. For subsequent work, new PR or new commits must be distinguishable from the
prior handoff baseline; ambiguous reopened unchanged results require owner resolution.

## Owner review and activation

Factory tasks additionally verify explicit task approval and issue linkage. Every PR review
checks branch isolation, acceptance evidence, secrets, workflow JSON and permissions. Owner alone
decides merge/close/rework; factory neither approves tasks nor merges. A rejected unmerged PR
with an open issue remains `Your QA`; owner explicitly returns it to `Approved` or closes issue.

Workflow changes: JSON in Git -> reviewed PR -> owner manual import into n8n -> verify credential
references and active workflow revision -> owner activates schedules. No automated deployment
step may import/activate changed JSON. Bootstrap is allowed interactively but retains this gate.
