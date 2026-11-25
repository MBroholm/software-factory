# Feature Specification: Basic A — Manual Software Factory

**Feature Branch**: No feature branch created; specification authored on existing `main` branch.

**Created**: 2026-11-22

**Status**: Draft — behavior clarifications resolved; ready for planning.

**Input**: Specify Basic A from project-brief.md and constitution v1.1.1. Reuse the published
GitHub repository and existing state labels. Use Codex as the coding agent and SpecKit for
project development. Expect factory operation on Ubuntu server and development on Fedora laptop.
Defer Basic B and advanced extensions; distinguish mandates, preferences, and proposals.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refine and explicitly approve a task (Priority: P1)

As the project owner, I submit a rough idea, discuss its refinement, and explicitly approve a
checkable task before any factory build starts.

**Why this priority**: It establishes the factory's useful input and preserves human authority.

**Independent Test**: Submit a rough issue, inspect the refinement comment, request a revision,
and approve the revised task without starting a coding agent.

**Acceptance Scenarios**:

1. **Given** an eligible open issue labelled `Ideas`, **When** the next scheduled check processes
   it, **Then** it enters `Refining`, receives an AI refinement comment using the fixed task
   template and any questions, and reaches `Ready for approval` after successful refinement.
2. **Given** `Ready for approval`, **When** the project owner comments to request revision,
   **Then** the task returns to `Refining` and a revised comment preserves the discussion history.
3. **Given** a refined task awaiting approval, **When** the project owner explicitly approves
   it, **Then** it becomes `Approved`; an AI comment or answer alone cannot grant initial approval.
4. **Given** an approved task, **When** its scope changes, **Then** work on the changed scope waits
   for renewed explicit project-owner approval.
5. **Given** an issue authored by someone other than the project owner, **When** scheduled
   processing encounters it, **Then** it is neither refined nor handed off for building,
   regardless of assignment or labels.

### User Story 2 - Build manually with traceable decisions (Priority: P1)

As the project owner, I start Codex myself with the approved issue, answer questions in its
session, and receive changes on an issue-specific branch as a linked pull request.

**Why this priority**: This delivers work through the manual factory without a runner.

**Independent Test**: Use an explicitly approved issue as input to a manually launched agent;
include a decision requiring a question, then inspect the branch, issue summary, and pull request.

**Acceptance Scenarios**:

1. **Given** approved work and an idle factory build slot, **When** the task is handed off for
   manual execution, **Then** n8n marks it `Building` to reserve the single build slot before
   launch, and only the project owner launches the agent. Another task cannot claim the slot
   while this task is reserved, even if the owner has not yet started Codex.
2. **Given** a running task, **When** an unresolved decision would change the result, **Then**
   the agent asks in its session instead of guessing; the answer and resulting decision are
   summarized on the issue before completion.
3. **Given** a question response within approved scope, **When** work continues in the session,
   **Then** no new scope is inferred; an expanded scope instead requires renewed explicit approval.
4. **Given** completed changes, **When** the owner or agent opens the result pull request,
   **Then** it links the issue, uses an issue-specific branch, and reports changes, actual checks,
   outcomes, and unchecked criteria without claiming unrun checks passed.
5. **Given** one factory task is building, **When** another task is approved, **Then** the second
   task waits; Basic A never launches an agent automatically.

### User Story 3 - Review and track the result (Priority: P2)

As the project owner, I inspect a linked pull request and decide whether to accept, reject, or
request more work, while the factory tracks the outcome.

**Why this priority**: The loop must end in a human acceptance decision and an observable state.

**Independent Test**: Provide a linked pull request for an issue and exercise review, rework,
merge, and issue-closure paths independently of the refinement workflow.

**Acceptance Scenarios**:

1. **Given** a linked pull request, **When** a scheduled check discovers it, **Then** the task
   enters `Your QA`; the factory does not approve or merge it.
2. **Given** `Your QA`, **When** the project owner reviews, **Then** the review verifies approval,
   issue linkage, branch isolation, acceptance evidence, secret exclusion, and workflow JSON or
   permission changes, with failed or unchecked criteria visible before a merge decision.
3. **Given** reviewed work, **When** its pull request merges or its issue closes, **Then** the
   factory marks the task `Done`. Closing a pull request without merging while its issue stays
   open leaves the task in `Your QA` awaiting the project owner's decision.
4. **Given** requested rework, **When** the project owner sends the task back with a comment and
   explicitly returns it to `Approved`, **Then** a subsequent build is manually launched and
   remains subject to approved scope.
