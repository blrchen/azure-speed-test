// @ts-check
const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')
const angular = require('angular-eslint')

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended
    ]
    // ... your rules
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended]
    // ... your rules
  }
)
