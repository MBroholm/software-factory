<!--
Sync Impact Report (temporary amendment review material; remove before commit)
Version: 1.1.1 -> 2.0.0
Bump: MAJOR. Isolated automated workflow imports relax an existing MUST prohibition;
this is an incompatible governance redefinition, not a patch clarification. Advanced
foundations also materially expand guidance, but the incompatible change determines the bump.
Modified principles (titles unchanged):
- I. Human Approval and Review: isolated testing versus manual operational adoption.
- III. Incremental Automation: bootstrap distinction and conditional advanced foundations.
- V. Evidence from Real Runs: tested revision and environment required.
Unchanged principles: II. Clear Specifications and Traceable Decisions;
IV. Bounded Permissions and Public Work.
Modified sections: Assignment Requirements; Planning and Review Gates; Governance.
Added sections: none (advanced foundations added within Principle III).
Removed sections: none; instructor-confirmation requirement removed from Governance.
Preserved: ratification 2026-11-20; owner initial approval and merge authority;
Basic A -> Basic B -> advanced; real-run evidence; completed tasks and existing evidence.
Subsequent alignment only (not modified by this command):
- specs/001-basic-a-factory/spec.md: testing/adoption boundaries and accepted policies.
- specs/001-basic-a-factory/plan.md: constitution reference, test environment and adoption gates.
- specs/001-basic-a-factory/tasks.md: pending import/testing gates and obsolete instructor
  follow-up (including T030); preserve completed task status and historical evidence.
- specs/001-basic-a-factory/quickstart.md and contracts/: align testing/adoption instructions
  and approval/resumption language where applicable.
- docs/permissions.md: scoped isolated-test permissions versus operational owner authority;
  remove obsolete instructor follow-up.
- docs/operations.md: automated isolated tests versus manual operational import; remove
  instructor-confirmation requirement while preserving historical run facts.
- factory/AGENTS.md: distinguish isolated-test authority from operational adoption.
Future advanced specifications/plans/tasks must cover both foundations before extensions;
this amendment authorizes no feature implementation, import, schedule activation, deployment,
or merge. No dependent artifacts or templates were changed.
Deferred placeholders: none. No instructor confirmation required.
-->
# Software Factory Constitution

## Core Principles

### I. Human Approval and Review

The project owner is the individual undertaking this project (the user directing this
repository). This role is independent of issue authorship or assignment; an issue author or
assignee does not thereby become the project owner.

For every task executed through the factory, initial approval of the refined task MUST require
an explicit action by the project owner before its build begins. Automation MAY resume
previously approved work after the project owner's response to a question only when that
response does not expand the approved scope. A scope change MUST receive renewed explicit
approval from the project owner before work on the changed scope begins. A response MUST NOT be
treated as initial approval. The AI MUST NOT grant approval independently.

Every factory build MUST use an issue-specific branch and return its changes in a linked pull
request. The project owner MUST review the result and decide what merges into `main`; the AI
MUST NOT merge independently. Changes to the factory's n8n workflows MUST be versioned as
JSON. The coding agent MAY automatically import, update, and execute workflow JSON in a
designated isolated development/test n8n instance using test data and scoped test credentials.
External writes MUST target designated test resources. Such testing MUST NOT replace or
activate operational workflows or process ordinary factory tasks.

Before operational adoption, the project owner MUST review the versioned workflow JSON in its
pull request and manually import the reviewed revision into operational n8n. The imported
revision MUST match the reviewed artifact. Subsequent changes MUST receive renewed owner
review and manual operational import. This step MAY occur before merge for final acceptance
testing or after merge. Manual operational import does not require manual execution of every
test. These testing and adoption boundaries apply during bootstrapping and factory operation.

### II. Clear Specifications and Traceable Decisions

One repository MUST hold the factory and a separate folder for the software it builds. Every
task executed through the factory MUST be an issue whose labels record its state; comments MUST
preserve questions and answers, and the linked pull request MUST record the result. Refined
tasks MUST use a fixed template containing a goal, constraints, and checkable acceptance
criteria. The coding agent MUST ask before proceeding when an unresolved decision would change
the result. In Basic A, answers given in the agent session MUST be summarized on the issue when
they resolve such a decision, so the repository retains the reasoning.

### III. Incremental Automation

Initial repository setup and factory bootstrapping MAY use interactive development with the
coding agent before the factory loop exists. This allowance enables creation of the loop itself;
tasks executed through the factory MUST follow its approval and review process. Isolated
testing and operational adoption MUST follow the distinct boundaries in Principle I.

Basic A MUST be built and validated through real tasks with a manually started coding agent
before the Basic B runner is added. Basic B MUST accept and build only tasks whose issue author
is the project owner, one at a time. Approval or assignment to the project owner MUST NOT
substitute for this authorship check. Questions, failures, and timeouts MUST be visible on the
issue with enough context for the project owner to answer, retry, or stop the task. Advanced
MUST follow Basic A and Basic B. This sequence keeps automation grounded in a demonstrated
review loop.

