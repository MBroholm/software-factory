# Initialize the control table

Create `factory_control` manually in n8n's Data Tables UI so each column has the required
type. Test and operational instances each use their own table.

With schedules paused, check whether the table already exists. Inspect and reuse an existing
table rather than adding another row or replacing diagnostic context. Never clear an existing
failure hold as part of setup. Duplicate rows block the workflows.

For a new table, add these five user columns and exactly one initial row:

| Column | Required type | Initial value |
|---|---|---|
| `key` | String | `global` |
| `busy` | Boolean | `false` |
| `execution_id` | String | Empty string |
| `issue_number` | Number | `null` |
| `started_at` | String | Empty string |

The owner tried CSV import and found no option to specify column types. CSV setup was
removed because the workflow requires a Boolean and a nullable Number, as well as String
fields. Do not use Number for `started_at`: the workflow stores ISO-8601 text there.
Leave built-in IDs/timestamps to n8n.

After saving, confirm exactly one row exists and use a read-only Data Table node to inspect
its JSON output. The five user fields must be:

```json
{
  "key": "global",
  "busy": false,
  "execution_id": "",
  "issue_number": null,
  "started_at": ""
}
```

If blank String cells become null, explicitly save empty strings in those two cells and
recheck. Keep workflows inactive until the read output has the required types and values.
See [operations](../../docs/operations.md) for the full provisioning and recovery instructions.

Copy the resulting table ID to `FACTORY_CONTROL_TABLE_ID` in `factory/local/test.env` or
`factory/local/operational.env`, then regenerate the matching local workflow JSON using
[the mapping guide](../../docs/workflow-mapping.md). Table creation does not activate workflows.
