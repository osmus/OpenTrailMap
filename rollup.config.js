import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'node_modules/@turf/buffer/dist/esm/index.js',
    output: {
        name: 'turfBuffer',
        file: 'dist/turf-buffer.js',
        format: 'iife',
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        nodePolyfills(),
    ]
};