# Daily Basic A health check

Use the intended operational n8n instance and GitHub repository. Read current state;
dated snapshots in the runbook are historical evidence, not today's health result.

- [ ] **Published workflow versions:** Confirm all three intended schedules are published
  with the owner-reviewed, manually imported revisions and correct credential/control-table
  mappings. Check the published versions, not just saved editor drafts. See
  [import and normal operation](operations.md#import-and-normal-operation) and
  [workflow mapping](workflow-mapping.md).
- [ ] **Recent executions:** Inspect recent scheduled polls for each workflow. Confirm
  expected completion or explained no-work outcomes, and investigate failures, missing polls
  or unexpected running/queued/waiting executions. A skipped poll because `busy` is held
  does not prove readiness. Follow [outcome inspection](operations.md#2-inspect-the-actual-outcome).
- [ ] **Shared busy flag:** Read the full `factory_control` table through Data Tables.
  Confirm exactly one valid `key=global` row with the expected typed fields. An idle factory
  should have `busy=false`; if true, match `execution_id`, `issue_number` and `started_at`
  to the actual execution. A stale timestamp never authorizes a reset. See
  [manual recovery](operations.md#t009--manual-failure-recovery).
- [ ] **Occupied Building slot:** Check all repository issues with `Building`, including
  closed or non-owner issues. Zero means the build slot is available; one legitimate
  reservation means it remains occupied, even if the laptop is idle. Verify its current
  approval, refinement, handoff and agent status using [manual coding](manual-coding.md).
  Multiple or conflicting reservations require inspection. Releasing `busy` does not
  release a Building slot.
- [ ] **Recovery route:** For a failure, unknown write or inconsistent state, follow the
  owner's [pause, drain, inspect and manual recovery sequence](operations.md#t009--manual-failure-recovery).
  Do not retry failed nodes, clear flags, remove reservations or launch replacement work
  as part of this checklist. Resume only after reconciled recovery and the
  [deliberate reset/resume checks](operations.md#5-reset-and-resume-deliberately).