When undertaking advanced, the project MUST establish both foundational parts before optional
extensions:

- The runner MUST independently verify that code changed and that tests pass when it runs them.
  Failed verification MUST send the task to `Stuck`. The pull request MUST record actual test
  results. Changes to existing tests or `.github/` MUST cause the factory to add `Flagged` and
  a warning that the agent may have made tests pass by changing them.
- The agent MUST run in its own container on a restricted Docker network where it can reach
  only the model. The runner MUST be the sole holder of the GitHub token and the sole
  component that pushes branches.

These foundations are conditional on undertaking advanced; they MUST NOT be imposed
retroactively on Basic A or Basic B. Neo4j memory, MCP tools, AI review, review feedback, and
metrics are optional extensions. Their implementation details belong in feature specifications
and plans.

### IV. Bounded Permissions and Public Work

The repository MUST be public. Each component MUST receive only the permissions needed for its
role. Credentials and machine-local secrets MUST stay out of Git, workflow exports, issue
comments, and pull request logs. Project documentation MUST state each component's permissions,
what the agent may do autonomously, and what requires project owner action. Changes that expand
access or autonomy MUST update that documentation and receive project owner review.

### V. Evidence from Real Runs

Each pull request MUST summarize the change and report the checks actually run and their
outcomes, including any acceptance criteria left unchecked. Unrun checks MUST NOT be reported as
passing. Run evidence MUST preserve failures, retries, and human intervention without exposing
secrets. Test evidence MUST identify the tested revision and environment. The final evaluation
MUST link at least five real task runs to their issues and pull requests and explain where the
factory worked, stopped, or needed help.

## Assignment Requirements

`project-brief.md` version 2, dated 2026-11-25, is the source for assignment requirements.
Chess is an example case, not a required product. This individual project MUST
deliver a working factory with n8n workflows and a runner, an architecture diagram, the
specification template, the refinement AI prompt, and evidence of at least five real tasks. The
report MUST be at most five pages and cover architecture; agent and model choice with
capabilities, cost, and limits; template and prompt design with an output example;
implementation; evaluation; permissions and safety; and reflection and future work. Submission
MUST include the report and public repository link through WISEflow.

Exact label transitions, runner API, provider and model choice, and deployment details belong in
Specify or Plan. Deferring these details MUST NOT waive requirements in the brief.

## Planning and Review Gates

Every plan MUST identify the applicable stage, acceptance checks, permission needs, and required
human actions. Basic B plans MUST link evidence that Basic A was validated. Advanced plans MUST
identify both foundational parts and establish them before optional extensions. Plans involving
workflow tests MUST identify the isolated test environment, test resources, and credential
scope; operational adoption MUST retain owner review and manual import of the matching revision.
Every pull request review MUST check branch isolation, acceptance evidence, secret exclusion,
and any workflow JSON
or permission changes. For tasks executed through the factory, review MUST additionally verify
explicit task approval and issue linkage. Unchecked criteria or failed checks MUST be visible to
the project owner before the merge decision.

## Governance

Patch clarification rationale (2026-11-22, v1.1.1): Review gates now distinguish universal
pull request checks from explicit task approval and issue linkage required for factory tasks,
aligning the gates with the existing interactive bootstrap exception. No other rules change.

Amendment rationale (2026-11-22): The project owner denotes the person retaining approval and
review authority, while Basic B eligibility depends separately on that person's issue
authorship. Interactive setup and bootstrapping are explicitly permitted because the factory
loop must be built before it can execute tasks. Initial approval and resumption are distinct: a
question response can continue authorized work, but cannot authorize new or expanded scope.

Amendment rationale (2026-11-26, v2.0.0): The owner adopts the isolated-testing versus
operational-adoption distinction as accepted project policy based on the owner's interpretation
of brief version 2. The former blanket manual-import MUST restriction, including bootstrapping,
is relaxed for isolated testing. This is an incompatible governance redefinition and therefore
a MAJOR bump, even though manual operational import and human review remain mandatory. Advanced
foundations add stage-conditional obligations, without changing Basic A or Basic B obligations.

The approval/resumption interpretation in Principle I is accepted project policy: only the
owner grants initial approval; automation may resume previously approved work after the owner's
answer when scope is unchanged; expanded scope requires renewed explicit owner approval.
Neither this policy nor the isolated-testing exception requires instructor confirmation.

Completed tasks MUST NOT be reset, and existing evidence MUST NOT be invalidated merely because
the brief changed. Review MUST assess evidence against its recorded revision, environment, and
applicable stage; additional checks MUST address actual gaps or changed artifacts rather than
blanket repetition.

This constitution governs project planning and review. Amendments MUST be proposed in a pull
request with a rationale and an account of affected plans or practices; the project owner MUST
approve them. Versions MUST use semantic versioning: major for incompatible principle changes or
removals, minor for added or materially expanded rules, and patch for clarifications. Every
amendment MUST update the version and amendment date. Planning and pull request review MUST
verify compliance with the current constitution.

**Version**: 2.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-26
