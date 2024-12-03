import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: {
    entryFileNames: 'src/index.js',
    dir: 'build',
    preserveModules: false, // If will build to a single index.js file if it 'false'
    sourcemap: true,
  },
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: 'src' },
        { find: '@common', replacement: 'src/common' },
        { find: '@sdk', replacement: 'src/sdk' },
        { find: '@utils', replacement: 'src/utils' },
        { find: '@types', replacement: 'src/types' },
        { find: '@tests', replacement: 'src/tests' },
      ],
    }),
    commonjs(),
    typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
  ],
};
