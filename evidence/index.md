# Basic A evidence index

**2026-11-26: one genuine issue/PR-linked task demonstrated.** US1–US4 implementation and
story/guard/recovery validation are recorded below. The final-project minimum is **five** real
runs: at least **four more** genuine issue/PR-linked tasks remain. Synthetic fixtures, isolated
fault injections, repeated polls and bootstrap PRs do not increase that count. Basic B, final
report/submission, full real tracking acceptance are not claimed complete. Owner-reported operational adoption is
recorded in the acceptance and operations ledgers.

## Genuine task 1 — document SSH editor access

| Step | Durable reference / actual observation |
|---|---|
| Input and scope | [Issue #1](https://github.com/MBroholm/software-factory/issues/1): documentation-only SSH example, private editor, placeholder connection details. |
| Refined task | [Refinement 7161366810](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7161366810), prompt v3/template v1, four acceptance criteria; prior revisions retained on issue. |
| Explicit initial approval | Owner label event 37246567614, actor 202449424 at 2026-11-25T11:45:26Z, verified against the exact refinement/source in [US2 evidence](manual-build-validation.md). |
| Reservation | [Handoff 7169659105](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7169659105), native 1275; Building before launch, single slot preserved across idle/repeated/restart polls. |
| Manual launch and material decision | Owner-launched Codex on Fedora, `issue-1`; [question/answer/decision 7170400632](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7170400632) selects the existing localhost endpoint/placeholder SSH command, explicitly unchanged scope. |
| Result and actual checks | [PR #5](https://github.com/MBroholm/software-factory/pull/5), head d0101c4011a1b1a2f29a2b3bc17a7828008a348f; one README changed (+15), content/fence/diff and isolated SSH parse checks. Initial SSH configuration-permission failure and fallback retained; live SSH/browser check unrun. |
| Owner acceptance | Owner MBroholm merged at 2026-11-25T19:04:05Z, merge bb474bda2544fcc8c19695460c1f2ad1dea6c055; all four PR criteria checked. [T034 closeout](review-validation.md#t034-real-task-owner-review-closeout--2026-11-26) records current approval/branch/content/secret/permission evidence. No separate formal PR review submission is inferred. |
| Tracking limit | Issue #1 still open/Building at final US4 read-only observation. Real QA/Done workflow processing is not demonstrated by that task; native synthetic tracking cases separately establish the implemented rules. |

[US1 validation](refinement-validation.md) preserves failures, inspected recovery, provider usage,
revision history and exact tested/imported source hashes. [US2 validation](manual-build-validation.md)
preserves native reservation, manual coding, actual checks and intervention. No private session
transcript or credential is required to follow the documented decision.

Issue #4 was refined/approved and demonstrated waiting behind #1; it has no completed linked
result in this evidence and is **not** counted as a second run. Bootstrap development PRs are
not factory-task runs.

## Supporting validation — fixtures and component evidence

| Evidence | What it establishes / limit |
|---|---|
| [Gemini evaluation](gemini-evaluation.md), [v3 owner review](gemini-v3-review.md), [local failed trials](ollama-evaluation.md) | Actual provider decision/quality, server access and historical failures. Version-specific prompt results retained; no invented hosted memory/cold-load measurements. |
| [Refinement native results](refinement-native-results.json), [scheduled results](refinement-scheduled-results.json) | Synthetic source/retry/failure/unchanged behavior and original scheduled entry mapped to real issue exercises. Fixtures are not additional task runs. |
| [Reservation native](reservation-native-results.json), [fault](reservation-fault-results.json), [scheduled](reservation-scheduled-results.json) | Real reservation plus synthetic fault/queue/restart/schedule coverage, with source/instance distinctions. |
| [Review validation](review-validation.md), [native results](review-native-results.json) | Synthetic open/merged/closed-unmerged/closed-issue/rework/ambiguous cases and original 60-second scheduled QA/unchanged polls; T034 real owner decision recorded separately. |
| [Guard coverage](guard-validation.md), [US4 results](us4-guard-results.json) | All three finished graphs: valid/no-work release, invalid/unconfirmed acquisition, failure holds, unknown release, ownership loss, three crashes and cross-workflow held polls. Earlier skeleton evidence retained with clear scope. |
| [Recovery validation](recovery-validation.md), [actual results](us4-recovery-results.json) | Explicit pause/drain/inspect/repair/reset/resume for simulated outage, partial label and unknown POST; stopped-volume restore into network-disabled clone, exact hashes/state and disposable encrypted-credential round trip. |
| [Acceptance ledger](acceptance.md) | T029 consolidated quickstart matrix, tested fingerprints, retained failures and owner-reported operational versions and unrun independent readback/real-tracking checks. This index does not silently promote failed/unrun criteria or operational adoption. |

## Reproduction and boundaries

[Architecture](../docs/architecture.md), [operations](../docs/operations.md),
[permissions](../docs/permissions.md), [manual coding](../docs/manual-coding.md),
[review](../docs/review.md), [test guide](../factory/tests/us4-validation.md) and
[quickstart](../specs/001-basic-a-factory/quickstart.md) identify expected steps, checked revisions,
permissions and required human actions. Use actual source/imported hashes and environment in each
record. Reuse valid unchanged-source evidence; rerun only missing/change-affected checks.

Raw traces, fixture state, environment files, API keys and backups stay private/ignored. Public
results contain whitelisted observations and links. Operational adoption requires owner PR
review/manual import of matching reviewed JSON; no automated test substitutes for it. The
stopped restore clone and inactive test workflows process no ordinary factory tasks.
