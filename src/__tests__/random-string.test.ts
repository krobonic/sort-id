import { describe, expect, spyOn, test } from "bun:test";
import { constants } from "node:buffer";
import * as crypto from "node:crypto";
import { ALPHANUMERIC, ALPHANUMERIC_UPPERCASE, NUMERIC } from "../alphabets";
import { randomString } from "../random-string";

describe("randomString", () => {
	test("generates a string of specified length", () => {
		const result = randomString({ length: 10 });
		expect(result).toHaveLength(10);
	});

	test("generates a string using default alphabet (alphanumeric lowercase)", () => {
		const result = randomString({ length: 100 });
		expect(result).toMatch(/^[a-z0-9]+$/);
	});

	test("generates a string using custom alphabet", () => {
		const result = randomString({
			length: 50,
			alphabet: ALPHANUMERIC_UPPERCASE,
		});
		expect(result).toMatch(/^[A-Z0-9]+$/);
	});

	test("generates a string using numeric alphabet only", () => {
		const result = randomString({ length: 20, alphabet: NUMERIC });
		expect(result).toMatch(/^[0-9]+$/);
	});

	test("generates a string using full alphanumeric alphabet", () => {
		const result = randomString({ length: 100, alphabet: ALPHANUMERIC });
		expect(result).toMatch(/^[A-Za-z0-9]+$/);
	});

	test("generates empty string when length is 0", () => {
		const result = randomString({ length: 0 });
		expect(result).toBe("");
	});

	test("generates different strings on successive calls", () => {
		const result1 = randomString({ length: 20 });
		const result2 = randomString({ length: 20 });
		expect(result1).not.toBe(result2);
	});

	test("uses only characters from the provided alphabet", () => {
		const customAlphabet = "ABC";
		const result = randomString({ length: 100, alphabet: customAlphabet });

		for (const char of result) {
			expect(customAlphabet).toContain(char);
		}
	});

	test("generates a single character string", () => {
		const result = randomString({ length: 1 });
		expect(result).toHaveLength(1);
	});
});

// Exercise runtime validation for JavaScript callers as well as TypeScript callers.
describe("randomString input validation and sampling", () => {
	test.each([
		-1,
		0.5,
		NaN,
		Infinity,
		-Infinity,
		Number.MAX_SAFE_INTEGER + 1,
		constants.MAX_STRING_LENGTH + 1,
		"5",
		null,
		undefined,
		true,
	])("rejects invalid length %s", (length) => {
		expect(() => randomString({ length: length as number })).toThrow(
			RangeError,
		);
	});

	test.each([
		"",
		"aba",
		"😀",
		"\uD800",
		"\uDFFF",
		Array.from({ length: 257 }, (_, i) => String.fromCharCode(i)).join(""),
	])("rejects invalid alphabet %j even with zero length", (alphabet) => {
		for (const length of [0, 10]) {
			expect(() => randomString({ length, alphabet })).toThrow(RangeError);
		}
	});

	test.each(
		[null, 123, true, ["a", "b"], {}].map((alphabet) => ({ alphabet })),
	)("rejects non-string alphabet %j", ({ alphabet }) => {
		expect(() =>
			randomString({ length: 0, alphabet: alphabet as string }),
		).toThrow(TypeError);
	});

	test.each([
		"a",
		"!@£$",
		"abc",
		Array.from({ length: 256 }, (_, i) => String.fromCharCode(i)).join(""),
	])("preserves length and alphabet membership for %j", (alphabet) => {
		const result = randomString({ length: 1024, alphabet });
		expect(result).toHaveLength(1024);
		for (const character of result) expect(alphabet).toContain(character);
	});

	test("rejects the incomplete byte range and refills until the requested length", () => {
		const random = spyOn(
			crypto as { randomBytes(size: number): Buffer },
			"randomBytes",
		);
		try {
			random.mockReturnValueOnce(Buffer.from([255, 255, 255]));
			random.mockReturnValueOnce(Buffer.from([0, 1, 254]));
			expect(randomString({ length: 3, alphabet: "abc" })).toBe("abc");
			expect(random).toHaveBeenCalledTimes(2);
		} finally {
			random.mockRestore();
		}
	});

	test("accepts all bytes for a 256-character alphabet", () => {
		const alphabet = Array.from({ length: 256 }, (_, i) =>
			String.fromCharCode(i),
		).join("");
		const random = spyOn(
			crypto as { randomBytes(size: number): Buffer },
			"randomBytes",
		);
		try {
			random.mockReturnValueOnce(
				Buffer.from(Array.from({ length: 256 }, (_, i) => i)),
			);
			expect(randomString({ length: 256, alphabet })).toBe(alphabet);
			expect(random).toHaveBeenCalledTimes(1);
		} finally {
			random.mockRestore();
		}
	});

	test("propagates cryptographic randomness failures", () => {
		const error = new Error("random source unavailable");
		const random = spyOn(
			crypto as { randomBytes(size: number): Buffer },
			"randomBytes",
		).mockImplementation(() => {
			throw error;
		});
		try {
			expect(() => randomString({ length: 1 })).toThrow(error);
			expect(randomString({ length: 0 })).toBe("");
			expect(random).toHaveBeenCalledTimes(1);
		} finally {
			random.mockRestore();
		}
	});
});
