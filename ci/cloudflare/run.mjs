import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(command, args, label, { test = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  process.stdout.write(output);

  if (result.error) throw new Error(`${label} could not start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} exited with status ${result.status}`);

  if (test) {
    const counts = Object.fromEntries(
      [...output.matchAll(/^# (tests|pass|fail|skipped) (\d+)\s*$/gm)].map((match) => [match[1], Number(match[2])]),
    );
    if (!Number.isInteger(counts.tests) || !Number.isInteger(counts.pass) || !Number.isInteger(counts.fail)) {
      throw new Error(`${label} did not emit a complete TAP test-count summary`);
    }
    if (counts.tests < 1 || counts.fail !== 0) {
      throw new Error(`${label} requires at least one test and zero failures`);
    }
    console.log(`CI_TEST_COUNTS name=${label} tests=${counts.tests} passed=${counts.pass} failed=${counts.fail} skipped=${counts.skipped ?? 0}`);
  }
}

run('pnpm', ['build'], 'pnpm build');
run('pnpm', ['test:pnl', '--', '--test-reporter=tap'], 'tests/trader-position-pnl.test.mjs', { test: true });
