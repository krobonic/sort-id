import { constants } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { ALPHANUMERIC_LOWERCASE } from './alphabets.js';

export type RandomStringParams = {
	/** Integer from 0 through node:buffer constants.MAX_STRING_LENGTH. */
	length: number;
	/** 1–256 distinct, non-surrogate UTF-16 characters. */
	alphabet?: string;
};

export const randomString = ({
	length,
	alphabet = ALPHANUMERIC_LOWERCASE,
}: RandomStringParams): string => {
	if (
		!Number.isSafeInteger(length) ||
		length < 0 ||
		length > constants.MAX_STRING_LENGTH
	) {
		throw new RangeError(
			`length must be an integer between 0 and ${constants.MAX_STRING_LENGTH}`,
		);
	}
	if (typeof alphabet !== 'string') {
		throw new TypeError('alphabet must be a string');
	}
	if (
		alphabet.length < 1 ||
		alphabet.length > 256 ||
		/[\uD800-\uDFFF]/u.test(alphabet) ||
		new Set(alphabet).size !== alphabet.length
	) {
		throw new RangeError(
			'alphabet must contain 1–256 distinct, non-surrogate UTF-16 characters',
		);
	}

	// Only accept complete groups of alphabet indices, giving each equal weight.
	const limit = 256 - (256 % alphabet.length);
	let result = '';
	while (result.length < length) {
		const bytes = randomBytes(Math.min(length - result.length, 65536));
		for (const byte of bytes) {
			if (byte < limit) {
				result += alphabet[byte % alphabet.length];
			}
		}
	}
	return result;
};
