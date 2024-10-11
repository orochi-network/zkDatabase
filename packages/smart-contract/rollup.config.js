import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/index.ts',
    output: {
      entryFileNames: 'src/index.esm.js',
      format: 'esm',
      dir: 'build',
      preserveModules: false, // If will build to a single index.js file if it 'false'
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      alias({
        entries: [
          { find: '@', replacement: 'src' },
          { find: '@archive-node', replacement: 'src/archive-node' },
          { find: '@contracts', replacement: 'src/contracts' },
          { find: '@proof', replacement: 'src/proof' },
          { find: '@types', replacement: 'src/types' },
        ],
      }),
      typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      entryFileNames: 'src/index.cjs.js',
      format: 'cjs',
      dir: 'build',
      preserveModules: false, // If will build to a single index.js file if it 'false'
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      alias({
        entries: [
          { find: '@', replacement: 'src' },
          { find: '@archive-node', replacement: 'src/archive-node' },
          { find: '@contracts', replacement: 'src/contracts' },
          { find: '@proof', replacement: 'src/proof' },
          { find: '@types', replacement: 'src/types' },
        ],
      }),
      typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      entryFileNames: 'src/index.umd.js',
      format: 'umd',
      dir: 'build',
      preserveModules: false, // If will build to a single index.js file if it 'false'
      sourcemap: true,
      name: 'smart-contract',
    },
    plugins: [
      commonjs(),
      alias({
        entries: [
          { find: '@', replacement: 'src' },
          { find: '@archive-node', replacement: 'src/archive-node' },
          { find: '@contracts', replacement: 'src/contracts' },
          { find: '@proof', replacement: 'src/proof' },
          { find: '@types', replacement: 'src/types' },
        ],
      }),
      typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
    ],
  },
];
