import { randomString } from './random-string';

export type SortIdParams = {
  prefix?: string;
  separator?: string;
  time?: 'hrtime' | 'date';
  alphabet?: string;
  randStrLength?: number;
  randStrProvider?: () => string;
};

export const sortId = (params?: SortIdParams): string => {
  const ts =
    params?.time === 'hrtime'
      ? process.hrtime.bigint().toString(36)
      : Date.now().toString(36);

  const randStr =
    typeof params?.randStrProvider !== 'undefined'
      ? params.randStrProvider()
      : randomString({
          alphabet: params?.alphabet,
          length: params?.randStrLength || 5,
        });

  let id = `${ts}${randStr}`;
  if (params?.prefix) {
    id = `${params.prefix}${params.separator || '_'}${id}`;
  }
  return id;
};
