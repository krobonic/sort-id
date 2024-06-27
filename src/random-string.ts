import { ALPHABETS } from './alphabets';

export type RandomStringParams = {
  length: number;
  alphabet?: string;
};

export const randomString = ({
  length,
  alphabet,
}: RandomStringParams): string => {
  const characters = alphabet || ALPHABETS.ALPHANUMERIC;
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
