import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

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
        { find: '@authentication', replacement: 'src/authentication' },
        { find: '@graphql', replacement: 'src/graphql' },
        { find: '@utils', replacement: 'src/utils' },
      ],
    }),
    nodeResolve(),
    commonjs(),
    typescript({ sourceMap: true, tsconfig: 'tsconfig.json' }),
  ],
};
