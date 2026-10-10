import wiopriph from '@wiopriph/eslint-config';


export default [
  {
    ignores: [
      'assets/vendor/**',
      'static/**',
      'node_modules/**',
      '.nuxt/**',
    ],
  },
  ...wiopriph,
];
