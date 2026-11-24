// Bounded T004 comparison, not a production provider integration.
// Prepare offline, then explicitly run once. No retries, tools or workflow changes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {validate} = require('./measure_refinement_request.cjs');
const root = path.resolve(__dirname, '../..');
const model = 'gemini-3.5-flash-lite';
const args = process.argv.slice(3);
const outputIndex = args.indexOf('--output-dir');
const caseIndex = args.indexOf('--case');
const selectedCase = caseIndex >= 0 ? args[caseIndex + 1] : null;
const destination = path.resolve(root, outputIndex >= 0 && args[outputIndex + 1]
  ? args[outputIndex + 1] : 'factory/local/evaluation-gemini-35-flash-lite');
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const read = name => JSON.parse(fs.readFileSync(path.join(destination, name), 'utf8'));
const write = (name, data) => fs.writeFileSync(path.join(destination, name), JSON.stringify(data, null, 2) + '\n', {flag: 'wx', mode: 0o600});

function prepare() {
  execFileSync('python3', [path.join(__dirname, 'prepare_refinement_evaluation.py'), '--model', model, '--output-dir', destination], {stdio: 'inherit'});
  const manifest = read('manifest.json');
  manifest.provider = 'Gemini generateContent REST';
  manifest.endpoint = endpoint;
  manifest.status = 'prepared-only; no API requests sent';
  manifest.request_limit = 5;
  manifest.deadline_seconds = 120;
  manifest.minimum_interval_seconds = 5;
  manifest.retries = 0;
  manifest.context_note = 'Same conservative input screen; hosted API has no Ollama num_ctx setting.';
  for (const entry of manifest.cases) {
    const source = read(`${entry.id}.request.json`);
    const request = {
      systemInstruction: {parts: [{text: source.messages[0].content}]},
      contents: [{role: 'user', parts: [{text: source.messages[1].content}]}],
      generationConfig: {
        temperature: 0, candidateCount: 1, maxOutputTokens: 768,
        responseMimeType: 'application/json', responseJsonSchema: source.format,
        thinkingConfig: {thinkingLevel: 'MINIMAL', includeThoughts: false},
      },
    };
    const serialized = JSON.stringify(request, null, 2) + '\n';
    fs.writeFileSync(path.join(destination, `${entry.id}.request.json`), serialized, {mode: 0o600});
    entry.request_sha256 = hash(serialized);
  }
  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {mode: 0o600});
  console.log('Prepared Gemini requests offline; key not read.');
}

