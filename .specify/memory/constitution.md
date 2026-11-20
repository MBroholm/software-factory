# Software Factory Constitution

## Core Principles

### I. Human Approval and Review

The issue owner MUST approve the refined task before its build begins. Every build MUST
use an issue-specific branch and return its changes in a linked pull request. The owner
MUST review the result and decide what merges into `main`; the AI MUST NOT approve tasks
or merge independently. Changes to the factory's n8n workflows MUST be committed as JSON,
reviewed in the pull request, and imported manually by the owner after review.

### II. Clear Specifications and Traceable Decisions

One repository MUST hold the factory and a separate folder for the software it builds.
Every task MUST be an issue whose labels record its state; comments MUST preserve questions
and answers, and the linked pull request MUST record the result. Refined tasks MUST use a
fixed template containing a goal, constraints, and checkable acceptance criteria. The coding
agent MUST ask before proceeding when an unresolved decision would change the result.
In Basic A, answers given in the agent session MUST be summarized on the issue when they
resolve such a decision, so the repository retains the reasoning.

### III. Incremental Automation

Basic A MUST be built and validated through real tasks with a manually started coding agent
before the Basic B runner is added. Basic B MUST build only owner-authored tasks, one at a
time. Questions, failures, and timeouts MUST be visible on the issue with enough context
for the owner to answer, retry, or stop the task. Advanced extensions MUST follow the basic
stages. This sequence keeps automation grounded in a demonstrated review loop.

### IV. Bounded Permissions and Public Work

The repository MUST be public. Each component MUST receive only the permissions needed for
its role. Credentials and machine-local secrets MUST stay out of Git, workflow exports,
issue comments, and pull request logs. Project documentation MUST state each component's
permissions, what the agent may do autonomously, and what requires owner action. Changes
that expand access or autonomy MUST update that documentation and receive owner review.

### V. Evidence from Real Runs

Each pull request MUST summarize the change and report the checks actually run and their
outcomes, including any acceptance criteria left unchecked. Unrun checks MUST NOT be
reported as passing. Run evidence MUST preserve failures, retries, and human intervention
without exposing secrets. The final evaluation MUST link at least five real task runs to
their issues and pull requests and explain where the factory worked, stopped, or needed help.

## Assignment Requirements

`project-brief.md` is the source for assignment requirements. This individual project MUST
deliver a working factory with n8n workflows and a runner, an architecture diagram, the
specification template, the refinement AI prompt, and evidence of at least five real tasks.
The report MUST be at most five pages and cover architecture; agent and model choice with
capabilities, cost, and limits; template and prompt design with an output example;
implementation; evaluation; permissions and safety; and reflection and future work.
Submission MUST include the report and public repository link through WISEflow.

Exact label transitions, runner API, provider and model choice, and deployment details
belong in Specify or Plan. Deferring these details MUST NOT waive requirements in the brief.

## Planning and Review Gates

Every plan MUST identify the applicable stage, acceptance checks, permission needs, and
required human actions. Basic B plans MUST link evidence that Basic A was validated.
Every pull request review MUST check task approval, issue linkage, branch isolation,
acceptance evidence, secret exclusion, and any workflow JSON or permission changes.
Unchecked criteria or failed checks MUST be visible to the owner before the merge decision.

## Governance

This constitution governs project planning and review. Amendments MUST be proposed in a
pull request with a rationale and an account of affected plans or practices; the owner
MUST approve them. Versions MUST use semantic versioning: major for incompatible principle
changes or removals, minor for added or materially expanded rules, and patch for clarifications.
Every amendment MUST update the version and amendment date. Planning and pull request
review MUST verify compliance with the current constitution.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
