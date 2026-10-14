import { randomString } from "./random-string";

export type SortIdParams = {
	prefix?: string;
	alphabet?: string;
	randStrLength?: number;
	radix?: number;
};

const DEFAULT_RAN_STR_LENGTH = 12;
const DEFAULT_RADIX = 36;
const MAX_TIMESTAMP = DEFAULT_RADIX ** 10 - 1;

export const sortId = (params?: SortIdParams): string => {
	const radix = params?.radix === undefined ? DEFAULT_RADIX : params.radix;
	if (!Number.isInteger(radix) || radix < 2 || radix > 36) {
		throw new RangeError("radix must be an integer between 2 and 36");
	}

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
	const timestampWidth = MAX_TIMESTAMP.toString(radix).length;
	const encodedTimestamp = timestamp
		.toString(radix)
		.padStart(timestampWidth, "0");

	const randStr = randomString({
		alphabet: params?.alphabet,
		length:
			typeof params?.randStrLength !== "undefined"
				? params.randStrLength
				: DEFAULT_RAN_STR_LENGTH,
	});

	const id = `${encodedTimestamp}${randStr}`;
	if (params?.prefix) {
		return `${params.prefix}${id}`;
	}
	return id;
};
