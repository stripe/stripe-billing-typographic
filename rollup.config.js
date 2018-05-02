/**
 * rollup.config.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Rollup bundles our frontend Vue components into a single JavaScript file
 * that can be distributed to the browser.
 */
'use strict';

import vue from 'rollup-plugin-vue';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import replace from 'rollup-plugin-replace';
import json from 'rollup-plugin-json';
import uglify from 'rollup-plugin-uglify';

import {minify} from 'uglify-es';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'client/src/main.js',
  output: {
    file: 'client/assets/bundle.js',
    // Use an immediately-invoked function expression, since we're loading our
    // bundle via a <script> tag
    format: 'iife',
    sourcemap: true,
  },
  plugins: [
    resolve({
      jsnext: true,
      browser: true,
      preferBuiltins: true,
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    globals(),
    builtins(),
    json(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.VUE_ENV': JSON.stringify('browser'),
    }),
    vue({
      compileTemplate: true,
      css: true,
    }),
    // Minify in production
    production && uglify({}, minify),
  ],
  watch: {
    chokidar: true,
    exclude: ['node_modules/**'],
  },
};
