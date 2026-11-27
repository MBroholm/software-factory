# Agent outcome and issue protocol v2

## Launch and final outcome

Invoke fresh Codex on `issue-N` via stdin prompt and schema-constrained final output, separate
from diagnostic events. Prompt contains approved goal/constraints/criteria, exact source
references, relevant owner discussion and prior question/answer/partial-work context. Instruct
agent to ask instead of guessing, stay within scope, avoid push/PR/merge and report actual checks.
Runner executes Git transport after the agent stops; it does not independently rerun tests.

Required final fields: `outcome` (done/question/stuck), `summary` (non-empty string), `question`
(nullable object containing non-empty text/context), `checks` (array of command, outcome
passed/failed/not_run, details, tested_revision and environment), `unchecked_criteria` (array),
`stuck_reason` (nullable string). No additional properties. done requires null question/reason;
question requires question and null reason; stuck requires non-empty reason and null question.
Runner supplies trusted attempt/result/question IDs and Git observations; model cannot choose
authorization or reservation identity. Validate schema and conditional rules after successful
exit; nonzero exit, missing result, contradictory outcome or timeout becomes Stuck regardless of
optimistic text. Tests are agent-reported and explicitly attributed. Publish only allowlisted
sanitized summary/check fields, never raw stderr, environment or auth files.

## Marked comments and answers

Use immutable leading markers `<!-- factory:attempt:v2 {JSON} -->`,
`<!-- factory:question:v2 {JSON} -->`, `<!-- factory:failure:v2 {JSON} -->`,
`<!-- factory:result:v2 {JSON} -->` and PR marker `<!-- factory:pr:v2 {JSON} -->`.
Metadata includes repository, issue, attempt, initial approval reference, specification digest,
result/question id as applicable. Validate expected actor AND ledger identity/digest; owner-owned
bot credentials do not make every marked comment a human approval. Edited/deleted markers hold
for owner recovery. Keep v1 historical markers valid for Basic A only; do not rewrite them.

Question id: `<attempt-uuid>-q1`. Show this exact owner reply form:

```text
answer <question-id>: <your answer>
scope: unchanged
```

Require the exact id, non-empty answer, separate literal `scope: unchanged` line, owner numeric
identity, and a comment created after the outstanding question. Store comment id/body hash;
consume once. Ignore factory markers and non-owner replies. Multiple competing answers, edits
to a consumed answer or missing confirmation stop continuation and request owner resolution.
Owner may instead write `scope: changed`; do not auto-approve it. Send changed specification
through refinement and renewed owner approval. An explicit unchanged declaration never
supersedes source-digest checks or approved constraints. Prompt requires question/stuck if the
answer conflicts with those constraints; no second AI scope classifier is introduced.

Initial approval requires the owner label event after the approved refinement, with unchanged
captured source, preserving Basic A checks. Answer-derived Approved has a v2 record linking the
original explicit approval, question and owner answer; the automation label event alone cannot
authorize. Retry requires a fresh owner Approved event after recorded Stuck. Each authorization
has unique consumption and deterministic attempt UUID. QA rework retains explicit owner action;
no advanced automatic review-comment session continuation is added.

## Workflow responsibilities

- Refine: unchanged idea/refinement paths; additionally inspect Waiting questions for valid owner
  answers, persist derived authorization before Approved transition, exclude these comments from
  refinement loops. Scope-changed replies require renewed refinement/approval.
- Reserve: acquire existing guard, reconcile global slot/Building labels, choose priority queue,
  validate input, reserve ledger, set Building and post v2 attempt marker, read back, start runner.
  Release guard after acknowledged start/no-work, not after the entire coding run.
- Collect: fourth 60-second schedule; under guard inspect current attempt, issue closure and
  result; reconcile journal/markers, create PR or question/failure comment, normalize labels,
  record confirmations, release slot only after stopped/effects proof. Never wait for worker.
- Track: retain owner-review/merge/unmerged-closure rules; v2 results associate by ledger attempt,
  exact SHA, branch and PR marker rather than v1 handoff-only history. Do not let unrelated old
  QA tasks overwrite the slot or a newer approval. Closed Waiting/Stuck issues also require
  cancellation/Done handling, not just existing Building/QA candidate filtering.

Keep all four under shared fail-stop guard with production concurrency=1. Add target state label
before removing old state; read back complete singleton state before release. A failed/unknown
write holds guard and reservation pending existing owner pause/drain/reconcile recovery. Do not
misrepresent that retained guard as normal long-running task reservation.

## Git and review

New task: branch issue-N from recorded main SHA. Existing attributable task: preserve branch,
partial changes and previous manifest, verify ancestry/remote head before fresh invocation.
Keep per-task worktrees while other tasks build; never clean, discard, rebase or force-push
unknown work. Unexpected existing branch/PR or divergence requires owner recovery.
PR base main; body includes `Refs #N`, attempt marker, pushed SHA, approved criteria, summary,
actual check provenance and unchecked items. Reconcile existing exact matching PR before create;
unrelated baseline PR is not completion. No merge action. PR closed unmerged with open issue
stays QA; owner can explicitly request rework or close issue. Existing open PR reuse requires
unambiguous owner-authorized rework and current-attempt association, not automatic feedback.
