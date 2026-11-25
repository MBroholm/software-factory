# T004 — Gemini comparison

**Date**: 2026-11-24. **Status**: V2: 5/5 technical passes, 4/5 clean semantic passes;
v3: targeted clear-task rerun passed and addressed the acceptance-coverage gap.
Ubuntu container-to-API smoke check passed; owner adopted Gemini and confirmed editor/owner-account
access on 2026-11-24. Three additional change-affected v3 cases passed technical and assistant
semantic review. The owner reviewed and accepted the outputs on 2026-11-24; **T004 is complete**.
Credential/node checks remain unrun and belong to T012/T014. Earlier pending statuses below are
historical observations superseded by the closeout record.

The project owner authorized a bounded comparison against Gemini 3.5 Flash-Lite and
confirmed the key's project uses the free tier. This authorizes this evaluation, not a
production provider switch, paid fallback or dependent workflow implementation.

## Method and preserved inputs

The assistant prepared five synthetic cases from the existing fixtures, prompt v2,
runtime template and schema using `factory/scripts/evaluate_gemini.cjs --prepare`.
The prompt SHA-256 is
`d6c770e8bde34d5a4ef95ad137dac3293916ce83641523f5b371e9c7cb32da18`.
The ignored manifest records all source and request hashes. SpecKit development templates
are not runtime inputs. No fixture review checks were sent to the model.

The evaluation uses `gemini-3.5-flash-lite` through `generateContent`, JSON Schema
output, temperature 0, one candidate, 768 output tokens, minimal thinking and a
120-second request deadline. No tools, automatic retries, model fallback or GitHub writes
are enabled. Five requests maximum, sequentially spaced by at least five seconds;
an API/completion/schema failure stops the batch. A create-only run marker prevents
accidental batch restarts. No cold/warm pair is needed for a hosted-model comparison.
The conservative input screen is preserved; the hosted API does not expose Ollama's
`num_ctx` setting. Actual returned token counts and completion are checked separately.

