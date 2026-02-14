Bun.build({
  entrypoints: ['src/index.ts', 'src/alphabets.ts'],
  outdir: 'dist',
  format: 'esm',
  target: 'node'
})
  .then((result) => {
    console.log(result);
    console.log('Completed Build');
  });
