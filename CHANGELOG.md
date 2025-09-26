# Change Log
All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.2](https://github.com/ghiscoding/cli-nano/compare/v1.2.1...v1.2.2) (2025-09-26)

### Bug Fixes

* publish with OIDC ([b8216b2](https://github.com/ghiscoding/cli-nano/commit/b8216b23b04b06db2e0387402a9ba38f8a7933a1))

## [1.2.1](https://github.com/ghiscoding/cli-nano/compare/v1.2.0...v1.2.1) (2025-07-09)

### Bug Fixes

* add text separator between usage/examples & descriptions ([128dc55](https://github.com/ghiscoding/cli-nano/commit/128dc557165ec7b67e8ad81dec087f1b40fbc089))

## [1.2.0](https://github.com/ghiscoding/cli-nano/compare/v1.1.3...v1.2.0) (2025-07-09)

### ⚠ BREAKING CHANGES

* change `positionals` from array to object
* rename description to `describe` to match Yargs

### Features

* add `examples` option for the user to provide script examples ([ed39f82](https://github.com/ghiscoding/cli-nano/commit/ed39f82375d227e29843c595475fe1310006e477))
* add `helpFlagCasing` to show flag in camel or kebab (default) case ([b5a8657](https://github.com/ghiscoding/cli-nano/commit/b5a8657e27271aa7d6069217232cdba726860233))
* add command option `group` ([287d747](https://github.com/ghiscoding/cli-nano/commit/287d747ce8cd201efd1c384ed062f0ec44da4176))
* change `positionals` from array to object ([d9c8799](https://github.com/ghiscoding/cli-nano/commit/d9c8799dbd49949349d473f6b9c5549578b8be7f))
* rename description to `describe` to match Yargs ([99f5455](https://github.com/ghiscoding/cli-nano/commit/99f545500a2dc4adef09fa7481edd4b441c7d12b))

### Bug Fixes

* use same help desc/name width for all options & define min/max ln ([54f4333](https://github.com/ghiscoding/cli-nano/commit/54f4333275378bb3815152962fc4a87e9b8cc9a7))

### Reverts

* change positionals from array to object ([809b182](https://github.com/ghiscoding/cli-nano/commit/809b182931e7b17e356bd218bbf302acf22df0b1))

## [1.1.3](https://github.com/ghiscoding/cli-nano/compare/v1.1.2...v1.1.3) (2025-07-05)

### Bug Fixes

* include source for source maps to work ([a9f8b8a](https://github.com/ghiscoding/cli-nano/commit/a9f8b8ab6ada89bc978df997a0092f2ebb30c0cd))

## [1.1.2](https://github.com/ghiscoding/cli-nano/compare/v1.1.1...v1.1.2) (2025-07-05)

### Bug Fixes

* drop declaration maps & source files in published pkg ([615db4b](https://github.com/ghiscoding/cli-nano/commit/615db4b1775a8b8697372e007ebc41b4e441d289))

## [1.1.1](https://github.com/ghiscoding/cli-nano/compare/v1.1.0...v1.1.1) (2025-07-05)

### Reverts

* use tsdown to minify prod build ([a318ab9](https://github.com/ghiscoding/cli-nano/commit/a318ab990db7fdb31922c3c205c4690fd921587f))

## [1.1.0](https://github.com/ghiscoding/cli-nano/compare/v1.0.2...v1.1.0) (2025-07-05)

### Features

* add auto type inference to parseArgs() result ([7d494fc](https://github.com/ghiscoding/cli-nano/commit/7d494fc1cb284a38259bc483ef2ae274b4a5b4e7))
* use tsdown to minify prod build ([8d145da](https://github.com/ghiscoding/cli-nano/commit/8d145da6a517e7057a167f973df98ad7d0b04b0a))

### Bug Fixes

* description shown in help should be programmable ([b16724f](https://github.com/ghiscoding/cli-nano/commit/b16724f64625169d6af4cfba576bdcab2acd2ff7))
* show required options in brackets "<option>" ([b594590](https://github.com/ghiscoding/cli-nano/commit/b5945908564289cff1c20831169c50418ab24abb))
* variadic positional args should show as spreading ([63e948e](https://github.com/ghiscoding/cli-nano/commit/63e948ee8e94f0567ca4c74ccc6bd2cdcfd0be39))

## [1.0.2](https://github.com/ghiscoding/cli-nano/compare/v1.0.1...v1.0.2) (2025-07-02)

### Bug Fixes

* better align options list when displaying help ([ea14137](https://github.com/ghiscoding/cli-nano/commit/ea14137aa0bf4bbb35da44aeef2fb4c677068363))

## [1.0.1](https://github.com/ghiscoding/cli-nano/compare/v1.0.0...v1.0.1) (2025-07-02)

### Bug Fixes

* long CLI option descriptions should be truncated with ellipsis ([d580081](https://github.com/ghiscoding/cli-nano/commit/d580081ccdbf8484784748c6d6f4699ae8d02202))

## [1.0.0](https://github.com/ghiscoding/cli-nano/compare/v0.3.10...v1.0.0) (2025-07-02)

### ⚠ BREAKING CHANGES

* `positional` prop should be plural

### Bug Fixes

* `positional` prop should be plural ([16352bb](https://github.com/ghiscoding/cli-nano/commit/16352bb5b6f10ed6016b66a52266534809ebb615))
* should be able to parse options with/without equals sign (`=`) ([9c559ff](https://github.com/ghiscoding/cli-nano/commit/9c559ffa4aacfe5d623f69222463fdd3989efdfb))
* use correct github project link in license ([f56a50f](https://github.com/ghiscoding/cli-nano/commit/f56a50fc4558195108515fa6a9037d425ac9763b))

## [0.3.10](https://github.com/ghiscoding/cli-nano/compare/v0.3.9...v0.3.10) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([1cc5b53](https://github.com/ghiscoding/cli-nano/commit/1cc5b53c08b1375dc03fd6bef7016f8afb42ad1d))

## [0.3.9](https://github.com/ghiscoding/cli-nano/compare/v0.3.8...v0.3.9) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([5052703](https://github.com/ghiscoding/cli-nano/commit/5052703b895f095c7d318e4c80d8fbde20023340))
* strip package fields w/releasing but add back after npm publish ([bc20d7c](https://github.com/ghiscoding/cli-nano/commit/bc20d7c895d8751a7d8cabb0a64129208f1f3f63))
* strip package fields w/releasing but add back after npm publish ([a925993](https://github.com/ghiscoding/cli-nano/commit/a925993c90511616320984dbc422f59c9bc30cbe))

## [0.3.8](https://github.com/ghiscoding/cli-nano/compare/v0.3.7...v0.3.8) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([ee072e4](https://github.com/ghiscoding/cli-nano/commit/ee072e4512a903f493c89728e0dd53bc19650798))

## [0.3.7](https://github.com/ghiscoding/cli-nano/compare/v0.3.6...v0.3.7) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([0bc33ec](https://github.com/ghiscoding/cli-nano/commit/0bc33ecfccfb09bef61a9bdae86bf26703d4ebf8))

## [0.3.6](https://github.com/ghiscoding/cli-nano/compare/v0.3.5...v0.3.6) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([255a0c9](https://github.com/ghiscoding/cli-nano/commit/255a0c9432953a7d2af6ecc9be83f16a3b18ec3b))

## [0.3.5](https://github.com/ghiscoding/cli-nano/compare/v0.3.4...v0.3.5) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([8983b3a](https://github.com/ghiscoding/cli-nano/commit/8983b3ae8c83765b97441994b139342c8a542131))

## [0.3.4](https://github.com/ghiscoding/cli-nano/compare/v0.3.3...v0.3.4) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([2f37e92](https://github.com/ghiscoding/cli-nano/commit/2f37e9281510964a5d898dd6e2d82c659c200292))

## [0.3.3](https://github.com/ghiscoding/cli-nano/compare/v0.3.2...v0.3.3) (2025-06-28)

### Bug Fixes

* strip package fields w/releasing but add back after npm publish ([76e8372](https://github.com/ghiscoding/cli-nano/commit/76e8372acae51101832a0e07ddbcbc49859890e4))

## [0.3.2](https://github.com/ghiscoding/cli-nano/compare/v0.3.1...v0.3.2) (2025-06-27)

## [0.3.1](https://github.com/ghiscoding/cli-nano/compare/v0.3.0...v0.3.1) (2025-06-27)

### Bug Fixes 

* npm publish should ignore test spec files

## [0.3.0](https://github.com/ghiscoding/cli-nano/compare/v0.2.1...v0.3.0) (2025-06-27)

### Features

* add `default` value for both `positionals` and regular `options` ([481482c](https://github.com/ghiscoding/cli-nano/commit/481482cb0e264f7cf8f0de55f22588f53c4fb1aa))

### Bug Fixes

* show `version` in Help guide but only when defined ([a6891b9](https://github.com/ghiscoding/cli-nano/commit/a6891b9f36cf01904bb20b6a72609d74bd864da1))
* validate: required positionals must come before optional ones ([767e09c](https://github.com/ghiscoding/cli-nano/commit/767e09c918948f34a3a576273239a114606a576e))

## [0.2.1](https://github.com/ghiscoding/cli-nano/compare/v0.2.0...v0.2.1) (2025-06-26)

### Bug Fixes

* export missing interfaces ([f61c261](https://github.com/ghiscoding/cli-nano/commit/f61c261291bc402444e7241c376f0e14ccd6dc6a))

## 0.2.0 (2025-06-25)

### Features

* create CLI via `parseArgs` ([4fc831c](https://github.com/ghiscoding/cli-nano/commit/4fc831c4ba3c2be39897735f25611451b86ace41))
