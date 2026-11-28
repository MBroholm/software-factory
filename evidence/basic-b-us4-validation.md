# Basic B US4 — refinement, owner review and adoption boundary

US3 was committed and pushed as `0df34cc` on `origin/002-basic-b-us1` at the owner's request.
US4 is the subsequent working increment, identified by `basic-b-us4-sources.json`. The tests
below use local fixtures and fake external adapters; no workflow import, activation, provisioning,
real model run or genuine factory task occurred. Basic A and earlier Basic B evidence is retained.

## Implemented scope

T035–T036 preserve unchanged refinement, initial explicit approval, historical v1 tracking and
exact v2 result/PR review. Closed-unmerged PRs remain QA; verified merge or issue closure leads
to Done without granting merge authority or proving the runner slot free. Retry review now
checks the current explicit retry approval rather than the original initial approval. Historical
PR baseline sorting no longer references an undefined queue variable when multiple PRs exist.

Explicit manual owner QA rework uses the existing v1 handoff procedure after pause/drain,
released/stopped done predecessor and confirmed effects. A new owner approval after the QA
result, immutable handoff and exact single existing open PR baseline are required. Tracking
accepts only that PR's subsequent changed head, records its separately approved v1 result and
preserves the original v2 runner/PR markers and ledger outcome. Repeated manual rework uses the
latest accepted manual head. It rejects unresolved predecessors, marker edits, unrelated or
multiple branch PRs and missing owner approval; unchanged baseline yields no completion. The
owner must establish exclusive manual Building/worktree ownership before re-enabling schedules.
There is no automated review-feedback invocation or new runner rework authorization endpoint.

T037–T038 document four-workflow architecture/mappings, durable slot versus short mutation guard,
versioned identities and agent-reported check provenance. Operations/manual guidance specifies
owner account/auth/model inputs, reviewed preflight, Basic A pause/drain and manual execution
reconciliation, matching four-artifact review/manual import, private mappings and rollback that
retains ledger/work history. These are preparation instructions, not performed deployment.

All four generators were rebuilt: shared historical baseline code is embedded in each artifact.
Tracking node and stage notes describe the new manual association path; exports remain inactive.

## Checks actually run

| Check | Actual outcome |
| --- | --- |
| `node factory/tests/basic-b-review.cjs` | Passed exact v2 review/merge/unmerged/issue closure, stale approval rejection, explicit manual rework, repeated rework, immutable/unsafe predecessor rejection, wrong/duplicate PR rejection, current retry approval, multi-PR baseline sorting and unchanged refinement. Includes existing pure execution protocol assertions. |
| `node factory/tests/basic-b-workflows.cjs --recovery --review --native-fixtures` | 14 generated graph scenarios passed through temporary real SQLite/ASGI API and fake GitHub/agent/service adapters. New scenarios cover v2 review/merge and manual rework of the same PR, duplicate polling and unchanged runner result. Synthetic native-expression input contexts were generated, not evaluated in a native n8n VM this increment. Both US4 graph scenarios also passed a focused rerun after final handoff identity hardening. |
| `factory/local/basic-b-venv/bin/python -W error::ResourceWarning -m unittest discover -s factory/runner/tests` | 81 discovered: 80 passed, one opt-in real Ubuntu elapsed deadline test skipped. |
| `node factory/tests/check-refinement.cjs` | 35 local scenario groups passed, retaining fixed template, discussion, explicit approval boundary and bounded refinement behavior. |
| `node factory/tests/check-tracking.cjs` | 25 historical policy/exported graph groups passed. |
| `node factory/tests/check-reservation.cjs --policy-only` | 19 historical reservation policy groups passed. Basic B graph validation uses the separate asynchronous graph harness above. |
| `node factory/tests/basic-b-questions.cjs` | Passed strict question/answer, source/authorization and scope-routing assertions. |
| All four `build-*.cjs --check` commands | Passed. Inactive artifacts, operational node notes, stage notes and absence of merge endpoint also checked. |
| `git diff --check` | Passed. |

The test-first review fixture reproduced `Stale approval/source lineage` before implementing
manual rework association. An unfiltered historical reservation script failed because it expects
the Basic A `Post handoff` node in the now-Basic B reserve artifact. Its original graph assertions
remain intact; an explicit `--policy-only` option now selects retained historical policy checks.
The Basic B graph checks passed separately, rather than claiming the old manual graph passed.

The sandboxed graph harness again timed out spawning its Python bridge. The same local harness
ran successfully with approved sandbox escalation; it uses only temporary local SQLite/API and
fake external effects. These are retained fixture failures, not failed live factory runs.

## Remaining gates

T039–T045 remain unchecked. No native n8n VM rerun or scheduled isolated HTTP/model acceptance,
actual Ubuntu process-tree deadline/reboot acceptance, service/network/credential provisioning,
owner operational import/enablement or genuine Basic B run was performed. Parameter expressions
were not changed in this increment; earlier native evidence remains scoped to its recorded
revision and is not claimed as a new native run. Owner must review/manual-import matching
artifacts after all adoption prerequisites; local fixtures do not satisfy the five-real-run
project requirement. No extension hooks are registered (`.specify/extensions.yml` absent).
