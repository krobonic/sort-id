import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../cli.ts', import.meta.url));
const run = (...args: string[]) =>
	spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('prints one default ID', () => {
	const result = run();
	expect(result.status).toBe(0);
	expect(result.stderr).toBe('');
	expect(result.stdout).toMatch(/^[0-9A-Za-z]{7}[a-z0-9]{12}\n$/);
});

test('supports long and short custom options', () => {
	for (const args of [
		['--prefix', 'user_', '--length', '4', '--alphabet', 'x'],
		['-p', 'user_', '-l', '4', '-a', 'x'],
		['--prefix=user_', '--length=4', '--alphabet=x'],
	]) {
		const result = run(...args);
		expect(result.status).toBe(0);
		expect(result.stdout).toMatch(/^user_[0-9A-Za-z]{7}xxxx\n$/);
	}
	expect(run('--length', '0').stdout).toMatch(/^[0-9A-Za-z]{7}\n$/);
});

test('overrides the timestamp with a date string or Unix milliseconds', () => {
	for (const args of [
		['--time', '1970-01-01T00:00:00.062Z'],
		['-t', '62'],
		['--time=62'],
	]) {
		const result = run(...args, '--prefix', 'user_', '--length', '0');
		expect(result.status).toBe(0);
		expect(result.stderr).toBe('');
		expect(result.stdout).toBe('user_0000010\n');
	}
	expect(run('--time', '0', '--length', '0').stdout).toBe('0000000\n');
	expect(run('--time', '3521614606207', '--length', '0').stdout).toBe(
		'zzzzzzz\n',
	);
});

test('shows help', () => {
	for (const flag of ['--help', '-h']) {
		const result = run(flag);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Usage: sort-id');
		expect(result.stderr).toBe('');
	}
});

test('rejects invalid arguments without writing an ID', () => {
	for (const args of [
		['--time'],
		['--time', ''],
		['--time', 'invalid'],
		['--time=-1'],
		['--time', '1969-12-31T23:59:59.999Z'],
		['--time', '3521614606208'],
		['--unknown'],
		['unexpected'],
		['--prefix'],
		['--length', ''],
		['--length', '-1'],
		['--length', '1.5'],
		['--length', 'Infinity'],
		['--length', '9007199254740992'],
		['--alphabet', ''],
		['--alphabet', 'aa'],
		['--alphabet', '😀'],
	]) {
		const result = run(...args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toStartWith('sort-id: ');
	}
});
