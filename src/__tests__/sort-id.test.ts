import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { constants } from 'node:buffer';
import * as crypto from 'node:crypto';
import { ALPHANUMERIC_UPPERCASE, NUMERIC } from '../alphabets';
import { sortId } from '../sort-id';

// Control both sources of variability; each test starts at the same instant.
const FROZEN_TIMESTAMP = 1723456789012;
let clock: ReturnType<typeof spyOn<typeof Date, 'now'>>;
let random: ReturnType<
	typeof spyOn<{ randomBytes(size: number): Buffer }, 'randomBytes'>
>;

beforeEach(() => {
	clock = spyOn(Date, 'now').mockReturnValue(FROZEN_TIMESTAMP);
	random = spyOn(
		crypto as { randomBytes(size: number): Buffer },
		'randomBytes',
	).mockImplementation((size) =>
		Buffer.from(Array.from({ length: size }, (_, i) => i % 256)),
	);
});

afterEach(() => {
	clock.mockRestore();
	random.mockRestore();
});

describe('sortId', () => {
	test('pads timestamps to exactly 7 base62 characters', () => {
		const now = spyOn(Date, 'now');
		try {
			for (const [timestamp, encoded] of [
				[0, '0000000'],
				[9, '0000009'],
				[10, '000000A'],
				[35, '000000Z'],
				[36, '000000a'],
				[61, '000000z'],
				[62, '0000010'],
				[56800235583, '0zzzzzz'],
				[56800235584, '1000000'],
				[3521614606207, 'zzzzzzz'],
			] as const) {
				now.mockReturnValue(timestamp);
				expect(sortId({ randStrLength: 0 })).toBe(encoded);
			}
		} finally {
			now.mockRestore();
		}
	});

	test('preserves lexical ordering across every base62 digit-width boundary', () => {
		const maximum = 62 ** 7 - 1;
		const timestamps = new Set([
			0,
			1,
			9,
			10,
			35,
			36,
			61,
			62,
			maximum - 1,
			maximum,
		]);
		for (let exponent = 1; exponent < 7; exponent++) {
			const boundary = 62 ** exponent;
			timestamps.add(boundary - 1);
			timestamps.add(boundary);
		}
		const ordered = [...timestamps].sort((a, b) => a - b);
		const now = spyOn(Date, 'now');
		try {
			const ids = ordered.map((timestamp) => {
				now.mockReturnValue(timestamp);
				const id = sortId({ prefix: 'test_', alphabet: 'a', randStrLength: 4 });
				expect(id).toHaveLength(16);
				expect(id).toEndWith('aaaa');
				expect(
					[...id.slice(5, 12)].reduce(
						(value, digit) =>
							value * 62 +
							'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.indexOf(
								digit,
							),
						0,
					),
				).toBe(timestamp);
				return id;
			});
			expect([...ids].reverse().sort()).toEqual(ids);
		} finally {
			now.mockRestore();
		}
	});

	test.each([
		-1,
		62 ** 7,
		Number.MAX_SAFE_INTEGER,
		0.5,
		NaN,
		Infinity,
		-Infinity,
	])('rejects unsupported timestamp %s', (timestamp) => {
		const now = spyOn(Date, 'now').mockReturnValue(timestamp);
		try {
			expect(() => sortId()).toThrow(RangeError);
		} finally {
			now.mockRestore();
		}
	});

	test('generates an ID with default parameters', () => {
		const result = sortId();
		expect(result).toBeDefined();
		expect(typeof result).toBe('string');
		expect(result).toHaveLength(19);
	});

	test('generates an ID without prefix (timestamp + random)', () => {
		const result = sortId();
		// Should be base62 timestamp + 12 random chars (default)
		expect(result).toMatch(/^[A-Za-z0-9]+$/);
	});

	test('generates an ID with prefix', () => {
		const result = sortId({ prefix: 'user_' });
		expect(result).toHaveLength(24);
		expect(result).toStartWith('user_');
		expect(result).toMatch(/^user_[A-Za-z0-9]+$/);
	});

	test.each([
		0, 1, 5, 10, 16, 20,
	])('preserves an explicit random string length of %i', (randStrLength) => {
		const timestamp = 1723456789012;
		const now = spyOn(Date, 'now').mockReturnValue(timestamp);
		try {
			const result = sortId({ prefix: 'test_', randStrLength });
			const timestampPart = 'test_ULEH33M';
			expect(result).toStartWith(timestampPart);
			expect(result).toHaveLength(timestampPart.length + randStrLength);
			expect(result.slice(timestampPart.length)).toMatch(
				new RegExp(`^[a-z0-9]{${randStrLength}}$`),
			);
		} finally {
			now.mockRestore();
		}
	});

	test.each([
		undefined,
		{},
		{ randStrLength: undefined },
		{ prefix: 'user_' },
		{ alphabet: NUMERIC },
	])('uses 12 random characters by default with %j', (params) => {
		const timestamp = 1723456789012;
		const now = spyOn(Date, 'now').mockReturnValue(timestamp);
		try {
			const result = sortId(params);
			const timestampPart = `${params?.prefix ?? ''}ULEH33M`;
			expect(result).toStartWith(timestampPart);
			expect(result.slice(timestampPart.length)).toMatch(
				params?.alphabet === NUMERIC ? /^[0-9]{12}$/ : /^[a-z0-9]{12}$/,
			);
		} finally {
			now.mockRestore();
		}
	});

	test('generates an ID with custom alphabet', () => {
		const result = sortId({
			alphabet: NUMERIC,
			randStrLength: 20,
		});

		expect(result.slice(7)).toMatch(/^[0-9]{20}$/);
	});

	test('maintains consistent format with all parameters', () => {
		const params = {
			prefix: 'u_',
			alphabet: ALPHANUMERIC_UPPERCASE,
			randStrLength: 6,
		};

		const result = sortId(params);
		expect(result).toStartWith('u_');

		const idPart = result.substring(2); // Remove 'u_'
		expect(idPart.slice(0, 7)).toBe('ULEH33M');
		expect(idPart.slice(7)).toBe('ABCDEF');
		expect(result).toHaveLength(15);
	});

	test('format matches expected pattern: prefix + timestamp(base62) + random', () => {
		const result = sortId({ prefix: 'u_', randStrLength: 6 });

		// Should match: u_<base62><random6chars>
		expect(result).toMatch(/^u_[A-Za-z0-9]+$/);

		const parts = result.split('_');
		expect(parts.length).toBe(2);
		expect(parts[0]).toBe('u');
		expect(parts[1]).toHaveLength(13);
	});
});

