module.exports = (api) => {
  api.cache(false)

  const presets = [
    ['@babel/preset-env', {
      modules: false
    }],
    '@babel/preset-react'
  ]
  const plugins = [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import'
  ]

  return {
    presets,
    plugins
  }
}