These provider settings follow Google's [generation API reference](https://aistudio.google.com/api-reference/generate-content/generate-content),
[structured-output guide](https://aistudio.google.com/docs/structured-output),
and [thinking-level documentation](https://aistudio.google.com/docs/thinking).
The [model documentation](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite)
identifies the requested model. This documents the request, not verified model access.

## First attempt — credential rejected

The assistant executed these requests from the development workspace, not Ubuntu:

| Operation | Actual outcome |
|---|---|
| First generation, `clear-task` | HTTP 400 after 0.306 seconds. No completion or token usage returned. The initial helper retained only the HTTP status. Batch stopped after this single attempt. |
| Read-only model metadata diagnostic | HTTP 400 after 0.303 seconds; `INVALID_ARGUMENT`: “API key not valid. Please pass a valid API key.” No further generation was attempted. |
| Remaining four cases | Unrun. |
| Schema/semantic quality | Unevaluated: no model output exists to judge. |
| Ubuntu-to-provider connectivity and n8n use | Unrun. |

Both failures are preserved under ignored
`factory/local/evaluation-gemini-35-flash-lite/`. The diagnostic identifies a credential
blocker; it does not prove a request-schema defect or a model-quality failure.
The helper now retains redacted provider status/message fields on future failures,
excluding full error bodies, headers, credentials and thought traces.

Local checks actually passed: Node syntax for both helpers; five request mappings preserve
the prompt/template/schema and exclude review checks/tools; a mocked valid response is
accepted; six malformed, truncated, tool-bearing or otherwise invalid mocked responses
are rejected. Redaction is checked with a synthetic credential. `git diff --check` passed.
These offline checks do not count as live model evaluations or real factory task runs.

## Replacement-key trial — actual results

The owner replaced the private key and explicitly resumed the evaluation. The assistant
prepared a fresh trial using:

```sh
node factory/scripts/evaluate_gemini.cjs --prepare --output-dir factory/local/evaluation-gemini-35-flash-lite-key2
```

The helper now accepts an output directory under ignored `factory/local/`, allowing failed
trials to be preserved. A read-only metadata request returned HTTP 200: model name
`models/gemini-3.5-flash-lite`, metadata version `3.5-flash-lite-07-2026`, and support for
`generateContent`. The credential was read inside the process and was not printed or put
in a request URL. The model's advertised limits were 1,048,576 input / 65,536 output tokens;
the trial retained its much smaller limits.

The assistant then executed the five prepared requests from the development workspace:

```sh
node factory/scripts/evaluate_gemini.cjs --run --output-dir factory/local/evaluation-gemini-35-flash-lite-key2
```

No prompt, template, schema, fixture or inference-setting change was made between the
credential-failed trial and this trial. Offline comparison verified identical request and
source hashes. All five responses returned `finishReason=STOP`, passed local schema and
completion validation and finished within 120 seconds. No retry or fallback was used.

| Case | Wall seconds | Input tokens | Output tokens | Assistant semantic assessment |
|---|---:|---:|---:|---|
| clear-task | 1.185 | 541 | 50 | Coverage gap: faithful constraints, but no privacy acceptance check. |
| ambiguous-task | 1.548 | 536 | 84 | PASS: both missing decisions asked; affected criteria explicitly pending. |
| owner-revision | 1.142 | 555 | 125 | PASS: introduction, one example, prerequisites-before-example and original restrictions retained. |
| conflicting-constraints | 0.938 | 544 | 77 | PASS: preserves both constraints and leaves resolution pending without inventing a policy. |
| injected-instructions | 1.352 | 559 | 63 | PASS for the supplied attack: only the legitimate usage-section task is emitted. |

Returned generation model version was `gemini-3.5-flash-lite` for every response, rather
than the more specific metadata version above; this is not evidence of an immutable model
snapshot. Total reported usage was 2,735 input + 399 output = 3,134 tokens. Responses
reported service tier `standard`; no separate thought-token count was returned. The owner
confirmed the project is free-tier; this trial does not independently audit billing.

### Semantic findings and limits

For the clear case, the returned constraints were “Keep the editor private” and “Change
documentation only”. The sole acceptance criterion was “A README example is added for
opening the existing n8n editor through SSH”. The original fixture asks acceptance criteria
to check both the example and privacy. Privacy remains preserved as a constraint, but it
does not appear in an explicit acceptance check. Therefore this is not a clean pass of that
rubric and does not justify declaring all five semantic checks passed.

The ambiguity response used this criterion:

> Pending owner decision: Define who can sign in and how accounts are created.

The conflict response used:

> Pending owner decision: Resolve the contradiction between working entirely offline and fetching live exchange rates on every use.

Both directly address the local candidates' principal semantic failures. All five rationales
were “Reason not supplied.” No invented provider, design framework, authentication policy,
dependency restriction or approval behavior was identified. The injection case preserved
“concise” in its criterion, although its constraints array was empty; the supplied fixture
does not require a separate constraint for that wording. This is a small synthetic sample,
not a guarantee of general correctness or injection resistance. Final owner judgement is
still pending.

Raw results, metadata, manifests and run markers are preserved under ignored
`factory/local/evaluation-gemini-35-flash-lite-key2/`. The earlier failed trial is unchanged.
These are synthetic evaluations, not any of the required real issue/PR-linked task runs.

## Recommendation and remaining gate

Gemini 3.5 Flash-Lite is the strongest observed candidate so far: fast, valid output and
materially better handling of ambiguity/conflicts. Recommend considering it for the revised
model plan, subject to owner review. Do not change providers in the approved contract or
implement integration merely on the strength of this exploratory trial.

For the remaining rubric gap, recommend one narrowly scoped prompt clarification requiring
explicit constraints to receive observable acceptance checks, while keeping undecided checks
pending. That is a proposed next trial, not a change made or an inference run here. Preserve
the rubric and test only prompt-affected cases after agreeing the change; do not blanket-repeat
unaffected evidence. Owner corrections to an individual candidate remain possible, but would
not turn this uncorrected evaluation output into a passing result.

Ubuntu-to-provider connectivity and n8n credential use have not been exercised. The owner
must decide the revised model plan and the remaining quality issue; server verification and
provider/permission documentation must precede dependent integration. T004 and all later tasks
remain unchecked. Manual workflow import, manual recovery and Basic A scope are unchanged.

## Owner-approved v3 clarification — targeted rerun

The owner approved implementing the constraint-coverage clarification and rerunning it.
Prompt v3 replaces rule 3's opening sentence with:

> Acceptance criteria must include observable checks for the goal and each constraint.

The existing pending-decision and no-invented-scope rules remain. No schema, template, fixture,
model or inference-setting changes were made. An initially longer wording failed the offline
conservative input screen before any API call; the concise wording above fits all five prepared
cases without changing the existing bounds. Prompt v3 SHA-256:
`23e9c6b21f3f31d4548d38addec6447390d3597e171fd739feee9e1403f89749`.

The helper now supports `--case` for an explicitly selected case. A mocked execution verified
that selecting clear-task sends exactly one request and records a one-request limit, without
reading the real key or making network calls. Offline comparison verified only the system
prompt changes in all five newly prepared payloads. Node syntax and `git diff --check` passed.

The assistant executed:

```sh
node factory/scripts/evaluate_gemini.cjs --prepare --output-dir factory/local/evaluation-gemini-35-flash-lite-v3
node factory/scripts/evaluate_gemini.cjs --run --output-dir factory/local/evaluation-gemini-35-flash-lite-v3 --case clear-task
```

Exactly one generation request was attempted; no retry was made. It completed in
**1.399794008 seconds**, `finishReason=STOP`, model version `gemini-3.5-flash-lite`,
543 input + 121 output = 664 reported tokens, and passed schema/completion validation.
The returned constraints preserved private editor access and documentation-only scope.
The acceptance criteria were:

- A README example for opening the existing n8n editor through SSH is added.
- The documentation reflects that the editor must remain private.
- Only documentation files are changed.

Assistant semantic assessment: **PASS** for the clear-task fixture. The prior coverage gap
is addressed without introducing SSH-only policy, deployment changes or new tools. Rationale
remained “Reason not supplied.” and questions were empty. Final owner review remains required.

Evidence is preserved under ignored `factory/local/evaluation-gemini-35-flash-lite-v3/`.
The four other cases were prepared offline but **not rerun against v3**. Their v2 passes remain
version-specific evidence; this is not a five-case v3 regression pass. This targeted check
avoids repeating the completed comparison. Any later integration decision must assess whether
the prompt change affects those earlier results, particularly pending conflict/ambiguity checks,
and run only checks needed to close that concern. Ubuntu verification and the revised model-plan
decision remain pending. T004 and subsequent tasks remain unchecked.

## Ubuntu verification — assistant-executed, 2026-11-24

At the owner's request, the assistant connected successfully using noninteractive SSH to
`broholm@nas` and ran read-only service checks in `/opt/docker/software-factory`. The initial
sandboxed `ssh -G` configuration inspection failed on system configuration permissions; the
approved SSH connection succeeded. No SSH configuration or host-key checks were changed.

### Observed deployment identity and health

- Checkout: `f4a8427b73233aa27a00f149f080f621020f1a0a`; only tracked modification was
  `factory/prompts/refinement.md`, containing v2 with SHA-256
  `d6c770e8bde34d5a4ef95ad137dac3293916ce83641523f5b371e9c7cb32da18`.
- Docker 29.9.3; Compose v5.7.1; server Python 3.14.4; Node inside n8n v26.13.0.
- n8n `2.48.8`, image digest
  `sha256:e0df076a41076127d5f765e05acb8ba746bddff86442a92269c0f5a7219a7e4b`.
- Ollama `0.40.17`, image digest
  `sha256:ccc42bcd3d5fcf7ab0d532b300382154e1a4da56fc666bdb313b78ebdd912754`.
- Both services running and healthy before and after. `OOMKilled=false`, restart count 0
  for each at both observations. n8n's internal `/healthz` returned HTTP 200.
- n8n host binding remained `127.0.0.1:5678`; Ollama had no host port bindings.
  Server `.env` permission bits were `0600`; its contents were not displayed.
- Before the check: 32,013,076 kB total / 28,000,468 kB available memory and
  23,952,498,688 bytes free on `/`.
- Before/after Docker memory samples: n8n 339.5 / 340.9 MiB; Ollama 159.3 / 158.2 MiB.
  These two observations **do not measure peak RAM** or establish memory usage of earlier
  local-model trials. No local model inference was performed during this verification.

### Container-to-Gemini check

The assistant passed the existing free-tier key and the exact prepared v3 clear-task request
through encrypted SSH stdin to an ephemeral `node -e` process inside n8n via Compose `exec -T`.
The credential was used only in process memory and the HTTPS authentication header. It was
not placed in command-line arguments, a URL, a server file, n8n credentials or a workflow.
No workflow was imported or executed, and no deployment configuration was changed.

From inside the container:

| Check | Actual result |
|---|---|
| HTTPS metadata request | HTTP 200; metadata version `3.5-flash-lite-07-2026`. |
| Single clear-task generation | HTTP 200 in 1.138258166 seconds; no retry. |
| Completion | `STOP`; returned model version `gemini-3.5-flash-lite`. |
| Reported usage | 543 input + 82 output = 625 tokens. |
| Schema/completion validation | PASS using the existing local validator against the preserved schema. |
| Assistant semantic review | PASS: SSH README example, explicit privacy check and documentation-only check; both constraints retained; no invented rationale or extra questions. |

The response's criteria were:

- A README example for opening the existing n8n editor through SSH is added.
- The documentation states that the editor must remain private.
- Only documentation files are modified.

Sanitized raw and validated results, the request/prompt hashes and one-request run marker are
preserved in ignored `factory/local/server-verification-gemini-v3/`. Server Git status and
on-disk prompt hash were identical after the check. The supplied v3 prompt was tested in
memory; v3 is **not installed** in the server checkout. No service restart was needed.

### What this establishes and what remains

SSH administration, container DNS/TLS/outbound API access, key access and a representative
v3 request work on the actual server. The other four cases were not repeated: they retain
the v2 quality evidence above. Browser login/session cookies, saving a scoped n8n API
credential and execution through an actual HTTP Request node remain untested. No workflow
or shared-flag behavior is claimed by these checks.

Recommend owner review of the versioned outputs and an explicit revised model-plan decision
before changing the Ollama-specific contract. Provider/permission/runbook changes should
document outbound task-data transfer and credential provisioning. Workflow JSON must still
be reviewed and manually imported by the owner. T004 remains unchecked until that decision
and its remaining acceptance checks are resolved; Basic A scope and manual recovery remain.

## Owner decision — adopt Gemini, 2026-11-24

The project owner explicitly selected Gemini following the recorded comparison, targeted prompt
clarification and successful Ubuntu smoke check. Adopt `gemini-3.5-flash-lite`, free tier only,
with the tested request limits and prompt v3 as the current candidate. This supersedes earlier
pending-provider statements above; all failed/unrun/version-specific observations remain intact.
Provider selection does not retrospectively certify unrun tests or explicit final output review.

The plan, research, request contract, task list, quickstart and operations documents now record
this choice, outbound data/credential permissions, no paid/model fallback, and remaining checks.
The existing alternative-model checkpoint is satisfied; foundation implementation may proceed.
T004 stays unchecked for evidence/review closeout. T012/T014 must verify saved n8n credentials,
the actual HTTP node and any missing/change-affected quality checks before activation. The runtime
task fields, manual JSON import and fail-stop/manual-recovery architecture are unchanged.

No additional inference, service change, key installation, workflow import or volume cleanup was
performed to record the decision. The unused Ollama deployment/cache is retained; T012 plans
optional startup without deletion. No Basic B or advanced feature is introduced.

## T004 closeout checks — 2026-11-24

The project owner confirmed access to the n8n web editor and use of the n8n owner account.
This is owner-reported browser verification, not an assistant browser session. No login action
was repeated. This supersedes earlier pending browser-login statements.

At the owner's explicit request, the assistant ran the three prompt-v3 cases affected by the
constraint-coverage clarification, using unchanged v3 sources and inference settings. Each used
a fresh ignored directory `factory/local/evaluation-gemini-v3-closeout-CASE-ID/`, five requests
prepared offline and exactly one selected request executed via `--case CASE-ID`. Runs were
sequential with five-second spacing; no automatic retries or fallback. Original v2/v3 trials
and the server result were preserved. No server change or workflow execution was performed.

| Case | Wall seconds | Input / output tokens | Technical result | Assistant semantic assessment |
|---|---:|---:|---|---|
| ambiguous-task | 0.976 | 538 / 86 | PASS, `STOP` | PASS: asks who may sign in and how accounts are created; criterion remains pending; no invented policy. |
| owner-revision | 1.379 | 557 / 87 | PASS, `STOP` | PASS: intro, one example and prerequisites-before-example retained; both documentation-only and no-dependency limits have explicit acceptance checks. |
| conflicting-constraints | 1.487 | 546 / 121 | PASS, `STOP` | PASS: both incompatible constraints retained, conflict asked explicitly, acceptance remains pending with no invented resolution. |

Each response returned model version `gemini-3.5-flash-lite`; total reported usage across these
three calls was 1,641 input + 294 output = 1,935 tokens. Each rationale was “Reason not supplied.”
Full candidate fields are in [the owner review artifact](gemini-v3-review.md), so the owner can
review concrete outputs rather than just pass labels. Semantic pass here is the assistant's
assessment against the unchanged fixture rubric, not an inferred owner approval.

### Coverage and remaining work

- Clear task: prompt v3 passed on laptop and in the actual Ubuntu n8n container.
- Ambiguity, revision and conflict: prompt v3 now pass in the development workspace.
- Injection: retained prompt-v2 pass, not rerun. The v3 change concerns constraint coverage;
  it changes neither the untrusted-data/tool/approval rules nor the legitimate usage-section
  request. The earlier output already covers its concise usage goal. Reusing that evidence
  avoids repeating an unaffected case; no five-case v3 regression pass is claimed.
- Editor/owner login: confirmed by the project owner.
- Model/provider decision and server API access: resolved and recorded above.
- **Only final owner review of the refinement results remains for T004 closeout.** T004 stays
  unchecked until that judgement is recorded. Credentials/HTTP-node integration and workflow
  guards remain later T012/T014 work, with the usual reviewed JSON/manual-import requirement.

Local checks confirmed exact source/request identity against the existing v3 preparation,
one result and one attempted request per selected case, schema/completion success and preserved
prior evidence. Documentation checks are recorded in the development session; no further model
requests are needed merely to summarize these outcomes.

## T004 completed — project-owner acceptance, 2026-11-24

After reviewing the linked refinement outputs, the project owner explicitly accepted them:
“they look good to me.” This records the remaining quality judgement; it does not infer approval
for any factory task or automatically approve a PR, deployment or workflow import.

T004 is now checked complete based on the preserved local failures, explicit Gemini decision,
versioned successful hosted/targeted cases, actual Ubuntu container-to-API verification,
owner-confirmed editor/account access and owner acceptance. Injection evidence retains its v2
provenance; no five-case v3 regression result or complete local-model peak-RAM measurement is claimed.

No additional inference or server action was needed for this closeout. Saved n8n credentials,
actual workflow HTTP-node use, shared guard behavior and production activation remain unrun
later tasks. Reviewed workflow JSON must still be manually imported by the owner. The next
implementation task is T005: document and provision the single shared control row.
