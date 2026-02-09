import { describe, expect, test } from 'bun:test';
import { randomString } from '../random-string';
import { ALPHANUMERIC, ALPHANUMERIC_UPPERCASE, NUMERIC } from '../alphabets';

describe('randomString', () => {
  test('generates a string of specified length', () => {
    const result = randomString({ length: 10 });
    expect(result).toHaveLength(10);
  });

  test('generates a string using default alphabet (alphanumeric lowercase)', () => {
    const result = randomString({ length: 100 });
    expect(result).toMatch(/^[a-z0-9]+$/);
  });

  test('generates a string using custom alphabet', () => {
    const result = randomString({ length: 50, alphabet: ALPHANUMERIC_UPPERCASE });
    expect(result).toMatch(/^[A-Z0-9]+$/);
  });

  test('generates a string using numeric alphabet only', () => {
    const result = randomString({ length: 20, alphabet: NUMERIC });
    expect(result).toMatch(/^[0-9]+$/);
  });

  test('generates a string using full alphanumeric alphabet', () => {
    const result = randomString({ length: 100, alphabet: ALPHANUMERIC });
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });

  test('generates empty string when length is 0', () => {
    const result = randomString({ length: 0 });
    expect(result).toBe('');
  });

  test('generates different strings on successive calls', () => {
    const result1 = randomString({ length: 20 });
    const result2 = randomString({ length: 20 });
    expect(result1).not.toBe(result2);
  });

  test('uses only characters from the provided alphabet', () => {
    const customAlphabet = 'ABC';
    const result = randomString({ length: 100, alphabet: customAlphabet });

    for (const char of result) {
      expect(customAlphabet).toContain(char);
    }
  });

  test('generates a single character string', () => {
    const result = randomString({ length: 1 });
    expect(result).toHaveLength(1);
  });
});
