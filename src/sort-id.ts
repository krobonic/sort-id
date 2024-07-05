import { randomString } from './random-string';

export type SortIdParams = {
  prefix?: string;
  separator?: string;
  alphabet?: string;
  randStrLength?: number;
  randStrProvider?: () => string;
};

export const sortId = (params?: SortIdParams): string => {
  const randStr =
    typeof params?.randStrProvider !== 'undefined'
      ? params.randStrProvider()
      : randomString({
          alphabet: params?.alphabet,
          length: typeof params?.randStrLength != 'undefined' ? params?.randStrLength : 5,
        });

  let id = `${Date.now().toString(36)}${randStr}`;
  if (params?.prefix) {
    id = `${params.prefix}${params.separator || '_'}${id}`;
  }
  return id;
};
