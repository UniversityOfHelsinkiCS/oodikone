const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const htmlTemplate = require('html-webpack-template')
const path = require('path')

const commonSettings = require('./webpack.config.common')

const CSS_MODULES_CLASS_PREFIX = 'no-purify'

module.exports = {
  mode: 'production',
  context: path.join(__dirname, 'src'),

  entry: [
    'babel-polyfill',
    './app'
  ],

  resolve: {
    extensions: ['.js', '.jsx']
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
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader!postcss-loader'
        ]
      },

      {
        test: /.*\/node_modules\/.+\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },

      {
        test: /^((?!\.global).)*\.css$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: `${CSS_MODULES_CLASS_PREFIX}_[name]__[local]___[hash:base64:5]`
            }
          },
          'postcss-loader'
        ]
      }
    ]
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    },
    minimizer: [
      new UglifyJSPlugin({ parallel: true }),
      new OptimizeCssAssetsPlugin()
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      CONFIG: {
        BASE_PATH: JSON.stringify('')
      },
      'process.env': {
        NODE_ENV: JSON.stringify('production')
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
      ],
      headHtmlSnippet: '<script src="https://browser.sentry-cdn.com/4.1.1/bundle.min.js" crossorigin="anonymous"></script>'
    }),

    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name]-[id].css'
    })
  ],

  output: {
    filename: '[name].[chunkhash].bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: ''
  }
}
