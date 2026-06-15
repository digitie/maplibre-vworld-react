import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// The source carries inline `// eslint-disable react-doctor/*` directives for
// the separate react-doctor tool (see doctor.config.json). Register those rule
// names as no-ops so ESLint can resolve the directives instead of erroring
// with "Definition for rule ... was not found".
const noopRule = { meta: { schema: [] }, create: () => ({}) };
const reactDoctorStub = {
  meta: { name: 'react-doctor-stub' },
  rules: Object.fromEntries(
    [
      'no-adjust-state-on-prop-change',
      'exhaustive-deps',
      'no-event-handler',
      'advanced-event-handler-refs',
      'no-cascading-set-state',
      'rerender-state-only-in-handlers',
      'prefer-useReducer',
      'no-giant-component',
      'no-z-index-9999',
      'no-long-transition-duration',
      'no-render-in-render',
      'prefer-tag-over-role',
    ].map((name) => [name, noopRule]),
  ),
};

/**
 * Shared flat ESLint config for the library packages (packages/*). The example
 * apps under apps/* keep their own configs (web-example) or are out of scope
 * (expo-example). Run per package via its `lint` script, or across the repo
 * with `npm run lint`.
 */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'apps/**', 'eslint.config.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks, 'react-doctor': reactDoctorStub },
    linterOptions: {
      // Source carries eslint-disable comments for a previous tooling setup
      // (react-doctor, no-console); don't flag those as unused here.
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // `any` and ts-comments are used deliberately at MapLibre/platform
      // boundaries; surface unused vars as warnings rather than hard errors.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
);
