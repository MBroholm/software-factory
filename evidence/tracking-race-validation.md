# Tracking no-work race — 2026-11-26

## Production incident and cause

Production tracking execution **133**, native trigger mode, ran from 16:12:35.141 to
16:12:41.679 UTC. [PR #10](https://github.com/MBroholm/software-factory/pull/10) was created
at **16:12:39 UTC** for [issue #9](https://github.com/MBroholm/software-factory/issues/9).
Read and Recheck produced Building/no result/no marker; both write IFs took their false
branches. Final then discovered PR #10 and planned Your QA/a result marker. Complete tracked
result rejected that different snapshot with `Final result readback changed`. No marker POST,
label add or label removal node ran. The safety hold was conservative; no duplicate write or
incorrect state transition occurred.

A supported encrypted entity export over SSH established the complete reached-node list,
branch outputs, public issue/PR identity and workflow snapshot. Only execution/workflow records
were decrypted in memory with a disposable export key; credentials/instance keys were not read.
Temporary remote export/key were removed. Filtered observations remain private under ignored
`factory/local/production-review/`. Public GitHub readback showed #9 open/Building, no result
marker, and PR #10 open at b84bfef4d438f7631f51045521ca59c207490d2f. At the snapshot all three
operational workflows were unpublished. Their saved track version was
943b51b9-49a1-45db-bcaf-13a6b3f30fd7; the failed execution snapshot did not expose its own
version UUID, so that current saved version is not substituted as per-execution provenance.
No production flag reset, retry, import, publication or task mutation was performed.

The [sanitized incident extract](tracking-incident-133.json) preserves execution metadata,
the reached-node list and the changed plan fields supporting this diagnosis. The private
filtered export is optional supporting material; it is not required to read these observations.
The extract does not recover the missing per-execution version UUID.

## Change and safety boundary

After the first validated Read ready snapshot, Have tracking work routes only a pending marker
or state transition into the existing Recheck/write/Final chain. A read-only no-result or
unchanged-QA snapshot instead goes to No tracked changes and the ordinary acknowledged guard
release. It keeps the selected issue context and the Building/QA reservation. A PR or merge
arriving after that read waits for the next scheduled poll.

All current association, captured-source, owner approval, ambiguity and PR-detail checks still
run on the initial read. Every planned write retains strict recheck, receipt validation and
final readback. Exceptions, changed write inputs, unknown POSTs and uncertain guard operations
still fail closed. This adds no retry, automatic repair or guard expiry. The generator maintains
new node notes and stage notes; both operational and isolated JSON were rebuilt from source.

## Checks actually run

Source base: c359fbde6a1b15335d596bc44f4792f9c4994234 plus this review branch's fix.
Track source SHA-256: `3d4e5883f4af1e7028c89dbe384217327cae4d330ee6e02d92f8cab1ac24d23c`.
Refine and reserve source are unchanged; their unaffected evidence is reused.

- **Regression before fix:** the new arriving-PR test failed against the old graph with
  `Tracking evidence changed before write` (the earlier version of the same no-work race).
  The retained [incident observation](tracking-incident-133.json) separately records the later Final-window variant.
- **PASS 25 local exported-graph/policy groups:** PR arrives after no-result read, next poll
  enters QA once, unchanged poll makes no writes; merge arriving after unchanged QA waits for
  next poll then enters Done; changed PR head before a planned write still holds; previous
  success/closure/rework/ambiguity/acquisition/failure/pagination tests retained.
- **PASS focused native n8n 2.48.8 checks** below, including the actual new IF expression and
  ordinary Data Table release in the VM engine. No separate synthetic VM claim replaces these.
- **PASS** track generator and isolated-package consistency, seven mapping groups, helper syntax,
  documentation links/fences, JSON parsing and `git diff --check`.

Fresh isolation verification established separate test volume `factory_guard_test_data`, host
loopback 5679, versus production volume/5678; all 25 prior workflows inactive, no running/waiting
executions, typed singleton idle at 1699. The new copy has no credentials and every HTTP
node uses synthetic container loopback 18767; schedules stay disabled. Exact imported version,
source/mapped hashes, native traces and observed guard rows are in
[results](tracking-race-results.json). Native execution snapshots matched every packaged Code
body and all connections.

| Native execution | Result |
|---|---|
| 1702 | Fixture returns empty PR list once then exposes a PR. No tracked changes completes, no Recheck/Final or write, Building retained, guard idle. |
| 1704 | Fresh poll discovers that PR, posts one marker and moves to QA; guard idle. |
| 1706 | Unchanged QA uses new no-work branch; marker stays single, zero additional writes, guard idle. |
| 1709 | Deliberate unknown POST receipt: one synthetic marker committed, no labels changed, error retains busy. |
| Later native held poll | Skips with the exact 1709 row unchanged. |

These are synthetic main-engine webhook executions, not new scheduled or real task evidence.
Existing scheduled-entry coverage is reused because trigger/acquisition is unchanged. Existing
Done behavior plus the new merge-arrival path is locally tested; no new real Done transition
is claimed. The native runner does not reset on errors: it unpublished/drained the copy and
retained 1709 for inspection. A separate explicit operator action verified that exact completed
synthetic failure, all copies inactive/drained and one committed synthetic marker, then reset
only its busy field using a conditional supported Data Table API update. All 26 test workflows
are inactive; test singleton idle with 1709 diagnostics retained. Only the new fixture process
was stopped; historical fixture/trace files remain. Production was untouched.

Initial sandbox network attempts stopped before API access; approved network runs succeeded.
No source workflow fix was required by native testing. The initial snapshot summary reader
assumed a versionId field that the execution export lacked; the reader was corrected, and
that provenance limit is recorded above.

## Owner recovery and operational adoption

Keep production paused/drained and preserve execution 133 as incident evidence. Review this fix
in its PR and manually import **only** `factory/workflows/track.json` (or its privately mapped
counterpart) into the intended operational tracking workflow. Verify the source hash, existing
credential and singleton mappings, code/connections and new published revision. Refine/reserve
need no reimport for this fix. Do not import the credential-free native fixture copy.

Before clearing busy, inspect the actual production singleton. Confirm the hold belongs to the
completed failed execution 133, no execution or laptop agent can still write, and fresh GitHub
readback still shows the known issue/PR/head and no duplicate marker or partial transition.
Record the incident/reconciliation on the issue. If anything differs, stop and reconcile that
actual state. With the known no-write outcome confirmed, the owner may clear only busy, retain
its diagnostic context and publish/resume reviewed schedules. Let a **fresh scheduled poll**
process the PR; do not Retry the failed execution or run individual mutation nodes.

Owner manual import and new operational version/mapping verification were subsequently completed
as recorded below. Production reset/resumption and real QA/Done observations remain **UNRUN**. Prior T030 completion describes the
previous imported revision and is preserved; it does not waive renewed review/manual import.


## Owner manual import verified — 2026-11-26

The owner confirmed importing the new workflow. Read-only supported export inspection at
**16:53:53.644 UTC** verified tracking workflow `spA3DraW41PVkV3z`, saved version
`6dcd3b8e-b018-4e4a-8f4e-25f26bdb0615`. All 71 nodes are present; every packaged Code body,
all connections, IF conditions and saved credential/control-table references match the privately
mapped reviewed artifact. The schedule remains 60 seconds. Credential values were not read.
This inspection establishes these specific fields; it does not audit credential scopes.

All three operational workflows remain unpublished (active=false, activeVersionId=null),
with no running/waiting/new executions. The typed singleton still has id=1, global, busy=true,
execution_id=133, issue_number=9, started_at=2026-11-26T16:12:35.164Z. Exported SQLite Boolean
1 was normalized to logical true; no direct SQL was used. Execution 133 remains error/stopped.
Fresh public GitHub readback confirms #9 open/Building, no result marker, PR #10 open/unmerged
at the unchanged b84bfef4d438f7631f51045521ca59c207490d2f head. Thus the known no-write
incident is unchanged. Supported export files/disposable key were removed after inspection;
filtered readback remains private/ignored. Public observations are appended in the results JSON.

The owner still needs to confirm the coding agent is finished/stopped, record reconciliation on
#9 and set only busy=false while workflows remain paused. Retain the execution/issue/start
fields and Building label, publish the reviewed workflows, and observe a fresh scheduled poll.
No production reset/publication, failed-execution retry or real QA/Done transition was performed
or inferred by this read-only verification.


## Real QA and merged-result Done verified — 2026-11-26

The owner reported #9 moving to Your QA after recovery/resumption, then merging PR #10 and
observing Done. Fresh public GitHub reads independently confirm the durable sequence:

| Event | UTC / durable evidence |
|---|---|
| One result marker | [7198327427](https://github.com/MBroholm/software-factory/issues/9#issuecomment-7198327427), 16:58:22; approval 37386569261, PR #10, unchanged b84bfef4d438f7631f51045521ca59c207490d2f head; unedited, exactly one marker |
| Building -> Your QA | QA label event 37392400679 at 16:58:23; Building removed at 16:58:24 |
| Owner accepts result | MBroholm merged [PR #10](https://github.com/MBroholm/software-factory/pull/10) at 17:01:15; merge commit 59977d3c13e991af1cb3416cbba8b788de41f846 |
| Your QA -> Done | Done label event 37392650172 at 17:01:22; QA removed at 17:01:23; issue #9 remains open, so issue closure did not cause completion |

Supported read-only production export at **17:03:50.259 UTC** confirms all three workflows
published at their reviewed versions, track activeVersionId
`6dcd3b8e-b018-4e4a-8f4e-25f26bdb0615`, with unchanged verified Code/connections/IF/mappings.
Retained execution **191** is successful native **trigger** mode, 17:01:16.991–17:01:25.798,
workflowVersionId matching that published version. Successful later trigger polls 194/197 are
also retained. Original failed 133 remains error at the old 943b51b9 version. Filtered success
trace collection did not return per-node records; QA relies on owner observation plus public
marker/label history, and Done additionally has the successful scheduled execution metadata.
No unseen native receipt or exact QA execution ID is asserted.

The singleton is idle (busy=false), execution_id=199, issue_number=null,
started_at=2026-11-26T17:03:23.089Z, with no running/waiting/new executions at that observation.
This is current observed idle state, not a substitute for per-node historical guard receipts.
The agent performed only read-only verification; reset/publication/resumption were owner actions.
No separate recovery comment is present in the inspected issue history; the incident and owner
intervention are preserved here and in PR #11 rather than inventing that comment.

Operational import/publication/recovery and real QA/Done outcomes for this fix are now **PASS**
within these evidence limits. Earlier pending statements above describe their dated checkpoints.
This adds genuine task **2** (#9 / PR #10) to [the index](index.md), leaving **three** more
issue/PR-linked tasks toward the final-project five-run minimum. It is not a claim that the
race itself reoccurred in production after the fix; deterministic reproduction remains local
and isolated native evidence. PR #11 still requires the owner's merge decision.
