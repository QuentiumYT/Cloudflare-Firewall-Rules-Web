/** @type {import('postcss-load-config').Config} */
export default {
  syntax: 'postcss-scss',
  plugins: {
    'postcss-import': {
      skipDuplicates: true,
    },
    'postcss-preset-env': {
      stage: 0,
    },
    'postcss-discard-comments': {
      removeAll: true,
    },
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    'autoprefixer': {},
    ...(process.env.NODE_ENV === 'production'
      ? {
        'cssnano': {},
      }
      : {}),
  },
};
