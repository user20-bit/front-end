import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const services = [
  ['API', '../backend/server.js'],
  ['Frontend', '../frontend/preview.js', '--source'],
];
const children = [];
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill();
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

for (const [label, entry, ...args] of services) {
  const child = spawn(process.execPath, [fileURLToPath(new URL(entry, import.meta.url)), ...args], {stdio:'inherit'});
  children.push(child);
  child.once('error', error => {
    console.error(`${label}: ${error.message}`);
    stop(1);
  });
  child.once('exit', code => stop(code ?? 1));
}
