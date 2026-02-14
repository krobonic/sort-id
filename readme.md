# sort-id

Time sortable, type-prefixed IDs. Each ID consists of a type prefix, followed by an
encoded timestamp (which can be alphabetically sorted), and finally a random string.

Examples

```ts
userly7512nco0QIs; // Generated first, sorts first alphabetically
userly751tfxst6Vw;
```

## Why

### Type Prefixing

Having the resource type prefixed at the start of the ID can make debugging easier and also makes
it easy to identify what type of resource the ID identifies at a glance.

### Timestamp Prefixing

After the optional type prefix comes the timestamp. This is the time in milliseconds since the
UNIX epoch. The value is converted to a string using a radix (base), which defaults to base36.
Base36 reduces the timestamp from 13 to 8 characters. This means that all IDs can be sorted
alphabetically in the order in which they were created. A limitation is that IDs created during the
same millisecond may not sort correctly.

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
console.log(userId); // -> user_ly757uw3998e2
```

### Without a prefix

Generates an ID without any type prefix.

```ts
const userId = sortId();
console.log(userId); // -> ly75c94jTosOQ
```

### With a custom random string length

Customises the number of characters in the random portion of the ID. The timestamp portion is always
the same length.

```ts
const userId = sortId({
  prefix: 'user_',
  randStrLength: 15,
});
console.log(userId); // -> user_ly9c8a9x9owvod33sqoiezw
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
console.log(userId); // -> user_ly76dhmoPM3IP
```

#### Bring your own alphabet:

```ts
const userId = sortId({
  prefix: 'user_',
  alphabet: '!@£$',
});
console.log(userId); // -> user_ly75rgn1$$£$£
```

### With a custom radix

Customises the radix used for encoding the timestamp. Defaults to 36.

```ts
const userId = sortId({
  prefix: 'user_',
  radix: 10,
});
console.log(userId); // -> user_1723456789012abcde
```
