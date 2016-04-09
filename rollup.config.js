import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  dest: 'lib/index.js',
  sourceMap: true,
  format: 'cjs',
  plugins: [
    nodeResolve({ skip: ['abigail-plugin'] }),
    commonjs(),
    babel(),
  ],
};