5. **Given** a pull request changing workflow JSON, **When** the owner accepts the change,
   **Then** activation still requires the project owner's manual import after review.
6. **Given** a task in `Your QA` with an open issue, **When** its pull request closes unmerged,
   **Then** it remains in `Your QA`; a subsequent scheduled check does not mark it `Done`.
   The project owner may return it to `Approved` for rework or close the issue to finish it.

### User Story 4 - Operate and demonstrate the manual factory (Priority: P2)

As the project owner, I can operate Basic A across my server and development environment and
show real task histories, decisions, and outcomes as evidence for later evaluation.

**Why this priority**: A working prototype needs reproducible operation and evidence, not just
workflow diagrams.

**Independent Test**: Follow the operating instructions, run a real task, and trace its issue,
questions, pull request, review, and recorded checks without consulting private session history.

**Acceptance Scenarios**:

1. **Given** the existing repository and labels, **When** Basic A is prepared for operation,
   **Then** its three workflow JSON artifacts, task template, refinement prompt and output example,
   architecture diagram, and operating/permission documentation are available in the repository.
2. **Given** a failure or interrupted manual session, **When** the owner reviews its issue,
   **Then** the failure, human intervention, and any retry are recorded without secrets; recovery
   does not silently authorize expanded scope or start an automated runner.
3. **Given** a completed real run, **When** the owner gathers evaluation evidence, **Then** its
   issue and pull request expose the checks actually performed and where human help was needed.

### Edge Cases

- An issue authored by someone other than the project owner: Basic A MUST ignore it, even if
  assigned to or labelled by the project owner (FR-002).
- Several approved issues: only one may be building; queue ordering is left to planning.
- The owner is unavailable after `Building` is set but before manual launch: the task retains
  the single build slot and other approved tasks wait; the label does not prove Codex has started.
  Owner-controlled recovery is documented during planning (FR-016).
- Repeated scheduled checks or the factory's own comments: do not produce repeated refinements,
  self-triggered discussion loops, or contradictory task states for the same unchanged event.
- Missing/conflicting state labels, a closed issue, or a pull request with no unambiguous issue
  association: do not infer approval or attach a result to the wrong task; surface the ambiguity.
- Refinement failure, service outage, or interruption: do not report successful refinement or
  completion; preserve enough visible context for owner-directed recovery.
- Task content changes after approval: changes to approved scope require renewed approval.
- A question arises during coding: use the agent session and summarize decisions on the issue;
  `Waiting for you`, automated restarts, and the Basic B timeout are not Basic A requirements.
- A pull request closes without merge while its issue remains open: retain `Your QA` until
  the project owner returns the task to `Approved` or closes the issue (FR-011).
- Workflow exports or generated evidence contain credentials: exclude secrets from public artifacts
  and logs; workflow activation remains a manual step after review.

## Requirements *(mandatory)*

### Requirement Sources and Scope

- **B** denotes assignment mandates from [project-brief.md](../../project-brief.md), especially
  “Basic A,” “States,” “n8n workflows,” “Scope,” and “Deliverables.”
- **C** denotes governance from [constitution v1.1.1](../../.specify/memory/constitution.md);
  principle or section references below identify the applicable rule.
- **U** denotes the project owner's stated preferences/context, not assignment mandates.
- **P** denotes a proposed derived behavior or acceptance target requiring owner agreement;
  proposals are not represented as explicit brief requirements.

This feature delivers Basic A only: scheduled refinement, manual build handoff, and pull request
tracking, with real-run validation. The repository is already published and labels already
exist (U); creating a repository or labels is not feature work. Reuse and verify them.

Basic B's runner, automatic agent launch, question-to-issue automation, automated resumption,
30-minute runner timeout, and result collection are deferred. Advanced memory, Neo4j, MCP-based
extensions, and other advanced capabilities are deferred. The project-owner-authorship-only
restriction is a Basic B mandate. The project owner explicitly chose the same restriction for
Basic A during clarification; for Basic A this is a user policy, not a brief mandate.

The full project's runner, at least five real runs, final report (at most five pages), public
repository, and WISEflow submission remain assignment obligations. Basic A must generate usable
evidence toward them; this feature does not claim to finish the whole assignment.

### Functional Requirements

- **FR-001 (B: Basic A, n8n workflows)**: Basic A MUST provide three n8n workflows: refine tasks,
  hand off approved tasks into `Building` for manual execution, and track pull requests through
  `Your QA` and `Done`. Task discovery and change detection MUST run on a schedule.
