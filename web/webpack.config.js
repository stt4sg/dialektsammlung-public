const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const OUTPUT_PATH = path.resolve(__dirname, 'dist');

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
    presets: ['@babel/preset-env'],
  },
};
module.exports = {
  entry: './src/main.ts',
  output: {
    path: OUTPUT_PATH,
    filename: 'bundle.js',
    publicPath: '/dist/',
    chunkFilename: '[name].js?id=[chunkhash]',
  },
  devtool: 'source-map',
  resolve: {
    /**
     * See https://webpack.js.org/configuration/resolve/#resolve-extensions
     *
     * ".js" included to make some Webpack plugins work.
     */
    extensions: ['.ts', '.tsx', '.js'],

    alias: {
      img: path.join(__dirname, 'img/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          babelLoader,
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.js$/,
        include: /node_modules/,
        use: [babelLoader],
      },
      {
        /**
         * By default, Webpack (rather, style-loader) includes stylesheets
         * into the JS bundle.
         *
         * ExtractTextPlugin emits them into a separate plain file instead.
         */
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif|webp)$/,
        loader: 'file-loader',
        options: {
          esModule: false, // TODO: Switch to ES modules syntax.
        },
      },
    ],
  },
  plugins: [
    /** See https://webpack.js.org/plugins/extract-text-webpack-plugin/ */
    new MiniCssExtractPlugin({
      filename: 'index.css',
    }),
    new HtmlWebpackPlugin({
      filename: '../index.html',
      template: 'index_template.html',
    }),
    function () {
      this.plugin('watchRun', () => console.log('Rebuilding…'));
      this.plugin('done', () => console.log('Built!'));
    },
    new webpack.DefinePlugin({
      'process.env.GIT_COMMIT_SHA': JSON.stringify(process.env.GIT_COMMIT_SHA),
    }),
  ],
};
