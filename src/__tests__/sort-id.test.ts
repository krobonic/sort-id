import { describe, expect, spyOn, test } from "bun:test";
import { ALPHANUMERIC_UPPERCASE, NUMERIC } from "../alphabets";
import { sortId } from "../sort-id";

describe("sortId", () => {
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
			const timestampPart = `test_${timestamp.toString(36)}`;
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
			const timestampPart = `${params?.prefix ?? ""}${timestamp.toString(params?.radix ?? 36)}`;
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

		// The random part uses numeric, timestamp is base36 so might have letters
		expect(result).toBeDefined();
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
		// Numeric timestamp in ms is 13 chars
		expect(result).toHaveLength(13 + 16);
		expect(result).toMatch(/^[0-9]+[a-z0-9]+$/);
	});
});