- **FR-002 (B: Basic A; U: authorship policy)**: Use labelled GitHub issues in the existing
  repository as factory tasks. Basic A MUST process only issues authored by the project owner;
  issues authored by anyone else MUST NOT be refined or built. Assignment, labels, or approval
  MUST NOT substitute for authorship. This Basic A restriction is the project owner's current
  chosen policy, confirmed on 2026-11-22.
- **FR-003 (B: Specification template; C II)**: The refinement AI MUST produce a plain task in a
  fixed template containing a goal, constraints, and checkable acceptance criteria; it MUST post
  advice and questions as issue comments. The project-owned prompt and template MUST be recorded
  with an output example and rationale for their design.
- **FR-004 (B: How the factory works, States)**: Successful refinement MUST move `Ideas` through
  `Refining` to `Ready for approval`. Project-owner revision comments at `Ready for approval`
  MUST return the task to refinement, preserving the discussion.
- **FR-005 (B: States; C I)**: Initial approval MUST be an explicit project-owner action moving
  the refined task to `Approved`. Automation and AI MUST NOT grant initial approval. Changes
  expanding approved scope MUST receive renewed explicit approval before execution.
- **FR-006 (B: States, Basic A, n8n workflows; U: handoff policy)**: When the build slot is
  free, n8n MUST reserve an approved task by setting `Building` before manual launch. `Building`
  means the task has claimed the single build slot; execution is starting or underway, but the
  label alone does not confirm that the agent has started. The project owner MUST launch Codex
  manually using that approved issue; no launch-confirmation step is required to set the label.
  This reservation meaning was chosen by the project owner on 2026-11-22.
- **FR-007 (B: How the factory works)**: No more than one factory task MUST be building at a time.
  Approved tasks MUST wait while that build slot is occupied. Basic A MUST NOT launch an agent
  automatically.
- **FR-008 (B: Basic A; C I–II)**: Each factory build MUST use an issue-specific branch and result
  in a linked pull request. The agent MUST ask in its session when a decision would change the
  result. Decisions resolved there MUST be summarized on the issue. In-scope work may continue
  after an answer; scope expansion MUST follow FR-005.
- **FR-009 (B: Basic A; C V)**: The project owner or agent MAY open the pull request. Each pull
  request MUST summarize changes, actual checks and outcomes, failed checks, and unchecked
  acceptance criteria. Unrun checks MUST NOT be described as passing.
- **FR-010 (B: States; C I, Planning and Review Gates)**: On discovering a linked pull request,
  tracking MUST set `Your QA`. Only the project owner decides merge or rejection. Review MUST
  verify branch isolation, acceptance evidence, secrets exclusion, workflow JSON/permission
  changes, and, for factory tasks, explicit task approval and issue linkage. A project-owner
  comment and explicit return to `Approved` MUST support manually launched rework.
- **FR-011 (B: States and flow; U: unmerged closure policy)**: A merged result pull request or
  a closed task issue MUST cause `Done`. If a linked pull request closes unmerged while its issue
  remains open, the task MUST remain in `Your QA` awaiting a project-owner decision. Closing
  that pull request alone MUST NOT cause `Done`. The project owner may explicitly return the
  task to `Approved` for rework or close the issue to finish it. This unmerged closure policy
  was chosen by the project owner on 2026-11-22.
- **FR-012 (B: Scope; C I, III)**: Workflow changes MUST be versioned as JSON, reviewed in a pull
  request, and manually imported by the project owner after review. Initial setup and bootstrap
  MAY be interactive before the factory loop exists; factory-executed tasks MUST obey its
  approval/review process. Bootstrap does not waive manual workflow import.
- **FR-013 (C II, IV)**: Keep factory artifacts and a separate folder for built software in the
  same public repository. Document component permissions, allowed autonomous actions, and
  required owner actions. Grant only role-needed permissions and keep secrets out of Git,
  exports, issues, and pull request logs. Access/autonomy expansion requires documentation
  updates and project-owner review.
- **FR-014 (B: Deliverables; C III, V)**: Validate Basic A with real factory tasks before Basic B
  is added. Preserve issue/pull-request links, decisions, checks, failures, retries, and human
  interventions as evaluation evidence. Provide an architecture diagram and operating guidance
  for the manual loop. The full-project minimum of five real task runs remains outstanding
  until the project evidence actually meets it.
- **FR-015 (U)**: Use Codex as the manually started coding agent and SpecKit to develop the
  project. Support the intended arrangement of factory operation on an Ubuntu server and
  development on a Fedora laptop; agent location and interaction method remain planning choices.
  These preferences do not mandate Codex for the refinement AI step.
