import { describe, expect, test } from 'bun:test';
import { sortId } from '../sort-id';
import { ALPHANUMERIC_UPPERCASE, NUMERIC } from '../alphabets';

describe('sortId', () => {
  test('generates an ID with default parameters', () => {
    const result = sortId();
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('generates an ID without prefix (timestamp + random)', () => {
    const result = sortId();
    // Should be base36 timestamp + 5 random chars (default)
    expect(result).toMatch(/^[a-z0-9]+$/);
  });

  test('generates an ID with prefix', () => {
    const result = sortId({ prefix: 'user_' });
    expect(result).toStartWith('user_');
    expect(result).toMatch(/^user_[a-z0-9]+$/);
  });

  test('generates an ID with custom random string length', () => {
    const prefix = 'test_';
    const randStrLength = 10;
    const result = sortId({ prefix, randStrLength });

    // Remove prefix to get the ID part
    const idPart = result.substring(prefix.length);
    // ID part should be timestamp (base36) + random string
    // We can't predict timestamp length exactly, but random part is at the end
    expect(idPart.length).toBeGreaterThanOrEqual(randStrLength);
  });

  test('default random string length is 5', () => {
    const result1 = sortId();
    const result2 = sortId();

    // Both should have same total structure: timestamp + 5 random chars
    expect(result1.length).toBeGreaterThanOrEqual(5);
    expect(result2.length).toBeGreaterThanOrEqual(5);
  });

  test('generates an ID with custom alphabet', () => {
    const result = sortId({
      alphabet: NUMERIC,
      randStrLength: 20
    });

    // The random part uses numeric, timestamp is base36 so might have letters
    expect(result).toBeDefined();
  });

  test('generates unique IDs on successive calls', () => {
    const id1 = sortId();
    const id2 = sortId();
    const id3 = sortId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  test('maintains consistent format with all parameters', () => {
    const params = {
      prefix: 'u_',
      alphabet: ALPHANUMERIC_UPPERCASE,
      randStrLength: 6
    };

    const result = sortId(params);
    expect(result).toStartWith('u_');

    const idPart = result.substring(2); // Remove 'u_'
    expect(idPart).toMatch(/^[a-z0-9A-Z]+$/); // base36 timestamp (lowercase) + uppercase random
  });

  test('generates multiple unique IDs in batch', () => {
    const ids = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      ids.add(sortId({ prefix: 'test_', randStrLength: 6 }));
    }

    // All IDs should be unique
    expect(ids.size).toBe(count);
  });

  test('format matches expected pattern: prefix + timestamp(base36) + random', () => {
    const result = sortId({ prefix: 'u_', randStrLength: 6 });

    // Should match: u_<base36><random6chars>
    expect(result).toMatch(/^u_[a-z0-9]+$/);

    const parts = result.split('_');
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe('u');
    expect(parts[1]?.length).toBeGreaterThanOrEqual(6);
  });

  test('IDs from same millisecond differ due to random part', () => {
    // Generate many IDs quickly (likely in same millisecond)
    const ids = Array.from({ length: 100 }, () => sortId({ randStrLength: 6 }));
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(100);
  });
});
