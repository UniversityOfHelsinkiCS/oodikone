module.exports = {
  module: {
    rules: [
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: 'file-loader?name=fonts/[name]-[hash].[ext]'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: 'file-loader?name=images/[name]-[hash].[ext]'
      }
    ]
  }
}
