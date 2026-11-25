# Isolated US1 native fault validation

This is test infrastructure for T014. It copies the current refinement graph, keeping native
Code, IF, Split In Batches, HTTP Request, Data Table and Wait nodes. It has no schedules,
credential references, real GitHub/provider destinations, subworkflows or production access.
The source workflow and issue #1 remain unchanged.

## Review and owner import

Build from the repository root with `node factory/tests/build-refinement-bridge.cjs`.
The builder produces the committed placeholder-mapped `factory/tests/refinement-bridge.json`
and `refinement-bridge-sources.json` for review. For the ready-mapped owner import it also uses
the ignored, previously owner-imported isolated mapping artifact
`factory/local/refine-us1-retry-mapped.json`. It writes:

- `factory/local/refinement-native-bridge/workflow.json` — owner import only
- `factory/local/refinement-native-bridge/fixtures.json` — synthetic HTTP data
- `factory/local/refinement-native-bridge/manifest.json` — hashes and explicit copy deltas

Verify generated files with `node factory/tests/build-refinement-bridge.cjs --check`.
Review the builder, committed JSON, fixture server, runner and manifest. All source connections are retained
except removed original trigger edges; all source Code bodies are exact except named prefixes
at Validate before Refining and Check comment receipt, gated to explicit exception cases.
HTTP calls keep request bodies, status handling, timeouts, pagination and expressions, with
only URL bases switched to an internal loopback fixture, authentication removed, and three
fixture identity headers added. Eight source Data Table nodes retain the same isolated US1
control mapping. Extra operator state/reset nodes use that same table; resets require row ID,
expected execution ID and a reason, change only busy, and are never connected to failure paths.

Constitution sections I/III require the owner to manually import reviewed workflow JSON.
Import the workflow as a **new** workflow into **factory-guard-test, localhost:5679 only**.
Name: `TEST ONLY — Basic A US1 native fault bridge`. Publish only this test bridge to register
its webhooks. Keep all other workflows inactive and do not execute manual tests concurrently.
No schedules are present. Do not import this bridge into production or remap it to production.
Source changes to the builder require rebuilding/review and owner reimport before relying on them.

## Assistant execution after import

The fixture server runs as a disposable process **inside factory-guard-test**, listening only
on `127.0.0.1:18765`; Docker publishes no new port. It serves synthetic GitHub/model responses,
records body digests/call counts/effects and persists synthetic state to a private /tmp file.
It accepts only declared case names and numeric execution IDs. It has no credentials and makes
no outbound requests. Existing real repository data and API quotas are untouched.

Start the installed fixture server in the container with:

```
node /tmp/basic-a-us1-native/refinement-fixture-server.cjs /tmp/basic-a-us1-native/fixtures.json
```

Use `run-refinement-bridge.py` via the existing authorized SSH connection, with stages inspect,
pilot, suite, restart and held-check. Pilot covers success and one 503 retry. The suite covers
39 other cases, including two retries, exhaustion, Retry-After refusal, other HTTP statuses,
transport loss, bad output/counts, source/discussion/state changes during backoff, source changes
during inference, owner/PR/closed exclusions, unchanged/reuse/revision behavior, captured edits/
deletions, conflicting/stranded states, real HTTP pagination, later-candidate selection, unknown
comment POST, partial label write and unexpected exceptions before/after a remote effect.

Every retained failure is followed by a fresh whole-workflow held-skip check, verifying the
persisted row and synthetic effect/call state are unchanged. Between independent completed
cases, the runner logs inspection and deliberately requests a busy-only fixture reset. It refuses
to clear an unknown held execution; no reset occurs in finally/error cleanup. Any unexpected
assertion stops testing with evidence retained. These fixture actions are authorized isolated
test operations, not recovery automation in the product workflow.

The restart stage observes a synthetic 503 response outside the serialized n8n execution slot,
then restarts **only factory-guard-test** with a one-second grace period during backoff. It
inspects the persisted hold after restart, makes no reset, and stops. Restart the fixture server,
which reloads its synthetic state, then run held-check to show no auto-resume or additional
provider call. Do not query a state webhook while the serialized long-running case occupies the
slot: it queues behind that case. A separate cancel-backoff fixture is reserved for a supported
UI cancellation test if an authenticated owner editor session is available; do not extract
session tokens or claim that cancellation ran merely from restart evidence.

## Actual evidence and limits

`check-refinement-bridge.cjs` checks packaging's HTTP fixture independently: all 43 case
initializations, 503 response sequences, payload identity, pagination and an actual dropped
connection. This is simulator validation, not a workflow pass. Installed native VM parameter
checks also cover the bridge's rewritten URLs and fixture headers before manual import.
Actual core waits of 10/30 seconds and AbortSignal cancellation were checked separately with
`check-refinement-native-waits.cjs` against installed n8n packages;
that does not prove complete engine routing/cancellation or persisted guard behavior.

After server-executed tests, collect native node traces with `collect-refinement-traces.py`.
It uses supported encrypted entity export and decrypts only execution data with a disposable
export key. It never decrypts credentials, reads the instance key or accesses internal SQL.
Match case/execution IDs, source/connection hashes, reached nodes, statuses, real elapsed waits,
guard snapshots, effect counts and held skips. Distinguish HTTP response-loss fixtures from
actual GitHub transport failures. Synthetic cases do not count as additional real task/build runs.
Retain failed/unrun cases and manual interventions in `evidence/refinement-validation.md`.

After inspection, unpublish the bridge, confirm its endpoint returns 404, and stop only its
fixture process. Preserve the final known hold and private evidence until deliberate owner
recovery. Never erase old failures or change production. T014 remains unchecked until the
required imported-revision and native acceptance evidence has actually been collected.
