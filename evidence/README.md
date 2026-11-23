# Evidence

Commit only sanitized observations and links; distinguish planned, passed, failed and unrun checks.
Synthetic fixture exercises do not count as real issue/PR-linked task runs. The full project
still requires at least five real runs; none is claimed by setup work.

Keep raw model responses, memory samples and server-local secrets under ignored `factory/local/`.
Review them before publishing any excerpts. Never commit database/volume backups or credentials.

T004's server evaluation is pending. See [local setup checks](local-setup-checks.md) and
[operations](../docs/operations.md); no model quality or server performance result is implied.
