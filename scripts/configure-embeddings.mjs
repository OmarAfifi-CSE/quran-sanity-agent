import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const studio = fileURLToPath(new URL('../studio/', import.meta.url));
const cli = fileURLToPath(new URL('../studio/node_modules/@sanity/cli/bin/run.js', import.meta.url));
const args = ['datasets', 'embeddings', process.argv.includes('--enable') ? 'enable' : 'status', 'production'];
if (process.argv.includes('--enable')) args.push('--projection', await readFile(new URL('../studio/context/embeddings-projection.groq', import.meta.url), 'utf8'));
const result = spawnSync(process.execPath, [cli, ...args], {cwd:studio,stdio:'inherit'});
process.exitCode = result.status ?? 1;
