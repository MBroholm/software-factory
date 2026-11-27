# Basic A permissions and publication boundaries

This documents the Basic A design and operating boundaries under constitution v2.0.0 and
brief version 2 (2026-11-25). All three completed workflows have recorded story and guard/recovery validation;
see the consolidated [acceptance ledger](../evidence/acceptance.md). See the story evidence for tested revisions and limits;
this policy update claims no new runtime checks or operational adoption. Use [manual recovery](operations.md#t009--manual-failure-recovery)
for changes while paused/drained.

## Roles and minimum access

| Role | Needed access | Autonomous work and owner boundary |
|---|---|---|
| Ubuntu n8n | One-repository fine-grained GitHub token for `MBroholm/software-factory`: Issues read/write, Pull requests read, required Metadata read; shared Data Table read/update; outbound HTTPS to GitHub/Google | Guarded refine/reserve/track only after reviewed implementation and activation. Never adds `Approved`, edits code, pushes branches, creates/merges PRs or adopts changed operational workflows. |
| Gemini refinement | Dedicated API key stored as n8n header-auth credential for `x-goog-api-key`; approved free-tier project | Receives bounded task data and returns candidate JSON. No GitHub credentials, tools, shell, approval/state mutation or automatic provider/billing change. |
| Interactive Fedora Codex | Local issue branch/worktree, repository reads; separate owner-authorized Git push and PR creation credentials when needed | Manually launched for one approved factory task. May edit/check code, summarize material decisions and open a linked PR within authorization. Never independently approves tasks, merges `main`, imports operational workflow JSON or assumes Ubuntu administration. Isolated test imports/updates/execution are allowed only within the boundary below. |
| Project owner | Explicit approval/review/merge decisions, manual agent launch, Ubuntu SSH and n8n owner administration | Provisions scoped credentials, manually imports reviewed operational JSON, activates operational schedules and controls recovery. A task author/assignee is not thereby the project owner. |

The n8n token is selected for this single repository, not all owner repositories. Do not grant
Contents write, Pull requests write, Actions, administration, organization or account permissions
to the factory. Git transport push and PR creation belong to the separate Fedora identity;
if a dedicated fine-grained token is used there, Contents write and Pull requests write are
needed for those operations, with Issues write only if it posts issue decision summaries.
Do not copy the broader Fedora credential into n8n or share it with the model.

GitHub Issues write is coarser than individual label operations: an owner-owned token can act as
the owner and cannot be restricted to “all labels except Approved.” The no-approval boundary is
enforced by reviewed code and operator practice, not label-specific token authorization. Validate
owner ID `202449424`, approval events and factory markers rather than trusting token actor alone.
Only owner-authored issues are eligible; all `Building` issues still block a second reservation.

Token capability checks are distinct from a successful public read. Check the token's selected
repository/permissions/expiry privately and verify required nodes under the later isolated story
tests. On expiry/403/outage, stop and inspect; never broaden scopes or fall back to a powerful
credential automatically. Sources: [GitHub issue comment permissions](https://docs.github.com/en/rest/issues/comments#create-an-issue-comment),
[PR read permissions](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request),
[fine-grained repository permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

## Credential and host boundary

Save runtime GitHub and Gemini values through n8n's private editor in its encrypted credential
store. Workflow JSON contains reviewed references only. Use header authentication for Gemini,
never URL query keys, literal headers, prompt text or environment expressions containing the key.
Keep the matching n8n encryption key and restricted server environment outside Git; preserve the
key with private backups. Do not replace it during troubleshooting or publish resolved Compose
configuration. Fedora evaluation key files and transient smoke-test inputs are not runtime
credential installation. Rotate an exposed credential and inspect its use before resuming.

The private editor stays on Ubuntu loopback through SSH with owner login. n8n receives no Docker
socket, host checkout, laptop credential mount or remote agent-launch access. No new inbound port,
runner, webhook into production or public editor is authorized by this document. The isolated
guard bridge's fixture/row-reset endpoints are test-only and remain unpublished after T008.

Google receives only reviewed runtime prompt/template/schema plus bounded public issue title/body
and relevant owner discussion over HTTPS, per the [refinement contract](../specs/001-basic-a-factory/contracts/refinement.md).
Exclude credentials, server environment, unrelated private files, attachments and raw agent or
execution logs. Do not enable model tools, paid billing or automatic fallback. Owner verifies
current quota before activation/retry. Development `.specify/templates/` is not runtime context.
The owner-approved countTokens preflight sends the same bounded public task/prompt/schema data
to the same Gemini model API using the existing saved key. It does not generate content or
grant new authority. No new credential, billing change or provider fallback is introduced. Owner-approved explicit
generation 503 UNAVAILABLE retries reuse that same payload/key at most twice after 10/30 seconds.
They add no tools, permissions, GitHub write retry or external resume endpoint.

## Isolated testing and operational adoption

Constitution v2.0.0 and `project-brief.md` version 2 (2026-11-25) govern this feature.
The coding agent may automatically import, update, and execute workflow JSON only in a
designated isolated development/test n8n instance, using test data and scoped test credentials.
External writes must target designated test resources. Testing must not replace or activate
operational workflows or process ordinary factory tasks. Verify instance identity, separate
storage/control tables, destinations and credential mappings before testing; an unknown
boundary stops the test. Existing `factory-guard-test` fixtures may be reused after verification.

Operational adoption requires owner review of versioned JSON in its pull request and owner
manual import of that reviewed revision into operational n8n. Verify that the imported artifact
matches the reviewed artifact; record necessary instance-specific credential/table mappings.
Subsequent changes require renewed review and manual operational import. This may occur before
merge for final acceptance testing or after merge. Manual import does not require manual
execution of every test. Record tested source revision/hash, imported revision, environment,
actual outcomes and test-copy deltas; distinguish fixture results from real factory runs.

Only the owner grants initial task approval. Unchanged-scope work may resume after the owner's
answer; expanded scope requires renewed explicit owner approval. This is accepted project
policy and requires no instructor confirmation. Basic A retains in-session answers and manual
rework/recovery; this policy does not add automated question handling or recovery. Owner review
and merge authority remain unchanged. Completed tasks and valid evidence are preserved; run
only missing or change-affected checks. Basic B and advanced implementation remain out of scope.

## Export and public evidence boundary

The repository, issue comments and PR logs are public. An export is private until inspected:

1. Inspect every workflow node and expression for tokens, API keys, URLs with secrets, imported
   cURL headers, machine paths and private host details. Use sanitized credential references;
   review names as well as IDs. n8n exports can include credential names/IDs and literal HTTP
   authentication headers; see [n8n export/import documentation](https://docs.n8n.io/build/manage-workflows/export-and-import.md).
2. Remove pinned data, private fixture payloads, execution data, raw errors/stacks, account details
   and unrelated instance metadata from publishable JSON. Check the entire diff, not only the
   credentials object. Do not export decrypted credentials to prepare a workflow for review.
3. Keep databases, encryption keys, environment files, credential/entity exports, archives and raw
   session/execution logs private with restricted access. Ignored `factory/local/` is an operator
   workspace, not permission to publish its contents. Temporary inspection exports/keys must be
   removed when finished. No direct SQL access to n8n internals.
4. Publish only checked, sanitized run facts: issue/PR links, reviewed/imported revisions, execution
   IDs/times, relevant control fields, minimal node outcomes, actual checks, failures/retries and
   human interventions. Summarize material agent decisions without full private transcripts. Mark
   failed/unrun criteria honestly and preserve corrections; never publish request headers or keys.

Operational workflow adoption requires a reviewed JSON PR and **owner manual import**, including
bootstrap. Renew review/import for subsequent changes; import may precede merge for final
acceptance testing or follow merge. Map credentials/control tables privately and verify
saved/published revision against the reviewed artifact before operational activation; [operations](operations.md#t009--reviewed-json-import-and-credential-boundaries)
defines the handoff. Permission/autonomy expansions require documentation and owner review.
This runbook adds no automatic deployment, merge, recovery, write retry or question resumption.
Approval/resumption is accepted owner policy; no instructor confirmation is required.

## Basic B US1 proposed permissions

T001–T020 implement an inactive Basic B increment. These permissions supersede the Basic A
role table only after owner review and provisioning; this change installs no services/accounts,
opens no ports and imports no operational workflows.

| Component | Separate credential and access | Authorized behavior |
|---|---|---|
| n8n orchestrator | Repository-scoped Issues read/write, Pull requests read/write, Metadata read; private runner bearer credential | Reserve approved owner tasks, journal publication, create one review PR, collect and track. No Contents write or merge. |
| Dedicated Ubuntu runner account | Separate repository-scoped Contents read/write and Issues read; private Git credential helper and API token file | Revalidate issue/source, fetch and push issue-N without force, own private SQLite/worktrees and supervised worker units. No issue/PR writes. |
| Codex | Owner-provisioned dedicated auth store and explicit allowlisted model identifier | Fresh noninteractive workspace-write invocation, approved scope, actual check reports. No runner bearer or GitHub token in prompt/environment; no push, PR, merge or service-manager use. |

The owner must review this access/autonomy expansion, select the exact model/auth store,
provision the dedicated unprivileged account/user manager with linger, and review systemd and
network configuration. API binds only a configured private host bridge (or test loopback),
with host firewall allowing the factory bridge and denying other interfaces. Container localhost
is not host localhost. No public listener, Docker socket, operational volume or personal-home
mount. Test and operational account, DB, work root, bearer and GitHub destinations are separate.
Preflight refuses unknown target identity or an unreconciled slot. Basic B same-account execution
is not malicious-code isolation. Agent output is untrusted public input: publish only sanitized
allowlisted fields and attribute checks to the agent. Owner alone reviews/merges; operational
adoption still requires manual import of the reviewed matching artifacts.
