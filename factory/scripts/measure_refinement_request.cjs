// T004 helper: run inside the n8n container with ONE reviewed request on stdin.
// No retries, tools, GitHub writes, workflow imports or semantic-quality claims.
const fs = require('node:fs');

function validate(value, schema, path = 'output') {
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return `${path}: expected object`;
    if (schema.required.some(key => !(key in value))) return `${path}: missing required field`;
    if (Object.keys(value).some(key => !(key in schema.properties))) return `${path}: unexpected field`;
    for (const [key, child] of Object.entries(schema.properties)) {
      const error = validate(value[key], child, `${path}.${key}`);
      if (error) return error;
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length < (schema.minItems || 0)) return `${path}: invalid array`;
    for (const entry of value) {
      const error = validate(entry, schema.items, path);
      if (error) return error;
    }
  } else if (schema.type === 'string') {
    if (typeof value !== 'string' || value.trim().length < (schema.minLength || 0)) return `${path}: empty/invalid string`;
  } else {
    return `${path}: unsupported bundled-schema type`;
  }
  return null;
}

async function main() {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (request.stream !== false || request.tools || request.options?.num_ctx !== 4096
      || request.options?.num_predict !== 768 || !request.format?.properties) {
    throw new Error('Expected a reviewed non-streaming, tool-free evaluation request with fixed limits');
  }
  const start = performance.now();
  const response = await fetch('http://ollama:11434/api/chat', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(request), signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const body = await response.json();
  let parsed = null;
  let error;
  try {
    parsed = JSON.parse(body.message?.content);
    error = validate(parsed, request.format);
  } catch {
    error = 'Final content is not JSON';
  }
  if (!error && (body.done !== true || body.done_reason !== 'stop' || body.message?.tool_calls?.length)) {
    error = 'Incomplete/truncated completion or unexpected tool calls';
  }
  if (!error && (!Number.isInteger(body.prompt_eval_count) || !Number.isInteger(body.eval_count)
      || body.prompt_eval_count + 768 + 256 > 4096)) {
    error = 'Missing token counts or insufficient context headroom';
  }
  console.log(JSON.stringify({
    wall_seconds: (performance.now() - start) / 1000,
    model: body.model, done: body.done, done_reason: body.done_reason,
    prompt_eval_count: body.prompt_eval_count, eval_count: body.eval_count,
    load_duration_ns: body.load_duration, total_duration_ns: body.total_duration,
    schema_and_completion_valid: !error, validation_error: error || null,
    semantic_review: 'pending project-owner review against fixture checks',
    final_content: parsed ?? body.message?.content,
  }, null, 2));
  if (error) process.exitCode = 1;
}

main().catch(error => {
  console.error(`Evaluation request failed: ${error.message}; do not retry automatically.`);
  process.exitCode = 1;
});
