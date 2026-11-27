# Feature Specification: Basic B — Automated Coding-Agent Execution

**Feature Branch**: No feature branch created; authored on existing `main`.

**Created**: 2026-11-26

**Status**: Clarified draft — ready for planning; acceptance not yet demonstrated.

**Input**: Extend validated Basic A with asynchronous Codex execution, issue-based questions,
result collection and factory-created pull requests, within project-brief.md Basic B scope.

## Clarifications

### Session 2026-11-27

- Q: When a task stops for a question, failure or owner review, should other approved tasks be allowed to build? → A: Option B: release the reservation at confirmed Waiting for you/Stuck/Your QA once execution has stopped and uncertain effects are reconciled; prioritize answered/retried tasks over ordinary Approved work without interrupting a running task.
- Q: How should the agent continue after an answer, an explicit retry or a runner restart? → A: Option A: fresh invocations with recorded context and preserved attributable work; reconcile existing execution after restart, require owner retry for confirmed interrupted execution, and owner recovery for unknown or conflicting partial work.
- Q: How should the factory recognize an agent’s outcome and your answer to its question? → A: Option A: validated structured done/question/stuck outcomes, with owner replies marked `answer <question-id>:` and explicit unchanged-scope confirmation; expanded scope requires renewed approval.
- Q: Which authentication policy should the Ubuntu runner use? → A: Option A: private server-local runner access with shared-secret authentication, separate repository-scoped GitHub credentials by role, and owner-provisioned Codex authentication under a dedicated runner account.

### Session 2026-11-26

- Q: Where should the Basic B runner and Codex CLI execute? → A: On the Ubuntu server alongside n8n; both runner and Codex execute on the server.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute approved work automatically (Priority: P1)

As the owner, I approve a refined task and receive a result for review without manually starting Codex.

**Why this priority**: Automating the existing handoff is Basic B's core value.

**Independent Test**: Supply an approved owner-authored test issue and observe reservation,
background execution, pushed branch and one linked pull request, independently of refinement.

**Acceptance Scenarios**:

1. **Given** an open owner-authored issue with explicit owner approval of the current specification and an idle slot, **When** selected, **Then** n8n validates approval, reserves the task as `Building` before submission, and the runner acknowledges acceptance without waiting for the build to finish.
2. **Given** an accepted attempt, **When** execution begins, **Then** the runner prepares the issue-specific branch and launches Codex CLI with the approved specification, constraints, acceptance criteria and relevant discussion; changed or unapproved scope does not run.
3. **Given** completed work, **When** the runner pushes the result and reports `done`, **Then** the fourth n8n workflow collects it, opens exactly one linked pull request with actual checks, failures and unchecked criteria, and tracking moves the issue to `Your QA`.
4. **Given** a non-owner-authored issue or missing/stale/unverifiable approval, **When** it is labelled `Approved`, **Then** no build is submitted, regardless of assignment or the label actor; ambiguity is visible without being interpreted as authorization.
5. **Given** two eligible tasks, **When** the first is reserved, **Then** the second cannot start while that reservation or its execution outcome remains unresolved, even between workflow executions.

### User Story 2 - Answer agent questions through the issue (Priority: P1)

As the owner, I answer an agent's question on the issue and continue the authorized task with its context intact.

**Why this priority**: Unattended execution must preserve decisions and human scope control.

**Independent Test**: Collect a question result, post owner and non-owner answers, and inspect the next accepted attempt's input.

**Acceptance Scenarios**:

1. **Given** a result-changing unresolved decision, **When** the agent reports `question`, **Then** the question and decision context are posted once on the issue and it becomes `Waiting for you`; no execution continues by guessing.
2. **Given** an outstanding question on previously approved work, **When** the owner answers within scope, **Then** n8n returns it to `Approved`; the next run receives the outstanding question, owner answer, approved specification and relevant previous discussion/result context.
3. **Given** a non-owner reply, an already-consumed answer or a factory comment, **When** observed, **Then** it cannot authorize a new attempt or create a reply loop.
4. **Given** an answer expanding scope, **When** observed, **Then** no changed-scope execution starts until renewed explicit owner approval; an answer is never initial approval.

