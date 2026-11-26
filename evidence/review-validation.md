# US3 result tracking validation — 2026-11-26

Source implementation T020/T021 and review runbook T022 are complete. T023 native acceptance
and T033 boundary verification remain incomplete. No operational adoption, real task processing,
merge, issue/comment write, native test execution or test import occurred in this session.

Tested source is the current uncommitted worktree on `001-basic-a-factory`:

- `factory/workflows/track.json` SHA-256: `d739916089873846b8f7a61aee71edfd0b7bee411cb727f3aefec54ff63b64b8`.
- `factory/tests/tracking-test.json` SHA-256: `bc3ed25bc8929dda514e27a518fef8954906b77e098e73131bfc5547f1372dc0`.
- Imported revision/execution IDs: none. Do not treat source hashes as imported evidence.

## Actual local checks

`node factory/tests/check-tracking.cjs`: 22 exported-graph/policy groups passed. The harness
executes the actual packaged Code, IF parameters, Data Table filters/updates and HTTP expressions
with synthetic responses; it does not emulate the native expression VM or prove main-engine
Data Table behavior. Cases cover QA, repeat suppression, authoritative merge detail, owner issue
closure, unmerged closure, no work, reapproval precedence, captured input/session distinctions,
ambiguous PRs, stale baselines/new heads/reopen, acquisition failure, pagination errors and
before/after-effect exceptions with retained hold and later skip.

`node factory/tests/check-reservation.cjs`: 36 groups passed after extracting the unchanged
T007 template to `factory/scripts/guard-template.json`. `build-reserve.cjs --check` confirms
reserve.json is unchanged. Refinement and tracking generator consistency checks pass.
`build-tracking-test.cjs --check` verifies unchanged source Code/connections, fixed loopback
HTTP, no credentials and disabled test schedule. Fixture-server syntax check passes; remote
service startup and end-to-end fixture HTTP checks remain unrun. `git diff --check` passes.

The generated source has operational notes and numbered stage notes. HTTP reads paginate with
bounded page counts and reject incomplete/error responses; detailed PR reads verify merge.
No write retries, automatic approval/merge, failure-release edge or automatic recovery is added.
Tracking rotates candidates by UTC minute so persistent unchanged QA does not starve other issues.
A changed accepted head without a new approved handoff conservatively requires owner resolution.

## T033 partial read-only environment inspection

SSH container inventory confirmed both instances run pinned n8n 2.48.8. Docker inspection showed:

| Instance | Volume at /home/node/.n8n | Published port |
|---|---|---|
| factory-guard-test | factory_guard_test_data | 127.0.0.1:5679 |
| software-factory-basic-a-n8n-1 | software-factory-basic-a_n8n_data | 127.0.0.1:5678 |

A supported CLI export **inside the test container only** wrote private
`/tmp/us3-before-workflows.json`. Metadata inspection showed all 21 isolated workflows inactive,
with historical tables `I1JBIePgy75Ecnlp`/`8fCAvfPK5z11XeRJ` and story table
`IgWCIu94ieyHQRHS`. Existing real-API test copies still reference header credentials, so they
must remain inactive and are not authorized test targets for US3. No credential values were
exported or read. New US3 test copy has no credentials; every HTTP destination is fixed container
loopback port 18767 and must use the synthetic fixture service, never a GitHub proxy.

Current table contents, active/queued execution drain, unused saved-credential scopes and native
authenticated access are not yet verified. Historical idle-at-1442 evidence is not a fresh row
observation. Browser inventory returned “browser access host is unavailable”. Existing
[guard evidence](guard-validation.md) documents standalone CLI Data Table context failure;
no CLI run was substituted for main-engine acceptance. User was asked to restore signed-in
isolated browser access or supply an approved test API access method. Unknown boundaries stop
native import/execution as required by T033; this is an access/boundary gap, not an owner manual
test-import approval requirement.

## Pending acceptance

All T023 native cases in [tracking-test.md](../factory/tests/tracking-test.md) remain UNRUN,
including native repeated polls, rework, merged/closed results, failures and scheduled entry.
Use the prepared credential-free test copy only after T033 passes. Record tested source/imported
revision, instance, mappings, actual traces/control rows/effects and shutdown state. Do not
count synthetic fixtures as additional real issue/PR runs. Operational adoption separately
requires owner PR review and manual import of the matching reviewed revision.
