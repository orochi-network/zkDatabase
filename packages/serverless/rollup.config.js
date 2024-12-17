import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolver from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    entryFileNames: 'src/index.js',
    dir: 'build',
    preserveModules: false, // Bundle into a single index.js if set to `false`
    sourcemap: true,
  },
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: 'src' },
        { find: '@apollo-app', replacement: 'src/apollo' },
        { find: '@domain', replacement: 'src/domain' },
        { find: '@helper', replacement: 'src/helper' },
        { find: '@model', replacement: 'src/model' },
        { find: '@service', replacement: 'src/service' },
        { find: '@test', replacement: 'src/test' },
      ],
    }),
    commonjs(),
    typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
  ],
};
