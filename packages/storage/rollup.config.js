import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    entryFileNames: 'src/index.js',
    dir: 'build',
    preserveModules: false, // If will build to a single index.js file if it 'false'
    sourcemap: true,
  },
  external: ['@orochi-network/framework', 'o1js', 'mongodb', 'crypto'],
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: 'src' },
        { find: '@common', replacement: 'src/common' },
        { find: '@database', replacement: 'src/database' },
        { find: '@helper', replacement: 'src/helper' },
      ],
    }),
    resolve(),
    commonjs(),
    typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
  ],
};
