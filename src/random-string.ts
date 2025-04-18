import { ALPHANUMERIC_LOWERCASE } from './alphabets';
import { randomInt } from 'crypto'

export type RandomStringParams = {
  length: number;
  alphabet?: string;
};

/**
 * @todo Use secure crypto random instead of Math.random()
 */
export const randomString = ({
  length,
  alphabet,
}: RandomStringParams): string => {
  const characters = alphabet || ALPHANUMERIC_LOWERCASE;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomInt(characters.length));
  }
  return result;
};
