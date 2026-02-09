import { randomString } from './random-string';

export type SortIdParams = {
  prefix?: string;
  alphabet?: string;
  randStrLength?: number;
  radix?: number;
};

const DEFAULT_RAN_STR_LENGTH = 5;
const DEFAULT_RADIX = 36;

export const sortId = (params?: SortIdParams): string => {
  const randStr = randomString({
    alphabet: params?.alphabet,
    length:
      typeof params?.randStrLength !== 'undefined'
        ? params.randStrLength
        : DEFAULT_RAN_STR_LENGTH,
  });

  const id = `${Date.now().toString(params?.radix || DEFAULT_RADIX)}${randStr}`;
  if (params?.prefix) {
    return `${params.prefix}${id}`;
  }
  return id;
};
