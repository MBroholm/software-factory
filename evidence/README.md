# Evidence

Commit only sanitized observations and links; distinguish planned, passed, failed and unrun checks.
Synthetic fixture exercises do not count as real issue/PR-linked task runs. The full project
still requires at least five real runs; none is claimed by setup work.

Keep raw model responses, memory samples and server-local secrets under ignored `factory/local/`.
Review them before publishing any excerpts. Never commit database/volume backups or credentials.

T004's model decision and owner acceptance are complete; see [Gemini evaluation](gemini-evaluation.md)
and [v3 owner review](gemini-v3-review.md). Historical local failures remain in
[Ollama evaluation](ollama-evaluation.md). Guard-only native tests are recorded in
[guard validation](guard-validation.md).

[US1 refinement validation](refinement-validation.md) records current local checks and the
pending owner import/native credential/live exercises. It does not claim a real issue/PR run.
See [operations](../docs/operations.md) for the owner-controlled import/recovery boundaries.
