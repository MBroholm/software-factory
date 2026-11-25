# US2 manual-build validation

**Date**: 2026-11-25. **Status**: T015–T018 source implementation complete; T019 pending.
Branch: `001-basic-a-factory-us2`. This is bootstrap implementation, not a real factory build.
The reserve export remains inactive and contains credential/table placeholders, empty pinned data
and no automatic agent launcher. No workflow import, activation, guard reset, label/comment write
or real manual build was performed in this US2 implementation session.

## Reused evidence and source boundaries

Reuse [US1 validation](refinement-validation.md), including real issue
[1](https://github.com/MBroholm/software-factory/issues/1), latest refinement
[7161366810](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7161366810)
and explicit owner approval event **37246567614**, actor **202449424**, at
**2026-11-25T11:45:26Z**. These are historical US1 observations, not fresh approval/reservation
validation. The live workflow must reread current GitHub evidence before reserving.

US1 source file remains byte-identical, SHA-256
`ee3f6e782f72ec409d6e9a6cb02ca0f8b9a4b43eccbfad4dff0a9003ffe1ec38`.
Its native/live evidence is retained without repeating model calls. Reservation packages its
unchanged canonical-source, SHA-256, marker/history and pagination helpers, plus new pure
`factory/scripts/reservation-runtime.cjs` policy. The offline builder
`factory/scripts/build-reserve.cjs` uses the unchanged track skeleton as the common guard template;
track behavior is not implemented or changed. Rebuild/check from repository root.

Reserve export SHA-256:
`ea6760fb5787dd216418596d93c37be981079aca8cc20f9a7f5ec2cab88930b6`.
Reviewed US2 commit, PR review, imported workflow/version ID and deployed fingerprint: **PENDING**.
A file digest identifies this prepared source; it is not evidence of review or import.

## Actual checks

| Check | Observed result and limit |
|---|---|
| `node factory/scripts/build-reserve.cjs --check` | PASS: reproducible inactive export, source-maintained node notes and numbered stage layout |
| `node factory/tests/check-reservation.cjs --native-fixtures` | PASS: 36 local policy/exported-graph scenario groups. Actual exported Code and connections run with in-memory HTTP/Data Table stand-ins; no native persistence or live GitHub claim |
| Native n8n 2.48.8 VM parameter check | PASS: 140 checks, 74 synthetic parameter contexts plus pagination. Executed checker against installed packages in existing `factory-guard-test` container over owner-approved SSH; no imports, runtime credentials, HTTP calls, DB access or guard reset |
| Native checker first attempt | FAIL: harness supplied execution ID `test` where fixtures expected `reserve-test`. Corrected checker context, then reran successfully. No workflow fix needed |
| Additional scheduled-entry fixtures | 28 extra contexts prepared after the passing native run; local graph scheduled-entry check passes. These extra contexts have not been evaluated natively |
| `node factory/scripts/build-refine.cjs --check` | PASS: US1 artifact matches existing reviewed sources |
| `node factory/tests/check-refinement.cjs` | PASS: 35 existing local scenario groups; prior US1 native/live evidence reused |
| `node factory/tests/check-guard-skeletons.cjs` | PASS: 25 remaining track skeleton scenarios; reserve now uses its dedicated story checker |
| `git diff --check` | PASS |

Local reserve coverage: owner approval ID/actor/time; no approval history/wrong actor/later removal;
latest unedited refinement with current captured source; missing/edited comments and changed title;
content digest and duplicate history; unrelated-label preservation; lowest eligible number;
closed/non-owner/conflicting Building blocks; PR baseline in handoff; duplicate attempt rejection;
manual and scheduled graph entry; idle/no-work/occupied-slot release; successful busy release with
Building persistent; pre-held row unchanged/no HTTP; missing row/failed acquisition prevents work;
unexpected failures before/after Building/remove/comment effects; held next poll; partial/error
pagination; no retries, automatic approval, launch, merge or import paths.

To prepare/check VM fixtures after further parameter changes:

```bash
node factory/tests/check-reservation.cjs --native-fixtures
```

This writes only ignored `factory/local/reservation-native-expression-fixtures.json`.
`factory/tests/check-reservation-native-expressions.cjs` reads that JSON on stdin and uses installed
n8n packages (default `/usr/local/lib/node_modules/n8n`, optional package-root argument). It explicitly
initializes VM evaluation, retaining the expression-engine lesson from US1. Run it only in the
approved environment; parameter evaluation is not a full-workflow execution.

## Concrete owner review/import handoff — T019

1. Review the US2 source/JSON in a PR and record the reviewed commit. Artifact:
   `factory/workflows/reserve.json`. The constitution requires reviewed JSON and **owner manual
   import**; the assistant must not import or activate it automatically.
2. Pause/drain all relevant schedules and inspect existing held rows before touching them.
   US1 evidence records deliberate isolated holds; elapsed time is not permission to clear them.
   Use [operations](../docs/operations.md) for any inspected owner recovery.
3. Owner manually imports the reviewed reserve JSON into isolation, retaining `active=false`.
   Select the SAME isolated `factory_control` table in all seven Data Table nodes. Map all
   GitHub HTTP nodes to the saved Authorization header credential privately. No Gemini credential
   belongs to reserve. Keep redirects/retries off and no pinned data. Never execute individual
   mutation nodes, retry/resume failed executions or run alongside mutating schedules.
4. Record imported workflow ID, saved revision/version UUID, n8n version, reviewed commit/export
   digest and mapping-only differences. Verify source Code/connections/parameters against the
   reviewed artifact. Separately inspect the active refine workflow revision and compare against
   its reviewed source; historical US1 evidence alone does not verify today's active deployment.
5. Execute only the scenarios below in isolation or paused/drained live operation, following
   [quickstart section 6](../specs/001-basic-a-factory/quickstart.md#6-end-to-end-and-edge-case-validation)
   and the existing [guard fault protocol](../factory/tests/guard-scenarios.md). Record execution
   IDs, node traces, before/after singleton rows, issue/PR/comment URLs and owner interventions.
   Synthetic fault copies must be explicitly identified; never present them as real task runs.
6. Owner manually launches the approved real task using [manual coding](../docs/manual-coding.md).
   Obtain one real result-changing session question, answer and sanitized issue decision summary,
   issue-specific branch and linked PR with actual checks/unchecked criteria. Do not invent a
   question or post comments without owner authorization. US3 review/tracking is separate.

| Required T019 exercise | Expected observation | Actual result |
|---|---|---|
| Reviewed owner import + refine revision | Recorded reviewed commits/imported revisions and mapping verification | PENDING |
| Approved current owner task, laptop idle | Building added before launch, Approved removed, exact handoff, busy=false; no process launched | UNRUN live; local graph PASS |
| Second approved issue | First Building blocks second regardless of owner/closed/conflicting state; ordinary busy release | UNRUN live; local graph PASS |
| Repeated full polls | No new handoff, no second reservation, Building unchanged and no-work releases | UNRUN live; local graph PASS |
| Restart with reservation and idle guard | Building survives restart; later polls cannot claim another task | UNRUN native |
| Unexpected exception before/after effect | busy=true persists, Building/partial labels retained as applicable, subsequent schedule skips with identical context | UNRUN native; local exported graph PASS |
| Interrupted reservation between add/remove/post | Partial state stays visible with held guard; no automatic repair/retry or second claim | UNRUN native |
| Restart while busy | Neither guard nor reservation auto-clears; later schedule skips | UNRUN native |
| Manual build + real question/answer | Owner launch, actual answer/decision on issue, scope status/renewed approval if needed, issue-N linked result PR | UNRUN |

T019 must remain unchecked until required observations exist. Existing US1 approval and guard
skeleton evidence do not substitute for completed reserve-path persistence/restart/live checks.
No US3/T020+ work, result tracking, owner acceptance decision or completed Basic A loop is claimed.

## Hooks

`.specify/extensions.yml` is absent at pre-implementation and post-implementation inspection;
no hooks are registered to dispatch.
