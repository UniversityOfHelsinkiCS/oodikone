const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const DeadCodePlugin = require('webpack-deadcode-plugin')
// const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const devServerPort = 8081
const apiServerPort = 8080
const apiAddress = process.env.BACKEND_ADDR || 'localhost'
const backendURL = `http://${apiAddress}:${apiServerPort}`
const BASE_PATH = process.env.BASE_PATH || '/'
const noSentryVersion = !Boolean(process.env.SENTRY_RELEASE_VERSION)
const sentryreleaseversion = noSentryVersion ? 'unknown' : process.env.SENTRY_RELEASE_VERSION

module.exports = (env, args) => {
  const { mode } = args
  const isDev = mode === 'development'
  return {
    output: {
      publicPath: BASE_PATH,
      filename: '[name]-[hash].js',
      chunkFilename: '[id]-[hash].js',
    },
    entry: [
      'babel-polyfill',
      './src/app'
    ],
    resolve: {
      extensions: ['.js', '.jsx']
    },
    module: {
      rules: [
        { // Load JS files
          test: /\.js$|.jsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        { // Load CSS files
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        { // Load other files
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: ['file-loader']
        }
      ]
    },
    plugins: [
      new DeadCodePlugin({
        exclude: [
          '**/node_modules/**',
          '**/*.(storybook|spec).(js|jsx)'
        ]
      }),
      new HtmlWebpackPlugin({
        template: './index.html',
        favicon: './favicon.png',
        baseHref: BASE_PATH
      }),
      new webpack.DefinePlugin({
        CONFIG: {
          BASE_PATH: JSON.stringify(BASE_PATH),
          AUTH_PROFILE: JSON.stringify(mode)
        },
        'process.env': {
          NODE_ENV: JSON.stringify(mode),
          ANALYTICS_ADMINER_URL: JSON.stringify(process.env.ANALYTICS_ADMINER_URL),
          USER_ADMINER_URL: JSON.stringify(process.env.USER_ADMINER_URL),
          ADMINER_URL: JSON.stringify(process.env.ADMINER_URL),
          KONE_ADMINER_URL: JSON.stringify(process.env.KONE_ADMINER_URL),
          USAGE_ADMINER_URL: JSON.stringify(process.env.USAGE_ADMINER_URL),
          SENTRY_RELEASE_VERSION: JSON.stringify(sentryreleaseversion)
        }
      }),
      new MiniCssExtractPlugin({
        filename: '[name]-[hash].css',
        chunkFilename: '[id]-[hash].css'
      })
      // new SentryWebpackPlugin({
      //   include: 'dist',
      //   ignoreFile: '.sentrycliignore',
      //   ignore: ['node_modules', 'webpack.config.js'],
      //   release: sentryreleaseversion,
      //   dryRun: noSentryVersion
      // })
    ],
    optimization: {
      minimizer: [new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      })]
    },
    devtool: isDev ? 'eval-source-map' : 'source-map',
    devServer: {
      historyApiFallback: true,
      port: devServerPort,
      proxy: [
        {
          context: ['/api'],
          target: backendURL
        }
      ]
    }
  }
}
