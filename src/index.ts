import type { ArgsResult, Config, FlagOption } from './interfaces.js';

export type * from './interfaces.js';

interface ParsedArgument {
  name: string;
  positionalIndex?: number;
  key?: string;
  value?: string;
  long?: boolean;
  negated?: boolean;
  last?: boolean;
}

const defaultOptions: Record<string, FlagOption> = {
  help: { alias: 'h', describe: 'Show help', type: 'boolean' },
  version: { alias: 'v', describe: 'Show version number', type: 'boolean' },
};

export function parseArgs<C extends Config>(config: C): ArgsResult<C> {
  const { command, options, version } = config;

  // Capture raw argv for consumers/diagnostics
  const __rawArgs = process.argv.slice(2);

  // Split passthrough before interpreting equals signs so its tokens stay intact.
  const dashIndex = __rawArgs.indexOf('--');
  const dashArgs = dashIndex >= 0 ? __rawArgs.slice(dashIndex + 1) : [];
  const args = dashIndex >= 0 ? __rawArgs.slice(0, dashIndex) : __rawArgs;
  // A null-prototype map keeps user-supplied keys isolated from inherited properties.
  const result = Object.create(null) as Record<string, any>;
  const allowInterleaved = command.allowInterleaved !== false;

  // Retain configuration order to preserve precedence between transformed aliases.
  const optionEntries = Object.entries(options);
  const aliasMap = new Map<string, [string, number]>();
  for (const [index, [key, opt]] of optionEntries.entries()) {
    if (opt.alias) {
      if (aliasMap.has(opt.alias)) {
        throw new Error(`Duplicate alias detected: "${opt.alias}" used for both "${aliasMap.get(opt.alias)?.[0]}" and "${key}"`);
      }
      aliasMap.set(opt.alias, [key, index]);
    }
  }

  // Handle --help and --version before anything else
  const hasFlag = (flag: string) => args.some(arg => arg === flag || arg.startsWith(`${flag}=`));
  if (hasFlag('--help') || hasFlag('-h')) {
    printHelp(config);
    process.exit(0);
  }
  if ((version && hasFlag('--version')) || hasFlag('-v')) {
    console.log(version || 'No version specified');
    process.exit(0);
  }

  // Validate: required positionals must come before optional ones
  const positionals = command.positionals ?? [];
  let foundOptional = false;
  for (const pos of positionals) {
    if (!pos.required) {
      foundOptional = true;
    }
    if (foundOptional && pos.required) {
      throw new Error(`Invalid positional argument configuration: required positional "${pos.name}" cannot follow optional positional(s).`);
    }
  }

  // Resolve each flag once. Collect its value here so positional assignment and
  // option parsing share the same interpretation of aliases, clusters and empty values.
  const parsedArgs: ParsedArgument[] = [];
  const nonOptionArgs: string[] = [];
  let foundFlag = false;
  const collectPositional = (name: string) => {
    const positionalIndex = allowInterleaved || !foundFlag ? nonOptionArgs.push(name) - 1 : undefined;
    parsedArgs.push({ name, positionalIndex });
  };
  for (let i = 0; i < args.length; i++) {
    const original = args[i];
    if (!original.startsWith('-')) {
      collectPositional(original);
      continue;
    }
    foundFlag = true;
    const equalsIndex = /^--?\w[\w-]*=/.test(original) ? original.indexOf('=') : -1;
    const flag = equalsIndex >= 0 ? original.slice(0, equalsIndex) : original;
    const inlineValue = equalsIndex >= 0 ? original.slice(equalsIndex + 1) : undefined;
    const long = flag.startsWith('--');
    const body = flag.slice(long ? 2 : 1);
    const exactKey = findOption(options, aliasMap, body);
    const cluster = exactKey === undefined && !long && body.length > 1 && !body.startsWith('no-');
    const names = cluster ? body.split('') : [body];
    for (let ci = 0; ci < names.length; ci++) {
      const name = names[ci];
      let key = cluster ? findOption(options, aliasMap, name) : exactKey;
      const negated = !cluster && name.startsWith('no-');
      if (key === undefined && negated) {
        const optionName = name.slice(3);
        const camel = kebabToCamel(optionName);
        const candidate = hasOwn(options, optionName) ? optionName : hasOwn(options, camel) ? camel : undefined;
        if (candidate !== undefined && options[candidate].type === 'boolean') {
          key = candidate;
        }
      }
      const option = key === undefined ? undefined : options[key];
      const last = ci === names.length - 1;
      let value: string | undefined;
      if (last && option?.type !== 'boolean') {
        if (inlineValue !== undefined) {
          value = inlineValue;
        } else if (args[i + 1] !== undefined && !args[i + 1].startsWith('-')) {
          value = args[++i];
        }
      }
      parsedArgs.push({ name, key, value, long, negated, last });
      if (last && option?.type === 'boolean' && inlineValue !== undefined) {
        collectPositional(inlineValue);
      }
    }
  }

  // Assign positionals from the collected non-option tokens
  let nonOptionIndex = 0;
  for (let i = 0; i < positionals.length; i++) {
    const pos = positionals[i];
    if (pos.variadic) {
      const remaining = positionals.length - (i + 1);
      const values = nonOptionArgs.slice(nonOptionIndex, nonOptionArgs.length - remaining);
      if (pos.required && values.length === 0) {
        const usagePositionals = buildUsagePositionals(positionals);
        throw new Error(`Missing required positional argument, i.e.: "${command.name} ${usagePositionals}"`);
      }
      result[pos.name] = !pos.required && values.length === 0 && pos.default !== undefined ? pos.default : values;
      nonOptionIndex += values.length;
    } else {
      const value = nonOptionArgs[nonOptionIndex];
      // Required positionals precede optional ones, so no suffix count is needed.
      if (value !== undefined) {
        result[pos.name] = value;
        nonOptionIndex++;
      } else if (!pos.required && pos.default !== undefined) {
        result[pos.name] = pos.default;
      } else if (pos.required) {
        const usagePositionals = buildUsagePositionals(positionals);
        throw new Error(`Missing required positional argument, i.e.: "${command.name} ${usagePositionals}"`);
      }
    }
  }

  for (const arg of parsedArgs) {
    if (arg.positionalIndex !== undefined && arg.positionalIndex < nonOptionIndex) {
      continue;
    }
    const { key, value } = arg;
    if (key === undefined) {
      throw new Error(`Unknown argument: ${arg.name}`);
    }
    const option = options[key];
    if (option.type === 'boolean') {
      if (result[key] !== undefined) {
        throw new Error('Providing same negated and truthy argument are not allowed');
      }
      result[key] = !arg.negated;
      if (arg.negated) {
        const noCamel = `no${key[0].toUpperCase()}${key.slice(1)}`;
        const noKebab = `no-${camelToKebab(key)}`;
        if (result[noCamel] === undefined) {
          result[noCamel] = true;
        }
        if (result[noKebab] === undefined) {
          result[noKebab] = true;
        }
      }
    } else {
      const array = option.type === 'array';
      if (!arg.last || (value === undefined && (!arg.long || option.type === 'number'))) {
        throw new Error(`Missing value for ${array && arg.last ? 'array option' : 'option'}: ${key}`);
      }
      if (array) {
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(value ?? '');
      } else {
        result[key] = option.type === 'number' ? Number(value) : (value ?? '');
      }
    }
  }

  // After all parsing, first ensure any `required` CLI options are present
  // (required should error even for boolean flags). Then assign any
  // explicit `default` values and finally apply yargs-parity boolean
  // defaults for non-required boolean flags.
  optionEntries.forEach(([key, opt]) => {
    // If the option wasn't provided and is required, throw immediately.
    if (result[key] === undefined && opt.required) {
      const aliasStr = opt.alias ? `-${opt.alias}, ` : '';
      throw new Error(`Missing required option: ${aliasStr}--${key}`);
    }

    // If the option wasn't provided, apply any explicit default.
    if (result[key] === undefined) {
      if (opt.default !== undefined) {
        result[key] = opt.default;
      } else if (opt.type === 'boolean') {
        // Parity with yargs: boolean flags default to false when not provided
        result[key] = false;
      }
    }
  });

  // Expose raw non-option positionals as `._` for convenience
  if (result._ === undefined) {
    result._ = nonOptionArgs;
  }

  // Duplicate parsed keys into both kebab-case and camelCase for parity with yargs.
  // Use a snapshot of keys to avoid iterating over newly-created duplicates.
  const parsedKeys = Object.keys(result);
  for (const key of parsedKeys) {
    if (key === '--' || key === '__rawArgs') {
      continue;
    }
    const value = result[key];
    const kebab = camelToKebab(key);
    const camel = kebabToCamel(key);
    if (kebab !== key && result[kebab] === undefined) {
      result[kebab] = value;
    }
    if (camel !== key && result[camel] === undefined) {
      result[camel] = value;
    }
  }

  // Expose passthrough tokens and raw args for downstream consumers
  if (!result['--']) {
    result['--'] = dashArgs;
  }
  if (result.__rawArgs === undefined) {
    result.__rawArgs = __rawArgs;
  }

  return result as ArgsResult<C>;
}

