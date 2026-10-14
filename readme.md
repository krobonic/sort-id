# sort-id

Time sortable, type-prefixed IDs. Each ID consists of a type prefix, followed by an
encoded timestamp (which can be alphabetically sorted), and finally a random string.
The random suffix now defaults to 12 characters (previously 5). Explicit
`randStrLength` values are unchanged; use `randStrLength: 5` to retain the previous length.

Examples

```ts
user00ly7512nc998e2abcde12; // Generated first, sorts first alphabetically
user00ly751tfxst6vwabcde12;
```

## Why

### Type Prefixing

Having the resource type prefixed at the start of the ID can make debugging easier and also makes
it easy to identify what type of resource the ID identifies at a glance.

### Timestamp Prefixing

After the optional type prefix comes the timestamp. This is the time in milliseconds since the
UNIX epoch. The value is encoded in base36.
Timestamps are zero-padded to a fixed width: 10 characters in base36.
For example, timestamp 35 becomes `000000000z` and timestamp 36 becomes `0000000010`,
so lexical ordering remains chronological across digit-width boundaries. IDs with the same
prefix sort by timestamp; IDs created during the same millisecond are ordered by
the random suffix. Clock changes can also affect creation order.

Supported timestamps are integer milliseconds from 0 through 3,656,158,440,062,975
(`36 ** 10 - 1`), inclusive. Negative, fractional, non-finite, and larger timestamps
throw `RangeError`.

This changes the ID format: existing unpadded IDs should not be mixed with padded IDs
when relying on lexical ordering. Consumers that parse IDs should use the new timestamp width.
The `radix` option has been removed; all timestamps now use base36.

### Random suffix length and collisions

The default payload is 22 characters: a 10-character base36 timestamp plus a
12-character random suffix, excluding the optional prefix. This balances compactness
with collision resistance. Explicit `randStrLength` values still control suffix length.

With the default 36-character alphabet, there are `36 ** 12` possible suffixes
(about `4.74 × 10^18`, or 62 bits of randomness). Assuming independent, uniform
random draws, the birthday approximation for at least one collision among `n`
IDs sharing the same timestamp, prefix, and alphabet is
`1 - exp(-n * (n - 1) / (2 * 36 ** 12))`. When the probability is small, this is
approximately `n * (n - 1) / (2 * 36 ** 12)`: about `1.05 × 10^-13` for 1,000 IDs
in one millisecond, or `1.05 × 10^-7` for 1,000,000 IDs in one millisecond.

Count all generators sharing the same ID namespace together, including multiple
processes and machines. Different timestamps produce different IDs, but clock
rollback or repeated timestamps add to the same collision bucket. These examples
are per timestamp, not lifetime guarantees: sum the small per-timestamp probabilities
to estimate cumulative risk. For a custom alphabet of size `A` and suffix length
`L`, replace `36 ** 12` with `A ** L`; smaller alphabets or shorter suffixes increase
risk. A zero-length suffix or single-character alphabet cannot distinguish IDs
within the same timestamp. Use a longer explicit suffix for higher volumes or a
lower collision budget, and enforce uniqueness where required.

## Package verification

Run `bun run test:package` to build fresh output and smoke-test a local tarball.
The check loads both public entry points, verifies the default 22-character payload,
resource prefixes and alphabet exports, and compiles a consumer against the packaged
declarations with NodeNext and Bundler resolution.

The `prepack` hook runs this build and check automatically for packaging and publishing;
either failure stops the operation. This check does not publish a release.

## Installation

```shell
$ npm i sort-id
```

## Usage

### Import

```ts
import { sortId } from 'sort-id';
```

## Examples

### With a prefix

Generates an ID with a type prefix. Useful for being able to determine what type of resource an ID
identifies.

```ts
const userId = sortId({
  prefix: 'user_',
});
console.log(userId); // -> user_00ly757uw3998e2abcde12
```

### Without a prefix

Generates an ID without any type prefix.

```ts
const userId = sortId();
console.log(userId); // -> 00ly75c94jtosoqabcde12
```

### With a custom random string length

Customises the number of characters in the random portion of the ID. The timestamp portion is always
the same length.

```ts
const userId = sortId({
  prefix: 'user_',
  randStrLength: 15,
});
console.log(userId); // -> user_00ly9c8a9x9owvod33sqoiezw
```

### With a custom alphabet

Customises the alphabet used for the random portion of the ID. The timestamp always uses
base36 (alphanumeric lowercase), and the default random alphabet is also alphanumeric lowercase.

#### Use a built-in alphabet:

```ts
import { sortId } from 'sort-id';
import { ALPHANUMERIC_UPPERCASE } from 'sort-id/alphabets';

const userId = sortId({
  prefix: 'user_',
  alphabet: ALPHANUMERIC_UPPERCASE,
});
console.log(userId); // -> user_00ly76dhmoPM3IPABCDE12
```

#### Bring your own alphabet:

```ts
const userId = sortId({
  prefix: 'user_',
  alphabet: '!@£$',
});
console.log(userId); // -> user_00ly75rgn1$$£$£!@£$!@£
```

### Supported random inputs

`randomString({ length, alphabet? })` is also exported from `sort-id`.
`length` is required; `sortId` uses `randStrLength`, defaulting to 12.
Both lengths must be numeric integers from 0 through the runtime's
`node:buffer` `constants.MAX_STRING_LENGTH` (inclusive). Zero produces an empty
random suffix. Negative, fractional, non-finite, out-of-range, and non-number
lengths throw `RangeError`; values are never coerced. Large outputs remain
subject to available memory.

The default alphabet is `abcdefghijklmnopqrstuvwxyz0123456789`. Custom alphabets
must be strings containing 1–256 distinct UTF-16 characters, excluding surrogate
code units. BMP characters such as `£` are supported; emoji and other characters
requiring surrogate pairs are not. Empty, duplicate-containing, oversized, or
surrogate-containing alphabets throw `RangeError`; non-string alphabets throw
`TypeError`. Alphabets are validated even for a zero length. A one-character
alphabet is supported but provides no randomness in the output.

Optional alphabet and random-length defaults apply only when omitted or
`undefined`; explicit `null` is invalid.

Random characters use cryptographic bytes from `node:crypto.randomBytes` with
rejection sampling: bytes outside the largest multiple of the alphabet size
below or equal to 256 are discarded. Each alphabet character has equal selection
probability. Randomness-source errors propagate to the caller.
