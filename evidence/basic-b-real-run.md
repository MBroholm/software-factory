# First operational Basic B run

[Issue #13](https://github.com/MBroholm/software-factory/issues/13) requested a
list of possible product ideas. [PR #14](https://github.com/MBroholm/software-factory/pull/14)
added only `product/ideas.md`. The owner explicitly approved the refined task,
and later reviewed and merged the PR. Tracking verified the merge and moved
the issue to Done. The issue remained open with that label.

The operational runner was installed from `5b9bdc3`. The owner manually imported
the four reviewed workflow files mapped at `70beef6`. Readback verified the
workflow code, URLs, credential and table references, connections and schedule
rules. The owner restored workflow settings that the editor omitted on import.
Basic A was inactive and n8n was drained before Basic B activation.

Reserve execution 7821 started the first operational worker. Codex produced the
result, and the runner committed and pushed `issue-13` at
`e1b316c79e0bd9f5bf475ea64c5b0dfd07a5549f`. Collection execution 7828 received a
GitHub HTTP 403 at PR creation. The guard and PR intent stayed held, and the
branch remained intact. The owner paused the schedules and updated the n8n
credential permission. After a dry run on a ledger copy, the owner approved
audited recovery of that exact denied request. The owner then cleared only
the drained n8n guard for execution 7828 and enabled collect.

The collector created PR #14 at the original pushed SHA and moved the issue
to Your QA. The runner released its slot. Neither the worker nor the push ran
again, and no one manually created a PR. Owner merge was verified at that SHA;
the tracker subsequently succeeded and the issue read back as Done. No
question was asked in this operational run.

This is one genuine Basic B operational task with a credential repair and
audited recovery. Together with the two retained Basic A runs, the project
has evidence of three of the required five genuine tasks. The isolated smoke
is separate. After owner review, the owner resumed Basic B. All four schedules were verified
active, with successful trigger executions 7859–7862. Basic A stayed inactive,
and the operational runner read back unpaused with an empty, unheld slot.

## Second operational Basic B run

[Issue #15](https://github.com/MBroholm/software-factory/issues/15) asked that the
product ideas reflect any requirements in the project brief. The owner added
a constraint in discussion, refine captured it in a new marked specification,
and the owner explicitly applied Approved. The factory recorded a v2 attempt
and opened [PR #16](https://github.com/MBroholm/software-factory/pull/16) at
`53e9e52433fb92b0f80e7d60782b20b39889d934`. The PR added two lines to
`product/ideas.md`. The owner merged it and the issue read back as Done.

The agent reported passing `git diff --check` and Python assertions for the
brief link, requirements text, six preserved ideas, and single-file scope.
The reported checks ran before the runner committed. The no-requirements
branch of the acceptance criteria was unexercised because the brief includes
requirements. The issue history showed no Stuck or Waiting transition. The
PR summary retains the agent's pre-commit wording and includes an absolute
worktree link, a publication-format issue to address separately.

This is the fourth genuine project run. One further genuine issue and PR
loop is required.
