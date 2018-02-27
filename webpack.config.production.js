const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const htmlTemplate = require('html-webpack-template');
const path = require('path');
const glob = require('glob');

const commonSettings = require('./webpack.config.common');

const CSS_MODULES_CLASS_PREFIX = 'no-purify';

module.exports = {
  context: path.join(__dirname, 'src'),

  entry: [
    'babel-polyfill',
    'whatwg-fetch',
    './app'
  ],

  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      // resolve RHL directly from /lib to bypass webpack's loader resolution magic
      'react-hot-loader': 'react-hot-loader/lib'
    }
  },

  module: {
    rules: [
      ...commonSettings.module.rules,

      {
        test: /\.jsx?$/,
        use: 'babel-loader'
      },

      {
        test: /\.global\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader!postcss-loader'
        })
      },

      {
        test: /.*\/node_modules\/.+\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },

      {
        test: /^((?!\.global).)*\.css$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                sourceMap: true,
                importLoaders: 1,
                localIdentName: `${CSS_MODULES_CLASS_PREFIX}_[name]__[local]___[hash:base64:5]`
              }
            },

            {
              loader: 'postcss-loader'
            }
          ]
        })
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks(module, count) {
        const { resource, context } = module;

        return (context && resource) &&
          context.indexOf('node_modules') >= 0 &&
          count >= 1 &&
          resource.match(/\.js$/);
      }
    }),

    new HtmlWebpackPlugin({
      inject: false,
      template: htmlTemplate,
      appMountId: 'root',
      title: 'Oodikone',
      minify: {
        collapseWhitespace: true,
        processConditionalComments: true
      },
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        }
      ]
    }),

    new ExtractTextPlugin('[name]-[contenthash].css'),

    new OptimizeCssAssetsPlugin(),
    new UglifyJSPlugin()
  ],

  output: {
    filename: '[name].[chunkhash].bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: ''
  }
};
