# sort-id

Time sortable, type-prefixed IDs. Each ID consists of a type prefix, followed by an
encoded timestamp (which can be alphabetically sorted), and finally a random string.
The random suffix now defaults to 16 characters (previously 5). Explicit
`randStrLength` values are unchanged; use `randStrLength: 5` to retain the previous length.

Examples

```ts
user00ly7512nc998e2abcde123456; // Generated first, sorts first alphabetically
user00ly751tfxst6vwabcde123456;
```

## Why

### Type Prefixing

Having the resource type prefixed at the start of the ID can make debugging easier and also makes
it easy to identify what type of resource the ID identifies at a glance.

### Timestamp Prefixing

After the optional type prefix comes the timestamp. This is the time in milliseconds since the
UNIX epoch. The value is converted to a string using a radix (base), which defaults to base36.
Timestamps are zero-padded to a fixed width: 10 characters in base36 by default.
For example, timestamp 35 becomes `000000000z` and timestamp 36 becomes `0000000010`,
so lexical ordering remains chronological across digit-width boundaries. IDs with the same
prefix and radix sort by timestamp; IDs created during the same millisecond are ordered by
the random suffix. Clock changes can also affect creation order.

Supported timestamps are integer milliseconds from 0 through 3,656,158,440,062,975
(`36 ** 10 - 1`), inclusive. Negative, fractional, non-finite, and larger timestamps
throw `RangeError`.

This changes the ID format: existing unpadded IDs should not be mixed with padded IDs
when relying on lexical ordering. Consumers that parse IDs should use the new timestamp width.

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
console.log(userId); // -> user_00ly757uw3998e2abcde123456
```

### Without a prefix

Generates an ID without any type prefix.

```ts
const userId = sortId();
console.log(userId); // -> 00ly75c94jtosoqabcde123456
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

Customises the alphabet used for the random portion of the ID. The default radix for the timestamp
portion is base36 (alphanumeric lowercase), and the default alphabet is also alphanumeric lowercase.

#### Use a built-in alphabet:

```ts
import { sortId } from 'sort-id';
import { ALPHANUMERIC_UPPERCASE } from 'sort-id/alphabets';

const userId = sortId({
  prefix: 'user_',
  alphabet: ALPHANUMERIC_UPPERCASE,
});
console.log(userId); // -> user_00ly76dhmoPM3IPABCDE123456
```

#### Bring your own alphabet:

```ts
const userId = sortId({
  prefix: 'user_',
  alphabet: '!@£$',
});
console.log(userId); // -> user_00ly75rgn1$$£$£!@£$!@£$!@£
```

### With a custom radix

Customises the radix used for encoding the timestamp. Defaults to 36. Supported radices
are integers from 2 through 36; other values throw `RangeError`. Each radix uses the
number of digits needed to encode the shared maximum timestamp (`36 ** 10 - 1`),
with leading zeroes added to shorter values. Changing the radix changes the width:

| Radix | Timestamp width |
| --- | --- |
| 2 | 52 |
| 8 | 18 |
| 10 | 16 |
| 16 | 13 |
| 36 | 10 |

For any supported radix, the width is `(36 ** 10 - 1).toString(radix).length`.

```ts
const userId = sortId({
  prefix: 'user_',
  radix: 10,
});
console.log(userId); // -> user_0001723456789012abcde1234567890f
```
