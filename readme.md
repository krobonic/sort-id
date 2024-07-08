# sort-id

Time sortable, type-prefixed IDs. Each ID consists of a type prefix, followed by a base 36
encoded timestamp (which can be alphabetically sorted), and finally a random string.

Examples

```ts
user_ly7512nco0QIs; // Generated first, sorts first alphabetically
user_ly751tfxst6Vw;
```

## Why

### Type Prefixing

Having the resource type prefixed at the start of the ID can make debugging easier and also makes
it easy to identify what type of resource the ID identifies at a glance.

### Timestamp Prefixing

After the optional type prefix comes the timestamp. This is the time in milliseconds since the
UNIX epoch. The value is converted to a string using base36, which reduces it from 13 to 8
characters. This means that all IDs can be sorted alphabetically in the order in which they were
created. A limitation is that IDs created during the same millisecond may not sort correctly.

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
  prefix: 'user',
});
console.log(userId); // -> user_ly757uw3998e2
```

### With a customised prefix separator

Generates an ID with a customised prefix separation character.

```ts
const userId = sortId({
  prefix: 'user',
  separator: '-',
});
console.log(userId); // -> user-ly765nhbPc0zR
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
  prefix: 'user',
  randStrLength: 15,
});
console.log(userId); // -> user_ly9c8a9x9owvod33sqoiezw
```

### With a custom alphabet

Customises the alphabet used for the random portion of the ID. The timestamp portion is always
base36 (alphanumeric lowercase), and the default alphabet is also alphanumeric lowercase.

#### Use a built-in alphabet:

```ts
import { sortId } from 'sort-id';
import { ALPHANUMERIC_UPPERCASE } from 'sort-id/alphabets';

const userId = sortId({
  prefix: 'user',
  alphabet: ALPHANUMERIC_UPPERCASE,
});
console.log(userId); // -> user_ly76dhmoPM3IP
```

#### Bring your own alphabet:

```ts
const userId = sortId({
  prefix: 'user',
  alphabet: '!@£$',
});
console.log(userId); // -> user_ly75rgn1$$£$£
```

### With a custom random string provider

Overwrites the random string function. Note that when using a custom random string provider,
the `alphabet` and `randStrLength` properties are ignored.

```ts
const userId = sortId({
  prefix: 'user',
  randStrProvider: () => 'my_random_string',
});
console.log(userId); // -> user_ly8tcd94my_random_string
```
