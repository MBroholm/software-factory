// Execute the generated graph against temporary real SQLite/API and fake external effects.
process.argv.push('--recovery');
require('./basic-b-workflows.cjs');
