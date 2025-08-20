#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs } from '../src/index.js';

function readPackage() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkgPath = resolve(__dirname, '../package.json');
  const pkg = readFileSync(pkgPath, 'utf8');
  return JSON.parse(pkg);
}

const config = {
  command: {
    name: 'serve',
    describe: 'Start a server with the given options',
    examples: [
      { cmd: '$0 ./www/index.html 8080 --open', describe: 'Start web server on port 8080 and open browser' },
      {
        cmd: '$0 ./index.html 8081 --no-open --verbose',
        describe: 'Start web server on port 8081 without opening browser and print more debugging logging to the console',
      },
    ],
    positionals: [
      {
        name: 'input',
        describe: 'serving files or directory',
        type: 'string',
        variadic: true, // 1 or more
        required: true,
      },
      {
        name: 'port',
        type: 'number',
        describe: 'port to bind on',
        required: false,
        default: 5000, // optional default value
      },
    ],
  },
  options: {
    dryRun: {
      alias: 'd',
      type: 'boolean',
      describe: 'Show what would be executed but without starting the server',
      default: false, // optional default value
    },
    display: {
      group: 'Advanced Options',
      alias: 'D',
      required: true,
      type: 'boolean',
      describe: 'a required display option',
    },
    exclude: {
      alias: 'e',
      type: 'array',
      describe: 'pattern or glob to exclude (may be passed multiple times)',
    },
    verbose: {
      alias: 'V',
      type: 'boolean',
      describe: 'print more information to console',
    },
    open: {
      alias: 'o',
      type: 'boolean',
      describe: 'open browser when starting server',
      default: true,
    },
    cache: {
      type: 'number',
      describe: 'Set cache time (in seconds) for cache-control max-age header',
      default: 3600,
    },
    address: {
      type: 'string',
      describe: 'Address to use',
      required: true,
    },
    rainbow: {
      group: 'Advanced Options',
      type: 'boolean',
      alias: 'r',
      describe: 'Enable rainbow mode',
      default: true,
    },
  },
  version: readPackage(),
  // helpFlagCasing: 'camel', // show help flag option in which text casing (camel or kebab) (defaults to 'kebab')
  helpDescMinLength: 40, // min description length shown in help (defaults to 50)
  helpDescMaxLength: 120, // max description length shown in help (defaults to 100), will show ellipsis (...) when greater
  // helpUsageSeparator: ':', // defaults to "→"
} as const;

const args = parseArgs<typeof config>(config);
console.log('Parsed arguments:', args.outDirectory);

// TypeScript will infer the correct types:
args.input; // [string, ...string[]] (required, variadic)
args.port; // number   (optional, has default)
args.verbose; // boolean  (optional)
args.display; // boolean (required)
