#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { sortId } from './sort-id.js';

try {
	const { values } = parseArgs({
		options: {
			prefix: { type: 'string', short: 'p' },
			length: { type: 'string', short: 'l' },
			alphabet: { type: 'string', short: 'a' },
			time: { type: 'string', short: 't' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: false,
	});

	if (values.help) {
		console.log(`Usage: sort-id [options]

Generate one time-sortable ID, followed by a newline.

Options:
  -p, --prefix <text>       Prefix to prepend to the ID
  -l, --length <number>     Random suffix length (default: 12)
  -a, --alphabet <chars>    Random suffix alphabet (default: a-z and 0-9)
  -t, --time <timestamp>    Override time with a date string or Unix milliseconds
  -h, --help                Show this help

The timestamp always contains 7 base62 characters.`);
	} else {
		if (values.length !== undefined && !/^\d+$/.test(values.length)) {
			throw new Error('--length must be a non-negative integer');
		}
		let time: Date | undefined;
		if (values.time !== undefined) {
			time = new Date(
				/^-?\d+(?:\.\d+)?$/.test(values.time)
					? Number(values.time)
					: values.time,
			);
			if (Number.isNaN(time.getTime())) {
				throw new Error(
					'--time must be a valid date string or Unix milliseconds',
				);
			}
		}
		console.log(
			sortId({
				time,
				prefix: values.prefix,
				alphabet: values.alphabet,
				randStrLength:
					values.length === undefined ? undefined : Number(values.length),
			}),
		);
	}
} catch (error) {
	console.error(
		`sort-id: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
}
