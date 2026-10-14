import {
	type RandomStringParams,
	randomString,
	type SortIdParams,
	sortId,
} from "sort-id";
import {
	ALPHANUMERIC,
	ALPHANUMERIC_LOWERCASE,
	ALPHANUMERIC_UPPERCASE,
	NUMERIC,
} from "sort-id/alphabets";

const sortIdParams: SortIdParams = {
	prefix: "user_",
	alphabet: ALPHANUMERIC_LOWERCASE,
	randStrLength: 12,
};
const randomStringParams: RandomStringParams = {
	length: 12,
	alphabet: ALPHANUMERIC_UPPERCASE,
};

export const ids: string[] = [sortId(), sortId(sortIdParams)];
export const strings: string[] = [
	randomString(randomStringParams),
	randomString({ length: 12 }),
	randomString({ length: 12, alphabet: ALPHANUMERIC }),
	randomString({ length: 12, alphabet: NUMERIC }),
];

// Ensure the public functions retain their parameter and return types.
// @ts-expect-error length is required
randomString({});
// @ts-expect-error randStrLength must be numeric
sortId({ randStrLength: "12" });
// @ts-expect-error sortId returns a string
export const numericId: number = sortId();
// @ts-expect-error randomString returns a string
export const numericRandomString: number = randomString({ length: 12 });
