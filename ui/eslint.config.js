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
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Enforce Angular style guide selectors
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase'
        }
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case'
        }
      ],
      // TypeScript strictness
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // Angular best practices
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/use-component-selector': 'error',
      '@angular-eslint/no-inputs-metadata-property': 'error', // Use input() function instead of @Input decorator
      '@angular-eslint/no-outputs-metadata-property': 'error', // Use output() function instead of @Output decorator
      'no-duplicate-imports': ['error', { includeExports: true }],
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'single', 'all', 'multiple'],
          allowSeparatedGroups: true
        }
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/forms',
              importNames: ['FormsModule'],
              message: 'Use reactive forms APIs instead of importing FormsModule.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Template best practices
      '@angular-eslint/template/prefer-control-flow': 'error', // Use @if, @for, @switch instead of *ngIf, *ngFor, *ngSwitch
      '@angular-eslint/template/no-negated-async': 'error', // Avoid negated async pipe
      '@angular-eslint/template/use-track-by-function': 'error' // Require trackBy function in @for loops
    }
  }
)