/** Format a text to a fixed length, truncating and padding as needed. */
function formatHelpText(text = '', max = 500) {
  const truncated = text.length > max ? `${text.slice(0, max - 3)}...` : text;
  return truncated.padEnd(max);
}

/** Build the usage string for positionals, e.g. "<input..> [output]" */
function buildUsagePositionals(positionals: readonly any[] = []) {
  return positionals
    .map(p => {
      const variadic = p.variadic ? '..' : '';
      return p.required ? `<${p.name}${variadic}>` : `[${p.name}${variadic}]`;
    })
    .join(' ');
}

/** Format the option/argument type for help output */
function formatOptionType(type: string | undefined, variadic?: boolean, required?: boolean) {
  const t = type || 'string';
  const variadicStr = variadic ? '..' : '';
  return required ? `<${t}${variadicStr}>` : `[${t}${variadicStr}]`;
}

/** Find a configured key without scanning the options or their aliases. */
function findOption(options: Record<string, FlagOption>, aliases: Map<string, [string, number]>, arg: string): string | undefined {
  if (hasOwn(options, arg)) {
    return arg;
  }
  const camel = kebabToCamel(arg);
  if (hasOwn(options, camel)) {
    return camel;
  }
  const kebab = camelToKebab(arg);
  const compact = kebab.replace(/-/g, '');
  if (hasOwn(options, compact)) {
    return compact;
  }
  let match: [string, number] | undefined;
  for (const name of [arg, camel, kebab]) {
    const candidate = aliases.get(name);
    if (candidate && (!match || candidate[1] < match[1])) {
      match = candidate;
    }
  }
  return match?.[0];
}

