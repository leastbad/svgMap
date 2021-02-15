//import { nodeResolve } from '@rollup/plugin-node-resolve'

const pkg = require('./package.json')

const name = pkg.name

export default {
  input: 'src/js/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.m.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name,
      sourcemap: true
    }
  ] //,
  //plugins: [nodeResolve()]
}
