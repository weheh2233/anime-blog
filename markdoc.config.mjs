import markdocShiki from '@astrojs/markdoc/shiki';

export default {
  extends: [
    markdocShiki({
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
      defaultColor: false,
      wrap: true,
      langs: [],
    }),
  ],
};
