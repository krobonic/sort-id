import { Alphabets } from './alphabets';

export type RandomStringParams = {
  length: number;
  alphabet?: string;
};

/**
 * @todo Use crypto
 */
export const randomString = ({
  length,
  alphabet,
}: RandomStringParams): string => {
  const characters = alphabet || Alphabets.ALPHANUMERIC;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
