# sort-id
Time sortable, type-prefixed IDs. Each ID consists of a base 36 encoded timestamp,
which can be alphabetically sorted, followed by a random string.

Examples
```ts
user_ly7512nco0QIs // Generated first, sorts first alphabetically
user_ly751tfxst6Vw
```

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

### Without a prefix
Generates an ID without any type prefix.
```ts
const userId = sortId();
console.log(userId); // -> ly75c94jTosOQ 
```

### With a customised prefix separator
Generates an ID with a customised prefix separation character.
```ts
const userId = sortId({
  prefix: 'user',
  separator: '-'
});
console.log(userId); // -> user-ly765nhbPc0zR
```

### With high-resolution time
Uses nanosecond prevision instead of millisecond precision for timestamps. Lowers chance of ID
collision, so that IDs not created in the same nanosecond can never collide, but increases character
length of timestamp portion by 2 characters.
```ts
const userId = sortId({
  prefix: 'user',
  time: 'hrtime',
});
console.log(userId); // user_56p6s77u7cSvpNy
```

### With a custom length
Customises the number of characters in the random portion of the ID. The timestamp portion is always
the same length (depending on the `time` setting).
```ts
const userId = sortId({
  prefix: 'user',
  randStrLength: 15,
});
console.log(userId); // -> user_ly762c55uKdl6ZA9rjQlnD4
```

### With a custom alphabet
Customises the alphabet used for the random portion of the ID. The timestamp portion is always
base36 (alphanumeric).

Use a built-in alphabet:
```ts
import { sortId, Alphabets } from 'sort-id';

const userId = sortId({
  prefix: 'user',
  alphabet: Alphabets.ALPHANUMERIC_UPPERCASE
});
console.log(userId); // -> user_ly76dhmoPM3IP
```

Bring your own alphabet:
```ts
const userId = sortId({
  prefix: 'user',
  alphabet: '!@£$'
}); 
console.log(userId); // -> user_ly75rgn1$$£$£
```

### With a custom random string provider
Overwrites the random string function. Note that when using a custom random string provider,
the `alphabet` and `randStrLength` properties are ignored.
```ts
const userId = sortId({
  prefix: 'user',
  randStrProvider: () => myRandomStringFunction()
});
console.log(userId); // -> user_ly75y9bb<something_random>
```
