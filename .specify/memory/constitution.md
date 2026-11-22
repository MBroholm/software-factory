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
MUST NOT merge independently. Changes to the factory's n8n workflows MUST be committed as JSON,
reviewed in the pull request, and imported manually by the project owner after review.

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
tasks executed through the factory MUST follow its approval and review process. The manual
import requirement for reviewed n8n workflow JSON remains in force during bootstrapping as well
as factory operation.

Basic A MUST be built and validated through real tasks with a manually started coding agent
before the Basic B runner is added. Basic B MUST accept and build only tasks whose issue author
is the project owner, one at a time. Approval or assignment to the project owner MUST NOT
substitute for this authorship check. Questions, failures, and timeouts MUST be visible on the
issue with enough context for the project owner to answer, retry, or stop the task. Advanced
extensions MUST follow the basic stages. This sequence keeps automation grounded in a
demonstrated review loop.

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
secrets. The final evaluation MUST link at least five real task runs to their issues and pull
requests and explain where the factory worked, stopped, or needed help.

## Assignment Requirements

`project-brief.md` is the source for assignment requirements. This individual project MUST
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
human actions. Basic B plans MUST link evidence that Basic A was validated. Every pull request
review MUST check branch isolation, acceptance evidence, secret exclusion, and any workflow JSON
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

Instructor confirmation required: The approval/resumption rule in Principle I is an
interpretation of `project-brief.md`, not a confirmed clarification from the instructor. The
brief's states table and accompanying text reserve `Approved` for the project owner, while its
question-handling flow and Basic B description let n8n return previously approved work to
`Approved` after the project owner's answer. This constitution interprets the latter as
resumption within the approved scope. The project owner MUST seek instructor confirmation of
this interpretation and record the outcome; a conflicting outcome MUST be resolved through a
constitution amendment before relying on that interpretation.

This constitution governs project planning and review. Amendments MUST be proposed in a pull
request with a rationale and an account of affected plans or practices; the project owner MUST
approve them. Versions MUST use semantic versioning: major for incompatible principle changes or
removals, minor for added or materially expanded rules, and patch for clarifications. Every
amendment MUST update the version and amendment date. Planning and pull request review MUST
verify compliance with the current constitution.

**Version**: 1.1.1 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-22
