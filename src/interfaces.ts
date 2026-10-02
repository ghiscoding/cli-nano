export interface FlagOption {
  /** option type */
  type?: 'string' | 'boolean' | 'number' | 'array';

  /** describe the flag option */
  describe: string;

  /** defaults to undefined, provide shorter alias as command options */
  alias?: string;

  /** default value for the option if not provided */
  default?: any;

  /** optional group for grouping some commands */
  group?: string;

  /** defaults to false, is the option required? */
  required?: boolean;
}

export interface PositionalArgument {
  /** positional argument name (it will be displayed in the help docs) */
  name: string;

  /** describe positional argument */
  describe: string;

  /** postional argument type */
  type?: 'string' | 'boolean' | 'number' | 'array';

  /** defaults to false, allows multiple values for this positional argument */
  variadic?: boolean;

  /** default value for the option if not provided */
  default?: any;

  /** defaults to false, is the positional argument required? */
  required?: boolean;
}

export interface CommandOption {
  /** command name, used in the help docs */
  name: string;

  /** describe command */
  describe: string;

  /** give some example invocations of your program */
  examples?: readonly ExampleOption[];

  /** defaults to true, allows positionals between option flags */
  allowInterleaved?: boolean;

  /** list of positional arguments */
  positionals?: readonly PositionalArgument[];
}

export interface ExampleOption {
  /** script example command, the string `$0` will get interpolated to the current script name or node command */
  cmd: string;

  /** describe what the script command does */
  describe: string;
}

/** CLI options */
export interface Config {
  /** CLI definition */
  command: CommandOption;

  /**
   * Show flag option in which casing (camelCase or kebab-case) in the help (defaults to 'kebab').
   * Note: this is only for the help print, the parsing will always support both camel/kebab casing
   */
  helpFlagCasing?: 'camel' | 'kebab';

  /** min description length shown in the help (defaults to 50) */
  helpDescMinLength?: number;

  /** text separator between usage/examples & descriptions (defaults to "→") */
  helpUsageSeparator?: string;

  /** max description length shown in the help (defaults to 100) */
  helpDescMaxLength?: number;

  /** CLI list of flag options */
  options: Record<string, FlagOption>;

  /** CLI or package version */
  version?: string;
}

/** Utility type to map ArgumentOptions/PositionalArgument to their value type */
export type ArgValueType<T extends { type?: string; default?: any; variadic?: boolean; required?: boolean }> = T['type'] extends 'boolean'
  ? boolean
  : T['type'] extends 'number'
    ? number
    : T['type'] extends 'array'
      ? T extends { variadic: true }
        ? T extends { required: true }
          ? [string, ...string[]]
          : string[]
        : string | string[]
      : T['type'] extends 'string'
        ? T extends { variadic: true }
          ? T extends { required: true }
            ? [string, ...string[]]
            : string[]
          : string
        : T['type'] extends undefined
          ? T extends { variadic: true }
            ? T extends { required: true }
              ? [string, ...string[]]
              : string[]
            : string
          : T['default'] extends undefined
            ? string
            : T['default'];

/** Helper to get required keys */
type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { required: true } ? K : never;
}[keyof T];

/** Helper to get optional keys */
type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

/** Map options record to an object type with required/optional properties */
export type OptionsToObject<T extends Record<string, any>> = { [K in RequiredKeys<T>]: ArgValueType<T[K]> } & {
  [K in OptionalKeys<T>]?: ArgValueType<T[K]>;
};

/** Map positionals array to an object type with required/optional properties */
export type PositionalsToObject<T extends readonly PositionalArgument[] | undefined> = T extends readonly [infer P, ...infer Rest]
  ? P extends PositionalArgument
    ? (P['required'] extends true ? { [K in P['name']]: ArgValueType<P> } : { [K in P['name']]?: ArgValueType<P> }) &
        PositionalsToObject<Rest extends readonly PositionalArgument[] ? Rest : []>
    : PositionalsToObject<Rest extends readonly PositionalArgument[] ? Rest : []>
  : { [key: string]: never };

/** The full result type for parseArgs */
export type ArgsResult<C extends Config> = PositionalsToObject<C['command']['positionals']> & OptionsToObject<C['options']>;
