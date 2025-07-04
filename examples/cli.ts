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
    description: 'Start a server with the given options',
    positionals: [
      {
        name: 'input',
        description: 'serving files or directory',
        type: 'string',
        variadic: true, // 1 or more
        required: true,
      },
      {
        name: 'port',
        type: 'number',
        description: 'port to bind on',
        required: false,
        default: 5000, // optional default value
      },
    ],
  },
  options: {
    dryRun: {
      alias: 'd',
      type: 'boolean',
      description: 'Show what would be done, but do not actually start the server',
      default: false, // optional default value
    },
    exclude: {
      alias: 'e',
      type: 'array',
      description: 'pattern or glob to exclude (may be passed multiple times)',
    },
    rainbow: {
      type: 'boolean',
      alias: 'r',
      description: 'Enable rainbow mode',
      default: true,
    },
    verbose: {
      alias: 'V',
      type: 'boolean',
      description: 'print more information to console',
    },
    up: {
      type: 'number',
      description: 'slice a path off the bottom of the paths',
      default: 1,
    },
    display: {
      alias: 'D',
      required: true,
      type: 'boolean',
      description: 'a required display option',
    },
  },
  version: readPackage().version,
} as const;

const args = parseArgs<typeof config>(config);
console.log('Parsed arguments:', args.outDirectory);

// TypeScript will infer the correct types:
args.input; // [string, ...string[]] (required, variadic)
args.port; // number   (optional, has default)
args.verbose; // boolean  (optional)
args.display; // boolean (required)
