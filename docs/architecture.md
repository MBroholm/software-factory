# Basic A architecture

Basic A is three scheduled n8n workflows on Ubuntu, connected through GitHub to an owner
who manually starts Codex on Fedora. There is no runner or automatic agent launch.

```mermaid
flowchart LR
    subgraph Fedora["Fedora development"]
        Owner["Project owner: approval, answers, review, merge"]
        Agent["Manually started Codex on issue-N"]
        SpecKit["SpecKit development artifacts: .specify/templates/"]
        SpecKit -.-> Agent
        Owner -->|manual launch and session answers| Agent
    end
    GH["Public GitHub: issues, labels, comments and PRs"]
    subgraph Ubuntu["Ubuntu: one operational n8n instance"]
        Refine["60s refine: Ideas → Refining → Ready"]
        Reserve["60s reserve: Approved → Building"]
        Track["60s track: Building → Your QA → Done"]
        Control["SQLite volume: encrypted credentials, workflow state, one factory_control row"]
        Runtime["Versioned runtime task template, prompt and schema embedded in refine JSON"]
        Refine --- Control
        Reserve --- Control
        Track --- Control
        Runtime --> Refine
    end
    Gemini["Gemini 3.5 Flash-Lite HTTPS API"]
    Refine <-->|bounded candidate refinement; no tools| Gemini
    Refine <--> GH
    Reserve <--> GH
    Track <--> GH
    Agent <-->|issue decisions, issue branch and result PR| GH
    Owner <-->|explicit approval and merge decision| GH
    Owner -.->|SSH tunnel to loopback editor; manual reviewed JSON import| Ubuntu
```

GitHub holds durable task state and human decisions. Refine accepts only owner-authored open
issues, captures the exact source, renders candidate advice and never approves it. Reserve
validates explicit owner approval and reserves the single Building slot before manual launch.
Track accepts an unambiguous current-attempt result, preserves rework approval and leaves
closed-unmerged/open-issue work in Your QA. Verified merge or issue closure completes it.
The owner alone grants approval and decides review/merge; the agent asks result-changing
questions in its session and summarizes decisions on the issue.

One serialized production execution and one shared fail-stop control row bound mutations across
all three workflows. Busy is not a task ledger or distributed lock. Acknowledged success/no-work
releases it; failure or uncertain writes retain it. Building survives busy release and laptop
downtime. Owner recovery pauses/drains, reconciles effects, records decisions, repairs known
state and only then resets busy. There is no automatic expiry, failed-execution replay or
concurrent manual mutator.

SpecKit's `.specify/templates/` creates development specifications/plans/tasks. Runtime refine
instead embeds `factory/templates/task.md`, `factory/prompts/refinement.md` and
`factory/templates/refinement.schema.json` through `factory/scripts/build-refine.cjs`.
Compose mounts no development template resolver, host checkout or Docker socket. Optional
Ollama service/cache is retained solely for historical `local-model-trials`; Gemini refinement
does not depend on it. No Redis, worker queue, custom backend, Basic B or advanced extension
is part of this architecture.

The operational editor is server-loopback 5678, accessible through SSH and owner login. The
single-repository GitHub credential allows Issues write and Pull requests read; Gemini receives
only bounded public task data plus the reviewed prompt/template/schema. Saved credentials are
encrypted in n8n and never exported as values. [Permissions](permissions.md) defines the exact
component and data-transfer boundaries.

The existing isolated n8n instance uses a different volume/control table and loopback port 5679.
Credential-free synthetic HTTP fixtures stay on container loopback. Test imports/executions
may be automated after boundary verification; test resources never become operational workflows
or process ordinary tasks. Operational adoption remains owner PR review and manual import of
the matching JSON revision. [Operations](operations.md) covers mapping, stopped-volume backup,
restore, retention and recovery. [Evidence index](../evidence/index.md) separates real tasks
from native fixtures and lists actual outcomes and remaining checks.