function evaluate(body, schema) {
  const candidates = body.candidates || [];
  const candidate = candidates[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
  let parsed = null;
  let error = null;
  try { parsed = JSON.parse(text); error = validate(parsed, schema); }
  catch { error = 'Final content is not JSON'; }
  if (!error && (candidates.length !== 1 || candidate.finishReason !== 'STOP'
      || parts.some(p => Object.keys(p).some(k => !['text', 'thought', 'thoughtSignature'].includes(k))))) {
    error = 'Incomplete completion or unexpected non-text output';
  }
  const usage = body.usageMetadata || {};
  if (!error && (!Number.isInteger(usage.promptTokenCount) || !Number.isInteger(usage.candidatesTokenCount)
      || usage.promptTokenCount + 768 + 256 > 4096)) error = 'Missing token counts or insufficient comparison headroom';
  return {
    model_version: body.modelVersion || null, finish_reason: candidate?.finishReason || null,
    usage, schema_and_completion_valid: !error, validation_error: error,
    semantic_review: 'pending project-owner review against fixture checks', final_content: parsed ?? text,
  };
}

function providerError(body, status, key) {
  return {
    schema_and_completion_valid: false,
    validation_error: `Gemini HTTP ${status}`,
    provider_status: body?.error?.status || null,
    provider_message: String(body?.error?.message || '').split(key).join('[REDACTED]')
      .replace(/AIza[A-Za-z0-9_-]+/g, '[REDACTED]').slice(0, 2000),
  };
}

async function run() {
  const manifest = read('manifest.json');
  const cases = JSON.parse(fs.readFileSync(path.join(root, 'factory/tests/fixtures/refinement-cases.json'), 'utf8')).cases;
  if (manifest.model !== model || manifest.cases.length !== 5
      || JSON.stringify(manifest.cases.map(c => c.id)) !== JSON.stringify(cases.map(c => c.id))) throw Error('Unexpected evaluation manifest');
  for (const [name, expected] of Object.entries(manifest.artifact_sha256)) {
    if (hash(fs.readFileSync(path.join(root, name))) !== expected) throw Error('Artifacts changed after preparation');
  }
  if (selectedCase && !manifest.cases.some(entry => entry.id === selectedCase)) throw Error('Unknown selected case');
  const requests = manifest.cases.filter(entry => !selectedCase || entry.id === selectedCase).map(entry => {
    const data = fs.readFileSync(path.join(destination, `${entry.id}.request.json`));
    if (hash(data) !== entry.request_sha256) throw Error('Prepared request changed');
    return {id: entry.id, data: data.toString(), schema: JSON.parse(data).generationConfig.responseJsonSchema};
  });
  const keyPath = path.join(root, 'factory/local/gemini-api-key');
  if (fs.statSync(keyPath).mode & 0o077) throw Error('Key file must have private permissions');
  const key = fs.readFileSync(keyPath, 'utf8').trim();
  if (!key || /\s/.test(key)) throw Error('Invalid key file format');
  // Exclusive marker prevents restarting an interrupted batch and consuming quota twice.
  write('run-started.json', {started_at: new Date().toISOString(), model,
    maximum_requests: requests.length, selected_case_ids: requests.map(r => r.id), retries: 0});
  let count = 0;
  for (const request of requests) {
    if (count) await new Promise(resolve => setTimeout(resolve, 5000));
    const started = performance.now();
    let result;
    try {
      count++;
      const response = await fetch(endpoint, {
        method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
        body: request.data, redirect: 'error', signal: AbortSignal.timeout(120000),
      });
      // Keep only redacted diagnostic fields, never full error bodies or headers.
      result = response.ok ? evaluate(await response.json(), request.schema)
        : providerError(await response.json(), response.status, key);
    } catch {
      result = {schema_and_completion_valid: false, validation_error: 'Network, timeout or response parsing failure; no retry performed'};
    }
    result.wall_seconds = (performance.now() - started) / 1000;
    result.completed_at = new Date().toISOString();
    write(`${request.id}.result.json`, result);
    console.log(`${request.id}: ${result.schema_and_completion_valid ? 'schema/completion PASS' : result.validation_error}; ${result.wall_seconds.toFixed(3)}s`);
    if (!result.schema_and_completion_valid) {
      write('run-finished.json', {requests_attempted: count, status: 'stopped after technical failure; no retry'});
      process.exitCode = 1;
      return;
    }
  }
  write('run-finished.json', {requests_attempted: count, status: 'technical checks complete; semantic/owner and server checks pending'});
}

module.exports = {evaluate, providerError};
if (require.main === module) {
  const mode = process.argv[2];
  Promise.resolve().then(() => {
    const local = path.join(root, 'factory/local') + path.sep;
    if (!destination.startsWith(local)) throw Error('Output must be inside factory/local/');
    const seen = new Set();
    let validArgs = args.length % 2 === 0;
    for (let i = 0; i < args.length; i += 2) {
      if (!['--output-dir', '--case'].includes(args[i]) || !args[i + 1]
          || args[i + 1].startsWith('--') || seen.has(args[i])) validArgs = false;
      seen.add(args[i]);
    }
    if (mode === '--prepare' && validArgs && !selectedCase) return prepare();
    if (mode === '--run' && validArgs) return run();
    throw Error('Usage: node factory/scripts/evaluate_gemini.cjs --prepare|--run [--output-dir factory/local/FRESH-DIRECTORY] [--case CASE-ID (run only)]');
  }).catch(() => { console.error('Evaluation stopped before completion; inspect local artifacts. No automatic retry.'); process.exitCode = 1; });
}