### User Story 3 - Recover or abandon safely (Priority: P1)

As the owner, I can see failures, retry deliberately, or close the issue without leaving hidden work running alongside another task.

**Why this priority**: Failures and uncertain outcomes must preserve the single-task guarantee.

**Independent Test**: Inject restart, timeout, lost acknowledgement and closure at each handoff boundary and inspect attempt history, external effects and slot ownership.

**Acceptance Scenarios**:

1. **Given** an agent failure or an execution reaching its 30-minute limit, **When** detected, **Then** the runner stops execution, reports `stuck`, and n8n moves the task to `Stuck` with a visible reason and partial-work context. Timeout enforcement does not wait for a result poll.
2. **Given** `Stuck`, **When** the owner explicitly returns it to `Approved`, **Then** a distinct retry attempt may start only after the previous execution is confirmed stopped and uncertainty reconciled; retries preserve failure history.
3. **Given** an issue closed before submission or during execution, **When** closure is observed, **Then** no new attempt starts, active work is cancelled, the issue follows the existing closure-to-`Done` rule, and a late result cannot reopen it or create a new pull request. The slot remains held until execution is confirmed stopped and pending effects reconciled.
4. **Given** a lost submission acknowledgement or interrupted runner, **When** scheduling resumes, **Then** the original attempt is reconciled before retrying; no second agent starts merely because an acknowledgement, process or guard disappeared.

### User Story 4 - Preserve refinement and owner review (Priority: P2)

As the owner, I keep the demonstrated refinement and review process while automating only the build handoff.

**Why this priority**: Automation must not bypass the validated human controls.

**Independent Test**: Exercise unchanged refinement, merged and closed-unmerged pull requests, and issue closure using existing tracking expectations.

**Acceptance Scenarios**:

1. **Given** an idea, **When** refined, **Then** the existing template, discussion and explicit initial approval process remain in force.
2. **Given** a result in `Your QA`, **When** reviewed, **Then** only the owner decides merge; merge or issue closure leads to `Done`, while an unmerged PR closure with an open issue remains `Your QA`.
3. **Given** workflow or permission changes, **When** proposed for operational adoption, **Then** versioned JSON and permission documentation require owner review and manual operational import of the matching reviewed revision. This specification authorizes no deployment.

### Edge Cases

| Exercise | Observable acceptance |
| --- | --- |
| Duplicate/concurrent submission of one attempt, including after lost response | Same attempt identity and acceptance outcome; at most one agent launch and one reserved task. A conflicting payload cannot replace its approved input. |
| Repeated/overlapping result polls | Same result remains reconcilable; at most one question comment, result PR and effective state transition per attempt/result. |
| Crash before acceptance, after acceptance, during coding, after push, or after result delivery | Restart retains/reconstructs attempt identity, reservation and known effects; no false success, silent retry, forgotten process or second build. Apply the resolved D3 reconciliation and fresh-invocation policy. |
| Unknown submission/push/PR/comment/label outcome | Reconcile the external effect before repeating it; hold the slot when execution or ownership is uncertain, expose the problem, and require owner recovery if certainty cannot be established. |
| Crash after setting Building but before submission | Reservation survives; reconcile that attempt before submission/recovery, rather than selecting another task. |
| Workflow guard released, lost or deliberately reset | Task reservation remains independently effective; a guard reset alone cannot free a build slot or authorize retry. |
| Old result arrives after answer/retry/cancellation | Match attempt and current task state; retain history without changing a newer attempt or reopening abandoned work. |
| Closure races with push/PR creation | Already-confirmed effects remain documented; reconcile uncertain writes, prevent subsequent publication after observed cancellation, and do not claim completed cancellation while execution might continue. |
| Existing branch, dirty checkout, partial commits or existing PR | Preserve and surface work; do not silently discard, overwrite, force-push or interpret it as this attempt's completion. Reuse only attributable task work under D3; conflicting or unattributable work requires owner recovery before execution. |
| Missing/malformed/contradictory agent outcome or empty question | Never infer done; surface diagnostic context and treat as Stuck once execution is stopped, under the resolved D2 structured-outcome rules. |
| Waiting/Stuck/QA task with confirmed stopped execution | Release the reservation after the state and stopped execution are confirmed and uncertain effects reconciled. Other eligible tasks may build while the owner answers, retries or reviews. Hold the slot if any earlier execution/submission remains uncertain. |