- **FR-016 (P: operational correctness)**: Reprocessing unchanged events MUST NOT duplicate
  refinements or repeatedly trigger refinement on factory-generated comments. Ambiguous task
  states, unclear result linkage, and failed operations MUST be visible and MUST NOT be treated
  as successful approval, building, or completion. Recovery MUST remain owner-controlled and
  MUST NOT silently broaden approved scope. Specific recovery mechanisms belong in planning.

### Key Entities *(include if feature involves data)*

- **Project owner**: The user directing this individual project; the sole approval and review
  authority. Issue authorship and assignment do not confer that authority.
- **Task issue**: Rough idea, discussion, refined specification, approval history, and state labels
  in the existing repository; associated with its result pull request.
- **Refined task**: Goal, constraints, and checkable acceptance criteria presented for explicit
  approval; changes must remain distinguishable from the approved scope.
- **Decision record**: A question, owner answer, and resulting decision; includes summaries of
  material decisions made in the coding-agent session.
- **Build attempt**: Manual execution of approved work on an issue-specific branch, with checks,
  failures, retries, and intervention evidence.
- **Result pull request**: Linked changes and acceptance evidence awaiting the owner's decision.
- **Workflow artifact**: Reviewed, versioned n8n JSON whose activation requires manual import.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Unless directly attributed to B/C below, counts are proposed feature acceptance targets (P),
not additional assignment mandates. Timing is evaluated over scheduled checks; no polling
interval or invented response-time threshold is prescribed here.

- **SC-001 (P; validates FR-001–005)**: One real task completes idea submission, refinement,
  owner-requested revision, and explicit approval with a readable discussion history. Its next
  eligible successful scheduled check recognizes each change without manual workflow editing.
- **SC-002 (P; validates FR-006–009, 014–015)**: At least one real approved task completes the
  manual build-to-reviewed-result loop, including one session question and its issue summary,
  an isolated branch, a linked pull request, and an owner acceptance decision.
- **SC-003 (B/C safety; validates FR-005, 007, 010, 012–013)**: Across acceptance exercises,
  there are zero unauthorized approvals, automatic agent starts, autonomous merges, concurrent
  factory builds, secret disclosures, or automatic activations of changed workflows.
- **SC-004 (P; validates FR-009–011, 014)**: Demonstrations cover a merged result, a closed issue,
  an unmerged pull request closure with its issue still open, and owner-requested rework.
  Every resulting state matches the approved state rules, and every
  pull request reports actual checks and any unchecked criteria.
- **SC-005 (P; validates FR-001, 013, 016)**: Repeated observation of the same unchanged event
  yields no duplicate refinement or self-triggered discussion loop. A failed refinement and an
  ambiguous task/result association each leave a visible problem without falsely advancing work.
- **SC-006 (P; validates FR-003, 012–015)**: The owner can follow the documented operating steps
  in the intended server/laptop arrangement and trace each demonstrated run from input through
  review using repository evidence. All three workflows, the task template, prompt/example,
  architecture diagram, and permission/human-action documentation are available for review.

## Assumptions

- **User-stated context**: The GitHub repository is already published and state labels exist.
  Their exact identities and access are to be verified during planning; this specification does
  not claim remote verification or authorize label/repository recreation.
- **Source interpretation**: Basic A does not use `Waiting for you` or `Stuck`, as stated in the
  brief's States table. Questions happen in-session; no automated question restart or 30-minute
  timeout is introduced here. Manual interruption/retry handling must be documented in planning.
- **Governance dependency**: The constitution's distinction between initial approval and automated
  in-scope resumption remains an interpretation requiring instructor confirmation. Basic A uses
  in-session continuation; automated resumption is deferred, and this specification does not
  claim instructor confirmation. A conflicting outcome requires a constitution amendment before
  relying on that interpretation.
- **Proposals awaiting owner agreement**: FR-016 and the P-labelled success targets are derived
  reliability/validation proposals. Their source is this draft, not the assignment. They must
  be reviewed with the owner during planning; the three behavior decisions resolved here do
  not imply separate acceptance of these proposals. No additional tooling is selected by them.
- **Planning decisions deliberately open**: Refinement provider/model and cost limits, hosting
  and deployment method, agent execution location, remote access, credentials and exact component
  permissions, polling cadence, queue selection, branch naming/link detection mechanics, and
  recovery procedures belong in planning. Codex is the user's coding-agent preference only.
  No container, API, runner interface, transport, or folder name is selected by this spec.
- **Project boundary**: A separate built-software folder is mandatory, but choosing its product
  and implementing it are separate task decisions. Five-run final evaluation, the final report,
  remaining Basic B work, and advanced extensions are not delivered by this specification.
