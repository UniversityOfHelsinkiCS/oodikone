const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const htmlTemplate = require('html-webpack-template')
const DeadCodePlugin = require('webpack-deadcode-plugin');
const path = require('path')

const commonSettings = require('./webpack.config.common')

const devServerPort = 8081
const apiServerPort = 8080
const apiAddress = process.env.BACKEND_ADDR || 'localhost'
const backendURL = `http://${apiAddress}:${apiServerPort}`

module.exports = {
  mode: 'development',
  context: path.join(__dirname, 'src'),

  devServer: {
    port: devServerPort,
    contentBase: path.join(__dirname, 'dist'),
    publicPath: '/',
    hot: true,
    proxy: [
      {
        context: ['/api/**'],
        target: backendURL
      }
    ],
    historyApiFallback: {
      index: '/'
    }
  },

  devtool: 'inline-source-map',

  entry: [
    'babel-polyfill',
    'react-hot-loader/patch',
    `webpack-dev-server/client?http://localhost:${devServerPort}`,
    'webpack/hot/only-dev-server',
    './app'
  ],

  resolve: {
    extensions: ['.js', '.jsx']
  },
  optimization: {
    usedExports: true,
  },
  module: {
    rules: [
      ...commonSettings.module.rules,

      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },

      {
        test: /\.global\.css$/,
        use: [
          'style-loader',
          'css-loader?sourceMap',
          'postcss-loader'
        ]
      },

      {
        test: /.*\/node_modules\/.+\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },

      {
        test: /^((?!\.global).)*\.css$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader'
          },

          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          },

          {
            loader: 'postcss-loader'
          }
        ]
      }
    ]
  },

  plugins: [
    new DeadCodePlugin({
      exclude: [
        '**/*.(storybook|spec).(js|jsx)',
      ],
    }),
    new webpack.DefinePlugin({
      CONFIG: {
        BASE_PATH: JSON.stringify(''),
        AUTH_PROFILE: JSON.stringify('development')
      },
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        ANALYTICS_ADMINER_URL: JSON.stringify(process.env.ANALYTICS_ADMINER_URL),
        USER_ADMINER_URL: JSON.stringify(process.env.USER_ADMINER_URL),
        ADMINER_URL: JSON.stringify(process.env.ADMINER_URL)
      }
    }),

    new HtmlWebpackPlugin({
      inject: false,
      template: htmlTemplate,
      appMountId: 'root',
      title: 'Oodikone',
      baseHref: '/',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        }
      ]
    }),

    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin()
  ],

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: ''
  }
}
