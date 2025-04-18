import * as esbuild from 'esbuild';

esbuild
  .build({
    entryPoints: ['src/index.ts', 'src/alphabets.ts'],
    outdir: 'dist',
    bundle: true,
    format: 'esm',
    platform: 'node',
  })
  .then((result) => {
    console.log(result);
    console.log('Completed Build');
  });
