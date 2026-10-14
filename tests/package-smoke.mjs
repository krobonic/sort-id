import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), "sort-id-package-"));
const run = (command, args, cwd = root) => execFileSync(command, args, {
  cwd,
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: join(temporary, "npm-cache") },
});

try {
  // prepack has already built the output. Disable hooks here to avoid recursion.
  const [packed] = JSON.parse(run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary]));
  const files = new Set(packed.files.map(({ path }) => path));
  for (const required of [
    "dist/index.js", "dist/alphabets.js", "dist/index.d.ts",
    "dist/alphabets.d.ts", "dist/random-string.d.ts", "dist/sort-id.d.ts",
  ]) {
    assert.ok(files.has(required), `Package is missing ${required}`);
  }

  const consumer = join(temporary, "consumer");
  const installed = join(consumer, "node_modules", "sort-id");
  mkdirSync(installed, { recursive: true });
  run("tar", ["-xzf", join(temporary, packed.filename), "--strip-components=1", "-C", installed]);
  writeFileSync(join(consumer, "package.json"), '{"type":"module"}');
  writeFileSync(join(consumer, "smoke.mjs"), `
    import assert from "node:assert/strict";
    import { sortId, randomString } from "sort-id";
    import * as alphabets from "sort-id/alphabets";

    assert.deepEqual({ ...alphabets }, {
      ALPHANUMERIC: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      ALPHANUMERIC_UPPERCASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      ALPHANUMERIC_LOWERCASE: "abcdefghijklmnopqrstuvwxyz0123456789",
      NUMERIC: "0123456789",
    });
    Date.now = () => 36;
    for (const prefix of ["", "user_", "order_"]) {
      const id = sortId({ prefix });
      assert.equal(id.length, prefix.length + 22);
      assert.ok(id.startsWith(prefix + "0000000010"));
      assert.match(id.slice(prefix.length + 10), /^[a-z0-9]{12}$/);
    }
    assert.equal(sortId().length, 22);
    for (const alphabet of Object.values(alphabets)) {
      const suffix = sortId({ alphabet }).slice(10);
      assert.equal(suffix.length, 12);
      assert.ok([...suffix].every(character => alphabet.includes(character)));
      const random = randomString({ alphabet, length: 12 });
      assert.equal(random.length, 12);
      assert.ok([...random].every(character => alphabet.includes(character)));
    }
  `);
  run(process.execPath, ["smoke.mjs"], consumer);

  // Compile a real consumer against the declarations shipped in the tarball.
  for (const file of ["consumer.ts", "tsconfig.nodenext.json", "tsconfig.bundler.json"]) {
    copyFileSync(join(root, "tests", "types", file), join(consumer, file));
  }
  for (const mode of ["nodenext", "bundler"]) {
    run(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "-p", `tsconfig.${mode}.json`], consumer);
  }
  console.log("Package smoke check passed (runtime exports, payloads, prefixes, and declarations).");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
