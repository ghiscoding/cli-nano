[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![codecov](https://codecov.io/gh/ghiscoding/cli-nano/branch/main/graph/badge.svg)](https://codecov.io/gh/ghiscoding/cli-nano)
[![npm](https://img.shields.io/npm/v/cli-nano.svg)](https://www.npmjs.com/package/cli-nano)
[![npm](https://img.shields.io/npm/dy/cli-nano)](https://www.npmjs.com/package/cli-nano)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/cli-nano?color=success&label=gzip)](https://bundlephobia.com/result?p=cli-nano)
<a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/cli-nano.svg" alt="Node" /></a>

## cli-nano

Small library to create command-line tool (aka CLI) which is quite similar to [`Yargs`](https://github.com/yargs/yargs), it is as configurable as Yargs but is a fraction of its size. The library is also inspired by NodeJS `parseArgs()` but is a lot more configurable in order to get what we would expect from a more complete CLI builder tool.

### Features
- Parses arguments
- Supports defining Positional (input) arguments
  - Supports Variadic args (1 or more positional args)
- Automatically converts flags to camelCase to match config options
  - accepts both `--camelCase` and `--kebab-case`
- Negates flags when using the `--no-` prefix
- Outputs version, when defined, by using `--version`
- Outputs description and supplied help text by using `--help`
- Supports defining `required` options
- Supports `default` values
- Supports `group` for grouping command options in help
- No dependencies!

### Install
```sh
npm install cli-nano
```

### Usage

```ts
#!/usr/bin/env node

import { type Config, parseArgs } from 'cli-nano';

const config: Config = {
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
  version: '0.1.6',
  helpFlagCasing: 'camel',  // show help flag option in which casing (camel/kebab) (defaults to 'kebab')
  helpDescMinLength: 40,    // min description length shown in help (defaults to 50)
  helpDescMaxLength: 120,   // max description length shown in help (defaults to 100), will show ellipsis (...) when greater
  helpUsageSeparator: ':',  // defaults to "→"
};

const args = parseArgs(config);
console.log(args);

// do something with parsed arguments, for example
// const { input, port, open } = args;
// startServer({ input, port, open });
```

### Usage with Type Inference

For full TypeScript auto-inference and intelliSense of parsed arguments, define your config as a `const` and cast it `as const`:

```ts
const config = {
  ... // your config object as shown above
} as const;

const args = parseArgs<typeof config>(config);

// TypeScript will infer the correct types:
args.input;   // [string, ...string[]] (required, variadic)
args.port;    // number   (optional, has default)
args.verbose; // boolean  (optional)
args.display; // boolean (required)
```

> **Tip:**  
> Using `as const` preserves literal types and tuple information, so TypeScript can infer required/optional fields and argument types automatically.  
> If you use `const config: Config = { ... }`, you get type checking but not full intelliSense for parsed arguments.

> [!NOTE]
> For required+variadic positionals, the type is `[string, ...string[]]` (at least one value required). For optional variadic, it's `string[]`. For non-variadic, it's `string`.

#### Example CLI Calls

```sh
# Show help guide (created by reading CLI config)
serve --help

# Show version (when defined)
serve --version

# Uses default port 5000
serve dist/index.html

# With required and optional positionals
serve index1.html index2.html 8080 -D value

# With boolean and array options entered as camelCase (kebab-case works too)
serve index.html 7000 --dryRun --exclude pattern1 --exclude pattern2 -D value

# With negated boolean entered as kebab-case
serve index.html 7000 --no-dryRun -D value

# With short aliases (case sensitive)
serve index.html 7000 -d -e pattern1 -e pattern2 -D value

# With number option
serve index.html 7000 --up 2 -D value
```

#### Notes

- **Default values**: Use the `default` property in an option or positional argument to specify a value when the user does not provide one.
  - Example for option: `{ type: 'boolean', default: false }`
  - Example for positional: `{ name: 'port', type: 'number', default: 5000 }`
- **Variadic positionals**: Use `variadic: true` for arguments that accept multiple values.
- **Required options**: Add `required: true` to enforce presence of an option.
- **Negated booleans**: Use `--no-flag` to set a boolean option to `false`.
- **Array options**: Repeat the flag to collect multiple values (e.g., `--exclude a --exclude b`).
- **Aliases**: Use `alias` for short flags (e.g., `-d` for `--dryRun`).
- **Groups**: Use `group` for grouping some commands in help (e.g., `{ group: 'Extra Commands' }`).

See [examples/](examples/) for more usage patterns.

## Used by

`cli-nano` is currently being used by the following projects, which is actually why I created this CLI tool, that I currently maintain as well (feel free to edit this list):

- [native-copyfiles](https://github.com/ghiscoding/native-copyfiles)
- [remove-glob](https://github.com/ghiscoding/remove-glob)

## Help Example

You can see below an example of a CLI help (which is the result of calling `--help` with the [config](#usage) shown above). 

Please note that the following means:

- `<option>` → required
- `[option]` → optional

```
Usage:
  serve <input..> [port] [options] → Start a server with the given options

Examples:
  serve ./www/index.html 8080 --open → Start web server on port 8080 and open browser
  serve ./index.html 8081 --no-open --verbose → Start web server on port 8081 without opening browser and print more debugging logging to the console

Arguments:
  input           serving files or directory                                      <string..>
  port            port to bind on                                                 [number]

Options:
  -d, --dry-run   Show what would be executed but without starting the server     [boolean]
  -e, --exclude   pattern or glob to exclude (may be passed multiple times)       [array]
  -V, --verbose   print more information to console                               [boolean]
  -o, --open      open browser when starting server                               [boolean]
      --cache     Set cache time (in seconds) for cache-control max-age header    [number]
      --address   Address to use                                                  <string>
  -h, --help      Show help                                                       [boolean]
  -v, --version   Show version number                                             [boolean]

Advanced Options:
  -D, --display   a required display option                                       <boolean>
  -r, --rainbow   Enable rainbow mode                                             [boolean]
```
