const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}', './node_modules/@8thday/**/*.{html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        ph: { raw: '(max-width: 768px) and (max-height: 768px)' },
      },
      colors: {
        primary: colors.blue,
        secondary: {
          ...colors.green,
          100: '#dbfde4',
        },
      },
      minHeight: (theme) => ({
        ...theme('spacing'),
        ...theme('height'),
      }),
      maxHeight: (theme) => ({
        ...theme('spacing'),
        ...theme('height'),
      }),
      minWidth: (theme) => ({
        ...theme('spacing'),
        ...theme('width'),
      }),
      maxWidth: (theme) => ({
        ...theme('spacing'),
        ...theme('width'),
      }),
      inset: (theme) => ({
        ...theme('spacing'),
      }),
      spacing: {
        '1/5': '20%',
        '2/5': '40%',
        '3/5': '60%',
        '4/5': '80%',
        15: '3.75rem',
        36: '9rem',
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '100vw': '100vw',
        '100dvh': '100dvh',
        '100svh': '100svh',
        content: 'calc(100vh - 3rem)',
        contentD: 'calc(100dvh - 3rem)',
        contentS: 'calc(100svh - 3rem)',
      },
      gridTemplateColumns: {
        sub: 'subgrid',
        ...Array(12)
          .fill(1)
          .reduce((gc, o, i) => ({ ...gc, [`auto-${o + i}`]: `repeat(${o + i}, minmax(0, auto))` }), {}),
      },
      boxShadow: {
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 -1px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      textShadow: {
        sm: '0 0 2px var(--tw-shadow-color)',
        DEFAULT: '0 0 4px var(--tw-shadow-color)',
        lg: '0 0 8px var(--tw-shadow-color)',
        xl: '0 0 16px var(--tw-shadow-color)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') },
      )
    }),
  ],
}
