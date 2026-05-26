import type { ArgsResult, Config, FlagOption } from './interfaces.js';

export type * from './interfaces.js';

const defaultOptions: Record<string, FlagOption> = {
  help: { alias: 'h', describe: 'Show help', type: 'boolean' },
  version: { alias: 'v', describe: 'Show version number', type: 'boolean' },
};

export function parseArgs<C extends Config>(config: C): ArgsResult<C> {
  const { command, options, version } = config;

  // Capture raw argv for consumers/diagnostics
  const __rawArgs = process.argv.slice(2);

  // Normalize args to support --option=value and -o=value
  let args = __rawArgs.flatMap(arg => {
    if (/^--?\w[\w-]*=/.test(arg)) {
      const [flag, ...rest] = arg.split('=');
      return [flag, rest.join('=')];
    }
    return arg;
  });

  // Capture `--` passthrough (everything after `--`) and remove from args to avoid parsing
  const dashIndex = args.indexOf('--');
  const dashArgs: string[] = dashIndex >= 0 ? args.slice(dashIndex + 1) : [];
  if (dashIndex >= 0) {
    args = args.slice(0, dashIndex);
  }
  const result: Record<string, any> = {};

  // Interleaved positionals: enabled by default for yargs-like behavior.
  // Set `command.allowInterleaved = false` to restore traditional positionals-first parsing.
  const allowInterleaved = (command as any).allowInterleaved !== false;

  // Check for duplicate aliases
  const aliasMap = new Map<string, string>();
  for (const [key, opt] of Object.entries(options)) {
    if (opt.alias) {
      if (aliasMap.has(opt.alias)) {
        throw new Error(`Duplicate alias detected: "${opt.alias}" used for both "${aliasMap.get(opt.alias)}" and "${key}"`);
      }
      aliasMap.set(opt.alias, key);
    }
  }

  // Handle --help and --version before anything else
  if (args.includes('--help') || args.includes('-h')) {
    printHelp(config);
    process.exit(0);
  }
  if ((version && args.includes('--version')) || args.includes('-v')) {
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

  const optionConsumed = new Set<number>();
  const isSingleDashNegation = (s: string) => /^no-/.test(s);
  if (allowInterleaved) {
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (!a.startsWith('-')) {
        continue;
      }
      optionConsumed.add(i);
      const isLong = a.startsWith('--');
      const body = a.slice(isLong ? 2 : 1);
      const negated = body.startsWith('no-');
      const lookup = negated ? body.slice(3) : !isLong && body.length > 1 ? body.slice(-1) : body;
      const [opt] = findOption(options, lookup);
      if (opt?.type !== 'boolean' && args[i + 1] && !args[i + 1].startsWith('-')) {
        optionConsumed.add(i + 1);
      }
    }
  } else {
    let i = args.findIndex(a => a.startsWith('-'));
    while (i >= 0 && i < args.length) {
      optionConsumed.add(i++);
    }
  }

  const nonOptionIndices = args.map((_, i) => i).filter(i => !optionConsumed.has(i));
  const nonOptionArgs = nonOptionIndices.map(i => args[i]);

  // Assign positionals from the collected non-option tokens
  let nonOptionIndex = 0;
  const positionalConsumed = new Set<number>();
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
      for (let j = nonOptionIndex; j < nonOptionIndex + values.length; j++) {
        positionalConsumed.add(nonOptionIndices[j]);
      }
      nonOptionIndex += values.length;
    } else {
      const value = nonOptionArgs[nonOptionIndex];
      // Check if there are enough args left for required positionals
      const requiredLeft = positionals.slice(i).filter(p => p.required).length;
      const argsLeft = nonOptionArgs.length - nonOptionIndex;
      if (value !== undefined && (argsLeft > requiredLeft - (pos.required ? 1 : 0) || pos.required)) {
        result[pos.name] = value;
        positionalConsumed.add(nonOptionIndices[nonOptionIndex]);
        nonOptionIndex++;
      } else if (!pos.required && pos.default !== undefined) {
        result[pos.name] = pos.default;
      } else if (pos.required) {
        const usagePositionals = buildUsagePositionals(positionals);
        throw new Error(`Missing required positional argument, i.e.: "${command.name} ${usagePositionals}"`);
      }
    }
  }

  let argIndex = 0;
  while (argIndex < args.length) {
    if (positionalConsumed.has(argIndex)) {
      argIndex++;
      continue;
    }
    const argOrg = args[argIndex] || '';
    let arg = argOrg;
    let option: FlagOption | undefined;
    let configKey: string | undefined;

    if (argOrg.startsWith('-')) {
      if (argOrg.startsWith('--')) {
        arg = argOrg.slice(2);
        [option, configKey] = findOption(options, arg);
      } else if (argOrg.startsWith('-')) {
        // Support grouped short flags, e.g. `-ab` where `a` and `b` are aliases.
        // The last short in the cluster may consume the next token as its value
        // when it's not a boolean option.
        const body = argOrg.slice(1);
        arg = body;

        // If this exact token matches an option (rare), prefer that (e.g. -xy where xy is alias)
        [option, configKey] = findOption(options, body);
        // Avoid treating `-no-foo` as a short-char cluster — it's a negated long form.
        if (!option && body.length > 1 && !isSingleDashNegation(body)) {
          // Treat as a cluster of single-char aliases
          const chars = body.split('');
          for (let ci = 0; ci < chars.length; ci++) {
            const ch = chars[ci];
            const isLast = ci === chars.length - 1;
            const [cOpt, cKey] = findOption(options, ch);
            if (!cOpt || !cKey) {
              throw new Error(`Unknown argument: ${ch}`);
            }

            if (!isLast) {
              if (cOpt.type !== 'boolean') {
                throw new Error(`Missing value for option: ${cKey}`);
              }
              if (result[cKey] !== undefined) {
                throw new Error('Providing same negated and truthy argument are not allowed');
              }
              result[cKey] = true;
            } else {
              if (cOpt.type === 'boolean') {
                if (result[cKey] !== undefined) {
                  throw new Error('Providing same negated and truthy argument are not allowed');
                }
                result[cKey] = true;
              } else if (cOpt.type === 'array') {
                if (!result[cKey]) {
                  result[cKey] = [];
                }
                const v = args[++argIndex];
                if (v === undefined || v.startsWith('-')) {
                  throw new Error(`Missing value for array option: ${cKey}`);
                }
                result[cKey].push(v);
              } else {
                if (args[argIndex + 1] === undefined || args[argIndex + 1].startsWith('-')) {
                  throw new Error(`Missing value for option: ${cKey}`);
                }
                result[cKey] = cOpt.type === 'number' ? Number(args[++argIndex]) : args[++argIndex];
              }
            }
          }

          // We've consumed any value for the last short (if present), continue to next arg
          argIndex++;
          continue;
        }
      }

      // Handle negated boolean (`no-foo` form)
      if (!option) {
        const isNegated = arg.startsWith('no-');
        const optionName = isNegated ? arg.slice(3) : arg;
        const camelOptionName = kebabToCamel(optionName);
        option = options[optionName] || options[camelOptionName];
        configKey = camelOptionName in options ? camelOptionName : optionName;
        if (option?.type === 'boolean') {
          if (result[optionName] !== undefined || result[camelOptionName] !== undefined) {
            throw new Error('Providing same negated and truthy argument are not allowed');
          }
          result[configKey] = !isNegated;
          // When explicitly negated also expose `noFoo` and `no-foo` keys
          if (isNegated) {
            const kebabKey = camelToKebab(configKey);
            const noCamel = `no${configKey[0].toUpperCase()}${configKey.slice(1)}`;
            const noKebab = `no-${kebabKey}`;
            if (result[noCamel] === undefined) {
              result[noCamel] = true;
            }
            if (result[noKebab] === undefined) {
              result[noKebab] = true;
            }
          }
          argIndex++;
          continue;
        }
      }

      if (!option || !configKey) {
        throw new Error(`Unknown argument: ${arg}`);
      }

      switch (option.type) {
        case 'boolean':
          if (result[configKey] !== undefined) {
            throw new Error('Providing same negated and truthy argument are not allowed');
          }
          result[configKey] = !argOrg.startsWith('--no-') && !argOrg.startsWith('-no-');
          // When a boolean was explicitly negated, also expose `noFoo` and `no-foo` keys
          if (result[configKey] === false) {
            const kebabKey = camelToKebab(configKey);
            const noCamel = `no${configKey[0].toUpperCase()}${configKey.slice(1)}`;
            const noKebab = `no-${kebabKey}`;
            if (result[noCamel] === undefined) {
              result[noCamel] = true;
            }
            if (result[noKebab] === undefined) {
              result[noKebab] = true;
            }
          }
          break;
        case 'number':
          if (args[argIndex + 1] === undefined || args[argIndex + 1].startsWith('-')) {
            throw new Error(`Missing value for option: ${configKey}`);
          }
          result[configKey] = Number(args[++argIndex]);
          break;
        case 'array': {
          if (!result[configKey]) {
            result[configKey] = [];
          }
          const next = args[argIndex + 1];
          if (next === undefined || next.startsWith('-')) {
            // For bare long-form options we allow empty value; short/clustered forms still throw
            if (argOrg.startsWith('--')) {
              result[configKey].push('');
            } else {
              throw new Error(`Missing value for array option: ${configKey}`);
            }
          } else {
            result[configKey].push(args[++argIndex]);
          }
          break;
        }
        case 'string':
        default:
          if (args[argIndex + 1] === undefined || args[argIndex + 1].startsWith('-')) {
            if (argOrg.startsWith('--')) {
              // treat bare long option as empty string
              result[configKey] = '';
            } else {
              throw new Error(`Missing value for option: ${configKey}`);
            }
          } else {
            result[configKey] = args[++argIndex];
          }
          break;
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
    argIndex++;
  }

  // After all parsing, first ensure any `required` CLI options are present
  // (required should error even for boolean flags). Then assign any
  // explicit `default` values and finally apply yargs-parity boolean
  // defaults for non-required boolean flags.
  Object.entries(options).forEach(([key, opt]) => {
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
  if ((result as any)._ === undefined) {
    (result as any)._ = nonOptionArgs.slice();
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
    result['--'] = dashArgs.slice();
  }
  if ((result as any).__rawArgs === undefined) {
    (result as any).__rawArgs = __rawArgs.slice();
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

/** Helper to find an option and its config key by argument name or alias. */
function findOption(options: Record<string, FlagOption>, arg: string): [FlagOption | undefined, string | undefined] {
  // Try all forms: as-is, kebab-to-camel, camel-to-kebab
  const option = options[arg] || options[kebabToCamel(arg)] || options[camelToKebab(arg).replace(/-/g, '')];
  if (option) {
    const configKey = Object.keys(options).find(key => options[key] === option);
    return [option, configKey];
  }
  // Try matching alias in all forms
  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (opt.alias && (opt.alias === arg || opt.alias === kebabToCamel(arg) || opt.alias === camelToKebab(arg))) {
      return [opt, key];
    }
  }
  return [undefined, undefined];
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
  for (const [key, option] of Object.entries({ ...options, ...defaultOptions })) {
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
  const groupedOptions = Object.entries({ ...options, ...defaultOptions }).reduce(
    (acc, [key, option]) => {
      const group = option.group || 'Options';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push([key, option]);
      return acc;
    },
    {} as Record<string, [string, FlagOption][]>,
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
