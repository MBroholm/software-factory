# Basic A acceptance — partial evidence

## T033 isolated boundary verification — 2026-11-26

T033 passed for credential-free US3 fixtures. Fresh Docker/API checks confirm test n8n 2.48.8,
separate `factory_guard_test_data` volume on loopback 5679 versus operational 5678/separate
volume, all 21 known test workflows inactive, zero running/waiting executions and the typed
singleton story row idle at execution 1442. No row was reset. The configured table is
`IgWCIu94ieyHQRHS`; all pagination cursors were exhausted. Private readback is retained in
`factory/local/us3/boundary-inspection.json`.

The new US3 fixture copy has no GitHub/Gemini credentials and fixed container-loopback HTTP
18767 only; old credential-bearing workflows remain inactive. The test API key is used only
by the adapter against verified localhost:5679, never in workflow JSON. Synthetic resources
cannot proxy to GitHub or process ordinary factory issues. See [operations](../docs/operations.md)
for mappings, operator reset limits and separate owner manual operational adoption. This
boundary check is not a T023 native acceptance result; native outcomes follow in
[review validation](review-validation.md). Operational workflows remain untouched.

This is the T033 record, not completion of T029 or the final acceptance matrix. Existing
US1/US2 evidence is retained in their story validation records.


## US3 story evidence — T023 complete

Source commit `db20bc67ff459e69abe3a02ab57581f667fc23b2`; unchanged track source hash is
recorded in [review validation](review-validation.md). New isolated workflow
`3SmlqLqhRDB5S5e9` passed 19 webhook main-engine cases (18 scenarios plus one repeat), six
held skips and scheduled mode=trigger QA/unchanged ticks 1538/1542. Test-only source/mapping
hashes, per-execution revisions, rows, effects, six deliberate inspected fixture resets and
observer corrections are in [native results](review-native-results.json). All 22 isolated
workflows are inactive/drained; final row idle at 1542, private route 404, fixture service
stopped. No operational adoption, real GitHub/model call or extra genuine task run occurred.
This reuses unaffected US1/US2 results; it does not complete T026 or the T029 final matrix.
