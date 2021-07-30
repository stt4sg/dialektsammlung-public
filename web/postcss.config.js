module.exports = {
  plugins: [
    require('postcss-import')(),
    require('postcss-color-mod-function')(),
    require('postcss-nested')(),
    require('postcss-custom-media')(),
    require('postcss-preset-env')(),
    require('cssnano')(),
  ],
};
