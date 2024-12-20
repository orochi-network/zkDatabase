import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    entryFileNames: 'src/index.js',
    dir: 'build',
    preserveModules: false, // If will build to a single index.js file if it 'false'
    sourcemap: true,
  },
  plugins: [
    json(),
    alias({
      entries: [
        { find: '@types', replacement: 'src/types' },
        { find: '@validation', replacement: 'src/validation' },
      ],
    }),
    nodeResolve(),
    commonjs(),
    typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
  ],
};
