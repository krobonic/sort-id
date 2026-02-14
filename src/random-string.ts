import { ALPHANUMERIC_LOWERCASE } from './alphabets';
import { randomBytes } from 'crypto';

export type RandomStringParams = {
  length: number;
  alphabet?: string;
};

const DEFAULT_ALPHABET = ALPHANUMERIC_LOWERCASE;

export const randomString = ({
  length,
  alphabet,
}: RandomStringParams): string => {
  const characters = alphabet || DEFAULT_ALPHABET;

  return Array.from(randomBytes(length), (byte) =>
    characters[byte % characters.length]
  ).join('');
};