| Answered/retried task arrives while another task is reserved | Existing reservation continues; at the next free-slot selection, eligible answered/retried tasks precede ordinary Approved work. Repeated polls do not create duplicate attempts or consume approval twice. |

## Requirements *(mandatory)*

### Sources, prerequisite and scope

Assignment mandates come from [project brief v2](../../project-brief.md), Basic B, States,
Architecture and n8n workflows. Governance comes from [constitution v2.0.0](../../.specify/memory/constitution.md), especially I–V.
Codex CLI and explicit reliability scenarios are owner requirements. Reliability invariants below
are derived acceptance obligations, not claims of extra assignment mandates.

Extend the [Basic A specification](../001-basic-a-factory/spec.md) and [architecture](../../docs/architecture.md).
The [evidence index](../../evidence/index.md) establishes two genuine manual-agent tasks:
[issue #1](https://github.com/MBroholm/software-factory/issues/1) / [PR #5](https://github.com/MBroholm/software-factory/pull/5),
and [issue #9](https://github.com/MBroholm/software-factory/issues/9) / [PR #10](https://github.com/MBroholm/software-factory/pull/10).
The latter demonstrates operational `Building → Your QA → Done`, including retained failure and owner recovery
([race evidence](../../evidence/tracking-race-validation.md), [acceptance ledger](../../evidence/acceptance.md)).
These satisfy the real-task prerequisite for specifying Basic B; they do not establish uninterrupted
operation, completion of every Basic A task/check, or the final five-run requirement. Preserve all existing artifacts and evidence.

In scope: automated approved execution, asynchronous runner acceptance, question/answer continuation,
30-minute limit, result polling, PR creation, cancellation and safe recovery. Out of scope:
agent-container network isolation, runner-independent code/test verification, `Flagged` detection,
AI review, memory, metrics and advanced automated review-feedback loops. Existing owner-directed
rework remains available without introducing the advanced review-comment continuation mechanism.

### Functional Requirements

- **FR-001**: Process only open issues authored by the project owner; verify explicit initial approval against the current approved specification. Assignment, labels alone and AI advice cannot substitute for authorship or approval (US1).
- **FR-002**: Preserve Basic A refinement, approval, owner review/merge, issue-specific branches and closure semantics (US4). Scope expansion requires renewed approval (US2).
- **FR-003**: Reserve one task as `Building` before runner submission; at most one task may execute or have an unresolved potentially executing submission (US1, edge cases).
- **FR-004**: Run the runner and Codex CLI on the Ubuntu server alongside n8n, independently of laptop availability. Accept runner work asynchronously with a durable identifiable attempt and prompt acceptance outcome, without keeping a workflow execution open for the coding duration. Prepare the branch, invoke Codex CLI, push completed work and report `done`, `question` or `stuck` (US1).
- **FR-005**: Supply immutable approved task input plus relevant discussion. Subsequent attempts include question, owner answer and relevant previous context; preserve source references so the owner can audit what was supplied (US1–2).
- **FR-006**: Add a fourth scheduled n8n workflow to collect results; n8n opens the linked result PR and existing tracking handles `Your QA`/`Done`. Include summary, actual checks/outcomes, failed/unrun checks, tested revision and environment; do not invent passing tests (US1, US4).
- **FR-007**: Apply the resolved D2 structured-outcome and explicitly marked owner-answer policy. Post each agent question once, set `Waiting for you`, and recognize only an applicable owner answer for in-scope return to `Approved`; prevent self-triggered or replayed answers (US2).
- **FR-008**: Stop agent execution at 30 minutes of the attempt's execution time, retaining its original deadline through interruption/recovery. Failed or timed-out attempts become `Stuck` with reason, partial-work references and recovery context. Explicit owner return to `Approved` permits retry; closure abandons work (US3).
- **FR-009**: Preserve identities and reconcile known/unknown effects across duplicate requests, repeated polls and restarts. Do not treat loss of contact as failure-to-accept, completion or permission to launch again (edge cases).
- **FR-010**: Cancellation must prevent new launches and suppress stale results. Retain the single-task slot until former execution is confirmed stopped and uncertain effects are reconciled; expose blocked cancellation to the owner (US3, edge cases).
- **FR-011**: Distinguish the durable task reservation from short-lived workflow execution guards. A guard serializes a bounded orchestration mutation; it is not the task ledger, coding process lifetime or release authority for the reservation. Releasing a guard between polls must allow result collection without permitting another build. Preserve Basic A's fail-stop guard recovery unless explicitly revised in planning (edge cases).
- **FR-012**: Preserve issue-visible questions, failures, retries, abandonment and human recovery, with attempt linkage and no secrets. Reject stale or mismatched results. Existing branches/partial work MUST follow the resolved D3 preservation and owner-recovery policy (US2–3, edge cases).
- **FR-013**: Enforce the resolved D1 private-access and credential-separation policy; unauthenticated runner requests MUST neither submit work nor disclose results. Document runner, agent and orchestrator permissions and autonomous actions; grant role-needed access only and exclude credentials from public inputs/outputs, workflow exports and evidence. Review access expansion and preserve isolated-test versus manual operational adoption boundaries (US4).
- **FR-014**: Demonstrate Basic B with real task evidence and isolated failure/recovery exercises covering every edge-case row; identify tested revision/environment and preserve failures. Synthetic exercises do not count toward five genuine project tasks.
- **FR-015**: Apply the resolved D3 reservation-release and priority policy. Select eligible answered/retried tasks before ordinary approved tasks when the slot is free; never preempt an existing reservation. Preserve partial task work independently of slot ownership.


### Decisions requiring clarification

The owner resolved the following policies through five clarification answers. Remaining credential mechanics, message schemas and service packaging belong in planning.

- **D1 — Execution location and authentication (resolved)**: The runner and Codex CLI MUST execute on the Ubuntu server alongside n8n, independently of Fedora laptop availability. Runner access MUST remain private to the server-local environment and require a shared secret for submission and result requests. Use separate, repository-scoped GitHub credentials by role: n8n needs issue/state/comment and pull-request creation/tracking permissions; the runner needs fetch/push access. Codex MUST use owner-provisioned authentication under a dedicated Ubuntu runner account whose file access is limited to its working area and required credentials. Credentials MUST be revocable independently and excluded from public records. This is account/credential separation, not advanced agent-container network isolation. Exact credential types, local connection and service packaging belong in planning; no provisioning is authorized.
- **D2 — Question and outcome recognition (resolved)**: The agent MUST return a validated structured final result with exactly one outcome: `done`, `question` or `stuck`. A `question` result MUST contain a non-empty question and a stable question identifier linked to its attempt; ordinary logs MUST NOT count as outcomes or questions. Missing, malformed or contradictory final outcomes MUST become `Stuck` once execution is confirmed stopped. An applicable answer MUST be an owner-authored comment using `answer <question-id>:` for the outstanding question and explicitly confirming that the answer remains within approved scope. Consume each applicable answer once. Unrelated, non-owner, stale or unconfirmed-scope comments MUST NOT restart work; surface missing confirmation to the owner. An answer that expands scope MUST wait for renewed explicit owner approval of the changed specification. Exact structured fields and confirmation wording belong in planning.
- **D3 — Recovery, partial work and slot lifecycle (resolved)**: Answers and explicit retries MUST start a fresh Codex invocation with the approved specification, recorded relevant context and preserved, attributable task work; saved-session resume is not required. A runner restart MUST first reconcile the existing attempt and any still-running agent without launching a replacement. A confirmed interrupted execution MUST become `Stuck` and require explicit owner retry; a still-active execution retains its original deadline. Known task branches and partial work MUST be preserved for the next authorized invocation. Unknown or conflicting branch/worktree changes, dirty work of uncertain ownership, divergence or ambiguous existing PR association MUST require owner recovery rather than automatic overwrite, reset or force-push. Release the task reservation when `Waiting for you`, `Stuck` or `Your QA` is confirmed, execution is confirmed stopped, and uncertain external effects are reconciled. Answered tasks and explicit owner retries entering `Approved` MUST take priority over ordinary approved work, but MUST NOT interrupt or displace an already-reserved task. Selection within each priority class must be deterministic and documented in planning. No release may free a slot while a former execution or uncertain submission can still run.

### Key Entities *(include if feature involves data)*

- **Task**: Owner-authored issue, approved specification/source, approval evidence, state and result link.
- **Task reservation**: Durable ownership of the sole build slot, tied to task/attempt and reconciliation status, independent of workflow guards.
- **Workflow execution guard**: Short-lived orchestration ownership with fail-stop recovery; not evidence of agent activity or inactivity.
- **Build attempt**: Stable identity, task/input references, branch, acceptance and execution status, original deadline, cancellation and terminal outcome. An explicit retry is a distinct attempt.
- **Question/answer record**: Outstanding question, owner response, consumed-answer identity and scope/approval relationship.
- **Result**: Attempt-linked done/question/stuck outcome, pushed revision when applicable, actual checks, diagnostics and acknowledged external effects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Counts are feature acceptance targets; no extra polling cadence or response-time mandate is inferred.

- **SC-001**: At least one real approved owner task reaches a linked reviewable result without manual agent launch or manual PR creation, with owner acceptance recorded.
- **SC-002**: One question/answer cycle demonstrably supplies the question, owner answer and approved context to the next attempt; non-owner and replayed replies produce zero unauthorized runs.
- **SC-003**: Across all duplicate, restart and uncertainty exercises, there are zero concurrent task executions, duplicate launches for the same attempt, duplicate result PRs or duplicate question posts.
- **SC-004**: Failure and 30-minute timeout exercises both stop execution and become visibly Stuck at the next successful result-collection opportunity; an explicit retry retains the former attempt's history.
- **SC-005**: Every cancellation exercise produces no new launch or result publication after cancellation is observed; the slot is never released while prior work could still execute. Known earlier effects remain traceable.
- **SC-006**: In all acceptance exercises, owner review/merge authority is preserved, unrun checks are identified, and the owner can trace approval, inputs, questions, outcomes and interventions from repository records without private session history or secrets.

- **SC-007**: Queue exercises demonstrate reservation release at each confirmed stopped Waiting/Stuck/QA state, priority selection of eligible answered/retried work over ordinary approved work, and zero preemptions or loss of preserved partial work.

## Assumptions

- Existing repository, owner identity, labels, refinement and tracking are reused; remote live state is not asserted by this specification.
- The brief and constitution permit in-scope continuation after an owner answer without new initial approval. Scope changes require explicit renewed approval.
- Acceptance timing means the next eligible successful scheduled observation; runner execution itself must stop at its 30-minute deadline even if orchestration is unavailable.
- Basic B does not require advanced independent verification; agent-reported checks remain accurately attributed rather than represented as runner-verified results.
- This change creates specification artifacts only. Implementation, operational workflow changes, credential provisioning and service deployment await later phases and applicable owner review.
