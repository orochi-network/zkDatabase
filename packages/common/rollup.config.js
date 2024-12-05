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
        { find: '@types', replacement: 'src/types' },
        { find: '@valdiation', replacement: 'src/valdiation' },
      ],
    }),
    commonjs(),
    typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
  ],
};