describe('sortId input validation', () => {
	test.each([
		-1,
		1.5,
		NaN,
		Infinity,
		-Infinity,
		Number.MAX_SAFE_INTEGER,
		constants.MAX_STRING_LENGTH + 1,
		null,
		'16',
		true,
	])('rejects invalid random length %s', (randStrLength) => {
		expect(() => sortId({ randStrLength: randStrLength as number })).toThrow(
			RangeError,
		);
	});
	test.each([
		'',
		'aab',
		'😀',
		'\uD800',
		'\uDFFF',
		Array.from({ length: 257 }, (_, i) => String.fromCharCode(i)).join(''),
	])('rejects invalid alphabet %j', (alphabet) => {
		for (const randStrLength of [0, 12]) {
			expect(() => sortId({ alphabet, randStrLength })).toThrow(RangeError);
		}
	});

	test.each(
		[null, 123, true, ['a', 'b'], {}].map((alphabet) => ({ alphabet })),
	)('rejects non-string alphabet %j', ({ alphabet }) => {
		for (const randStrLength of [0, 12]) {
			expect(() =>
				sortId({ alphabet: alphabet as string, randStrLength }),
			).toThrow(TypeError);
		}
	});
});

describe('sortId ordering guarantees', () => {
	test('orders IDs in the same millisecond by their suffix', () => {
		random
			.mockReturnValueOnce(Buffer.from([25]))
			.mockReturnValueOnce(Buffer.from([0]));
		const first = sortId({ prefix: 'user_', randStrLength: 1 });
		const second = sortId({ prefix: 'user_', randStrLength: 1 });
		expect(first.slice(0, -1)).toBe(second.slice(0, -1));
		expect(first.slice(-1)).toBe('z');
		expect(second.slice(-1)).toBe('a');
		expect([first, second].sort()).toEqual([second, first]);
	});

	test('sorts across every timestamp width boundary regardless of suffix', () => {
		for (let exponent = 1; exponent < 7; exponent++) {
			clock.mockReturnValue(62 ** exponent - 1);
			const before = sortId({ prefix: 'user_', alphabet: 'z' });
			clock.mockReturnValue(62 ** exponent);
			const after = sortId({ prefix: 'user_', alphabet: 'a' });
			expect([after, before].sort()).toEqual([before, after]);
		}
	});

	test.each([
		0, 12,
	])('can repeat within one millisecond with a single-character alphabet and length %i', (randStrLength) => {
		const params = { alphabet: 'x', randStrLength };
		expect(sortId(params)).toBe(sortId(params));
	});
});
