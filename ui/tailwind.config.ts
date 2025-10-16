import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d6efd',
          dark: '#0a58ca',
          light: '#e7f1ff'
        },
        surface: {
          DEFAULT: '#f8faff',
          dark: '#e9eeff'
        }
      },
      boxShadow: {
        'brand-sm': '0 0.4rem 1.2rem rgba(13, 110, 253, 0.12)'
      }
    }
  },
  plugins: []
}

export default config
