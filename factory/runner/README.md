# Basic B runner — through US3

This increment implements Setup, Foundation, US1, US2 and US3 (T001–T034). It is local-testable software,
not an installed or adopted service. See `specs/002-basic-b-agent/` for the full feature contract.
US2 publishes stopped questions, claims exact unchanged-scope owner answers and starts fresh
continuations with retained work/history. Stopped question publication releases the slot at
confirmed Waiting. US3 reconciles named units at API startup and authenticated status reads,
records active cancellation, publishes stopped failures and permits a distinct explicit owner
retry after safe Stuck release. Unknown process/effect state retains the slot. Live workers
retain their original deadline across API restart; interrupted workers are never redispatched.
Operational adoption remains pending US4 and cross-cutting acceptance.

From the repository root, Python 3.12+:

```bash
python3 -m venv factory/local/basic-b-venv
factory/local/basic-b-venv/bin/pip install --require-hashes -r factory/runner/requirements.lock
factory/local/basic-b-venv/bin/pip install --no-deps --no-build-isolation ./factory/runner
factory/local/basic-b-venv/bin/python -m unittest discover -s factory/runner/tests
node factory/tests/basic-b-execution.cjs
node factory/tests/basic-b-questions.cjs
node factory/tests/basic-b-workflows.cjs
node factory/scripts/build-reserve.cjs --check
node factory/scripts/build-collect.cjs --check
node factory/scripts/build-track.cjs --check
```

The dependency lock includes the tested build backend. It was resolved/tested on Python 3.15;
Ubuntu/Python 3.12 and actual Codex/systemd process-tree acceptance remain unrun here. Lock
regeneration uses pip-tools 7.7.0 with `--allow-unsafe --all-build-deps --strip-extras --generate-hashes`.
The name `--allow-unsafe` is pip-tools' switch to include setuptools in the hash lock.

Copy `config.example.toml` outside the checkout, set mode 0600 and replace every owner placeholder.
The API model configuration identifier selects exactly one private configured model; neither
HTTP clients nor prompts can override it. Point Git's owner-provisioned executable credential
helper at the separate runner credential, never a URL token. Keep state directories 0700 and
credentials 0600. No GitHub credential or runner bearer is passed to Codex. A same-account
agent is not adversarial isolation. The account, model auth, helper, user manager/linger, private
bridge/firewall and service installation require later owner provisioning/review.

`python -m factory_runner preflight --config /absolute/private/config.toml` is read-only except
initializing the dedicated ledger schema. It checks Ubuntu, private paths, explicit model,
auth availability, CLI options, user manager/linger, reviewed worker policy, designated target
and an empty/reconciled slot for standalone preflight; it never starts work or prints credentials. US2 adds authenticated question reads and answer
claims; claim acknowledgement precedes derived Approved. Answers and current issue/source are
independently rechecked before launch and push; a changed/deleted/competing consumed answer holds. `serve` runs reconciliation and deployment preflight, then exposes recovery reads even when
an occupied/held slot blocks new reservations. `worker --attempt UUID` can claim only a committed dispatching attempt once.
Systemd templates are provided for manual review; no install command is executed by this repo.
Workers retain named-unit evidence with `RemainAfterExit=yes`; stopped proof additionally requires
an empty complete cgroup. API reads finalize that proof only for the recorded boot/invocation.
Runtime includes preparation: RuntimeMaxSec 1795 seconds plus stop grace 5 seconds, group kill,
no worker restart. Actual elapsed enforcement under Ubuntu remains a later acceptance test.

The inactive refine/reserve/collect/track JSON must be treated as a matched increment. Map runner HTTP
nodes to a separate saved bearer credential and the private runner address. Map GitHub nodes to
the separate orchestrator credential. Configure the model identifier in the reservation source
and rebuild; do not insert literal credentials. Preserve the shared control table and production
concurrency=1. A runner slot is independent of that workflow guard and has no TTL/reset endpoint.
Do not operationally activate this partial feature before US4 and cross-cutting acceptance.

For read-only n8n VM checks, `node factory/tests/basic-b-workflows.cjs --native-fixtures` writes
synthetic contexts under ignored `factory/local/basic-b-native/`. The separately authorized
`python3 factory/tests/run-basic-b-us1-expressions.py` verifies the designated n8n 2.48.8 test
container and evaluates parameters there, without importing workflows, reading tables or making
HTTP calls. These checks are not full native workflow or real-task evidence.


US3 local recovery fixtures: `node factory/tests/basic-b-recovery.cjs`. Python discovery includes
fault, cancellation and backup checks. The actual 30-minute process-tree test is skipped unless
`FACTORY_ISOLATED_DEADLINE_TEST=yes` is explicitly set on the provisioned isolated Ubuntu account.
It launches only a uniquely named deadline-test unit with a sleep descendant. Do not use this
opt-in on an unknown account/manager. Its elapsed result remains required before adoption.

Private recovery CLI (with the same absolute `--config`): `pause`, `drain`, `inspect`,
`backup --bundle /absolute/new/bundle` and `restore --bundle /absolute/bundle --owner-record
"recorded owner decision"`. Pause blocks new reservations; drain reconciles once without waiting
or abandoning work. Finish collection/reconcile effects until the slot is empty before backup.
The CLI never clears workflow guards. Backup takes a SQLite snapshot plus the complete work root
and dedicated checkout, including worktree Git metadata, under a reservation lock. Keep bundles
private and outside those source directories. Restore checks every recorded file fingerprint,
original paths and exact retained task/attempt/effect/question/authorization history. Retain the
current directories privately first; restore refuses overwrites or a ledger that would forget
history. Lost/older ledger history requires explicit owner investigation outside this conservative
command. Configuration and credential files remain separately owner-managed; they are not placed
in bundles. Restore leaves the runner paused; explicit `resume` requires a fully drained/reconciled runner. No automatic recovery reset or replay is provided.
