# Basic B adoption preparation

Prepared against US4 commit `ff14865` plus the validation-tooling working changes identified
in `basic-b-results.json`. This is a review record, not approval or evidence of deployment.

## Source artifact fingerprints

| Inactive source artifact | SHA-256 |
| --- | --- |
| `factory/workflows/refine.json` | `a68f9d0c160c816e6cc04a3367af01ec6d2382f3b23a1b37a7180a5b2a2a8aa0` |
| `factory/workflows/reserve.json` | `ed8ad287ef70ef1def944a52530ec79afe087810f80941aeaad1e6e845bdcf59` |
| `factory/workflows/track.json` | `77d3bc2b59a3805716eea2f5203b37d8adbaf975d58016786329e64a7e312650` |
| `factory/workflows/collect.json` | `abd0dd6cf78118491bdaf064e5d2f5d625b1dbe0614022e785c9903ce43e84f1` |

## Owner review and gates

- Pending: owner PR review of all four JSON fingerprints and Basic B permission expansion.
- Pending: owner-provisioned dedicated Ubuntu account/user manager, private runner bind/network,
  separate API/worker secrets and owner-selected model/auth. No provisioning performed here.
- Passed on the isolated host: real Codex smoke through owner merge and the elapsed descendant deadline (T042).
- T041 passed with scheduled fake HTTP, outage and redaction fixtures, scratch backup/restore,
  and separate Ubuntu runner restart and duplicate-dispatch tests. Review the recorded test limits.
- Pending: verify production workflow concurrency=1 and 60-second schedules in the instance.
- Pending: pause/drain Basic A; inspect and manually reconcile every manual Building task and
  owner-started process. An idle workflow guard does not establish stopped execution.
- Pending: owner manually imports this matching four-artifact revision after review, reads back
  fingerprints/mapping deltas, then explicitly enables schedules. No operational import observed.
- Pending: genuine approved owner-authored task through automated PR and owner acceptance.

## Permission and mapping review

Runner receives its own GitHub credential for scoped repository reads/push; orchestrator uses
separate saved GitHub, model and runner bearer credential references. Agent-reported checks
remain attributed. No merge permission or advanced isolation/verification is introduced.
See `docs/permissions.md`, `docs/operations.md` and `docs/manual-coding.md` for exact boundaries.

Private mapping records belong under ignored `factory/local/`; do not publish credential IDs,
instance exports or secrets. `factory/local/basic-b-test/manifest.json` currently describes only
synthetic offline loopback copies, with exact node deltas and `live_isolation_verified=false`.
It is not an operational mapping or import receipt. Record actual private mapping location and
source/imported fingerprints after owner action; keep those fields pending until observed.

Rollback requires pause/drain and stopped/effect reconciliation. Preserve the current ledger,
worktrees, manifests and unresolved intents; never restore an old ledger to forget a live attempt.

## Observed operational cutover

The owner configured the dedicated operational account and credentials, paused
Basic A, and manually imported the four inactive artifacts mapped at `70beef6`.
Readback verified the code, node mappings, connections, schedules and production
concurrency of one. The editor omitted some workflow settings; the owner restored
those settings before staggered activation. The four Basic B schedules were then
verified active; Basic A remained inactive. See [operational run evidence](basic-b-real-run.md)
for the credential denial and recovery in the first run, and the subsequent
run through owner merge and Done. The rollback details stay in the local NAS log.
