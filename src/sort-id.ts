import { randomString } from './random-string';
import { ALPHABETS } from './alphabets';

export type BaseSortIdParams = {
  prefix?: string;
  separator?: string;
};

export type GenerateRandomStringParams = {
  alphabet?: string;
  numRandomChars: number;
};

export type ProvideRandomStringParams = {
  randomStrProvider: () => string;
};

export type SortIdParams =
  | (BaseSortIdParams & GenerateRandomStringParams)
  | (BaseSortIdParams & ProvideRandomStringParams);

export const sortId = (params: SortIdParams): string => {
  const ts = Date.now().toString(36);

  let randStr = '';
  if ('alphabet' in params) {
    randStr = randomString({
      alphabet: params.alphabet,
      length: params.numRandomChars,
    });
  } else if ('randomStrProvider' in params) {
    randStr = params.randomStrProvider();
  }

  let id = `${ts}${randStr}`;
  if (params.prefix) {
    id = `${params.prefix}${params.separator || '_'}${id}`;
  }
  return id;
};

(() => {
  while (true) {
    console.log(
      sortId({
        prefix: 'u',
        separator: '#',
        numRandomChars: 5,
        alphabet: ALPHABETS.ALPHANUMERIC_LOWERCASE,
      }),
    );
  }
})();
