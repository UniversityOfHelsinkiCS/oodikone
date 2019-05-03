const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const htmlTemplate = require('html-webpack-template')
const DeadCodePlugin = require('webpack-deadcode-plugin')
const path = require('path')

const devServerPort = 8081
const apiServerPort = 8080
const apiAddress = process.env.BACKEND_ADDR || 'localhost'
const backendURL = `http://${apiAddress}:${apiServerPort}`

module.exports = (env, args) => {
  const { mode } = args
  return {
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
      new HtmlWebpackPlugin({
        inject: false,
        template: htmlTemplate,
        appMountId: 'root',
        title: 'Oodikone'
      }),
      new webpack.DefinePlugin({
        CONFIG: {
          BASE_PATH: JSON.stringify(''),
          AUTH_PROFILE: JSON.stringify(mode)
        },
        'process.env': {
          NODE_ENV: JSON.stringify(mode),
          ANALYTICS_ADMINER_URL: JSON.stringify(process.env.ANALYTICS_ADMINER_URL),
          USER_ADMINER_URL: JSON.stringify(process.env.USER_ADMINER_URL),
          ADMINER_URL: JSON.stringify(process.env.ADMINER_URL),
          USAGE_ADMINER_URL: JSON.stringify(process.env.USAGE_ADMINER_URL)
        }
      }),
      new MiniCssExtractPlugin()
    ],
    devServer: {
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api/**'],
          target: backendURL
        }
      ]
    }
  }
}
