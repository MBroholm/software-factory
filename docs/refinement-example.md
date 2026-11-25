# Refinement output example

## Live workflow example

Execution 753 on 2026-11-25 posted the first real refinement for
[issue #1](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7160240711).
The original issue text was not shortened: provider count 576 tokens, reserved total 2056/4096,
one successful Gemini generation with 106 output tokens, Ready for approval and idle guard.
See `evidence/refinement-validation.md` for the source key, native evidence and prior failures.
Execution 755 subsequently passed revision mechanics. Execution 757 posted the
[corrected refinement](https://github.com/MBroholm/software-factory/issues/1#issuecomment-7161366810),
including an explicit privacy acceptance criterion and the SSH access section requirement.
Its first generation attempt succeeded (663 input / 197 output tokens), reserved total 2143/4096,
and the owner-reported guard is idle. Owner explicitly approved this refinement at
2026-11-25T11:45:26Z (label event 37246567614). Post-approval poll 758 returned no_work
and an idle guard, leaving Approved and the six-comment count unchanged. Actual 503 retry/backoff
was not exercised. This is not a completed build/PR run.

## Earlier offline rendering

Offline rendering of the actual, owner-accepted v3 `owner-revision` evaluation output from
2026-11-24. See [quality evidence](../evidence/gemini-v3-review.md). Issue 103 and comment 1001
are synthetic fixture identifiers; this is not a posted GitHub comment or a native workflow pass.
The renderer adds the source marker, fixed headings and unchecked criteria. A real imported
workflow output remains pending T014. No model call was repeated to create this example.

```markdown
<!-- factory:refinement:v1 {"issue_number":103,"source_digest":"1ce43e25d17362c780c2a3d952f1fb3d6bd0de91f141037c5ac96a7369e2ffdf","captured_comment_ids":[1001],"last_included_owner_comment_id":1001,"prompt_version":"v3","template_version":"v1","source_key":"103:1ce43e25d17362c780c2a3d952f1fb3d6bd0de91f141037c5ac96a7369e2ffdf:1001:v3","content_sha256":"0b9ecf763f384d13a76c7dc890c09c1e989f7202634fc9e95565c4649379990a"} -->
<!-- Runtime task template v1; rendered by the workflow, not filled with model authority. -->
# Refined task

## Goal
Improve the product README by adding a short introduction, a prerequisites section, and one usage example

## Why
Reason not supplied&#46;

## Constraints
- Keep it documentation&#45;only
- Add no dependencies

## Acceptance criteria
- [ ] The README contains a short introduction
- [ ] The README contains a prerequisites section placed before the usage example
- [ ] The README contains one usage example
- [ ] No new dependencies are added
- [ ] Changes are documentation&#45;only

## Questions for the project owner
- None supplied.

## Source
<!-- Workflow-supplied metadata only; the model does not generate this section. -->
Issue: https://github.com/MBroholm/software-factory/issues/103
Revision: 103:1ce43e25d17362c780c2a3d952f1fb3d6bd0de91f141037c5ac96a7369e2ffdf:1001:v3
Input digest: 1ce43e25d17362c780c2a3d952f1fb3d6bd0de91f141037c5ac96a7369e2ffdf
Captured comments: 1001
Prompt version: v3
Template version: v1

Candidate refinement only. Explicit project-owner approval is required before building.

Model: gemini&#45;3&#46;5&#45;flash&#45;lite
Usage: {"promptTokenCount":557,"candidatesTokenCount":87,"totalTokenCount":644}
```