/** Print CLI help documentation to the screen */
function printHelp(config: Config) {
  const { command, options, version, helpDescMinLength = 50, helpDescMaxLength = 100, helpUsageSeparator = '→' } = config;
  const usagePositionals = buildUsagePositionals(command.positionals);

  console.log('Usage:');
  console.log(`  ${command.name} ${usagePositionals} [options] ${helpUsageSeparator} ${command.describe}`);

  // display any examples (when provided)
  if (Array.isArray(command.examples) && command.examples.length) {
    console.log('\nExamples:');
    command.examples.forEach(ex => {
      console.log(`  ${ex.cmd.replace('$0', command.name)} ${helpUsageSeparator} ${ex.describe || ''}`);
    });
  }

  // calculate longest description length
  let longestOptNameLn = 0;
  let longestOptDescLn = 0;
  const helpOptions = Object.assign(Object.create(null) as Record<string, FlagOption>, options, defaultOptions);
  for (const [key, option] of Object.entries(helpOptions)) {
    const flagLn = (config.helpFlagCasing === 'camel' ? key : camelToKebab(key)).length;
    if (flagLn > longestOptNameLn) {
      longestOptNameLn = key.length;
    }
    if ((option.describe?.length ?? 0) > longestOptDescLn) {
      longestOptDescLn = option.describe.length;
    }
  }

  // make sure the length to use is between our defined min/max
  if (longestOptDescLn < helpDescMinLength) {
    longestOptDescLn = helpDescMinLength;
  } else if (longestOptDescLn > helpDescMaxLength) {
    longestOptDescLn = helpDescMaxLength;
  }

  // reserve some extra spaces between option name/desc
  longestOptDescLn += 2;
  longestOptNameLn += 3;

  console.log('\nArguments:');
  command.positionals?.forEach(arg => {
    console.log(
      `  ${formatHelpText(arg.name, longestOptNameLn + 6)}${formatHelpText(arg.describe, longestOptDescLn)} ${formatOptionType(arg.type, arg.variadic, arg.required)}`,
    );
  });

  // Group options by their group property
  const groupedOptions = Object.entries(helpOptions).reduce(
    (acc, [key, option]) => {
      const group = option.group || 'Options';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push([key, option]);
      return acc;
    },
    Object.create(null) as Record<string, [string, FlagOption][]>,
  );

  Object.keys(groupedOptions).forEach(group => {
    console.log(`\n${group}:`);
    groupedOptions[group].forEach(([key, option]) => {
      const aliasStr = option.alias ? `-${option.alias}, ` : '';
      if (!version && key === 'version') {
        return;
      }
      const flagName = config.helpFlagCasing === 'camel' ? key : camelToKebab(key);
      console.log(
        `  ${aliasStr.padEnd(4)}--${formatHelpText(flagName, longestOptNameLn)}${formatHelpText(option.describe || '', longestOptDescLn)} ${formatOptionType(option.type, false, option.required)}`,
      );
    });
  });
}

/** Utility to convert kebab-case to camelCase */
function kebabToCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Utility to convert camelCase to kebab-case */
function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Check for an own property without consulting an object's prototype. */
function hasOwn(object: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(object, key);
}
