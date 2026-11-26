# US3 native validation handoff

Source: `factory/workflows/track.json`; generator: `factory/scripts/build-track.cjs`.
Run local graph checks with `node factory/tests/check-tracking.cjs` and packaging consistency
with `node factory/scripts/build-track.cjs --check`.

`node factory/tests/build-tracking-test.cjs` prepares `factory/tests/tracking-test.json` offline.
All Code bodies and connections match source. Only Data Table mapping (`IgWCIu94ieyHQRHS`),
HTTP origin/authentication (credential-free loopback `127.0.0.1:18767/github`), notes, name and
disabled schedule differ. Do not import into the operational instance. T033 must first verify
the isolated instance, current idle row, credential/destination boundary and drained executions.

Native execution requires the main n8n engine: standalone CLI Data Table execution has a known
context limitation documented in guard-validation.md. A signed-in isolated editor or authorized
test-instance API is needed. No native pass is claimed by local graph or packaging checks.

Use synthetic fixtures (`node factory/tests/check-tracking.cjs --fixtures` writes ignored local
inputs). The prepared `tracking-fixture-server.cjs` implements synthetic GitHub
issue listing/detail, comments, events, PR listing/detail and additive/deleting label routes.
It persists inspectable state across repeated polls and never proxies requests to GitHub. Start it
inside the isolated container with fixture and NEW state-file arguments; both paths must be
explicit. The authenticated native execution adapter, remote service start and native cases
remain pending; the packaged copy must remain inactive.

Exercise these cases through the actual entry/acquire/work/release path, inspecting traces,
control row and fixture effects after each:

| Case | Required result |
|---|---|
| Open current result | Building -> Your QA; one approval/PR/head marker; idle release |
| Repeated poll | No marker or label write; idle release |
| Current result merged | Detailed merge evidence -> Done; idle release |
| Owner closes issue | Done without requiring a PR |
| Closed unmerged PR, issue open | Remains Your QA |
| No result / no candidate | No writes; idle release |
| Fresh rework handoff | Unchanged baseline ignored; new open-baseline head or new PR accepted |
| New Approved label | Old result cannot override approval |
| Ordinary session/rework comment | Captured digest unchanged |
| Several current PRs / unchanged reopen / missing history | Held failure; no guessed association |
| Unknown POST / partial labels / exception | Hold persists; next poll skips |
| Failed acquisition / release | No remote work / no assumed completion respectively |

Record tested source hash, imported workflow/revision, deltas, mode, execution IDs, node traces,
actual row/effects, failures and deliberate interventions in evidence/review-validation.md.
Unpublish/drain after tests and verify final state; preserve held failures before owner recovery.
Native scheduled-entry validation is needed before claiming scheduled acceptance. Operational
adoption separately requires owner PR review and manual matching-revision import.
