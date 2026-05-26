import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    clearMocks: true,
    deps: {
      interopDefault: false,
    },
    coverage: {
      include: ['src/**'],
      exclude: [...configDefaults.exclude, '**/interfaces.ts', '**/{examples, scripts}/**', '*.mjs', '**/.npmignore'],
    },
    watch: false,
  },
});
