const result = await Bun.build({
  entrypoints: ['src/index.ts', 'src/alphabets.ts'],
  outdir: 'dist',
  format: 'esm',
  target: 'node'
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log('Completed Build');
