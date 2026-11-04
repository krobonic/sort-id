import { randomString } from './random-string.js';

export type SortIdParams = {
	prefix?: string;
	alphabet?: string;
	randStrLength?: number;
};

const DEFAULT_RAN_STR_LENGTH = 12;
const TIMESTAMP_ALPHABET =
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const TIMESTAMP_WIDTH = 7;
const MAX_TIMESTAMP = TIMESTAMP_ALPHABET.length ** TIMESTAMP_WIDTH - 1;

export const sortId = (params?: SortIdParams): string => {
	const timestamp = Date.now();
	if (
		!Number.isSafeInteger(timestamp) ||
		timestamp < 0 ||
		timestamp > MAX_TIMESTAMP
	) {
		throw new RangeError(
			`timestamp must be an integer between 0 and ${MAX_TIMESTAMP}`,
		);
	}
	// Alphabet order matches JavaScript string comparison.
	let remaining = timestamp;
	let encodedTimestamp = '';
	for (let i = 0; i < TIMESTAMP_WIDTH; i++) {
		encodedTimestamp =
			TIMESTAMP_ALPHABET[remaining % TIMESTAMP_ALPHABET.length] +
			encodedTimestamp;
		remaining = Math.floor(remaining / TIMESTAMP_ALPHABET.length);
	}

	const randStr = randomString({
		alphabet: params?.alphabet,
		length:
			typeof params?.randStrLength !== 'undefined'
				? params.randStrLength
				: DEFAULT_RAN_STR_LENGTH,
	});

	const id = `${encodedTimestamp}${randStr}`;
	if (params?.prefix) {
		return `${params.prefix}${id}`;
	}
	return id;
};
