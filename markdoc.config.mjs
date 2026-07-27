import markdocShiki from '@astrojs/markdoc/shiki';

export default {
  extends: [
    markdocShiki({
      themes: {
        light: 'github-dark-default',
        dark: 'github-light-default',
      },
      defaultColor: false,
      wrap: true,
      langs: [],
    }),
  ],
};
