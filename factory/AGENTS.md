# Workflow documentation

When implementing or changing n8n workflows in this directory:

- Give every operational node a concise, plain-language `notes` explanation of its purpose.
  Explain important inputs/checks, branch destinations, external writes and failure behavior
  where applicable. Explain why repeated checks exist rather than repeating the node name.
- Update affected notes in the same change as node behavior, conditions, connections,
  permissions or recovery expectations. Remove or rename documentation entries when nodes
  are removed or renamed. Review note accuracy before reporting the change complete.
- Use numbered stage sticky notes to explain the overall flow. Keep their summaries and
  grouping consistent with the current nodes and connections. Enable `notesInFlow` selectively
  for short, useful subtitles so the canvas remains readable.
- For generated workflows, maintain notes and layout in the generator's source, then rebuild
  the JSON. Do not make documentation changes only in generated JSON or the n8n editor.
  Refinement documentation lives in `scripts/refinement-notes.cjs` and is packaged by
  `scripts/build-refine.cjs`.
- Run the relevant generator consistency check after changes. From the repository root,
  refinement uses `node factory/scripts/build-refine.cjs --check`. Its builder rejects missing,
  duplicate, stale or empty node-note entries; human review must still check their meaning.
- When guiding an owner workflow import, give the artifact as a project-relative plain path
  in code formatting, not a clickable file link (links open an inconvenient side panel).
- For parameter-expression changes, check compatibility with the deployed expression engine.
  Importing `n8n-workflow` alone uses legacy evaluation; this deployment uses the VM engine.
  `tests/check-refinement.cjs --native-fixtures` generates synthetic contexts for
  `tests/check-refinement-native-expressions.cjs`, which explicitly initializes VM evaluation.
  In n8n 2.48.8, omit the redundant negative run index in `.first(1)`; explicit `.first(1, -1)`
  returns undefined in VM parameter expressions. Keep the native regression when changing this.

- Generation backoff must remain below the deployed native in-process wait threshold, with
  `acceptsResumeRequest=false`. Retain native Wait/threshold checks; never introduce durable
  waiting, external resume, automatic guard reset or failed-execution replay.

Documentation/layout changes alone do not require new behavior tests. When intended to be
documentation-only, verify that execution parameters and connections remain unchanged.
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
