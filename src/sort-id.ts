import { randomString } from "./random-string";

export type SortIdParams = {
	prefix?: string;
	alphabet?: string;
	randStrLength?: number;
};

const DEFAULT_RAN_STR_LENGTH = 12;
const TIMESTAMP_WIDTH = 10;
const MAX_TIMESTAMP = 36 ** TIMESTAMP_WIDTH - 1;

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
	const encodedTimestamp = timestamp
		.toString(36)
		.padStart(TIMESTAMP_WIDTH, "0");

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
