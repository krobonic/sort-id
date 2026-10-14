import { describe, expect, spyOn, test } from "bun:test";
import { ALPHANUMERIC_UPPERCASE, NUMERIC } from "../alphabets";
import { sortId } from "../sort-id";

describe("sortId", () => {
	test("pads default timestamps to exactly 10 base36 characters", () => {
		const now = spyOn(Date, "now");
		try {
			for (const [timestamp, encoded] of [
				[0, "0000000000"],
				[35, "000000000z"],
				[36, "0000000010"],
				[36 ** 8 - 1, "00zzzzzzzz"],
				[36 ** 8, "0100000000"],
				[36 ** 9 - 1, "0zzzzzzzzz"],
				[36 ** 9, "1000000000"],
				[36 ** 10 - 1, "zzzzzzzzzz"],
			] as const) {
				now.mockReturnValue(timestamp);
				expect(sortId({ randStrLength: 0 })).toBe(encoded);
			}
		} finally {
			now.mockRestore();
		}
	});

	test.each(
		Array.from({ length: 35 }, (_, index) => index + 2),
	)("uses a fixed width and preserves lexical ordering across every base%i boundary", (radix) => {
		const maximum = 36 ** 10 - 1;
		const timestamps = new Set([0, 1, maximum - 1, maximum]);
		let width = 1;
		for (
			let power = BigInt(radix);
			power <= BigInt(maximum);
			power *= BigInt(radix)
		) {
			timestamps.add(Number(power) - 1);
			timestamps.add(Number(power));
			width++;
		}
		const ordered = [...timestamps].sort((a, b) => a - b);
		const now = spyOn(Date, "now");
		try {
			const ids = ordered.map((timestamp) => {
				now.mockReturnValue(timestamp);
				const id = sortId({
					radix,
					prefix: "test_",
					alphabet: "a",
					randStrLength: 4,
				});
				expect(id).toHaveLength(5 + width + 4);
				expect(id).toEndWith("aaaa");
				expect(Number.parseInt(id.slice(5, 5 + width), radix)).toBe(timestamp);
				return id;
			});
			expect([...ids].reverse().sort()).toEqual(ids);
		} finally {
			now.mockRestore();
		}
	});

	test.each([
		-1,
		36 ** 10,
		Number.MAX_SAFE_INTEGER,
		0.5,
		NaN,
		Infinity,
		-Infinity,
	])("rejects unsupported timestamp %s", (timestamp) => {
		const now = spyOn(Date, "now").mockReturnValue(timestamp);
		try {
			for (const radix of [2, 10, 36]) {
				expect(() => sortId({ radix })).toThrow(RangeError);
			}
		} finally {
			now.mockRestore();
		}
	});

	test.each([
		0,
		1,
		37,
		-2,
		2.5,
		NaN,
		Infinity,
	])("rejects unsupported radix %s", (radix) => {
		expect(() => sortId({ radix })).toThrow(RangeError);
	});

	test("generates an ID with default parameters", () => {
		const result = sortId();
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("generates an ID without prefix (timestamp + random)", () => {
		const result = sortId();
		// Should be base36 timestamp + 16 random chars (default)
		expect(result).toMatch(/^[a-z0-9]+$/);
	});

	test("generates an ID with prefix", () => {
		const result = sortId({ prefix: "user_" });
		expect(result).toStartWith("user_");
		expect(result).toMatch(/^user_[a-z0-9]+$/);
	});

	test.each([
		0, 1, 5, 10, 20,
	])("preserves an explicit random string length of %i", (randStrLength) => {
		const timestamp = 1723456789012;
		const now = spyOn(Date, "now").mockReturnValue(timestamp);
		try {
			const result = sortId({ prefix: "test_", randStrLength });
			const timestampPart = `test_${timestamp.toString(36).padStart(10, "0")}`;
			expect(result).toStartWith(timestampPart);
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
		{ prefix: "user_" },
		{ alphabet: NUMERIC },
		{ radix: 10 },
	])("uses 16 random characters by default with %j", (params) => {
		const timestamp = 1723456789012;
		const now = spyOn(Date, "now").mockReturnValue(timestamp);
		try {
			const result = sortId(params);
			const timestampPart = `${params?.prefix ?? ""}${timestamp.toString(params?.radix ?? 36).padStart((36 ** 10 - 1).toString(params?.radix ?? 36).length, "0")}`;
			expect(result).toStartWith(timestampPart);
			expect(result.slice(timestampPart.length)).toMatch(
				params?.alphabet === NUMERIC ? /^[0-9]{16}$/ : /^[a-z0-9]{16}$/,
			);
		} finally {
			now.mockRestore();
		}
	});

	test("generates an ID with custom alphabet", () => {
		const result = sortId({
			alphabet: NUMERIC,
			randStrLength: 20,
		});

		expect(result.slice(10)).toMatch(/^[0-9]{20}$/);
	});

	test("generates unique IDs on successive calls", () => {
		const id1 = sortId();
		const id2 = sortId();
		const id3 = sortId();

		expect(id1).not.toBe(id2);
		expect(id2).not.toBe(id3);
		expect(id1).not.toBe(id3);
	});

	test("maintains consistent format with all parameters", () => {
		const params = {
			prefix: "u_",
			alphabet: ALPHANUMERIC_UPPERCASE,
			randStrLength: 6,
		};

		const result = sortId(params);
		expect(result).toStartWith("u_");

		const idPart = result.substring(2); // Remove 'u_'
		expect(idPart).toMatch(/^[a-z0-9A-Z]+$/); // base36 timestamp (lowercase) + uppercase random
	});

	test("generates multiple unique IDs in batch", () => {
		const ids = new Set<string>();
		const count = 1000;

		for (let i = 0; i < count; i++) {
			ids.add(sortId({ prefix: "test_", randStrLength: 6 }));
		}

		// All IDs should be unique
		expect(ids.size).toBe(count);
	});

	test("format matches expected pattern: prefix + timestamp(base36) + random", () => {
		const result = sortId({ prefix: "u_", randStrLength: 6 });

		// Should match: u_<base36><random6chars>
		expect(result).toMatch(/^u_[a-z0-9]+$/);

		const parts = result.split("_");
		expect(parts.length).toBe(2);
		expect(parts[0]).toBe("u");
		expect(parts[1]?.length).toBeGreaterThanOrEqual(6);
	});

	test("IDs from same millisecond differ due to random part", () => {
		// Generate many IDs quickly (likely in same millisecond)
		const ids = Array.from({ length: 100 }, () => sortId({ randStrLength: 6 }));
		const uniqueIds = new Set(ids);

		expect(uniqueIds.size).toBe(100);
	});

	test("generates an ID with custom radix for timestamp", () => {
		const result = sortId({ radix: 10 });
		// Should be numeric timestamp + 16 random chars
		// Decimal timestamps are padded to 16 characters
		expect(result).toHaveLength(16 + 16);
		expect(result).toMatch(/^[0-9]+[a-z0-9]+$/);
	});
});

describe("sortId input validation", () => {
	test.each([
		-1,
		1.5,
		NaN,
		Infinity,
		-Infinity,
		Number.MAX_SAFE_INTEGER,
		null,
		"16",
		true,
	])("rejects invalid random length %s", (randStrLength) => {
		expect(() => sortId({ randStrLength: randStrLength as number })).toThrow(
			RangeError,
		);
	});
	test.each([
		null,
		"36",
		true,
		-Infinity,
	])("rejects invalid radix %s", (radix) => {
		expect(() => sortId({ radix: radix as number })).toThrow(RangeError);
	});
	test.each([
		"",
		"aab",
		"😀",
		null,
		123,
	])("rejects invalid alphabet %j", (alphabet) => {
		expect(() =>
			sortId({ alphabet: alphabet as string, randStrLength: 0 }),
		).toThrow();
	});
});
