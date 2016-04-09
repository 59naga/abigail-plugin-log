import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/index.js',
  dest: 'lib/index.js',
  sourceMap: true,
  format: 'cjs',
  plugins: [
    nodeResolve({ skip: ['abigail-plugin'] }),
    commonjs(),
    babel(),
    uglify(),
  ],
};
